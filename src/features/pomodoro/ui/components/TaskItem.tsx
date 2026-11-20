import type { Task } from '../../domain/entities';

export interface TaskItemProps {
  task: Task;
  isActive: boolean;
  onSelect: () => void;
  onComplete: () => void;
  onDelete: () => void;
}

export function TaskItem({ task, isActive, onSelect, onComplete, onDelete }: TaskItemProps) {
  const isCompleted = task.status === 'completed';

  return (
    <div
      className={`task-item ${isActive ? 'active' : ''}`}
      role="listitem"
      aria-label={`Task: ${task.title}, ${task.completedPomodoros} of ${task.estimatedPomodoros} Pomodoros`}
    >
      <div className="task-left">
        <button
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={onComplete}
          disabled={isCompleted}
          aria-label={isCompleted ? 'Task completed' : `Mark ${task.title} as completed`}
          title={isCompleted ? 'Completed' : 'Mark complete'}
          style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
        >
          {isCompleted ? '✓' : '○'}
        </button>

        <button
          type="button"
          onClick={onSelect}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            flex: 1,
            color: 'inherit',
            padding: 'var(--space-1) var(--space-2)',
            minHeight: '44px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
          aria-label={`Select ${task.title} as focus target`}
        >
          <span className={`task-title ${isCompleted ? 'completed' : ''}`}>{task.title}</span>
          <span className="task-tally">
            {isActive ? '🎯 Active Focus • ' : ''}
            {task.completedPomodoros} of {task.estimatedPomodoros} Pomodoro
            {task.estimatedPomodoros > 1 ? 's' : ''}
          </span>
        </button>
      </div>

      <div className="task-actions">
        <button
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={onDelete}
          aria-label={`Delete task ${task.title}`}
          title="Delete task"
          style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
        >
          🗑
        </button>
      </div>
    </div>
  );
}
