export const CUE_IDS = [
  'ui_select',
  'ui_confirm',
  'ui_back',
  'hit_player',
  'hit_enemy',
  'pickup',
  'level_up',
  'boss_warn',
  'boss_intro',
  'victory',
  'defeat',
] as const;

export type CueId = (typeof CUE_IDS)[number];

export interface CueVoice {
  freq: number;
  durationMs: number;
  type: OscillatorType;
  gain: number;
  delayMs: number;
}

/** Short patterns. Frequencies differ so a hit, a pickup, a boss, and a result are not the same beep. */
export const CUE_PATTERNS: Record<CueId, readonly CueVoice[]> = {
  ui_select: [{ freq: 620, durationMs: 35, type: 'triangle', gain: 0.07, delayMs: 0 }],
  ui_confirm: [
    { freq: 520, durationMs: 50, type: 'triangle', gain: 0.08, delayMs: 0 },
    { freq: 780, durationMs: 70, type: 'triangle', gain: 0.08, delayMs: 55 },
  ],
  ui_back: [
    { freq: 480, durationMs: 40, type: 'triangle', gain: 0.07, delayMs: 0 },
    { freq: 320, durationMs: 50, type: 'triangle', gain: 0.07, delayMs: 45 },
  ],
  hit_player: [
    { freq: 150, durationMs: 70, type: 'sawtooth', gain: 0.09, delayMs: 0 },
    { freq: 86, durationMs: 110, type: 'sine', gain: 0.09, delayMs: 40 },
  ],
  hit_enemy: [{ freq: 760, durationMs: 32, type: 'square', gain: 0.045, delayMs: 0 }],
  pickup: [
    { freq: 660, durationMs: 40, type: 'sine', gain: 0.07, delayMs: 0 },
    { freq: 990, durationMs: 55, type: 'sine', gain: 0.06, delayMs: 42 },
  ],
  level_up: [
    { freq: 523, durationMs: 80, type: 'triangle', gain: 0.08, delayMs: 0 },
    { freq: 659, durationMs: 90, type: 'triangle', gain: 0.08, delayMs: 85 },
    { freq: 784, durationMs: 120, type: 'triangle', gain: 0.07, delayMs: 170 },
  ],
  boss_warn: [
    { freq: 146, durationMs: 100, type: 'sawtooth', gain: 0.08, delayMs: 0 },
    { freq: 146, durationMs: 100, type: 'sawtooth', gain: 0.08, delayMs: 170 },
  ],
  boss_intro: [
    { freq: 73, durationMs: 260, type: 'sawtooth', gain: 0.1, delayMs: 0 },
    { freq: 110, durationMs: 300, type: 'triangle', gain: 0.07, delayMs: 150 },
  ],
  victory: [
    { freq: 392, durationMs: 130, type: 'triangle', gain: 0.09, delayMs: 0 },
    { freq: 494, durationMs: 130, type: 'triangle', gain: 0.09, delayMs: 140 },
    { freq: 587, durationMs: 200, type: 'triangle', gain: 0.08, delayMs: 280 },
  ],
  defeat: [
    { freq: 220, durationMs: 160, type: 'sine', gain: 0.1, delayMs: 0 },
    { freq: 165, durationMs: 180, type: 'sine', gain: 0.09, delayMs: 160 },
    { freq: 110, durationMs: 240, type: 'sine', gain: 0.08, delayMs: 340 },
  ],
};

/** Minimum time before the same cue may sound again. Crowd hits stay sparse. */
export const CUE_MIN_GAP_MS: Record<CueId, number> = {
  ui_select: 40,
  ui_confirm: 90,
  ui_back: 90,
  hit_player: 180,
  hit_enemy: 110,
  pickup: 120,
  level_up: 500,
  boss_warn: 900,
  boss_intro: 900,
  victory: 1200,
  defeat: 1200,
};

export function cueSignature(cueId: CueId): string {
  return CUE_PATTERNS[cueId].map((voice) => `${voice.freq}@${voice.delayMs}`).join('|');
}

export function shouldPlayCue(lastAtMs: number | undefined, nowMs: number, cueId: CueId): boolean {
  if (lastAtMs === undefined) return true;
  return nowMs - lastAtMs >= CUE_MIN_GAP_MS[cueId];
}

/** Quiet night drone. Music volume does not drive it; the ambience slider does. */
export const AMBIENCE_PEAK = 0.03;

export function ambiencePeak(settings: VolumeSettings): number {
  return effectiveBusGain(settings, 'ambience') * AMBIENCE_PEAK;
}

export type AudioBus = 'master' | 'music' | 'sfx' | 'ui' | 'ambience';

export interface MixerPolicy {
  maxConcurrent: Record<AudioBus, number>;
  defaultBus: Record<CueId, AudioBus>;
}

export const DEFAULT_MIXER_POLICY: MixerPolicy = {
  maxConcurrent: {
    master: 32,
    music: 1,
    sfx: 12,
    ui: 4,
    ambience: 2,
  },
  defaultBus: {
    ui_select: 'ui',
    ui_confirm: 'ui',
    ui_back: 'ui',
    hit_player: 'sfx',
    hit_enemy: 'sfx',
    pickup: 'sfx',
    level_up: 'sfx',
    boss_warn: 'sfx',
    boss_intro: 'music',
    victory: 'music',
    defeat: 'music',
  },
};

export interface VolumeSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  uiVolume: number;
  ambienceVolume: number;
  muted: boolean;
}

/** Effective linear gain for a bus. Mute forces silence on every bus. */
export function effectiveBusGain(settings: VolumeSettings, bus: AudioBus): number {
  if (settings.muted) return 0;
  const channel =
    bus === 'music'
      ? settings.musicVolume
      : bus === 'sfx'
        ? settings.sfxVolume
        : bus === 'ui'
          ? settings.uiVolume
          : bus === 'ambience'
            ? settings.ambienceVolume
            : 1;
  return Math.max(0, Math.min(1, settings.masterVolume * channel));
}

export function applyVolumeSettings(port: AudioPort, settings: VolumeSettings): void {
  port.setBusVolume('master', settings.muted ? 0 : settings.masterVolume);
  port.setBusVolume('music', settings.muted ? 0 : settings.musicVolume);
  port.setBusVolume('sfx', settings.muted ? 0 : settings.sfxVolume);
  port.setBusVolume('ui', settings.muted ? 0 : settings.uiVolume);
  port.setBusVolume('ambience', settings.muted ? 0 : settings.ambienceVolume);
}

export interface AudioPort {
  unlock(): Promise<void>;
  play(cueId: CueId, intensity?: number): void;
  startAmbience(): void;
  stopAmbience(): void;
  setBusVolume(bus: AudioBus, volume: number): void;
  dispose(): void;
}
