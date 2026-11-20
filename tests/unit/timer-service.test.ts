import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TimerService } from '../../src/features/pomodoro/application/timer-service';
import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferences,
} from '../../src/features/pomodoro/domain/entities';

describe('TimerService Application Service', () => {
  let service: TimerService;
  let preferences: UserPreferences;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000000);
    preferences = { ...DEFAULT_USER_PREFERENCES };
    service = new TimerService(preferences);
  });

  it('initializes in idle state with configured work duration', () => {
    const state = service.getState();
    expect(state.status).toBe('idle');
    expect(state.mode).toBe('work');
    expect(state.durationSeconds).toBe(25 * 60);
    expect(state.remainingSeconds).toBe(25 * 60);
    expect(state.completedCyclesCount).toBe(0);
    expect(state.activeTaskId).toBeNull();
  });

  it('starts running and establishes targetEndTime based on system clock', () => {
    service.start();
    const state = service.getState();

    expect(state.status).toBe('running');
    expect(state.startedAt).toBe(1000000);
    expect(state.targetEndTime).toBe(1000000 + 25 * 60 * 1000);
  });

  it('pauses and preserves remaining seconds', () => {
    service.start();

    // Advance clock 60 seconds
    vi.setSystemTime(1060000);
    service.tick();

    service.pause();
    const pausedState = service.getState();

    expect(pausedState.status).toBe('paused');
    expect(pausedState.remainingSeconds).toBe(24 * 60);
    expect(pausedState.targetEndTime).toBeNull();
  });

  it('resumes from paused state with new targetEndTime', () => {
    service.start();
    vi.setSystemTime(1060000);
    service.tick();
    service.pause();

    // Wait 500 seconds while paused
    vi.setSystemTime(1560000);
    service.resume();

    const resumedState = service.getState();
    expect(resumedState.status).toBe('running');
    expect(resumedState.startedAt).toBe(1560000);
    expect(resumedState.targetEndTime).toBe(1560000 + 24 * 60 * 1000);
  });

  it('resets timer back to full duration and idle state', () => {
    service.start();
    vi.setSystemTime(1060000);
    service.tick();

    service.reset();
    const state = service.getState();

    expect(state.status).toBe('idle');
    expect(state.remainingSeconds).toBe(25 * 60);
    expect(state.targetEndTime).toBeNull();
  });

  it('skips interval without incrementing completedCyclesCount when confirmed is true', () => {
    service.start();
    service.skip(true);

    const state = service.getState();
    expect(state.mode).toBe('shortBreak');
    expect(state.completedCyclesCount).toBe(0);
    expect(state.status).toBe('idle');
    expect(state.remainingSeconds).toBe(5 * 60);
  });

  it('does not skip interval when confirmed is false', () => {
    service.start();
    service.skip(false);

    const state = service.getState();
    expect(state.mode).toBe('work');
    expect(state.status).toBe('running');
  });

  it('completes countdown and auto-transitions on clock expiry', () => {
    service.start();

    // Fast forward to expiry
    vi.setSystemTime(1000000 + 25 * 60 * 1000);
    const result = service.tick();

    expect(result.completed).toBe(true);
    expect(result.state.mode).toBe('shortBreak');
    expect(result.state.completedCyclesCount).toBe(1);
    expect(result.state.status).toBe('idle');
  });

  it('notifies subscribers on state mutations', () => {
    const listener = vi.fn();
    const unsubscribe = service.subscribe(listener);

    service.start();
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ status: 'running' }));

    unsubscribe();
    service.pause();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('allows manual mode switching when idle', () => {
    service.setMode('longBreak');
    const state = service.getState();

    expect(state.mode).toBe('longBreak');
    expect(state.durationSeconds).toBe(15 * 60);
    expect(state.remainingSeconds).toBe(15 * 60);
  });

  it('associates active task id', () => {
    service.setActiveTaskId('task-uuid-123');
    expect(service.getState().activeTaskId).toBe('task-uuid-123');
  });
});
