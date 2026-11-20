import { formatTime } from '../../../../core/utils/time-formatter';
import type { TimerMode } from '../../domain/entities';

export interface TimerDisplayProps {
  mode: TimerMode;
  remainingSeconds: number;
  durationSeconds: number;
  activeTaskTitle: string | null;
  isCompletePulse?: boolean | 'work' | 'break';
}

const RADIUS = 144;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getModeBadgeText(mode: TimerMode): string {
  switch (mode) {
    case 'work':
      return 'Work Focus';
    case 'shortBreak':
      return 'Short Break';
    case 'longBreak':
      return 'Long Break';
  }
}

function getPulseClass(pulse: boolean | 'work' | 'break'): string {
  if (!pulse) return '';
  if (pulse === 'break') return 'pulse-break';
  if (pulse === 'work') return 'pulse-work';
  return 'pulse-animation pulse-work';
}

export function TimerDisplay({
  mode,
  remainingSeconds,
  durationSeconds,
  activeTaskTitle,
  isCompletePulse = false,
}: TimerDisplayProps) {
  const safeDuration = durationSeconds > 0 ? durationSeconds : 1;
  const progressRatio = Math.max(0, Math.min(1, remainingSeconds / safeDuration));
  const strokeDashoffset = CIRCUMFERENCE * (1 - progressRatio);
  const formattedTime = formatTime(remainingSeconds);
  const modeLabel = getModeBadgeText(mode);
  const pulseClass = getPulseClass(isCompletePulse);

  return (
    <div
      data-testid="timer-display"
      className={`timer-card ${pulseClass}`}
      role="timer"
      aria-label={`${modeLabel}: ${formattedTime} remaining`}
      aria-live="polite"
    >
      <div className="timer-svg-container">
        <svg
          viewBox="0 0 320 320"
          width="320"
          height="320"
          className="timer-svg"
          aria-hidden="true"
        >
          {isCompletePulse ? (
            <circle cx="160" cy="160" className="celebration-ripple" aria-hidden="true" />
          ) : null}
          <circle
            cx="160"
            cy="160"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            className="timer-ring-bg"
          />
          <circle
            cx="160"
            cy="160"
            r={RADIUS}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="timer-ring-progress"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        <div className="timer-text-overlay">
          <div className="timer-digits" data-testid="current-time">
            {formattedTime}
          </div>
          <div className="timer-badge">
            <span>●</span> {modeLabel}
          </div>
        </div>
      </div>

      {activeTaskTitle ? (
        <div className="active-task-display" title={activeTaskTitle}>
          🎯 Focus: <strong>{activeTaskTitle}</strong>
        </div>
      ) : null}
    </div>
  );
}
