/**
 * Core Domain Entities and Validation Invariants
 * Quoting data-model constraints and business rules.
 */

import type {
  SoundAlertProfile,
  SoundSettings,
  StorageHealth,
  TimerMode,
  TimerStatus,
} from './value-objects';

export type { SoundAlertProfile, SoundSettings, StorageHealth, TimerMode, TimerStatus };

/**
 * Timer operational state entity.
 * Invariants:
 * - durationSeconds: Integer, 60 <= val <= 7200 (1 to 120 minutes)
 * - remainingSeconds: Integer, 0 <= val <= durationSeconds
 * - startedAt: Epoch timestamp in milliseconds or null if idle
 * - targetEndTime: Epoch timestamp in ms (>= startedAt) or null
 * - completedCyclesCount: Non-negative integer (>= 0)
 * - activeTaskId: Valid UUID string or null
 */
export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  durationSeconds: number;
  remainingSeconds: number;
  startedAt: number | null;
  targetEndTime: number | null;
  completedCyclesCount: number;
  activeTaskId: string | null;
}

/**
 * Task entity.
 * Invariants:
 * - id: Non-empty UUID v4 or timestamp-derived unique ID
 * - title: Trimmed string, length 1 <= len <= 100. Rejects whitespace-only
 * - estimatedPomodoros: Integer, 1 <= val <= 20. Default: 1
 * - completedPomodoros: Integer, >= 0. Default: 0
 * - status: 'active' | 'completed' | 'archived'
 * - createdAt and updatedAt: Epoch timestamp in milliseconds
 */
export interface Task {
  id: string;
  title: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  status: 'active' | 'completed' | 'archived';
  createdAt: number;
  updatedAt: number;
}

/**
 * Immutable historical record of completed work session.
 * Invariants:
 * - id: Non-empty UUID or unique identifier
 * - taskId: Valid task ID or null if session was unassigned
 * - taskTitle: Snapshot string, length 1 <= len <= 100. Default: 'General Focus Session'
 * - mode: Must be 'work'
 * - durationMinutes: Integer, 1 <= val <= 120
 * - completedAt: Epoch timestamp in milliseconds
 */
export interface HistoryEntry {
  id: string;
  taskId: string | null;
  taskTitle: string;
  mode: 'work';
  durationMinutes: number;
  completedAt: number;
}

/**
 * User customizable timer and audio preferences.
 * Invariants:
 * - workDurationMinutes: Integer, 1 <= val <= 120. Default: 25
 * - shortBreakDurationMinutes: Integer, 1 <= val <= 60. Default: 5
 * - longBreakDurationMinutes: Integer, 1 <= val <= 60. Default: 15
 * - longBreakInterval: Integer, 1 <= val <= 12. Default: 4
 * - autoStartBreaks: boolean. Default: false
 * - autoStartPomodoros: boolean. Default: false
 * - sound: SoundSettings with volume normalized 0.0 to 1.0. Default: 0.8
 */
export interface UserPreferences {
  workDurationMinutes: number;
  shortBreakDurationMinutes: number;
  longBreakDurationMinutes: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  sound: SoundSettings;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  workDurationMinutes: 25,
  shortBreakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  sound: {
    enabled: true,
    volume: 0.8,
    workSound: 'bell',
    breakSound: 'chime',
  },
};

export const DEFAULT_TIMER_STATE: TimerState = {
  mode: 'work',
  status: 'idle',
  durationSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  startedAt: null,
  targetEndTime: null,
  completedCyclesCount: 0,
  activeTaskId: null,
};
