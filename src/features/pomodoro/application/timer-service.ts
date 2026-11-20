/**
 * Concrete TimerService Application Service
 * Orchestrates countdown lifecycle, ticker, clock reconciliation, and state listeners.
 */

import type { TimerMode, TimerState, UserPreferences } from '../domain/entities';
import {
  calculateRemainingSeconds,
  getDurationForMode,
  getNextMode,
  transitionTimerOnComplete,
} from '../domain/timer-engine';
import type { IAudioNotificationPort, ITimerService } from './ports';

export class TimerService implements ITimerService {
  private state: TimerState;

  private preferences: UserPreferences;

  private audioPort: IAudioNotificationPort | null;

  private tickerId: ReturnType<typeof setInterval> | null = null;

  private listeners: Array<(state: TimerState) => void> = [];

  private onSessionCompleteCallback:
    | ((completedMode: TimerMode, durationMinutes: number) => void)
    | null = null;

  constructor(preferences: UserPreferences, audioPort: IAudioNotificationPort | null = null) {
    this.preferences = { ...preferences };
    this.audioPort = audioPort;

    const initialDuration = getDurationForMode('work', this.preferences);
    this.state = {
      mode: 'work',
      status: 'idle',
      durationSeconds: initialDuration,
      remainingSeconds: initialDuration,
      startedAt: null,
      targetEndTime: null,
      completedCyclesCount: 0,
      activeTaskId: null,
    };

    this.setupWindowListeners();
  }

  getState(): TimerState {
    return { ...this.state };
  }

  setAudioPort(audioPort: IAudioNotificationPort | null): void {
    this.audioPort = audioPort;
  }

  setOnSessionComplete(
    callback: ((completedMode: TimerMode, durationMinutes: number) => void) | null,
  ): void {
    this.onSessionCompleteCallback = callback;
  }

  start(): void {
    if (this.state.status === 'running') {
      return;
    }

    const now = Date.now();
    const targetEndTime = now + this.state.remainingSeconds * 1000;

    this.state = {
      ...this.state,
      status: 'running',
      startedAt: now,
      targetEndTime,
    };

    this.startTicker();
    this.notify();
  }

  pause(): void {
    if (this.state.status !== 'running') {
      return;
    }

    this.stopTicker();
    const remaining = calculateRemainingSeconds(this.state.targetEndTime, Date.now());

    this.state = {
      ...this.state,
      status: 'paused',
      remainingSeconds: remaining,
      startedAt: null,
      targetEndTime: null,
    };

    this.notify();
  }

  resume(): void {
    if (this.state.status !== 'paused') {
      return;
    }
    this.start();
  }

  reset(): void {
    this.stopTicker();
    const duration = getDurationForMode(this.state.mode, this.preferences);

    this.state = {
      ...this.state,
      status: 'idle',
      durationSeconds: duration,
      remainingSeconds: duration,
      startedAt: null,
      targetEndTime: null,
    };

    this.notify();
  }

  skip(confirmed: boolean): void {
    if (!confirmed) {
      return;
    }

    this.stopTicker();
    const nextMode = getNextMode(
      this.state.mode,
      this.state.completedCyclesCount,
      this.preferences.longBreakInterval,
    );
    const duration = getDurationForMode(nextMode, this.preferences);

    this.state = {
      ...this.state,
      mode: nextMode,
      status: 'idle',
      durationSeconds: duration,
      remainingSeconds: duration,
      startedAt: null,
      targetEndTime: null,
    };

    this.notify();
  }

  tick(): { completed: boolean; state: TimerState } {
    if (this.state.status !== 'running' || this.state.targetEndTime === null) {
      return { completed: false, state: this.getState() };
    }

    const remaining = calculateRemainingSeconds(this.state.targetEndTime, Date.now());

    if (remaining > 0) {
      this.state = {
        ...this.state,
        remainingSeconds: remaining,
      };
      this.notify();
      return { completed: false, state: this.getState() };
    }

    return this.handleComplete();
  }

  setMode(mode: TimerMode): void {
    if (this.state.status === 'running') {
      this.stopTicker();
    }
    const duration = getDurationForMode(mode, this.preferences);
    this.state = {
      ...this.state,
      mode,
      status: 'idle',
      durationSeconds: duration,
      remainingSeconds: duration,
      startedAt: null,
      targetEndTime: null,
    };
    this.notify();
  }

  setActiveTaskId(taskId: string | null): void {
    this.state = {
      ...this.state,
      activeTaskId: taskId,
    };
    this.notify();
  }

  updateDurations(preferences: UserPreferences): void {
    this.preferences = { ...preferences };
    if (this.state.status === 'idle') {
      const duration = getDurationForMode(this.state.mode, this.preferences);
      this.state = {
        ...this.state,
        durationSeconds: duration,
        remainingSeconds: duration,
      };
      this.notify();
    }
  }

  subscribe(listener: (state: TimerState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private handleComplete(): { completed: boolean; state: TimerState } {
    this.stopTicker();
    const completedMode = this.state.mode;
    const durationMinutes = Math.round(this.state.durationSeconds / 60);

    const nextState = transitionTimerOnComplete(
      this.state.mode,
      this.state.completedCyclesCount,
      this.preferences,
      this.state.activeTaskId,
    );

    this.state = nextState;

    if (this.onSessionCompleteCallback) {
      this.onSessionCompleteCallback(completedMode, durationMinutes);
    }

    if (this.audioPort) {
      const alertType = completedMode === 'work' ? 'work' : 'break';
      this.audioPort.play(alertType, this.preferences.sound).catch(() => {});
    }

    const shouldAutoStart =
      (nextState.mode === 'work' && this.preferences.autoStartPomodoros) ||
      (nextState.mode !== 'work' && this.preferences.autoStartBreaks);

    if (shouldAutoStart) {
      this.start();
    } else {
      this.notify();
    }

    return { completed: true, state: this.getState() };
  }

  private startTicker(): void {
    this.stopTicker();
    this.tickerId = setInterval(() => {
      this.tick();
    }, 250);
  }

  private stopTicker(): void {
    if (this.tickerId !== null) {
      clearInterval(this.tickerId);
      this.tickerId = null;
    }
  }

  private setupWindowListeners(): void {
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && this.state.status === 'running') {
          this.tick();
        }
      });
      window.addEventListener('focus', () => {
        if (this.state.status === 'running') {
          this.tick();
        }
      });
    }
  }

  private notify(): void {
    const snapshot = this.getState();
    this.listeners.forEach((listener) => {
      listener(snapshot);
    });
  }
}
