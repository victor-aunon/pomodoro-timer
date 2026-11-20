/**
 * Core Domain Value Objects
 * Independent of any browser or external runtime.
 */

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export type SoundAlertProfile = 'bell' | 'chime' | 'marimba';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // Normalized float between 0.0 and 1.0
  workSound: SoundAlertProfile;
  breakSound: SoundAlertProfile;
}

export interface StorageHealth {
  status: 'healthy' | 'degraded';
  storageType: 'localStorage' | 'memory';
  warningMessage: string | null;
}
