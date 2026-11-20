import { type FormEvent, useEffect, useState } from 'react';
import type { SoundAlertProfile, UserPreferences } from '../../domain/entities';

export interface SettingsDialogProps {
  isOpen: boolean;
  preferences: UserPreferences;
  onSave: (preferences: UserPreferences) => void;
  onClose: () => void;
  onResetDefaults: () => void;
  onPreviewSound: (profile: SoundAlertProfile, volume: number) => void;
}

export function SettingsDialog({
  isOpen,
  preferences,
  onSave,
  onClose,
  onResetDefaults,
  onPreviewSound,
}: SettingsDialogProps) {
  const [workDuration, setWorkDuration] = useState(preferences.workDurationMinutes);
  const [shortBreak, setShortBreak] = useState(preferences.shortBreakDurationMinutes);
  const [longBreak, setLongBreak] = useState(preferences.longBreakDurationMinutes);
  const [interval, setInterval] = useState(preferences.longBreakInterval);
  const [autoBreaks, setAutoBreaks] = useState(preferences.autoStartBreaks);
  const [autoPomodoros, setAutoPomodoros] = useState(preferences.autoStartPomodoros);
  const [soundEnabled, setSoundEnabled] = useState(preferences.sound.enabled);
  const [volume, setVolume] = useState(preferences.sound.volume);
  const [workSound, setWorkSound] = useState<SoundAlertProfile>(preferences.sound.workSound);
  const [breakSound, setBreakSound] = useState<SoundAlertProfile>(preferences.sound.breakSound);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setWorkDuration(preferences.workDurationMinutes);
    setShortBreak(preferences.shortBreakDurationMinutes);
    setLongBreak(preferences.longBreakDurationMinutes);
    setInterval(preferences.longBreakInterval);
    setAutoBreaks(preferences.autoStartBreaks);
    setAutoPomodoros(preferences.autoStartPomodoros);
    setSoundEnabled(preferences.sound.enabled);
    setVolume(preferences.sound.volume);
    setWorkSound(preferences.sound.workSound);
    setBreakSound(preferences.sound.breakSound);
    setErrors({});
  }, [preferences, isOpen]);

  if (!isOpen) {
    return null;
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!Number.isInteger(workDuration) || workDuration < 1 || workDuration > 120) {
      newErrors.work = 'Work duration must be between 1 and 120 minutes.';
    }
    if (!Number.isInteger(shortBreak) || shortBreak < 1 || shortBreak > 60) {
      newErrors.shortBreak = 'Short break must be between 1 and 60 minutes.';
    }
    if (!Number.isInteger(longBreak) || longBreak < 1 || longBreak > 60) {
      newErrors.longBreak = 'Long break must be between 1 and 60 minutes.';
    }
    if (!Number.isInteger(interval) || interval < 1 || interval > 12) {
      newErrors.interval = 'Long break interval must be between 1 and 12 cycles.';
    }
    if (typeof volume !== 'number' || volume < 0.0 || volume > 1.0) {
      newErrors.volume = 'Volume must be between 0.0 and 1.0.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    onSave({
      workDurationMinutes: workDuration,
      shortBreakDurationMinutes: shortBreak,
      longBreakDurationMinutes: longBreak,
      longBreakInterval: interval,
      autoStartBreaks: autoBreaks,
      autoStartPomodoros: autoPomodoros,
      sound: {
        enabled: soundEnabled,
        volume,
        workSound,
        breakSound,
      },
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-dialog-title"
      className="modal-overlay"
      data-testid="settings-dialog"
    >
      <div className="modal-content" data-testid="settings-content">
        <div className="modal-header">
          <h2 id="settings-dialog-title" className="modal-title">
            Timer Preferences
          </h2>
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            onClick={onClose}
            aria-label="Close preferences dialog"
            style={{ width: '44px', height: '44px', minWidth: '44px', minHeight: '44px' }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {/* Durations */}
            <div className="settings-field">
              <label htmlFor="setting-work" className="settings-label">
                <span>Focus Duration (minutes)</span>
                <span>{workDuration} min</span>
              </label>
              <input
                id="setting-work"
                type="number"
                className="input"
                min={1}
                max={120}
                value={workDuration}
                onChange={(e) => setWorkDuration(parseInt(e.target.value, 10) || 0)}
              />
              {errors.work ? <span className="error-text">{errors.work}</span> : null}
            </div>

            <div className="settings-field">
              <label htmlFor="setting-short-break" className="settings-label">
                <span>Short Break (minutes)</span>
                <span>{shortBreak} min</span>
              </label>
              <input
                id="setting-short-break"
                type="number"
                className="input"
                min={1}
                max={60}
                value={shortBreak}
                onChange={(e) => setShortBreak(parseInt(e.target.value, 10) || 0)}
              />
              {errors.shortBreak ? <span className="error-text">{errors.shortBreak}</span> : null}
            </div>

            <div className="settings-field">
              <label htmlFor="setting-long-break" className="settings-label">
                <span>Long Break (minutes)</span>
                <span>{longBreak} min</span>
              </label>
              <input
                id="setting-long-break"
                type="number"
                className="input"
                min={1}
                max={60}
                value={longBreak}
                onChange={(e) => setLongBreak(parseInt(e.target.value, 10) || 0)}
              />
              {errors.longBreak ? <span className="error-text">{errors.longBreak}</span> : null}
            </div>

            <div className="settings-field">
              <label htmlFor="setting-interval" className="settings-label">
                <span>Long Break Interval (cycles)</span>
                <span>{interval}</span>
              </label>
              <input
                id="setting-interval"
                type="number"
                className="input"
                min={1}
                max={12}
                value={interval}
                onChange={(e) => setInterval(parseInt(e.target.value, 10) || 0)}
              />
              {errors.interval ? <span className="error-text">{errors.interval}</span> : null}
            </div>

            {/* Automation */}
            <div className="settings-toggle">
              <label
                htmlFor="setting-auto-breaks"
                style={{ fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}
              >
                Auto-start breaks
              </label>
              <input
                id="setting-auto-breaks"
                type="checkbox"
                checked={autoBreaks}
                onChange={(e) => setAutoBreaks(e.target.checked)}
                style={{ width: '20px', height: '20px' }}
              />
            </div>

            <div className="settings-toggle">
              <label
                htmlFor="setting-auto-pomodoros"
                style={{ fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}
              >
                Auto-start focus sessions
              </label>
              <input
                id="setting-auto-pomodoros"
                type="checkbox"
                checked={autoPomodoros}
                onChange={(e) => setAutoPomodoros(e.target.checked)}
                style={{ width: '20px', height: '20px' }}
              />
            </div>

            {/* Audio notifications */}
            <div className="settings-toggle">
              <label
                htmlFor="setting-sound-enabled"
                style={{ fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}
              >
                Sound notifications
              </label>
              <input
                id="setting-sound-enabled"
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                style={{ width: '20px', height: '20px' }}
              />
            </div>

            {soundEnabled ? (
              <>
                <div className="settings-field">
                  <label htmlFor="setting-volume" className="settings-label">
                    <span>Notification Volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </label>
                  <input
                    id="setting-volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  {errors.volume ? <span className="error-text">{errors.volume}</span> : null}
                </div>

                <div className="settings-field">
                  <label htmlFor="setting-work-sound" className="settings-label">
                    <span>Work Complete Tone</span>
                  </label>
                  <div className="form-row">
                    <select
                      id="setting-work-sound"
                      className="input"
                      value={workSound}
                      onChange={(e) => setWorkSound(e.target.value as SoundAlertProfile)}
                    >
                      <option value="bell">Digital Bell</option>
                      <option value="chime">Soft Chime</option>
                      <option value="marimba">Marimba</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onPreviewSound(workSound, volume)}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                <div className="settings-field">
                  <label htmlFor="setting-break-sound" className="settings-label">
                    <span>Break Complete Tone</span>
                  </label>
                  <div className="form-row">
                    <select
                      id="setting-break-sound"
                      className="input"
                      value={breakSound}
                      onChange={(e) => setBreakSound(e.target.value as SoundAlertProfile)}
                    >
                      <option value="chime">Soft Chime</option>
                      <option value="bell">Digital Bell</option>
                      <option value="marimba">Marimba</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => onPreviewSound(breakSound, volume)}
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowResetConfirm(true)}
              style={{ fontSize: 'var(--font-size-xs)' }}
            >
              Reset to Defaults
            </button>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </div>
        </form>

        {showResetConfirm ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-defaults-title"
            className="modal-overlay"
          >
            <div className="modal-content" style={{ maxWidth: '400px' }}>
              <h3
                id="reset-defaults-title"
                className="modal-title"
                style={{ fontSize: 'var(--font-size-base)' }}
              >
                Reset to Defaults?
              </h3>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginTop: 'var(--space-2)',
                }}
              >
                This will restore all timer intervals and sound preferences to their factory
                defaults.
              </p>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setShowResetConfirm(false);
                    onResetDefaults();
                    onClose();
                  }}
                >
                  Reset Defaults
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
