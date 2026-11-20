/**
 * Pure domain countdown engine and state transition rules.
 * Strictly decoupled from browser APIs and side effects.
 */

import type { TimerMode, TimerState, UserPreferences } from './entities';

/**
 * Calculates remaining seconds from target end time and current timestamp.
 * Uses ceil to avoid premature 0 countdown rendering.
 */
export function calculateRemainingSeconds(
  targetEndTime: number | null,
  currentTimeMs: number,
): number {
  if (targetEndTime === null) {
    return 0;
  }
  const deltaMs = targetEndTime - currentTimeMs;
  if (deltaMs <= 0) {
    return 0;
  }
  return Math.ceil(deltaMs / 1000);
}

/**
 * Derives duration in seconds for a specific mode from user preferences.
 */
export function getDurationForMode(mode: TimerMode, preferences: UserPreferences): number {
  switch (mode) {
    case 'work':
      return preferences.workDurationMinutes * 60;
    case 'shortBreak':
      return preferences.shortBreakDurationMinutes * 60;
    case 'longBreak':
      return preferences.longBreakDurationMinutes * 60;
  }
}

/**
 * Determines the next timer mode upon interval completion or skip.
 */
export function getNextMode(
  currentMode: TimerMode,
  completedCycles: number,
  longBreakInterval: number,
): TimerMode {
  if (currentMode === 'work') {
    if (completedCycles > 0 && completedCycles % longBreakInterval === 0) {
      return 'longBreak';
    }
    return 'shortBreak';
  }
  return 'work';
}

/**
 * Pure transition helper producing the next TimerState upon session completion.
 */
export function transitionTimerOnComplete(
  currentMode: TimerMode,
  completedCyclesCount: number,
  preferences: UserPreferences,
  activeTaskId: string | null = null,
): TimerState {
  const nextCompletedCycles =
    currentMode === 'work' ? completedCyclesCount + 1 : completedCyclesCount;

  const nextMode = getNextMode(currentMode, nextCompletedCycles, preferences.longBreakInterval);

  const durationSeconds = getDurationForMode(nextMode, preferences);

  return {
    mode: nextMode,
    status: 'idle',
    durationSeconds,
    remainingSeconds: durationSeconds,
    startedAt: null,
    targetEndTime: null,
    completedCyclesCount: nextCompletedCycles,
    activeTaskId,
  };
}
