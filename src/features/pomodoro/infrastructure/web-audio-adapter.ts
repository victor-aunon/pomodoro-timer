/**
 * Procedural Web Audio API Adapter
 * Synthesizes Digital Bell, Soft Chime, and Marimba tones with 0 KB asset weight.
 */

import type { AlertType, IAudioNotificationPort } from '../application/ports';
import type { SoundAlertProfile, SoundSettings } from '../domain/entities';

type AudioContextFactory = () => AudioContext;

export class WebAudioAdapter implements IAudioNotificationPort {
  private audioCtx: AudioContext | null = null;

  private readonly contextFactory: AudioContextFactory;

  private readonly isCustomFactory: boolean;

  constructor(contextFactory?: AudioContextFactory) {
    if (contextFactory) {
      this.contextFactory = contextFactory;
      this.isCustomFactory = true;
    } else {
      this.isCustomFactory = false;
      this.contextFactory = () => {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        return new AudioContextClass();
      };
    }
  }

  isAvailable(): boolean {
    if (this.isCustomFactory) {
      return true;
    }
    if (typeof window === 'undefined') {
      return false;
    }
    return 'AudioContext' in window || 'webkitAudioContext' in window;
  }

  async initialize(): Promise<boolean> {
    try {
      const ctx = this.getOrCreateContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      return true;
    } catch {
      return false;
    }
  }

  async play(alert: AlertType, settings: SoundSettings): Promise<boolean> {
    if (!settings.enabled || settings.volume <= 0) {
      return false;
    }
    const profile = alert === 'work' ? settings.workSound : settings.breakSound;
    return this.preview(profile, settings.volume);
  }

  async preview(profile: SoundAlertProfile, volume: number): Promise<boolean> {
    if (volume <= 0) {
      return false;
    }
    const clampedVolume = Math.max(0.0, Math.min(1.0, volume));

    try {
      await this.initialize();
      const ctx = this.getOrCreateContext();

      switch (profile) {
        case 'bell':
          this.synthesizeBell(ctx, clampedVolume);
          break;
        case 'chime':
          this.synthesizeChime(ctx, clampedVolume);
          break;
        case 'marimba':
          this.synthesizeMarimba(ctx, clampedVolume);
          break;
      }
      return true;
    } catch {
      return false;
    }
  }

  private getOrCreateContext(): AudioContext {
    if (!this.audioCtx) {
      this.audioCtx = this.contextFactory();
    }
    return this.audioCtx;
  }

  private synthesizeBell(ctx: AudioContext, masterVolume: number): void {
    const now = ctx.currentTime;
    const duration = 1.4;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolume * 0.45, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    masterGain.connect(ctx.destination);

    // Warm sub-harmonic 440Hz + 880Hz fundamental + 1760Hz overtone
    const freqs = [440, 880, 1760];
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + duration);
    });
  }

  private synthesizeChime(ctx: AudioContext, masterVolume: number): void {
    const now = ctx.currentTime;
    // Uplifting arpeggio: C5, E5, G5, C6
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.1;
      const noteDuration = 1.1;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(masterVolume * 0.28, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);
      gain.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.connect(gain);
      osc.start(startTime);
      osc.stop(startTime + noteDuration);
    });
  }

  private synthesizeMarimba(ctx: AudioContext, masterVolume: number): void {
    const now = ctx.currentTime;
    const duration = 0.5;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(masterVolume * 0.5, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    masterGain.connect(ctx.destination);

    // Warm wooden chord: A4, E5, A5
    const freqs = [440, 660, 880];
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(masterGain);
      osc.start(now);
      osc.stop(now + duration);
    });
  }
}
