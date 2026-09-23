import { describe, expect, it } from 'vitest';
import { stickHeading, writeStickVector } from './stick-readout';

describe('stick readout', () => {
  it('names directions from stable labels and reuses the vector record', () => {
    expect(stickHeading(0, 0, 0.2)).toBe('Centered');
    expect(stickHeading(1, 0, 0.2)).toBe('Right');
    expect(stickHeading(0, -1, 0.2)).toBe('Up');
    const diagonal = stickHeading(1, 1, 0.2);
    expect(diagonal).toBe('Down Right');
    expect(stickHeading(1, 1, 0.2)).toBe(diagonal);

    const out = { dx: 0, dy: 0 };
    writeStickVector(out, 150, 80, 100, 40, 100, 80);
    expect(out.dx).toBe(0);
    expect(out.dy).toBe(0);
    const kept = out.dx;
    writeStickVector(out, 200, 80, 100, 40, 100, 80);
    expect(kept).toBe(0);
    expect(out.dx).toBe(1);
  });
});
