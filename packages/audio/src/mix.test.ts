import { describe, expect, it } from 'vitest';
import {
  ambiencePeak,
  CUE_IDS,
  CUE_MIN_GAP_MS,
  cueSignature,
  effectiveBusGain,
  shouldPlayCue,
} from './types.js';

const base = {
  masterVolume: 1,
  musicVolume: 0.8,
  sfxVolume: 0.5,
  uiVolume: 0.4,
  ambienceVolume: 0.2,
  muted: false,
};

describe('volume settings', () => {
  it('mutes every bus', () => {
    expect(effectiveBusGain({ ...base, muted: true }, 'sfx')).toBe(0);
    expect(effectiveBusGain({ ...base, muted: true }, 'music')).toBe(0);
  });

  it('scales each bus by its own slider and master', () => {
    expect(effectiveBusGain(base, 'sfx')).toBeCloseTo(0.5);
    expect(effectiveBusGain({ ...base, masterVolume: 0.5 }, 'sfx')).toBeCloseTo(0.25);
    expect(effectiveBusGain(base, 'music')).toBeCloseTo(0.8);
    expect(effectiveBusGain({ ...base, sfxVolume: 0 }, 'music')).toBeCloseTo(0.8);
    expect(effectiveBusGain(base, 'ui')).toBeCloseTo(0.4);
    expect(effectiveBusGain(base, 'ambience')).toBeCloseTo(0.2);
  });

  it('keeps important cues distinct and sparse', () => {
    const important = ['hit_player', 'hit_enemy', 'pickup', 'level_up', 'boss_warn', 'boss_intro', 'victory', 'defeat', 'ui_confirm'] as const;
    const signatures = important.map((id) => cueSignature(id));
    expect(new Set(signatures).size).toBe(important.length);
    expect(CUE_IDS).toEqual(expect.arrayContaining([...important]));
    expect(CUE_MIN_GAP_MS.hit_enemy).toBeGreaterThanOrEqual(100);
    expect(CUE_MIN_GAP_MS.hit_player).toBeGreaterThan(CUE_MIN_GAP_MS.hit_enemy);
    expect(shouldPlayCue(undefined, 1000, 'hit_enemy')).toBe(true);
    expect(shouldPlayCue(1000, 1050, 'hit_enemy')).toBe(false);
    expect(shouldPlayCue(1000, 1120, 'hit_enemy')).toBe(true);
  });

  it('lets the ambience slider silence the night tone without muting music', () => {
    expect(ambiencePeak(base)).toBeCloseTo(0.2 * 0.03);
    expect(ambiencePeak({ ...base, muted: true })).toBe(0);
    expect(ambiencePeak({ ...base, ambienceVolume: 0 })).toBe(0);
    expect(ambiencePeak({ ...base, musicVolume: 0 })).toBeGreaterThan(0);
  });
});
