/**
 * Persistence Port Contract
 * Defines the application interface for saving and restoring user data,
 * with built-in quarantine for corrupt payloads and fallback handling.
 */

import type { HistoryEntry, StorageHealth, Task, UserPreferences } from '../data-model';

export interface IPersistencePort {
  /**
   * Loads user preferences from storage, returning default preferences if none exist or if corrupted.
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
   * Subscribes to storage health degradation events (e.g. quota exceeded or private mode).
   */
  onHealthChange(callback: (health: StorageHealth) => void): () => void;
}
