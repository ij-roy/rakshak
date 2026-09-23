import { describe, expect, it } from 'vitest';
import { writeLerpedPose, type SpritePose } from './sprite-pose';

describe('sprite pose', () => {
  it('reuses one pose record and leaves a copied coordinate alone', () => {
    const out: SpritePose = { x: 0, y: 0, facing: 0, radius: 0, alpha: 0 };
    writeLerpedPose(out, 0, 0, 0, 10, 1, 10, 20, 1, 14, 0.5, 0.5);
    expect(out.x).toBe(5);
    expect(out.y).toBe(10);
    expect(out.radius).toBe(12);
    const keptX = out.x;
    writeLerpedPose(out, 4, 8, 0, 6, 1, 4, 8, 0, 6, 1, 0);
    expect(out.x).toBe(4);
    expect(keptX).toBe(5);
  });
});
