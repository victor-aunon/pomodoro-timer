export interface LoadingSkeletonProps {
  type?: 'timer' | 'taskList' | 'history';
}

export function LoadingSkeleton({ type = 'timer' }: LoadingSkeletonProps) {
  if (type === 'taskList') {
    return (
      <div role="status" aria-label="Loading tasks" aria-busy="true" className="task-list">
        <div className="task-item skeleton" style={{ height: '56px' }} />
        <div className="task-item skeleton" style={{ height: '56px' }} />
        <div className="task-item skeleton" style={{ height: '56px' }} />
      </div>
    );
  }

  if (type === 'history') {
    return (
      <div
        role="status"
        aria-label="Loading history"
        aria-busy="true"
        className="history-container"
      >
        <div className="history-item skeleton" style={{ height: '64px' }} />
        <div className="history-item skeleton" style={{ height: '64px' }} />
      </div>
    );
  }

  return (
    <div role="status" aria-label="Loading timer" aria-busy="true" className="timer-card">
      <div className="skeleton skeleton-timer" />
    </div>
  );
}
