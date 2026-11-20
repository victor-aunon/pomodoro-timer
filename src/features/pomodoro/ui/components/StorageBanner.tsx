import type { StorageHealth } from '../../domain/entities';

export interface StorageBannerProps {
  health: StorageHealth;
  onDismiss: () => void;
}

export function StorageBanner({ health, onDismiss }: StorageBannerProps) {
  if (health.status === 'healthy') {
    return null;
  }

  const message =
    health.warningMessage ||
    'Local storage is currently unavailable. Operating in temporary in-memory mode.';

  return (
    <div
      className="storage-banner"
      role="status"
      aria-live="polite"
      data-testid="storage-health-banner"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span aria-hidden="true">⚠️</span>
        <span>{message}</span>
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-icon"
        onClick={onDismiss}
        aria-label="Dismiss storage warning"
        title="Dismiss warning"
        style={{ width: '32px', height: '32px', minHeight: '32px' }}
      >
        ✕
      </button>
    </div>
  );
}
