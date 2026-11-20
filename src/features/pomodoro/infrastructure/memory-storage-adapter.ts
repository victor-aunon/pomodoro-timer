/**
 * In-memory fallback implementation of IPersistencePort.
 * Used during private browsing or when localStorage quota is exceeded.
 */

import type { IPersistencePort } from '../application/ports';
import {
  DEFAULT_USER_PREFERENCES,
  type HistoryEntry,
  type StorageHealth,
  type Task,
  type UserPreferences,
} from '../domain/entities';

export class MemoryStorageAdapter implements IPersistencePort {
  private preferences: UserPreferences;

  private tasks: Task[] = [];

  private history: HistoryEntry[] = [];

  private health: StorageHealth;

  private listeners: Array<(health: StorageHealth) => void> = [];

  constructor(warningMessage: string | null = null) {
    this.preferences = { ...DEFAULT_USER_PREFERENCES };
    this.health = {
      status: warningMessage ? 'degraded' : 'healthy',
      storageType: 'memory',
      warningMessage,
    };
  }

  loadPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  savePreferences(preferences: UserPreferences): void {
    this.preferences = { ...preferences };
  }

  loadTasks(): Task[] {
    return [...this.tasks];
  }

  saveTasks(tasks: Task[]): void {
    this.tasks = [...tasks];
  }

  loadHistory(): HistoryEntry[] {
    return [...this.history];
  }

  saveHistory(history: HistoryEntry[]): void {
    this.history = [...history];
  }

  getHealth(): StorageHealth {
    return { ...this.health };
  }

  setDegradedHealth(message: string): void {
    this.health = {
      status: 'degraded',
      storageType: 'memory',
      warningMessage: message,
    };
    this.notifyHealthChange();
  }

  onHealthChange(callback: (health: StorageHealth) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyHealthChange(): void {
    const healthCopy = { ...this.health };
    this.listeners.forEach((listener) => {
      listener(healthCopy);
    });
  }
}
