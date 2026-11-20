import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskService } from '../../src/features/pomodoro/application/task-service';
import { TimerService } from '../../src/features/pomodoro/application/timer-service';
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from '../../src/features/pomodoro/domain/entities';
import { MemoryStorageAdapter } from '../../src/features/pomodoro/infrastructure/memory-storage-adapter';

describe('End-to-End Integration Flow: Pomodoro Cycle, Task Linking & Persistence', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000000);
    storage = new MemoryStorageAdapter();
  });

  it('executes full focus cycle: task creation, timer run, auto-transition, history logging, and rehydration', () => {
    // 1. Initialize services with shared persistence
    const taskService = new TaskService(storage);
    const timerService = new TimerService(DEFAULT_USER_PREFERENCES);

    // Wire session completion from timer to task service
    timerService.setOnSessionComplete((completedMode, durationMinutes) => {
      if (completedMode === 'work') {
        taskService.recordCompletedWorkSession(durationMinutes);
      }
    });

    // 2. Create and select a task
    const task = taskService.createTask('Implement Feature Architecture', 2);
    expect(task.completedPomodoros).toBe(0);

    taskService.selectActiveTask(task.id);
    timerService.setActiveTaskId(task.id);
    expect(timerService.getState().activeTaskId).toBe(task.id);

    // 3. Start timer
    timerService.start();
    expect(timerService.getState().status).toBe('running');
    expect(timerService.getState().mode).toBe('work');

    // 4. Fast forward to end of 25-minute work interval
    vi.setSystemTime(1000000 + 25 * 60 * 1000);
    const tickResult = timerService.tick();

    // 5. Verify timer state transition
    expect(tickResult.completed).toBe(true);
    expect(timerService.getState().mode).toBe('shortBreak');
    expect(timerService.getState().completedCyclesCount).toBe(1);
    expect(timerService.getState().remainingSeconds).toBe(5 * 60);

    // 6. Verify task progress and focus history log
    const updatedTask = taskService.getTasks().find((t) => t.id === task.id);
    expect(updatedTask?.completedPomodoros).toBe(1);

    const history = taskService.getHistory();
    expect(history).toHaveLength(1);
    expect(history[0].taskId).toBe(task.id);
    expect(history[0].taskTitle).toBe('Implement Feature Architecture');
    expect(history[0].durationMinutes).toBe(25);
    expect(history[0].mode).toBe('work');

    // 7. Update preferences and persist
    const customPreferences: UserPreferences = {
      ...DEFAULT_USER_PREFERENCES,
      workDurationMinutes: 50,
      shortBreakDurationMinutes: 10,
    };
    storage.savePreferences(customPreferences);

    // 8. Rehydrate a completely new set of services from storage (simulating app reload)
    const rehydratedTaskService = new TaskService(storage);
    const rehydratedPreferences = storage.loadPreferences();
    const rehydratedTimerService = new TimerService(rehydratedPreferences);

    expect(rehydratedPreferences.workDurationMinutes).toBe(50);
    expect(rehydratedPreferences.shortBreakDurationMinutes).toBe(10);
    expect(rehydratedTimerService.getState().durationSeconds).toBe(50 * 60);

    expect(rehydratedTaskService.getTasks()).toHaveLength(1);
    expect(rehydratedTaskService.getTasks()[0].completedPomodoros).toBe(1);
    expect(rehydratedTaskService.getHistory()).toHaveLength(1);
    expect(rehydratedTaskService.getHistory()[0].taskTitle).toBe('Implement Feature Architecture');
  });
});
