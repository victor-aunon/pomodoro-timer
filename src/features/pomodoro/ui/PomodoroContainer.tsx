import { useEffect, useState } from 'react';
import type {
  IAudioNotificationPort,
  IPersistencePort,
  ITaskService,
  ITimerService,
} from '../application/ports';
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '../domain/entities';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { SettingsDialog } from './components/SettingsDialog';
import { StorageBanner } from './components/StorageBanner';
import { TaskForm } from './components/TaskForm';
import { TaskHistory } from './components/TaskHistory';
import { TaskList } from './components/TaskList';
import { TimerControls } from './components/TimerControls';
import { TimerDisplay } from './components/TimerDisplay';
import { TransitionBanner } from './components/TransitionBanner';
import { usePomodoro } from './hooks/usePomodoro';

export interface PomodoroContainerProps {
  timerService: ITimerService;
  taskService?: ITaskService;
  persistencePort?: IPersistencePort;
  audioPort?: IAudioNotificationPort;
  initialPreferences?: UserPreferences;
  onNavigateRoute?: (route: string) => void;
  isLoading?: boolean;
}

export function PomodoroContainer({
  timerService,
  taskService,
  persistencePort,
  audioPort,
  initialPreferences = DEFAULT_USER_PREFERENCES,
  onNavigateRoute,
  isLoading = false,
}: PomodoroContainerProps) {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  const {
    timerState,
    tasks,
    history,
    preferences,
    activeTask,
    storageHealth,
    start,
    pause,
    resume,
    reset,
    skip,
    setMode,
    selectActiveTask,
    createTask,
    completeTask,
    deleteTask,
    deleteHistoryEntry,
    clearHistory,
    updatePreferences,
    resetPreferences,
    previewSound,
    dismissStorageBanner,
    transitionEvent,
    dismissTransitionEvent,
  } = usePomodoro({
    timerService,
    taskService,
    persistencePort,
    audioPort,
    initialPreferences,
  });

  const [pulseType, setPulseType] = useState<'work' | 'break' | false>(false);
  const [prevCycleCount, setPrevCycleCount] = useState(timerState.completedCyclesCount);

  useEffect(() => {
    if (transitionEvent) {
      const type = transitionEvent.type === 'pomodoro-completed' ? 'work' : 'break';
      setPulseType(type);
      const timer = setTimeout(() => setPulseType(false), 2400);
      return () => clearTimeout(timer);
    }
  }, [transitionEvent]);

  useEffect(() => {
    if (timerState.completedCyclesCount > prevCycleCount) {
      if (!pulseType) {
        setPulseType('work');
        const timer = setTimeout(() => setPulseType(false), 2400);
        return () => clearTimeout(timer);
      }
    }
    setPrevCycleCount(timerState.completedCyclesCount);
  }, [timerState.completedCyclesCount, prevCycleCount, pulseType]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentRoute(path);
    }
    if (onNavigateRoute) {
      onNavigateRoute(path);
    }
  };

  const themeClass = `theme-${timerState.mode}`;
  const isSettingsOpen = currentRoute === '/settings';

  return (
    <div
      className={themeClass}
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="app-header">
        <button
          type="button"
          className="brand"
          onClick={() => navigate('/')}
          aria-label="Pomodoro Focus Timer Home"
        >
          <div className="brand-icon">🍅</div>
          <span className="brand-text">Pomodoro Focus</span>
        </button>

        <nav className="header-actions" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-link ${currentRoute === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            Timer
          </button>
          <button
            type="button"
            className={`nav-link ${currentRoute === '/history' ? 'active' : ''}`}
            onClick={() => navigate('/history')}
          >
            History
          </button>
          <button
            type="button"
            className={`nav-link ${currentRoute === '/settings' ? 'active' : ''}`}
            onClick={() => navigate('/settings')}
          >
            Settings
          </button>
        </nav>
      </header>

      <main id="main-content" className="main-content">
        <StorageBanner health={storageHealth} onDismiss={dismissStorageBanner} />

        {isLoading ? (
          <LoadingSkeleton type={currentRoute === '/history' ? 'history' : 'timer'} />
        ) : currentRoute === '/history' ? (
          <div
            data-testid="task-history-view"
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <TaskHistory
              history={history}
              onDeleteEntry={deleteHistoryEntry}
              onClearHistory={clearHistory}
            />
          </div>
        ) : (
          <div data-testid="timer-dashboard" className="dashboard-layout">
            <div className="mode-tabs" role="tablist" aria-label="Timer Mode Switcher">
              <button
                type="button"
                role="tab"
                aria-selected={timerState.mode === 'work'}
                className={`mode-tab ${timerState.mode === 'work' ? 'active' : ''}`}
                onClick={() => setMode('work')}
              >
                Work
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={timerState.mode === 'shortBreak'}
                className={`mode-tab ${timerState.mode === 'shortBreak' ? 'active' : ''}`}
                onClick={() => setMode('shortBreak')}
              >
                Short Break
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={timerState.mode === 'longBreak'}
                className={`mode-tab ${timerState.mode === 'longBreak' ? 'active' : ''}`}
                onClick={() => setMode('longBreak')}
              >
                Long Break
              </button>
            </div>

            {transitionEvent ? (
              <TransitionBanner
                type={transitionEvent.type}
                nextMode={transitionEvent.nextMode}
                completedDurationMinutes={transitionEvent.durationMinutes}
                nextDurationMinutes={Math.round(timerState.durationSeconds / 60)}
                taskTitle={transitionEvent.taskTitle}
                cycleNumber={transitionEvent.cycleNumber}
                longBreakInterval={preferences.longBreakInterval}
                isRunning={timerState.status === 'running'}
                onStartNext={start}
                onDismiss={dismissTransitionEvent}
              />
            ) : null}

            <TimerDisplay
              mode={timerState.mode}
              remainingSeconds={timerState.remainingSeconds}
              durationSeconds={timerState.durationSeconds}
              activeTaskTitle={activeTask?.title || null}
              isCompletePulse={pulseType}
            />

            <TimerControls
              status={timerState.status}
              onStart={start}
              onPause={pause}
              onResume={resume}
              onReset={reset}
              onSkip={skip}
            />

            <div className="cycle-counter">
              <span>Completed Cycles:</span>
              <strong>{timerState.completedCyclesCount}</strong>
              <span>/ {preferences.longBreakInterval}</span>
            </div>

            <section className="section-card" aria-labelledby="tasks-heading">
              <h2 id="tasks-heading" className="section-title">
                <span>Focus Tasks</span>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  {tasks.filter((t) => t.status === 'completed').length}/{tasks.length} Done
                </span>
              </h2>

              <TaskForm onSubmit={createTask} />

              <TaskList
                tasks={tasks}
                activeTaskId={timerState.activeTaskId}
                onSelectTask={selectActiveTask}
                onCompleteTask={completeTask}
                onDeleteTask={deleteTask}
              />
            </section>
          </div>
        )}

        <SettingsDialog
          isOpen={isSettingsOpen}
          preferences={preferences}
          onSave={updatePreferences}
          onClose={() => navigate('/')}
          onResetDefaults={resetPreferences}
          onPreviewSound={previewSound}
        />
      </main>
    </div>
  );
}
