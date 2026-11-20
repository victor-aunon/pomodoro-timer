/**
 * Timer Service Port Contract
 * Defines the application interface for controlling countdown lifecycle and interval progression.
 */

import type { TimerMode, TimerState, UserPreferences } from '../data-model';

export interface ITimerService {
  /**
   * Returns a snapshot of the current timer state.
   */
  getState(): TimerState;

  /**
   * Starts the countdown from the idle state.
   */
  start(): void;

  /**
   * Pauses an actively running countdown.
   */
  pause(): void;

  /**
   * Resumes counting from the paused state.
   */
  resume(): void;

  /**
   * Resets the active timer to the full starting duration and idle state.
   */
  reset(): void;

  /**
   * Skips the current interval after user confirmation.
   * Advances to the next interval without incrementing completed session tally.
   */
  skip(confirmed: boolean): void;

  /**
   * Forces a clock reconciliation tick against wall-clock Date.now().
   * Called by ticker loop, requestAnimationFrame, or on visibilitychange.
   */
  tick(): { completed: boolean; state: TimerState };

  /**
   * Changes the active timer mode directly (e.g. manual selection).
   */
  setMode(mode: TimerMode): void;

  /**
   * Associates an active task ID with the running session.
   */
  setActiveTaskId(taskId: string | null): void;

  /**
   * Updates duration configurations from user preferences.
   */
  updateDurations(preferences: UserPreferences): void;

  /**
   * Subscribes a listener to timer state mutations.
   * Returns an unsubscribe function.
   */
  subscribe(listener: (state: TimerState) => void): () => void;
}
