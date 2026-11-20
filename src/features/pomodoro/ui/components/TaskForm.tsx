import { type FormEvent, useState } from 'react';

export interface TaskFormProps {
  onSubmit: (title: string, estimatedPomodoros: number) => void;
  isSubmitting?: boolean;
}

export function TaskForm({ onSubmit, isSubmitting = false }: TaskFormProps) {
  const [title, setTitle] = useState('');
  const [estimated, setEstimated] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();

    if (trimmed.length < 1 || trimmed.length > 100) {
      setError('Task title must be between 1 and 100 characters.');
      return;
    }

    if (!Number.isInteger(estimated) || estimated < 1 || estimated > 20) {
      setError('Estimated Pomodoros must be an integer between 1 and 20.');
      return;
    }

    setError(null);
    onSubmit(trimmed, estimated);
    setTitle('');
    setEstimated(1);
  };

  return (
    <form onSubmit={handleSubmit} className="task-form" noValidate>
      <div className="form-row">
        <input
          type="text"
          className="input"
          placeholder="What are you working on?"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          maxLength={100}
          aria-label="Task title"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'task-form-error' : undefined}
          disabled={isSubmitting}
        />

        <input
          type="number"
          className="input input-number"
          min={1}
          max={20}
          value={estimated}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setEstimated(Number.isNaN(val) ? 1 : val);
          }}
          aria-label="Estimated Pomodoros"
          disabled={isSubmitting}
          title="Estimated Pomodoros (1-20)"
        />

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting}
          aria-label="Add new task"
        >
          Add Task
        </button>
      </div>

      <div className="form-footer">
        {error ? (
          <span id="task-form-error" className="error-text" role="alert">
            {error}
          </span>
        ) : (
          <span>
            Estimate: {estimated} session{estimated > 1 ? 's' : ''}
          </span>
        )}
        <span>{title.length}/100</span>
      </div>
    </form>
  );
}
