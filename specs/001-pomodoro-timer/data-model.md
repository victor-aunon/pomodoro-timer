# Phase 1: Data Model & State Transitions Specification

**Feature**: `001-pomodoro-timer` (Pomodoro Timer with Sound Notifications and Task History)  
**Date**: 2026-11-19  
**Status**: Complete

---

## 1. Domain Entities & Value Objects

The domain layer encapsulates all entities and invariants with zero external dependencies and zero browser API references.

### 1.1 `TimerMode` & `TimerStatus` (Value Objects)

```typescript
export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
```

### 1.2 `TimerState` (Entity)

Represents the core real-time operational state of the countdown engine.

| Field                  | Type             | Invariant / Validation Rule                                  | Description                                    |
| :--------------------- | :--------------- | :----------------------------------------------------------- | :--------------------------------------------- |
| `mode`                 | `TimerMode`      | Must be `'work'`, `'shortBreak'`, or `'longBreak'`.          | Current interval cycle mode.                   |
| `status`               | `TimerStatus`    | Must be `'idle'`, `'running'`, `'paused'`, or `'completed'`. | Current operational state.                     |
| `durationSeconds`      | `number`         | Integer, $60 \le \text{val} \le 7200$ (1 to 120 minutes).    | Total duration of the active mode.             |
| `remainingSeconds`     | `number`         | Integer, $0 \le \text{val} \le \text{durationSeconds}$.      | Seconds left in current countdown.             |
| `startedAt`            | `number \| null` | Epoch timestamp in milliseconds or `null` if idle.           | Wall-clock time when interval started/resumed. |
| `targetEndTime`        | `number \| null` | Epoch timestamp in ms ($\ge \text{startedAt}$) or `null`.    | Calculated deadline for countdown completion.  |
| `completedCyclesCount` | `number`         | Non-negative integer ($\ge 0$).                              | Number of completed Work intervals in cycle.   |
| `activeTaskId`         | `string \| null` | Valid UUID string or `null`.                                 | Reference to the currently focused task.       |

### 1.3 `Task` (Entity)

Represents a unit of work created and managed by the user.

| Field                | Type                                    | Invariant / Validation Rule                                                 | Description                                   |
| :------------------- | :-------------------------------------- | :-------------------------------------------------------------------------- | :-------------------------------------------- |
| `id`                 | `string`                                | Non-empty UUID v4 or timestamp-derived unique ID.                           | Unique task identifier.                       |
| `title`              | `string`                                | Trimmed string, length $1 \le \text{len} \le 100$. Rejects whitespace-only. | Human-readable title of task.                 |
| `estimatedPomodoros` | `number`                                | Integer, $1 \le \text{val} \le 20$. Default: 1.                             | Target focus intervals estimated by user.     |
| `completedPomodoros` | `number`                                | Integer, $\ge 0$. Default: 0. Incremented on work session completion.       | Actual completed work sessions for this task. |
| `status`             | `'active' \| 'completed' \| 'archived'` | Valid enum status. Default: `'active'`.                                     | Task lifecycle state.                         |
| `createdAt`          | `number`                                | Epoch timestamp in milliseconds.                                            | Creation timestamp.                           |
| `updatedAt`          | `number`                                | Epoch timestamp in milliseconds ($\ge \text{createdAt}$).                   | Last updated timestamp.                       |

### 1.4 `HistoryEntry` (Entity)

Represents an immutable, append-only historical record of a successfully completed work interval.

| Field             | Type             | Invariant / Validation Rule                                                             | Description                                  |
| :---------------- | :--------------- | :-------------------------------------------------------------------------------------- | :------------------------------------------- |
| `id`              | `string`         | Non-empty UUID or unique identifier.                                                    | Unique history entry identifier.             |
| `taskId`          | `string \| null` | Valid task ID or `null` if session was unassigned.                                      | Link to origin task.                         |
| `taskTitle`       | `string`         | Snapshot string, length $1 \le \text{len} \le 100$. Default: `"General Focus Session"`. | Captured title at completion time.           |
| `mode`            | `TimerMode`      | Must be `'work'` (history tracks focus sessions).                                       | Session mode completed.                      |
| `durationMinutes` | `number`         | Integer, $1 \le \text{val} \le 120$.                                                    | Length of completed focus period in minutes. |
| `completedAt`     | `number`         | Epoch timestamp in milliseconds.                                                        | Completion timestamp for grouping & sorting. |

### 1.5 `SoundProfile` & `SoundSettings` (Value Objects)

```typescript
export type SoundAlertProfile = 'bell' | 'chime' | 'marimba';

export interface SoundSettings {
  enabled: boolean; // Master toggle (default: true)
  volume: number; // Normalized float between 0.0 and 1.0 (default: 0.8)
  workSound: SoundAlertProfile; // Default: 'bell'
  breakSound: SoundAlertProfile; // Default: 'chime'
}
```

### 1.6 `UserPreferences` (Entity)

Stores user-customizable configuration parameters with validation constraints.

| Field                       | Type            | Bounds / Invariants                 | Default  | Description                                     |
| :-------------------------- | :-------------- | :---------------------------------- | :------- | :---------------------------------------------- |
| `workDurationMinutes`       | `number`        | Integer, $1 \le \text{val} \le 120$ | `25`     | Duration of Work interval in minutes.           |
| `shortBreakDurationMinutes` | `number`        | Integer, $1 \le \text{val} \le 60$  | `5`      | Duration of Short Break in minutes.             |
| `longBreakDurationMinutes`  | `number`        | Integer, $1 \le \text{val} \le 60$  | `15`     | Duration of Long Break in minutes.              |
| `longBreakInterval`         | `number`        | Integer, $1 \le \text{val} \le 12$  | `4`      | Completed Pomodoros required before Long Break. |
| `autoStartBreaks`           | `boolean`       | Boolean                             | `false`  | Automatically begin break when work completes.  |
| `autoStartPomodoros`        | `boolean`       | Boolean                             | `false`  | Automatically begin work when break completes.  |
| `sound`                     | `SoundSettings` | Valid `SoundSettings` object        | defaults | Sound alert configuration.                      |

### 1.7 `StorageHealth` (Value Object)

Represents the operational integrity of the persistence layer.

```typescript
export interface StorageHealth {
  status: 'healthy' | 'degraded';
  storageType: 'localStorage' | 'memory';
  warningMessage: string | null;
}
```

---

## 2. State Machine & Transitions

### 2.1 Timer Operational Status Machine

```
      +-------------+
      |    IDLE     | <-------------------------+
      +-------------+                           |
             |                                  |
             | start()                          |
             v                                  |
      +-------------+        pause()     +-------------+
      |   RUNNING   | -----------------> |   PAUSED    |
      +-------------+ <----------------- +-------------+
             |               resume()           |
             |                                  | reset()
             | tick() [remaining == 0]          |
             v                                  |
      +-------------+                           |
      |  COMPLETED  | --------------------------+
      +-------------+
             |
             | autoTransition() or startNext()
             v
      [ Next Mode (IDLE or RUNNING) ]
```

#### Status Transition Invariants

1. `start()`: Valid from `IDLE`. Sets `status = 'running'`, `startedAt = Date.now()`, `targetEndTime = startedAt + remainingSeconds * 1000`.
2. `pause()`: Valid from `RUNNING`. Sets `status = 'paused'`, clears `targetEndTime`, recalculates `remainingSeconds`.
3. `resume()`: Valid from `PAUSED`. Sets `status = 'running'`, `startedAt = Date.now()`, `targetEndTime = startedAt + remainingSeconds * 1000`.
4. `reset()`: Valid from `RUNNING`, `PAUSED`, or `COMPLETED`. Sets `status = 'idle'`, restores `remainingSeconds = durationSeconds`, clears `startedAt` and `targetEndTime`.
5. `skip()`: Requires confirmation. If confirmed: halts current interval, leaves completed cycle counter unchanged, advances to the next mode in the cycle, resets `remainingSeconds` to the new mode duration.

### 2.2 Interval Mode Cycle Machine

```
                 +-------------------+
                 |    WORK (25m)     |
                 +-------------------+
                           |
            Work Completed | (tally++)
                           v
              [ tally % interval == 0 ? ]
                 /                   \
        YES     /                     \  NO
               v                       v
      +-----------------+     +-----------------+
      | LONG BREAK(15m) |     |SHORT BREAK (5m) |
      +-----------------+     +-----------------+
               \                       /
Break Complete  \                     / Break Complete
                 \                   /
                  v                 v
                 +-------------------+
                 |    WORK (25m)     |
                 +-------------------+
```

#### Mode Transition Rules

- When a `work` session completes ($00:00$ reached):
  1. Increments `completedCyclesCount` by $1$.
  2. If associated with an active task, increments `task.completedPomodoros` by $1$.
  3. Appends a new `HistoryEntry` record.
  4. Triggers `AudioNotificationPort.play('work', volume)`.
  5. If `completedCyclesCount % longBreakInterval === 0`, next mode is `'longBreak'`. Otherwise, next mode is `'shortBreak'`.
  6. If `preferences.autoStartBreaks` is `true`, transition directly to `RUNNING` in the new mode. Otherwise, transition to `IDLE`.
- When a `shortBreak` or `longBreak` session completes ($00:00$ reached):
  1. Triggers `AudioNotificationPort.play('break', volume)`.
  2. Next mode is `'work'`.
  3. If `preferences.autoStartPomodoros` is `true`, transition directly to `RUNNING`. Otherwise, transition to `IDLE`.

---

## 3. Data Integrity & Validation Rules

### 3.1 Input Validation Matrix

| Field                      | Validation Predicate                                     | Failure Error Message                                        |
| :------------------------- | :------------------------------------------------------- | :----------------------------------------------------------- |
| `task.title`               | `title.trim().length >= 1 && title.trim().length <= 100` | `"Task title must be between 1 and 100 characters."`         |
| `task.estimatedPomodoros`  | `Number.isInteger(val) && val >= 1 && val <= 20`         | `"Estimated Pomodoros must be an integer between 1 and 20."` |
| `preferences.workDuration` | `Number.isInteger(val) && val >= 1 && val <= 120`        | `"Work duration must be between 1 and 120 minutes."`         |
| `preferences.shortBreak`   | `Number.isInteger(val) && val >= 1 && val <= 60`         | `"Short break must be between 1 and 60 minutes."`            |
| `preferences.longBreak`    | `Number.isInteger(val) && val >= 1 && val <= 60`         | `"Long break must be between 1 and 60 minutes."`             |
| `preferences.interval`     | `Number.isInteger(val) && val >= 1 && val <= 12`         | `"Long break interval must be between 1 and 12 cycles."`     |
| `sound.volume`             | `typeof val === 'number' && val >= 0 && val <= 1`        | `"Volume must be between 0.0 and 1.0."`                      |

### 3.2 Deserialization Schema Guarding (Quarantine Policy)

When loading data from persistent storage:

```typescript
function safeDeserialize<T>(
  rawJson: string | null,
  validator: (obj: unknown) => obj is T,
  fallback: T,
): { data: T; isCorrupted: boolean } {
  if (!rawJson) return { data: fallback, isCorrupted: false };
  try {
    const parsed = JSON.parse(rawJson);
    if (validator(parsed)) {
      return { data: parsed, isCorrupted: false };
    }
  } catch (err) {
    // Malformed JSON caught below
  }
  return { data: fallback, isCorrupted: true };
}
```

If `isCorrupted` is `true`:

1. Save the bad raw string under `pomodoro_quarantine_<key>_<Date.now()>`.
2. Delete the corrupted key from active storage.
3. Return `fallback` safe defaults.
4. Record a non-fatal warning in console.
