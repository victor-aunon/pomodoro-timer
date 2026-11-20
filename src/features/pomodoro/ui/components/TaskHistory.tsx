import { useMemo, useState } from 'react';
import {
  formatDateGroup,
  formatDurationMinutes,
  formatTimeOfDay,
} from '../../../../core/utils/time-formatter';
import type { HistoryEntry } from '../../domain/entities';
import { EmptyState } from './EmptyState';

export interface TaskHistoryProps {
  history: HistoryEntry[];
  onDeleteEntry: (id: string) => void;
  onClearHistory: () => void;
}

export function TaskHistory({ history, onDeleteEntry, onClearHistory }: TaskHistoryProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const { groups, totalTodayMinutes } = useMemo(() => {
    const grouped: Record<string, HistoryEntry[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    let todayMins = 0;

    history.forEach((entry) => {
      const group = formatDateGroup(entry.completedAt);
      grouped[group].push(entry);
      if (group === 'Today') {
        todayMins += entry.durationMinutes;
      }
    });

    return { groups: grouped, totalTodayMinutes: todayMins };
  }, [history]);

  if (history.length === 0) {
    return (
      <div data-testid="history-timeline" className="history-container">
        <EmptyState
          title="No focus sessions completed yet"
          description="Start your first Pomodoro to track progress."
        />
      </div>
    );
  }

  return (
    <div data-testid="history-timeline" className="history-container">
      <div className="section-title">
        <div>
          <h2>Focus Session Log</h2>
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              fontWeight: 'normal',
            }}
          >
            Today: <strong>{totalTodayMinutes} min</strong> ({groups.Today.length} sessions)
          </span>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowClearConfirm(true)}
          style={{ fontSize: 'var(--font-size-xs)' }}
        >
          Clear History
        </button>
      </div>

      {(['Today', 'Yesterday', 'Earlier'] as const).map((groupKey) => {
        const entries = groups[groupKey];
        if (entries.length === 0) return null;

        return (
          <div key={groupKey} style={{ marginBottom: 'var(--space-4)' }}>
            <div className="history-group-title">
              <span>{groupKey}</span>
              <span>
                {entries.length} session{entries.length > 1 ? 's' : ''}
              </span>
            </div>

            {entries.map((entry) => (
              <div key={entry.id} className="history-item">
                <div>
                  <div
                    style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}
                  >
                    {entry.taskTitle}
                  </div>
                  <div className="history-meta">
                    <span data-testid="completed-at-timestamp">
                      {formatTimeOfDay(entry.completedAt)}
                    </span>
                    <span>•</span>
                    <span>{formatDurationMinutes(entry.durationMinutes)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-icon"
                  onClick={() => onDeleteEntry(entry.id)}
                  aria-label={`Delete record for ${entry.taskTitle}`}
                  title="Delete entry"
                  style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        );
      })}

      {showClearConfirm ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-history-title"
          className="modal-overlay"
        >
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <h2
              id="clear-history-title"
              className="modal-title"
              style={{ fontSize: 'var(--font-size-lg)' }}
            >
              Clear All History?
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-2)',
              }}
            >
              This will permanently delete all {history.length} completed session records. This
              action cannot be undone.
            </p>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  setShowClearConfirm(false);
                  onClearHistory();
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
