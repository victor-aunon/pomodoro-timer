/**
 * Audio Notification Port Contract
 * Defines the application interface for procedural sound synthesis and alerts.
 */

import type { SoundAlertProfile, SoundSettings } from '../data-model';

export type AlertType = 'work' | 'break';

export interface IAudioNotificationPort {
  /**
   * Initializes or resumes the audio context upon user gesture.
   */
  initialize(): Promise<boolean>;

  /**
   * Plays the designated notification alert tone for work or break completion.
   * Resolves to true on successful playback; false if blocked, muted, or failed.
   */
  play(alert: AlertType, settings: SoundSettings): Promise<boolean>;

  /**
   * Previews a specific sound alert profile at the specified volume.
   */
  preview(profile: SoundAlertProfile, volume: number): Promise<boolean>;

  /**
   * Returns whether the audio subsystem is available and permitted to play.
   */
  isAvailable(): boolean;
}
