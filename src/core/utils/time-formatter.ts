/**
 * Core time formatting utilities for Pomodoro Timer.
 */

/**
 * Formats total seconds into standard MM:SS string representation.
 * Clamps negative values to 0.
 */
export function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  const paddedMins = mins.toString().padStart(2, '0');
  const paddedSecs = secs.toString().padStart(2, '0');
  return `${paddedMins}:${paddedSecs}`;
}

/**
 * Classifies an epoch timestamp into a chronological date group:
 * 'Today', 'Yesterday', or 'Earlier'.
 */
export function formatDateGroup(timestamp: number): 'Today' | 'Yesterday' | 'Earlier' {
  const targetDate = new Date(timestamp);
  const now = new Date();

  const isToday =
    targetDate.getFullYear() === now.getFullYear() &&
    targetDate.getMonth() === now.getMonth() &&
    targetDate.getDate() === now.getDate();

  if (isToday) {
    return 'Today';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    targetDate.getFullYear() === yesterday.getFullYear() &&
    targetDate.getMonth() === yesterday.getMonth() &&
    targetDate.getDate() === yesterday.getDate();

  if (isYesterday) {
    return 'Yesterday';
  }

  return 'Earlier';
}

/**
 * Formats an epoch timestamp into local 24-hour HH:MM time string.
 */
export function formatTimeOfDay(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats minutes into human-readable duration string.
 */
export function formatDurationMinutes(minutes: number): string {
  const safeMinutes = Math.max(1, Math.round(minutes));
  return `${safeMinutes} min`;
}
