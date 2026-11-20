/**
 * Application Port Interfaces
 * Conforming to Clean Architecture and contracts in specs/001-pomodoro-timer/contracts/
 */

import type {
  HistoryEntry,
  SoundAlertProfile,
  SoundSettings,
  StorageHealth,
  Task,
  TimerMode,
  TimerState,
  UserPreferences,
} from '../domain/entities';

export type AlertType = 'work' | 'break';

export interface IAudioNotificationPort {
  /**
   * Initializes or resumes the audio context upon user gesture.
   */
  initialize(): Promise<boolean>;

  /**
   * Plays the designated notification alert tone for work or break completion.
   * Resolves to true on successful playback; false if blocked, muted, or failed.
   */
  play(alert: AlertType, settings: SoundSettings): Promise<boolean>;

  /**
   * Previews a specific sound alert profile at the specified volume.
   */
  preview(profile: SoundAlertProfile, volume: number): Promise<boolean>;

  /**
   * Returns whether the audio subsystem is available and permitted to play.
   */
  isAvailable(): boolean;
}

export interface IPersistencePort {
  /**
   * Loads user preferences from storage, returning default preferences if none exist or corrupted.
   */
  loadPreferences(): UserPreferences;

  /**
   * Saves user preferences to storage.
   */
  savePreferences(preferences: UserPreferences): void;

  /**
   * Loads active and completed tasks from storage.
   */
  loadTasks(): Task[];

  /**
   * Saves the task list to storage.
   */
  saveTasks(tasks: Task[]): void;

  /**
   * Loads the immutable task history log from storage.
   */
  loadHistory(): HistoryEntry[];

  /**
   * Appends or replaces the history log in storage.
   */
  saveHistory(history: HistoryEntry[]): void;

  /**
   * Returns current storage operational status (healthy vs degraded).
   */
  getHealth(): StorageHealth;

  /**
   * Subscribes to storage health degradation events.
   */
  onHealthChange(callback: (health: StorageHealth) => void): () => void;
}

export interface ITimerService {
  getState(): TimerState;
  start(): void;
  pause(): void;
  resume(): void;
  reset(): void;
  skip(confirmed: boolean): void;
  tick(): { completed: boolean; state: TimerState };
  setMode(mode: TimerMode): void;
  setActiveTaskId(taskId: string | null): void;
  updateDurations(preferences: UserPreferences): void;
  subscribe(listener: (state: TimerState) => void): () => void;
}

export interface ITaskService {
  getTasks(): Task[];
  createTask(title: string, estimatedPomodoros?: number): Task;
  updateTask(
    id: string,
    updates: Partial<Pick<Task, 'title' | 'estimatedPomodoros' | 'status'>>,
  ): Task;
  completeTask(id: string): void;
  deleteTask(id: string): void;
  selectActiveTask(id: string | null): void;
  getActiveTask(): Task | null;
  recordCompletedWorkSession(durationMinutes: number): HistoryEntry;
  getHistory(): HistoryEntry[];
  deleteHistoryEntry(id: string): void;
  clearHistory(): void;
  subscribe(listener: (tasks: Task[], history: HistoryEntry[]) => void): () => void;
}
