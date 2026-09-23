import { describe, expect, it } from 'vitest';
import { EMPTY_INPUT, createEmptyRenderSnapshot } from '@rakshak/game-protocol';
import { GameRuntime, readWatchStamp, watchChanged, type WatchStamp } from './runtime.js';

function blankStamp(): WatchStamp {
  return { tick: -1, paused: false, awaitingChoice: false, outcome: '', level: 0, rerolls: 0, choiceId: '' };
}

describe('display frames between ticks', () => {
  it('keeps the picture while a paused watch is held', () => {
    const runtime = new GameRuntime({ seed: 1, guardianId: 'asha', mapId: 'gaon' });
    const stamp = blankStamp();
    readWatchStamp(runtime.world, stamp);
    runtime.step({ ...EMPTY_INPUT, pause: true });
    expect(watchChanged(stamp, runtime.world)).toBe(true);
    const keptTick = stamp.tick;
    readWatchStamp(runtime.world, stamp);
    expect(stamp.tick).toBe(keptTick);
    runtime.step(EMPTY_INPUT);
    expect(watchChanged(stamp, runtime.world)).toBe(false);
    const shown = runtime.snapshot(createEmptyRenderSnapshot());
    const again = runtime.snapshot(createEmptyRenderSnapshot());
    expect(again.sprites[0]?.x).toBe(shown.sprites[0]?.x);
    expect(again.hud.paused).toBe(true);
  });

  it('asks for a new picture when the tick moves', () => {
    const runtime = new GameRuntime({ seed: 1, guardianId: 'asha', mapId: 'gaon' });
    const stamp = blankStamp();
    readWatchStamp(runtime.world, stamp);
    const keptTick = stamp.tick;
    runtime.step(EMPTY_INPUT);
    expect(stamp.tick).toBe(keptTick);
    expect(watchChanged(stamp, runtime.world)).toBe(true);
    readWatchStamp(runtime.world, stamp);
    expect(stamp.tick).toBe(runtime.tick);
  });
});
