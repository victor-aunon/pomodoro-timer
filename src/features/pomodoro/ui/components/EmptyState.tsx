export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true" style={{ fontSize: '36px' }}>
        📋
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-description">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onAction}
          style={{ marginTop: 'var(--space-2)' }}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
