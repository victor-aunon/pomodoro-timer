/**
 * Concrete TaskService Application Service
 * Manages user tasks lifecycle, active focus target, and completed focus history.
 */

import { generateId } from '../../../core/utils/id-generator';
import type { HistoryEntry, Task } from '../domain/entities';
import type { IPersistencePort, ITaskService } from './ports';

export class TaskService implements ITaskService {
  private tasks: Task[] = [];

  private history: HistoryEntry[] = [];

  private activeTaskId: string | null = null;

  private persistencePort: IPersistencePort | null;

  private listeners: Array<(tasks: Task[], history: HistoryEntry[]) => void> = [];

  constructor(persistencePort: IPersistencePort | null = null) {
    this.persistencePort = persistencePort;
    if (this.persistencePort) {
      this.tasks = this.persistencePort.loadTasks();
      this.history = this.persistencePort.loadHistory();
    }
  }

  getTasks(): Task[] {
    return [...this.tasks];
  }

  createTask(title: string, estimatedPomodoros = 1): Task {
    const trimmedTitle = title ? title.trim() : '';
    if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
      throw new Error('Task title must be between 1 and 100 characters.');
    }

    if (
      !Number.isInteger(estimatedPomodoros) ||
      estimatedPomodoros < 1 ||
      estimatedPomodoros > 20
    ) {
      throw new Error('Estimated Pomodoros must be an integer between 1 and 20.');
    }

    const now = Date.now();
    const newTask: Task = {
      id: generateId(),
      title: trimmedTitle,
      estimatedPomodoros,
      completedPomodoros: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    this.tasks = [...this.tasks, newTask];
    this.persistAndNotify();
    return newTask;
  }

  updateTask(
    id: string,
    updates: Partial<Pick<Task, 'title' | 'estimatedPomodoros' | 'status'>>,
  ): Task {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) {
      throw new Error(`Task with id '${id}' not found.`);
    }

    let updatedTitle = task.title;
    if (updates.title !== undefined) {
      const trimmed = updates.title.trim();
      if (trimmed.length < 1 || trimmed.length > 100) {
        throw new Error('Task title must be between 1 and 100 characters.');
      }
      updatedTitle = trimmed;
    }

    let updatedEstimated = task.estimatedPomodoros;
    if (updates.estimatedPomodoros !== undefined) {
      if (
        !Number.isInteger(updates.estimatedPomodoros) ||
        updates.estimatedPomodoros < 1 ||
        updates.estimatedPomodoros > 20
      ) {
        throw new Error('Estimated Pomodoros must be an integer between 1 and 20.');
      }
      updatedEstimated = updates.estimatedPomodoros;
    }

    const updatedTask: Task = {
      ...task,
      title: updatedTitle,
      estimatedPomodoros: updatedEstimated,
      status: updates.status ?? task.status,
      updatedAt: Date.now(),
    };

    this.tasks = this.tasks.map((t) => (t.id === id ? updatedTask : t));
    this.persistAndNotify();
    return updatedTask;
  }

  completeTask(id: string): void {
    this.updateTask(id, { status: 'completed' });
  }

  deleteTask(id: string): void {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    if (this.activeTaskId === id) {
      this.activeTaskId = null;
    }
    this.persistAndNotify();
  }

  selectActiveTask(id: string | null): void {
    this.activeTaskId = id;
    this.notify();
  }

  getActiveTask(): Task | null {
    if (!this.activeTaskId) {
      return null;
    }
    return this.tasks.find((t) => t.id === this.activeTaskId) || null;
  }

  recordCompletedWorkSession(durationMinutes: number): HistoryEntry {
    const active = this.getActiveTask();
    const now = Date.now();

    let taskTitle = 'General Focus Session';
    let taskId: string | null = null;

    if (active) {
      taskId = active.id;
      taskTitle = active.title;
      this.tasks = this.tasks.map((t) =>
        t.id === active.id
          ? {
              ...t,
              completedPomodoros: t.completedPomodoros + 1,
              updatedAt: now,
            }
          : t,
      );
    }

    const entry: HistoryEntry = {
      id: generateId(),
      taskId,
      taskTitle,
      mode: 'work',
      durationMinutes,
      completedAt: now,
    };

    this.history = [entry, ...this.history];
    this.persistAndNotify();
    return entry;
  }

  getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  deleteHistoryEntry(id: string): void {
    this.history = this.history.filter((h) => h.id !== id);
    this.persistAndNotify();
  }

  clearHistory(): void {
    this.history = [];
    this.persistAndNotify();
  }

  subscribe(listener: (tasks: Task[], history: HistoryEntry[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private persistAndNotify(): void {
    if (this.persistencePort) {
      this.persistencePort.saveTasks(this.tasks);
      this.persistencePort.saveHistory(this.history);
    }
    this.notify();
  }

  private notify(): void {
    const tasksSnapshot = this.getTasks();
    const historySnapshot = this.getHistory();
    this.listeners.forEach((l) => l(tasksSnapshot, historySnapshot));
  }
}
