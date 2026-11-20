import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SoundSettings } from '../../src/features/pomodoro/domain/entities';
import { WebAudioAdapter } from '../../src/features/pomodoro/infrastructure/web-audio-adapter';

// Mock Web Audio API primitives
class MockAudioParam {
  value = 0;

  setValueAtTime = vi.fn().mockReturnThis();

  linearRampToValueAtTime = vi.fn().mockReturnThis();

  exponentialRampToValueAtTime = vi.fn().mockReturnThis();
}

class MockGainNode {
  gain = new MockAudioParam();

  connect = vi.fn();

  disconnect = vi.fn();
}

class MockOscillatorNode {
  type = 'sine';

  frequency = new MockAudioParam();

  connect = vi.fn();

  start = vi.fn();

  stop = vi.fn();

  disconnect = vi.fn();
}

class MockAudioContext {
  state: 'suspended' | 'running' | 'closed' = 'running';

  currentTime = 0;

  destination = {};

  createGain = vi.fn(() => new MockGainNode());

  createOscillator = vi.fn(() => new MockOscillatorNode());

  resume = vi.fn().mockResolvedValue(undefined);

  close = vi.fn().mockResolvedValue(undefined);
}

describe('WebAudioAdapter: Procedural Web Audio Synthesis', () => {
  let adapter: WebAudioAdapter;
  let mockCtx: MockAudioContext;

  beforeEach(() => {
    mockCtx = new MockAudioContext();
    // Inject mock AudioContext factory
    adapter = new WebAudioAdapter(() => mockCtx as unknown as AudioContext);
  });

  it('reports availability based on AudioContext presence', () => {
    expect(adapter.isAvailable()).toBe(true);

    const defaultAdapter = new WebAudioAdapter();
    expect(defaultAdapter.isAvailable()).toBe(false);
  });

  it('initializes and resumes suspended AudioContext', async () => {
    mockCtx.state = 'suspended';
    const result = await adapter.initialize();
    expect(result).toBe(true);
    expect(mockCtx.resume).toHaveBeenCalled();
  });

  it('plays digital bell alert on work completion when enabled', async () => {
    const settings: SoundSettings = {
      enabled: true,
      volume: 0.8,
      workSound: 'bell',
      breakSound: 'chime',
    };

    const played = await adapter.play('work', settings);
    expect(played).toBe(true);
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
  });

  it('plays soft chime alert on break completion when enabled', async () => {
    const settings: SoundSettings = {
      enabled: true,
      volume: 0.8,
      workSound: 'bell',
      breakSound: 'chime',
    };

    const played = await adapter.play('break', settings);
    expect(played).toBe(true);
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });

  it('previews marimba sound profile successfully', async () => {
    const previewed = await adapter.preview('marimba', 0.5);
    expect(previewed).toBe(true);
    expect(mockCtx.createOscillator).toHaveBeenCalled();
  });

  it('does not synthesize audio when master sound toggle is disabled', async () => {
    const settings: SoundSettings = {
      enabled: false,
      volume: 0.8,
      workSound: 'bell',
      breakSound: 'chime',
    };

    const played = await adapter.play('work', settings);
    expect(played).toBe(false);
    expect(mockCtx.createOscillator).not.toHaveBeenCalled();
  });

  it('does not synthesize audio when volume is 0', async () => {
    const settings: SoundSettings = {
      enabled: true,
      volume: 0,
      workSound: 'bell',
      breakSound: 'chime',
    };

    const played = await adapter.play('work', settings);
    expect(played).toBe(false);
    expect(mockCtx.createOscillator).not.toHaveBeenCalled();
  });

  it('handles audio playback failure gracefully without throwing uncaught errors', async () => {
    const failingCtx = new MockAudioContext();
    failingCtx.createOscillator = vi.fn().mockImplementation(() => {
      throw new Error('Hardware audio device disconnected');
    });

    const failingAdapter = new WebAudioAdapter(() => failingCtx as unknown as AudioContext);

    const result = await failingAdapter.preview('bell', 0.8);
    expect(result).toBe(false);
  });
});
