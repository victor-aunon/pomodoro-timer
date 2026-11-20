import type { Task } from '../../domain/entities';
import { EmptyState } from './EmptyState';
import { TaskItem } from './TaskItem';

export interface TaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  onSelectTask: (id: string) => void;
  onCompleteTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export function TaskList({
  tasks,
  activeTaskId,
  onSelectTask,
  onCompleteTask,
  onDeleteTask,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No tasks yet"
        description="Create a task to organize your focus sessions."
      />
    );
  }

  return (
    <div className="task-list" role="list" aria-label="Tasks list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isActive={task.id === activeTaskId}
          onSelect={() => onSelectTask(task.id)}
          onComplete={() => onCompleteTask(task.id)}
          onDelete={() => onDeleteTask(task.id)}
        />
      ))}
    </div>
  );
}
