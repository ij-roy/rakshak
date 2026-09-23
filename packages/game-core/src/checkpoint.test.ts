import { describe, expect, it } from 'vitest';
import { applyRunCheckpoint, captureRunCheckpoint, parseRunCheckpoint } from './checkpoint.js';
import { GameRuntime } from './runtime.js';
import { EMPTY_INPUT } from '@rakshak/game-protocol';

describe('run checkpoint', () => {
  it('restores health, tick, build and rng, and rejects a tampered blob', () => {
    const original = new GameRuntime({ seed: 7, guardianId: 'asha', mapId: 'gaon' });
    for (let i = 0; i < 20; i += 1) {
      original.step({ ...EMPTY_INPUT, moveX: 1 });
    }
    original.world.player.hp = 37;
    const checkpoint = captureRunCheckpoint(original, 'pause');
    const restored = JSON.parse(JSON.stringify(checkpoint)) as unknown;
    const parsed = parseRunCheckpoint(restored);
    expect(parsed).not.toBeNull();

    const resumed = new GameRuntime({
      seed: parsed!.seed,
      guardianId: parsed!.guardianId,
      mapId: parsed!.mapId,
    });
    applyRunCheckpoint(resumed, parsed!);
    expect(resumed.world.player.hp).toBe(37);
    expect(resumed.world.tick).toBe(original.world.tick);
    expect(resumed.world.run.paused).toBe(true);
    expect(resumed.world.run.outcome).toBe('ongoing');
    expect(resumed.rng.spawn.getState().map((n) => n >>> 0)).toEqual(
      original.rng.spawn.getState().map((n) => n >>> 0),
    );
    expect(resumed.world.weapons.map((slot) => slot.weaponId)).toEqual(
      original.world.weapons.map((slot) => slot.weaponId),
    );

    const tampered = { ...parsed!, player: { ...parsed!.player, hp: 999 } };
    expect(parseRunCheckpoint(tampered)).toBeNull();
  });
});
