/**
 * UI Component Props Contracts
 * Defines atomic design component interfaces.
 * Adheres strictly to the one-component-per-file and presentational decoupling rules.
 */

import type {
  HistoryEntry,
  StorageHealth,
  Task,
  TimerMode,
  TimerState,
  UserPreferences,
} from '../data-model';

export interface TimerDisplayProps {
  mode: TimerMode;
  remainingSeconds: number;
  durationSeconds: number;
  activeTaskTitle: string | null;
}

export interface TimerControlsProps {
  status: TimerState['status'];
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export interface TaskFormProps {
  onSubmit: (title: string, estimatedPomodoros: number) => void;
  isSubmitting?: boolean;
}

export interface TaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  onSelectTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export interface TaskItemProps {
  task: Task;
  isActive: boolean;
  onSelect: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

export interface TaskHistoryProps {
  history: HistoryEntry[];
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
}

export interface SettingsDialogProps {
  isOpen: boolean;
  preferences: UserPreferences;
  onSave: (preferences: UserPreferences) => void;
  onResetDefaults: () => void;
  onClose: () => void;
  onPreviewSound: (profile: UserPreferences['sound']['workSound'], volume: number) => void;
}

export interface StorageBannerProps {
  health: StorageHealth;
  onDismiss: () => void;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}
