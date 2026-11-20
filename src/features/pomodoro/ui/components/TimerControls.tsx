import { useState } from 'react';
import type { TimerStatus } from '../../domain/entities';

export interface TimerControlsProps {
  status: TimerStatus;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function TimerControls({
  status,
  onStart,
  onPause,
  onResume,
  onReset,
  onSkip,
}: TimerControlsProps) {
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const handleSkipClick = () => {
    setShowSkipConfirm(true);
  };

  const handleConfirmSkip = () => {
    setShowSkipConfirm(false);
    onSkip();
  };

  const handleCancelSkip = () => {
    setShowSkipConfirm(false);
  };

  return (
    <div className="controls-container">
      {status !== 'idle' ? (
        <button
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={onReset}
          aria-label="Reset timer"
          title="Reset timer [R]"
        >
          <span>↺</span>
        </button>
      ) : null}

      {status === 'running' ? (
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={onPause}
          aria-label="Pause timer"
        >
          <span>❚❚</span> Pause <span className="hotkey-hint">[Space]</span>
        </button>
      ) : status === 'paused' ? (
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={onResume}
          aria-label="Resume timer"
        >
          <span>▶</span> Resume <span className="hotkey-hint">[Space]</span>
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={onStart}
          aria-label="Start timer"
        >
          <span>▶</span> Start <span className="hotkey-hint">[Space]</span>
        </button>
      )}

      <button
        type="button"
        className="btn btn-secondary btn-icon"
        onClick={handleSkipClick}
        aria-label="Skip interval"
        title="Skip interval [S]"
      >
        <span>⏭</span>
      </button>

      {showSkipConfirm ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="skip-dialog-title"
          className="modal-overlay"
        >
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <h2
              id="skip-dialog-title"
              className="modal-title"
              style={{ fontSize: 'var(--font-size-lg)' }}
            >
              Skip Current Interval?
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-2)',
              }}
            >
              Skipping will advance to the next interval without counting this session towards your
              completed tally.
            </p>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCancelSkip}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmSkip}>
                Skip Interval
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
