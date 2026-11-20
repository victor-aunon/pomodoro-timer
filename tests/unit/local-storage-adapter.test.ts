import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_USER_PREFERENCES,
  type HistoryEntry,
  type Task,
  type UserPreferences,
} from '../../src/features/pomodoro/domain/entities';
import { LocalStorageAdapter } from '../../src/features/pomodoro/infrastructure/local-storage-adapter';

class MockStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

describe('LocalStorageAdapter: Persistence, Quarantine & Health', () => {
  let mockStorage: MockStorage;
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    mockStorage = new MockStorage();
    adapter = new LocalStorageAdapter(mockStorage);
  });

  it('loads default preferences when storage is empty', () => {
    const prefs = adapter.loadPreferences();
    expect(prefs).toEqual(DEFAULT_USER_PREFERENCES);
    expect(adapter.getHealth().status).toBe('healthy');
  });

  it('saves and reloads valid preferences accurately', () => {
    const customPrefs: UserPreferences = {
      ...DEFAULT_USER_PREFERENCES,
      workDurationMinutes: 50,
      shortBreakDurationMinutes: 10,
    };

    adapter.savePreferences(customPrefs);
    const reloaded = adapter.loadPreferences();

    expect(reloaded.workDurationMinutes).toBe(50);
    expect(reloaded.shortBreakDurationMinutes).toBe(10);
  });

  it('quarantines corrupt preferences JSON and returns default preferences', () => {
    mockStorage.setItem('pomodoro_timer_v1_prefs', '{ invalid json : true ');

    const prefs = adapter.loadPreferences();

    expect(prefs).toEqual(DEFAULT_USER_PREFERENCES);
    expect(mockStorage.getItem('pomodoro_timer_v1_prefs')).toBeNull();

    // Verify quarantine key was created
    const keys = Object.keys((mockStorage as unknown as { store: Record<string, string> }).store);
    const quarantineKey = keys.find((k) =>
      k.startsWith('pomodoro_quarantine_pomodoro_timer_v1_prefs_'),
    );
    expect(quarantineKey).toBeDefined();
    expect(mockStorage.getItem(quarantineKey!)).toBe('{ invalid json : true ');
  });

  it('quarantines structurally invalid tasks array and resets to empty', () => {
    mockStorage.setItem('pomodoro_timer_v1_tasks', '{"notAnArray": true}');

    const tasks = adapter.loadTasks();

    expect(tasks).toEqual([]);
    expect(mockStorage.getItem('pomodoro_timer_v1_tasks')).toBeNull();

    const keys = Object.keys((mockStorage as unknown as { store: Record<string, string> }).store);
    const quarantineKey = keys.find((k) =>
      k.startsWith('pomodoro_quarantine_pomodoro_timer_v1_tasks_'),
    );
    expect(quarantineKey).toBeDefined();
  });

  it('saves and loads task list correctly', () => {
    const sampleTasks: Task[] = [
      {
        id: 't-1',
        title: 'Task 1',
        estimatedPomodoros: 2,
        completedPomodoros: 1,
        status: 'active',
        createdAt: 1000,
        updatedAt: 1000,
      },
    ];

    adapter.saveTasks(sampleTasks);
    const loaded = adapter.loadTasks();

    expect(loaded).toHaveLength(1);
    expect(loaded[0].title).toBe('Task 1');
  });

  it('saves and loads history entries correctly', () => {
    const sampleHistory: HistoryEntry[] = [
      {
        id: 'h-1',
        taskId: 't-1',
        taskTitle: 'Task 1',
        mode: 'work',
        durationMinutes: 25,
        completedAt: 1000,
      },
    ];

    adapter.saveHistory(sampleHistory);
    const loaded = adapter.loadHistory();

    expect(loaded).toHaveLength(1);
    expect(loaded[0].taskTitle).toBe('Task 1');
  });

  it('falls back to MemoryStorageAdapter and degrades health when storage quota is exceeded', () => {
    const onHealthChange = vi.fn();
    adapter.onHealthChange(onHealthChange);

    mockStorage.setItem = () => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    };

    adapter.savePreferences(DEFAULT_USER_PREFERENCES);

    const health = adapter.getHealth();
    expect(health.status).toBe('degraded');
    expect(health.storageType).toBe('memory');
    expect(onHealthChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'degraded', storageType: 'memory' }),
    );

    // Verify operations succeed in memory without throwing
    expect(() => adapter.saveTasks([])).not.toThrow();
  });
});
