/**
 * Task Service Port Contract
 * Defines the application interface for task management and focus session history tracking.
 */

import type { HistoryEntry, Task } from '../data-model';

export interface ITaskService {
  /**
   * Retrieves all user tasks.
   */
  getTasks(): Task[];

  /**
   * Creates a new task after validating title and estimated count.
   * Throws ValidationError if title is empty/whitespace or exceeds 100 characters.
   */
  createTask(title: string, estimatedPomodoros?: number): Task;

  /**
   * Updates task properties.
   */
  updateTask(
    id: string,
    updates: Partial<Pick<Task, 'title' | 'estimatedPomodoros' | 'status'>>,
  ): Task;

  /**
   * Marks a task as completed while preserving history records.
   */
  completeTask(id: string): void;

  /**
   * Deletes a task from the active list.
   */
  deleteTask(id: string): void;

  /**
   * Sets or clears the active task targeted for focus sessions.
   */
  selectActiveTask(id: string | null): void;

  /**
   * Retrieves the currently selected active task, or null if none.
   */
  getActiveTask(): Task | null;

  /**
   * Increments the completed Pomodoro count on the active task and appends a record to history.
   * If no task is active, logs the session under "General Focus Session".
   */
  recordCompletedWorkSession(durationMinutes: number): HistoryEntry;

  /**
   * Retrieves all historical completed sessions in reverse chronological order.
   */
  getHistory(): HistoryEntry[];

  /**
   * Deletes a single history record by ID.
   */
  deleteHistoryEntry(id: string): void;

  /**
   * Permanently clears all history records after user confirmation.
   */
  clearHistory(): void;

  /**
   * Subscribes a listener to task and history changes.
   */
  subscribe(listener: (tasks: Task[], history: HistoryEntry[]) => void): () => void;
}
