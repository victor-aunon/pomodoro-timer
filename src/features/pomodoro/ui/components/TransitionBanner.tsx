import type { TimerMode } from '../../domain/entities';

export interface TransitionBannerProps {
  type: 'pomodoro-completed' | 'break-completed';
  nextMode: TimerMode;
  completedDurationMinutes?: number;
  nextDurationMinutes?: number;
  durationMinutes?: number;
  taskTitle: string | null;
  cycleNumber: number;
  longBreakInterval: number;
  isRunning: boolean;
  onStartNext: () => void;
  onDismiss: () => void;
}

export function TransitionBanner({
  type,
  nextMode,
  completedDurationMinutes,
  nextDurationMinutes,
  durationMinutes,
  taskTitle,
  cycleNumber,
  longBreakInterval,
  isRunning,
  onStartNext,
  onDismiss,
}: TransitionBannerProps) {
  const isPomodoroDone = type === 'pomodoro-completed';
  const isLongBreak = nextMode === 'longBreak';

  const completedMins = Math.max(1, Math.round(completedDurationMinutes ?? durationMinutes ?? 25));
  const nextMins = Math.max(1, Math.round(nextDurationMinutes ?? durationMinutes ?? 5));

  const title = isPomodoroDone
    ? 'Pomodoro Completed! Great focus'
    : 'Break Finished! Mind refreshed';

  const subtitle = isPomodoroDone
    ? isLongBreak
      ? `You completed ${longBreakInterval} cycles. Enjoy a well-deserved long break to recharge.`
      : `You maintained ${completedMins} min of pure focus. Take a breather to consolidate what you learned.`
    : 'Energy recharged. The lowest-friction moment to jump back into flow is right now.';

  const actionText = isRunning
    ? isPomodoroDone
      ? 'Break in progress'
      : 'Focus session in progress'
    : isPomodoroDone
      ? `Take a break (${nextMins} min) ▶`
      : `Start focus session (${nextMins} min) ▶`;

  const bannerClass = `transition-banner ${isPomodoroDone ? 'transition-banner-work' : 'transition-banner-break'}`;

  return (
    <aside
      className={bannerClass}
      role="status"
      aria-live="polite"
      data-testid="transition-banner"
    >
      <div className="transition-banner-header">
        <div className="transition-icon-wrapper" aria-hidden="true">
          {isPomodoroDone ? (
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          )}
        </div>

        <div className="transition-content">
          <strong className="transition-title">{title}</strong>
          <span className="transition-subtitle">{subtitle}</span>

          {taskTitle && isPomodoroDone ? (
            <span className="transition-task-tag">
              🎯 Focus target: <strong>{taskTitle}</strong> (cycle {cycleNumber})
            </span>
          ) : null}
        </div>

        <button
          type="button"
          className="transition-dismiss-btn"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          title="Dismiss notification"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="transition-actions">
        <button
          type="button"
          className="btn btn-delight-action"
          onClick={onStartNext}
          disabled={isRunning}
          aria-label={actionText}
        >
          <span>{actionText}</span>
          {!isRunning ? <span className="hotkey-hint">[Space]</span> : null}
        </button>
      </div>
    </aside>
  );
}
