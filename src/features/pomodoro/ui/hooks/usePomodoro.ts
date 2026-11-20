/**
 * Complete usePomodoro custom hook.
 * Connects TimerService, TaskService, PersistencePort, and AudioNotificationPort.
 */

import { useCallback, useEffect, useState } from 'react';
import { formatTime } from '../../../../core/utils/time-formatter';
import type {
  IAudioNotificationPort,
  IPersistencePort,
  ITaskService,
  ITimerService,
} from '../../application/ports';
import {
  DEFAULT_USER_PREFERENCES,
  type HistoryEntry,
  type SoundAlertProfile,
  type StorageHealth,
  type Task,
  type TimerMode,
  type TimerState,
  type UserPreferences,
} from '../../domain/entities';

export interface SessionTransitionEvent {
  type: 'pomodoro-completed' | 'break-completed';
  completedMode: TimerMode;
  nextMode: TimerMode;
  durationMinutes: number;
  taskTitle: string | null;
  cycleNumber: number;
  timestamp: number;
}

export interface UsePomodoroOptions {
  timerService: ITimerService;
  taskService?: ITaskService;
  persistencePort?: IPersistencePort;
  audioPort?: IAudioNotificationPort;
  initialPreferences?: UserPreferences;
}

export function usePomodoro({
  timerService,
  taskService,
  persistencePort,
  audioPort,
  initialPreferences,
}: UsePomodoroOptions) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    if (initialPreferences) return initialPreferences;
    if (persistencePort) return persistencePort.loadPreferences();
    return DEFAULT_USER_PREFERENCES;
  });

  const [timerState, setTimerState] = useState<TimerState>(() => timerService.getState());
  const [tasks, setTasks] = useState<Task[]>(() => (taskService ? taskService.getTasks() : []));
  const [history, setHistory] = useState<HistoryEntry[]>(() =>
    taskService ? taskService.getHistory() : [],
  );

  const [storageHealth, setStorageHealth] = useState<StorageHealth>(() =>
    persistencePort
      ? persistencePort.getHealth()
      : { status: 'healthy' as const, storageType: 'memory', warningMessage: null },
  );
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [transitionEvent, setTransitionEvent] = useState<SessionTransitionEvent | null>(null);

  // Subscribe to storage health
  useEffect(() => {
    if (!persistencePort) return;
    const unsubscribe = persistencePort.onHealthChange((health) => {
      setStorageHealth(health);
      setIsBannerDismissed(false);
    });
    return () => {
      unsubscribe();
    };
  }, [persistencePort]);

  // Subscribe to TimerService
  useEffect(() => {
    const unsubscribe = timerService.subscribe((newState) => {
      setTimerState(newState);
    });
    return () => {
      unsubscribe();
    };
  }, [timerService]);

  // Subscribe to TaskService
  useEffect(() => {
    if (!taskService) {
      return;
    }

    const unsubscribe = taskService.subscribe((updatedTasks, updatedHistory) => {
      setTasks(updatedTasks);
      setHistory(updatedHistory);
    });

    return () => {
      unsubscribe();
    };
  }, [taskService]);

  // Wire session completion recording and delight transition event
  useEffect(() => {
    if ('setOnSessionComplete' in timerService) {
      const concreteTimer = timerService as unknown as {
        setOnSessionComplete: (cb: (mode: TimerMode, durationMinutes: number) => void) => void;
      };
      concreteTimer.setOnSessionComplete((completedMode, durationMinutes) => {
        if (completedMode === 'work' && taskService) {
          taskService.recordCompletedWorkSession(durationMinutes);
        }

        const stateNow = timerService.getState();
        const active = tasks.find((t) => t.id === stateNow.activeTaskId);
        setTransitionEvent({
          type: completedMode === 'work' ? 'pomodoro-completed' : 'break-completed',
          completedMode,
          nextMode: stateNow.mode,
          durationMinutes,
          taskTitle: active?.title || null,
          cycleNumber: stateNow.completedCyclesCount,
          timestamp: Date.now(),
        });
      });
    }
  }, [timerService, taskService, tasks]);

  // Dynamic document title
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const formatted = formatTime(timerState.remainingSeconds);
    const modeLabel =
      timerState.mode === 'work'
        ? 'Work'
        : timerState.mode === 'shortBreak'
          ? 'Short Break'
          : 'Long Break';

    document.title = `${formatted} - ${modeLabel} | Pomodoro`;
  }, [timerState.remainingSeconds, timerState.mode]);

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        (target &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) ||
        document.querySelector('[role="dialog"]')
      ) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        setTransitionEvent(null);
        if (timerState.status === 'running') {
          timerService.pause();
        } else if (timerState.status === 'paused') {
          timerService.resume();
        } else {
          timerService.start();
        }
      } else if (event.code === 'KeyR' || event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        setTransitionEvent(null);
        timerService.reset();
      } else if (event.code === 'KeyS' || event.key === 's' || event.key === 'S') {
        event.preventDefault();
        setTransitionEvent(null);
        timerService.skip(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [timerService, timerState.status]);

  const start = useCallback(() => {
    setTransitionEvent(null);
    timerService.start();
  }, [timerService]);
  const pause = useCallback(() => timerService.pause(), [timerService]);
  const resume = useCallback(() => {
    setTransitionEvent(null);
    timerService.resume();
  }, [timerService]);
  const reset = useCallback(() => {
    setTransitionEvent(null);
    timerService.reset();
  }, [timerService]);
  const skip = useCallback(
    (confirmed = true) => {
      setTransitionEvent(null);
      timerService.skip(confirmed);
    },
    [timerService],
  );
  const setMode = useCallback(
    (mode: TimerMode) => {
      setTransitionEvent(null);
      timerService.setMode(mode);
    },
    [timerService],
  );

  const selectActiveTask = useCallback(
    (id: string | null) => {
      if (taskService) {
        const nextId = timerState.activeTaskId === id ? null : id;
        taskService.selectActiveTask(nextId);
        timerService.setActiveTaskId(nextId);
      }
    },
    [taskService, timerService, timerState.activeTaskId],
  );

  const createTask = useCallback(
    (title: string, estimated = 1) => {
      if (!taskService) throw new Error('TaskService not available');
      return taskService.createTask(title, estimated);
    },
    [taskService],
  );

  const completeTask = useCallback(
    (id: string) => {
      if (taskService) taskService.completeTask(id);
    },
    [taskService],
  );

  const deleteTask = useCallback(
    (id: string) => {
      if (taskService) {
        taskService.deleteTask(id);
        if (timerState.activeTaskId === id) {
          timerService.setActiveTaskId(null);
        }
      }
    },
    [taskService, timerService, timerState.activeTaskId],
  );

  const deleteHistoryEntry = useCallback(
    (id: string) => {
      if (taskService) taskService.deleteHistoryEntry(id);
    },
    [taskService],
  );

  const clearHistory = useCallback(() => {
    if (taskService) taskService.clearHistory();
  }, [taskService]);

  const updatePreferences = useCallback(
    (newPrefs: UserPreferences) => {
      setPreferences(newPrefs);
      timerService.updateDurations(newPrefs);
      if (persistencePort) {
        persistencePort.savePreferences(newPrefs);
      }
    },
    [timerService, persistencePort],
  );

  const resetPreferences = useCallback(() => {
    updatePreferences(DEFAULT_USER_PREFERENCES);
  }, [updatePreferences]);

  const previewSound = useCallback(
    (profile: SoundAlertProfile, volume: number) => {
      if (audioPort) {
        audioPort.preview(profile, volume).catch(() => {});
      }
    },
    [audioPort],
  );

  const dismissStorageBanner = useCallback(() => {
    setIsBannerDismissed(true);
  }, []);

  const dismissTransitionEvent = useCallback(() => {
    setTransitionEvent(null);
  }, []);

  const activeTask = tasks.find((t) => t.id === timerState.activeTaskId) || null;

  return {
    timerState,
    tasks,
    history,
    preferences,
    activeTask,
    storageHealth: isBannerDismissed
      ? { status: 'healthy' as const, storageType: storageHealth.storageType, warningMessage: null }
      : storageHealth,
    transitionEvent,
    dismissTransitionEvent,
    start,
    pause,
    resume,
    reset,
    skip,
    setMode,
    selectActiveTask,
    createTask,
    completeTask,
    deleteTask,
    deleteHistoryEntry,
    clearHistory,
    updatePreferences,
    resetPreferences,
    previewSound,
    dismissStorageBanner,
  };
}
