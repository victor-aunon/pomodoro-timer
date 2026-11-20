import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TimerService } from '../../src/features/pomodoro/application/timer-service';
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from '../../src/features/pomodoro/domain/entities';
import type { IAudioNotificationPort } from '../../src/features/pomodoro/application/ports';

describe('Delight & Session Transitions: Work and Break Completion Lifecycles', () => {
  let timerService: TimerService;
  let mockAudioPort: IAudioNotificationPort;
  let preferences: UserPreferences;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000000);

    mockAudioPort = {
      isAvailable: vi.fn().mockReturnValue(true),
      initialize: vi.fn().mockResolvedValue(true),
      play: vi.fn().mockResolvedValue(true),
      preview: vi.fn().mockResolvedValue(true),
    };

    preferences = {
      ...DEFAULT_USER_PREFERENCES,
      workDurationMinutes: 25,
      shortBreakDurationMinutes: 5,
      longBreakDurationMinutes: 15,
      longBreakInterval: 4,
      autoStartBreaks: false,
      autoStartPomodoros: false,
    };

    timerService = new TimerService(preferences, mockAudioPort);
  });

  it('triggers work session completion callback and plays work alert on pomodoro end', () => {
    const onComplete = vi.fn();
    timerService.setOnSessionComplete(onComplete);

    timerService.start();
    expect(timerService.getState().status).toBe('running');
    expect(timerService.getState().mode).toBe('work');

    // Fast-forward 25 minutes
    vi.setSystemTime(1000000 + 25 * 60 * 1000);
    const tickResult = timerService.tick();

    expect(tickResult.completed).toBe(true);
    expect(onComplete).toHaveBeenCalledWith('work', 25);
    expect(mockAudioPort.play).toHaveBeenCalledWith('work', preferences.sound);

    // State transitioned to shortBreak, ready for user action
    const nextState = timerService.getState();
    expect(nextState.mode).toBe('shortBreak');
    expect(nextState.status).toBe('idle');
    expect(nextState.completedCyclesCount).toBe(1);
    expect(nextState.remainingSeconds).toBe(5 * 60);
  });

  it('triggers break session completion callback and plays break alert on break end', () => {
    const onComplete = vi.fn();
    timerService.setOnSessionComplete(onComplete);

    // Set to short break and start
    timerService.setMode('shortBreak');
    timerService.start();
    expect(timerService.getState().status).toBe('running');
    expect(timerService.getState().mode).toBe('shortBreak');

    // Fast-forward 5 minutes
    vi.setSystemTime(1000000 + 5 * 60 * 1000);
    const tickResult = timerService.tick();

    expect(tickResult.completed).toBe(true);
    expect(onComplete).toHaveBeenCalledWith('shortBreak', 5);
    expect(mockAudioPort.play).toHaveBeenCalledWith('break', preferences.sound);

    // State transitioned back to work, ready to restart focus
    const nextState = timerService.getState();
    expect(nextState.mode).toBe('work');
    expect(nextState.status).toBe('idle');
    expect(nextState.remainingSeconds).toBe(25 * 60);
  });

  it('transitions to long break after completing the configured cycle interval', () => {
    const onComplete = vi.fn();
    timerService.setOnSessionComplete(onComplete);

    // Simulate 3 completed cycles
    for (let cycle = 1; cycle <= 3; cycle++) {
      timerService.start();
      vi.setSystemTime(Date.now() + 25 * 60 * 1000);
      timerService.tick();
      // Reset mode to work for next cycle
      timerService.setMode('work');
    }

    expect(timerService.getState().completedCyclesCount).toBe(3);

    // 4th cycle: should transition to longBreak
    timerService.start();
    vi.setSystemTime(Date.now() + 25 * 60 * 1000);
    const result = timerService.tick();

    expect(result.completed).toBe(true);
    expect(timerService.getState().mode).toBe('longBreak');
    expect(timerService.getState().remainingSeconds).toBe(15 * 60);
    expect(timerService.getState().completedCyclesCount).toBe(4);
  });

  it('correctly passes custom configured durations upon completion', () => {
    const customPrefs: UserPreferences = {
      ...preferences,
      workDurationMinutes: 45,
      shortBreakDurationMinutes: 10,
    };
    const customTimer = new TimerService(customPrefs);
    const onComplete = vi.fn();
    customTimer.setOnSessionComplete(onComplete);

    customTimer.start();
    expect(customTimer.getState().remainingSeconds).toBe(45 * 60);

    vi.setSystemTime(Date.now() + 45 * 60 * 1000);
    customTimer.tick();

    expect(onComplete).toHaveBeenCalledWith('work', 45);
    expect(customTimer.getState().mode).toBe('shortBreak');
    expect(customTimer.getState().remainingSeconds).toBe(10 * 60);
  });
});
