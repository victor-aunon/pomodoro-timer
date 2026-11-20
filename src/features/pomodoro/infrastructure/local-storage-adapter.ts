/**
 * Production LocalStorageAdapter conforming to IPersistencePort.
 * Implements defensive schema validation, corrupt payload quarantine,
 * and seamless fallback to MemoryStorageAdapter.
 */

import type { IPersistencePort } from '../application/ports';
import {
  DEFAULT_USER_PREFERENCES,
  type HistoryEntry,
  type StorageHealth,
  type Task,
  type UserPreferences,
} from '../domain/entities';
import { MemoryStorageAdapter } from './memory-storage-adapter';

const KEY_PREFS = 'pomodoro_timer_v1_prefs';
const KEY_TASKS = 'pomodoro_timer_v1_tasks';
const KEY_HISTORY = 'pomodoro_timer_v1_history';

export class LocalStorageAdapter implements IPersistencePort {
  private storage: Storage | null;

  private memoryFallback: MemoryStorageAdapter;

  private health: StorageHealth;

  private listeners: Array<(health: StorageHealth) => void> = [];

  constructor(customStorage?: Storage) {
    this.memoryFallback = new MemoryStorageAdapter();
    this.health = {
      status: 'healthy',
      storageType: 'localStorage',
      warningMessage: null,
    };

    if (customStorage) {
      this.storage = customStorage;
    } else if (typeof window !== 'undefined' && 'localStorage' in window) {
      try {
        const testKey = '__storage_test__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        this.storage = window.localStorage;
      } catch {
        this.storage = null;
        this.transitionToDegraded('Local storage access denied (private browsing mode).');
      }
    } else {
      this.storage = null;
      this.transitionToDegraded('Web storage is not supported in this runtime.');
    }
  }

  loadPreferences(): UserPreferences {
    if (!this.storage || this.health.status === 'degraded') {
      return this.memoryFallback.loadPreferences();
    }

    const raw = this.getItem(KEY_PREFS);
    if (!raw) {
      return { ...DEFAULT_USER_PREFERENCES };
    }

    try {
      const parsed = JSON.parse(raw) as Partial<UserPreferences>;
      if (!this.validatePreferences(parsed)) {
        this.quarantine(KEY_PREFS, raw);
        return { ...DEFAULT_USER_PREFERENCES };
      }
      return { ...DEFAULT_USER_PREFERENCES, ...parsed };
    } catch {
      this.quarantine(KEY_PREFS, raw);
      return { ...DEFAULT_USER_PREFERENCES };
    }
  }

  savePreferences(preferences: UserPreferences): void {
    if (!this.storage || this.health.status === 'degraded') {
      this.memoryFallback.savePreferences(preferences);
      return;
    }

    try {
      this.storage.setItem(KEY_PREFS, JSON.stringify(preferences));
      this.memoryFallback.savePreferences(preferences);
    } catch {
      this.transitionToDegraded('Storage quota exceeded. Switched to in-memory mode.');
      this.memoryFallback.savePreferences(preferences);
    }
  }

  loadTasks(): Task[] {
    if (!this.storage || this.health.status === 'degraded') {
      return this.memoryFallback.loadTasks();
    }

    const raw = this.getItem(KEY_TASKS);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        this.quarantine(KEY_TASKS, raw);
        return [];
      }
      return parsed as Task[];
    } catch {
      this.quarantine(KEY_TASKS, raw);
      return [];
    }
  }

  saveTasks(tasks: Task[]): void {
    if (!this.storage || this.health.status === 'degraded') {
      this.memoryFallback.saveTasks(tasks);
      return;
    }

    try {
      this.storage.setItem(KEY_TASKS, JSON.stringify(tasks));
      this.memoryFallback.saveTasks(tasks);
    } catch {
      this.transitionToDegraded('Storage quota exceeded. Switched to in-memory mode.');
      this.memoryFallback.saveTasks(tasks);
    }
  }

  loadHistory(): HistoryEntry[] {
    if (!this.storage || this.health.status === 'degraded') {
      return this.memoryFallback.loadHistory();
    }

    const raw = this.getItem(KEY_HISTORY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        this.quarantine(KEY_HISTORY, raw);
        return [];
      }
      return parsed as HistoryEntry[];
    } catch {
      this.quarantine(KEY_HISTORY, raw);
      return [];
    }
  }

  saveHistory(history: HistoryEntry[]): void {
    if (!this.storage || this.health.status === 'degraded') {
      this.memoryFallback.saveHistory(history);
      return;
    }

    try {
      this.storage.setItem(KEY_HISTORY, JSON.stringify(history));
      this.memoryFallback.saveHistory(history);
    } catch {
      this.transitionToDegraded('Storage quota exceeded. Switched to in-memory mode.');
      this.memoryFallback.saveHistory(history);
    }
  }

  getHealth(): StorageHealth {
    return { ...this.health };
  }

  onHealthChange(callback: (health: StorageHealth) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private getItem(key: string): string | null {
    try {
      return this.storage ? this.storage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  private quarantine(key: string, rawPayload: string): void {
    if (!this.storage) return;
    const quarantineKey = `pomodoro_quarantine_${key}_${Date.now()}`;
    try {
      this.storage.setItem(quarantineKey, rawPayload);
      this.storage.removeItem(key);
    } catch {
      // Ignore secondary error during quarantine write
    }
  }

  private validatePreferences(prefs: Partial<UserPreferences>): boolean {
    if (!prefs || typeof prefs !== 'object') return false;
    if (
      prefs.workDurationMinutes !== undefined &&
      (typeof prefs.workDurationMinutes !== 'number' ||
        prefs.workDurationMinutes < 1 ||
        prefs.workDurationMinutes > 120)
    ) {
      return false;
    }
    if (
      prefs.shortBreakDurationMinutes !== undefined &&
      (typeof prefs.shortBreakDurationMinutes !== 'number' ||
        prefs.shortBreakDurationMinutes < 1 ||
        prefs.shortBreakDurationMinutes > 60)
    ) {
      return false;
    }
    return true;
  }

  private transitionToDegraded(reason: string): void {
    this.health = {
      status: 'degraded',
      storageType: 'memory',
      warningMessage: reason,
    };
    const healthCopy = { ...this.health };
    this.listeners.forEach((l) => l(healthCopy));
  }
}
