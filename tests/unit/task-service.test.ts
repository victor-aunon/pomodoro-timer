import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TaskService } from '../../src/features/pomodoro/application/task-service';
import { MemoryStorageAdapter } from '../../src/features/pomodoro/infrastructure/memory-storage-adapter';

describe('TaskService: Task Lifecycle & Focus History', () => {
  let service: TaskService;
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000000);
    storage = new MemoryStorageAdapter();
    service = new TaskService(storage);
  });

  it('creates a new task with validated title and estimated Pomodoros', () => {
    const task = service.createTask('Design Architecture', 4);

    expect(task.title).toBe('Design Architecture');
    expect(task.estimatedPomodoros).toBe(4);
    expect(task.completedPomodoros).toBe(0);
    expect(task.status).toBe('active');
    expect(task.id).toBeDefined();

    expect(service.getTasks()).toHaveLength(1);
  });

  it('rejects empty or whitespace-only task titles', () => {
    expect(() => service.createTask('')).toThrow(
      'Task title must be between 1 and 100 characters.',
    );
    expect(() => service.createTask('   ')).toThrow(
      'Task title must be between 1 and 100 characters.',
    );
  });

  it('rejects task titles exceeding 100 characters', () => {
    const longTitle = 'a'.repeat(101);
    expect(() => service.createTask(longTitle)).toThrow(
      'Task title must be between 1 and 100 characters.',
    );
  });

  it('rejects out-of-bounds estimated Pomodoros', () => {
    expect(() => service.createTask('Valid Title', 0)).toThrow(
      'Estimated Pomodoros must be an integer between 1 and 20.',
    );
    expect(() => service.createTask('Valid Title', 21)).toThrow(
      'Estimated Pomodoros must be an integer between 1 and 20.',
    );
  });

  it('selects and deselects active task target', () => {
    const task = service.createTask('Active Target', 2);
    expect(service.getActiveTask()).toBeNull();

    service.selectActiveTask(task.id);
    expect(service.getActiveTask()?.id).toBe(task.id);

    service.selectActiveTask(null);
    expect(service.getActiveTask()).toBeNull();
  });

  it('marks a task as completed', () => {
    const task = service.createTask('Complete Me', 1);
    service.completeTask(task.id);

    const updated = service.getTasks().find((t) => t.id === task.id);
    expect(updated?.status).toBe('completed');
  });

  it('deletes a task and clears active selection if deleted task was active', () => {
    const task = service.createTask('To Delete', 1);
    service.selectActiveTask(task.id);

    service.deleteTask(task.id);
    expect(service.getTasks()).toHaveLength(0);
    expect(service.getActiveTask()).toBeNull();
  });

  it('records completed work session with active task and increments tally', () => {
    const task = service.createTask('Document API', 3);
    service.selectActiveTask(task.id);

    const entry = service.recordCompletedWorkSession(25);

    expect(entry.taskId).toBe(task.id);
    expect(entry.taskTitle).toBe('Document API');
    expect(entry.durationMinutes).toBe(25);
    expect(entry.mode).toBe('work');
    expect(entry.completedAt).toBe(1000000);

    const updatedTask = service.getTasks().find((t) => t.id === task.id);
    expect(updatedTask?.completedPomodoros).toBe(1);

    expect(service.getHistory()).toHaveLength(1);
    expect(service.getHistory()[0].taskTitle).toBe('Document API');
  });

  it('records completed work session as General Focus Session when no task is active', () => {
    const entry = service.recordCompletedWorkSession(25);

    expect(entry.taskId).toBeNull();
    expect(entry.taskTitle).toBe('General Focus Session');
    expect(service.getHistory()).toHaveLength(1);
  });

  it('deletes single history entry and clears all history records', () => {
    service.recordCompletedWorkSession(25);
    service.recordCompletedWorkSession(25);
    expect(service.getHistory()).toHaveLength(2);

    const firstId = service.getHistory()[0].id;
    service.deleteHistoryEntry(firstId);
    expect(service.getHistory()).toHaveLength(1);

    service.clearHistory();
    expect(service.getHistory()).toHaveLength(0);
  });

  it('notifies subscribers on tasks or history mutations', () => {
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);

    service.createTask('Subscribed Task', 1);
    expect(listener).toHaveBeenCalledTimes(1);

    service.recordCompletedWorkSession(25);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    service.createTask('Another Task', 1);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
