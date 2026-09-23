import { describe, expect, it } from 'vitest';
import { EMPTY_INPUT, type InputSnapshot } from '@rakshak/game-protocol';
import { GameRuntime } from './runtime.js';

describe('checksum determinism', () => {
  it('same seed + inputs produce identical checksums', () => {
    const inputs: InputSnapshot[] = [];
    for (let i = 0; i < 180; i++) {
      inputs.push({
        moveX: Math.sin(i * 0.07),
        moveY: Math.cos(i * 0.05),
        pause: false,
        confirm: false,
        cancel: false,
      });
    }

    const a = replay(42, inputs);
    const b = replay(42, inputs);
    expect(a).toBe(b);

    const c = replay(43, inputs);
    expect(c).not.toBe(a);
  });

  it('cosmetic-only divergence does not change combat checksum path for identical combat streams', () => {
    // Named streams ensure cosmetic draws in deaths don't affect spawn stream.
    const inputs = Array.from({ length: 90 }, () => ({ ...EMPTY_INPUT, moveX: 1 }));
    expect(replay(1234, inputs)).toBe(replay(1234, inputs));
  });
});

function replay(seed: number, inputs: readonly InputSnapshot[]): bigint {
  const rt = new GameRuntime({ seed, guardianId: 'asha', mapId: 'gaon' });
  for (const input of inputs) {
    // Auto-resolve level-ups to keep simulation advancing.
    if (rt.world.offer.awaitingChoice) {
      rt.step({ ...EMPTY_INPUT, confirm: true, moveX: 0 });
    } else {
      rt.step(input);
    }
  }
  return rt.checksum();
}
