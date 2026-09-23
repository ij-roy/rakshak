import type { AudioBus, AudioPort, CueId } from './types.js';
import { AMBIENCE_PEAK, CUE_PATTERNS, DEFAULT_MIXER_POLICY, shouldPlayCue } from './types.js';

interface AmbienceVoice {
  low: OscillatorNode;
  high: OscillatorNode;
  gain: GainNode;
}

/** Procedural Web Audio — no external sample files. */
export function createWebProceduralAudio(policy = DEFAULT_MIXER_POLICY): AudioPort {
  let ctx: AudioContext | null = null;
  let unlocked = false;
  let ambience: AmbienceVoice | null = null;
  const busGain = new Map<AudioBus, number>([
    ['master', 1],
    ['music', 0.7],
    ['sfx', 1],
    ['ui', 1],
    ['ambience', 0.6],
  ]);
  const activeCount = new Map<AudioBus, number>();
  const lastCueAt = new Map<CueId, number>();

  async function ensureCtx(): Promise<AudioContext> {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') await ctx.resume();
    unlocked = true;
    return ctx;
  }

  function ambienceLevel(): number {
    return (busGain.get('master') ?? 1) * (busGain.get('ambience') ?? 0) * AMBIENCE_PEAK;
  }

  function applyAmbienceLevel() {
    if (!ambience || !ctx) return;
    const now = ctx.currentTime;
    ambience.gain.gain.cancelScheduledValues(now);
    ambience.gain.gain.setTargetAtTime(ambienceLevel(), now, 0.05);
  }

  return {
    async unlock() {
      await ensureCtx();
    },
    play(cueId: CueId, intensity = 1) {
      if (!unlocked || !ctx) return;
      const nowMs = performance.now();
      if (!shouldPlayCue(lastCueAt.get(cueId), nowMs, cueId)) return;
      const bus = policy.defaultBus[cueId];
      const master = busGain.get('master') ?? 1;
      const busVol = busGain.get(bus) ?? 1;
      if (master <= 0.001 || busVol <= 0.001) return;
      const max = policy.maxConcurrent[bus];
      const current = activeCount.get(bus) ?? 0;
      if (current >= max) return;
      lastCueAt.set(cueId, nowMs);

      const voices = CUE_PATTERNS[cueId];
      activeCount.set(bus, current + 1);
      let pending = voices.length;
      const release = () => {
        pending -= 1;
        if (pending > 0) return;
        activeCount.set(bus, Math.max(0, (activeCount.get(bus) ?? 1) - 1));
      };
      for (const voice of voices) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = voice.type;
        osc.frequency.value = voice.freq;
        const peak = voice.gain * master * busVol * Math.max(0.05, Math.min(1, intensity));
        const start = ctx.currentTime + voice.delayMs / 1000;
        const end = start + voice.durationMs / 1000;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(end + 0.02);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
          release();
        };
      }
    },
    startAmbience() {
      if (!unlocked || !ctx || ambience) {
        applyAmbienceLevel();
        return;
      }
      const low = ctx.createOscillator();
      const high = ctx.createOscillator();
      const gain = ctx.createGain();
      low.type = 'sine';
      high.type = 'triangle';
      low.frequency.value = 55;
      high.frequency.value = 82;
      gain.gain.value = ambienceLevel();
      low.connect(gain);
      high.connect(gain);
      gain.connect(ctx.destination);
      low.start();
      high.start();
      ambience = { low, high, gain };
    },
    stopAmbience() {
      if (!ambience || !ctx) return;
      const voice = ambience;
      ambience = null;
      const now = ctx.currentTime;
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(0.0001, now, 0.05);
      voice.low.stop(now + 0.3);
      voice.high.stop(now + 0.3);
    },
    setBusVolume(bus: AudioBus, volume: number) {
      busGain.set(bus, Math.max(0, Math.min(1, volume)));
      if (bus === 'master' || bus === 'ambience') applyAmbienceLevel();
    },
    dispose() {
      ambience?.low.stop();
      ambience?.high.stop();
      ambience = null;
      void ctx?.close();
      ctx = null;
      unlocked = false;
    },
  };
}
