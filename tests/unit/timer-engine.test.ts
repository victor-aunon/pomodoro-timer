import { describe, expect, it } from 'vitest';
import {
  DEFAULT_USER_PREFERENCES,
  type TimerMode,
  type UserPreferences,
} from '../../src/features/pomodoro/domain/entities';
import {
  calculateRemainingSeconds,
  getDurationForMode,
  getNextMode,
  transitionTimerOnComplete,
} from '../../src/features/pomodoro/domain/timer-engine';

describe('Timer Engine: Pure Countdown & Transition Logic', () => {
  it('calculates remaining seconds using ceiling of wall-clock delta', () => {
    const now = 1000000;
    const targetEndTime = now + 25000; // 25 seconds remaining

    expect(calculateRemainingSeconds(targetEndTime, now)).toBe(25);
    // Fractional millisecond tests ceiling behavior
    expect(calculateRemainingSeconds(targetEndTime, now + 500)).toBe(25);
    expect(calculateRemainingSeconds(targetEndTime, now + 1000)).toBe(24);
  });

  it('clamps remaining seconds to 0 when now is past targetEndTime', () => {
    const now = 1000000;
    const targetEndTime = now - 5000;

    expect(calculateRemainingSeconds(targetEndTime, now)).toBe(0);
  });

  it('handles null targetEndTime gracefully by returning 0', () => {
    expect(calculateRemainingSeconds(null, 1000000)).toBe(0);
  });

  it('retrieves accurate duration in seconds for each mode based on preferences', () => {
    const prefs: UserPreferences = {
      ...DEFAULT_USER_PREFERENCES,
      workDurationMinutes: 30,
      shortBreakDurationMinutes: 6,
      longBreakDurationMinutes: 20,
    };

    expect(getDurationForMode('work', prefs)).toBe(1800);
    expect(getDurationForMode('shortBreak', prefs)).toBe(360);
    expect(getDurationForMode('longBreak', prefs)).toBe(1200);
  });

  it('transitions from work to shortBreak for non-milestone cycles', () => {
    // 1st cycle complete (1 % 4 !== 0) -> shortBreak
    expect(getNextMode('work', 1, 4)).toBe('shortBreak');
    // 2nd cycle complete -> shortBreak
    expect(getNextMode('work', 2, 4)).toBe('shortBreak');
    // 3rd cycle complete -> shortBreak
    expect(getNextMode('work', 3, 4)).toBe('shortBreak');
  });

  it('transitions from work to longBreak when completedCyclesCount matches interval milestone', () => {
    // 4th cycle complete (4 % 4 === 0) -> longBreak
    expect(getNextMode('work', 4, 4)).toBe('longBreak');
    // 8th cycle complete (8 % 4 === 0) -> longBreak
    expect(getNextMode('work', 8, 4)).toBe('longBreak');
  });

  it('transitions from break modes back to work mode', () => {
    expect(getNextMode('shortBreak', 1, 4)).toBe('work');
    expect(getNextMode('longBreak', 4, 4)).toBe('work');
  });

  it('creates complete next TimerState upon session completion', () => {
    const currentMode: TimerMode = 'work';
    const completedCycles = 0;
    const prefs = DEFAULT_USER_PREFERENCES;

    const nextState = transitionTimerOnComplete(currentMode, completedCycles, prefs);

    expect(nextState.mode).toBe('shortBreak');
    expect(nextState.status).toBe('idle');
    expect(nextState.completedCyclesCount).toBe(1);
    expect(nextState.durationSeconds).toBe(5 * 60);
    expect(nextState.remainingSeconds).toBe(5 * 60);
    expect(nextState.startedAt).toBeNull();
    expect(nextState.targetEndTime).toBeNull();
  });
});
