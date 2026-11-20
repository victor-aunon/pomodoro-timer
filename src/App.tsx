import { useMemo } from 'react';
import { TaskService } from './features/pomodoro/application/task-service';
import { TimerService } from './features/pomodoro/application/timer-service';
import { LocalStorageAdapter } from './features/pomodoro/infrastructure/local-storage-adapter';
import { WebAudioAdapter } from './features/pomodoro/infrastructure/web-audio-adapter';
import { ErrorBoundary } from './features/pomodoro/ui/components/ErrorBoundary';
import { PomodoroContainer } from './features/pomodoro/ui/PomodoroContainer';

export function App() {
  const { timerService, taskService, persistencePort, audioPort, initialPreferences } =
    useMemo(() => {
      const storage = new LocalStorageAdapter();
      const prefs = storage.loadPreferences();
      const audio = new WebAudioAdapter();
      const task = new TaskService(storage);
      const timer = new TimerService(prefs, audio);
      return {
        timerService: timer,
        taskService: task,
        persistencePort: storage,
        audioPort: audio,
        initialPreferences: prefs,
      };
    }, []);

  return (
    <ErrorBoundary>
      <PomodoroContainer
        timerService={timerService}
        taskService={taskService}
        persistencePort={persistencePort}
        audioPort={audioPort}
        initialPreferences={initialPreferences}
      />
    </ErrorBoundary>
  );
}
