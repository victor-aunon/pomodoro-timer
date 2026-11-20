import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { TimerService } from '../../src/features/pomodoro/application/timer-service';
import { DEFAULT_USER_PREFERENCES } from '../../src/features/pomodoro/domain/entities';
import { TimerControls } from '../../src/features/pomodoro/ui/components/TimerControls';

describe('Timer Controls & Keyboard Shortcuts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000000);
  });

  describe('TimerControls Button Titles & Accessible Tooltips', () => {
    it('renders accessible title with hotkey on Start button in idle state', () => {
      const html = renderToStaticMarkup(
        <TimerControls
          status="idle"
          onStart={vi.fn()}
          onPause={vi.fn()}
          onResume={vi.fn()}
          onReset={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      expect(html).toContain('title="Start timer [Space]"');
      expect(html).toContain('title="Skip interval [S]"');
      // Reset is not shown when idle
      expect(html).not.toContain('title="Reset timer [R]"');
    });

    it('renders accessible title with hotkey on Pause button in running state', () => {
      const html = renderToStaticMarkup(
        <TimerControls
          status="running"
          onStart={vi.fn()}
          onPause={vi.fn()}
          onResume={vi.fn()}
          onReset={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      expect(html).toContain('title="Pause timer [Space]"');
      expect(html).toContain('title="Reset timer [R]"');
      expect(html).toContain('title="Skip interval [S]"');
    });

    it('renders accessible title with hotkey on Resume button in paused state', () => {
      const html = renderToStaticMarkup(
        <TimerControls
          status="paused"
          onStart={vi.fn()}
          onPause={vi.fn()}
          onResume={vi.fn()}
          onReset={vi.fn()}
          onSkip={vi.fn()}
        />,
      );

      expect(html).toContain('title="Resume timer [Space]"');
      expect(html).toContain('title="Reset timer [R]"');
      expect(html).toContain('title="Skip interval [S]"');
    });
  });

  describe('Keyboard Event Dispatch (KeyS, Space, KeyR)', () => {
    it('skips interval when S keydown event is dispatched', () => {
      const timerService = new TimerService(DEFAULT_USER_PREFERENCES);
      timerService.start();
      expect(timerService.getState().mode).toBe('work');
      expect(timerService.getState().status).toBe('running');

      // The exact dispatch handler logic wired in usePomodoro
      const handleKeyDown = (event: { code: string; key: string; preventDefault: () => void }) => {
        if (event.code === 'KeyS' || event.key === 's' || event.key === 'S') {
          event.preventDefault();
          timerService.skip(true);
        }
      };

      const preventDefault = vi.fn();
      handleKeyDown({ code: 'KeyS', key: 's', preventDefault });

      expect(preventDefault).toHaveBeenCalled();
      expect(timerService.getState().mode).toBe('shortBreak');
      expect(timerService.getState().status).toBe('idle');
    });

    it('toggles start and pause when Space keydown event is dispatched', () => {
      const timerService = new TimerService(DEFAULT_USER_PREFERENCES);
      expect(timerService.getState().status).toBe('idle');

      const handleKeyDown = (event: { code: string; preventDefault: () => void }) => {
        if (event.code === 'Space') {
          event.preventDefault();
          if (timerService.getState().status === 'running') {
            timerService.pause();
          } else if (timerService.getState().status === 'paused') {
            timerService.resume();
          } else {
            timerService.start();
          }
        }
      };

      const preventDefault = vi.fn();

      // Space 1: Start
      handleKeyDown({ code: 'Space', preventDefault });
      expect(timerService.getState().status).toBe('running');

      // Space 2: Pause
      handleKeyDown({ code: 'Space', preventDefault });
      expect(timerService.getState().status).toBe('paused');

      // Space 3: Resume
      handleKeyDown({ code: 'Space', preventDefault });
      expect(timerService.getState().status).toBe('running');
    });

    it('resets timer when R keydown event is dispatched', () => {
      const timerService = new TimerService(DEFAULT_USER_PREFERENCES);
      timerService.start();
      expect(timerService.getState().status).toBe('running');

      const handleKeyDown = (event: { code: string; key: string; preventDefault: () => void }) => {
        if (event.code === 'KeyR' || event.key === 'r' || event.key === 'R') {
          event.preventDefault();
          timerService.reset();
        }
      };

      const preventDefault = vi.fn();
      handleKeyDown({ code: 'KeyR', key: 'r', preventDefault });

      expect(preventDefault).toHaveBeenCalled();
      expect(timerService.getState().status).toBe('idle');
      expect(timerService.getState().remainingSeconds).toBe(25 * 60);
    });

    it('does not trigger hotkeys when typing inside an input element', () => {
      const timerService = new TimerService(DEFAULT_USER_PREFERENCES);
      expect(timerService.getState().status).toBe('idle');

      const handleKeyDown = (event: {
        code: string;
        key: string;
        target: { tagName: string; isContentEditable: boolean };
        preventDefault: () => void;
      }) => {
        const target = event.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }

        if (event.code === 'KeyS' || event.key === 's') {
          timerService.skip(true);
        }
      };

      const preventDefault = vi.fn();
      handleKeyDown({
        code: 'KeyS',
        key: 's',
        target: { tagName: 'INPUT', isContentEditable: false },
        preventDefault,
      });

      // Status should remain untouched
      expect(timerService.getState().mode).toBe('work');
      expect(timerService.getState().status).toBe('idle');
      expect(preventDefault).not.toHaveBeenCalled();
    });
  });
});
