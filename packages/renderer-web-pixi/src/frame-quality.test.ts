import { describe, expect, it } from 'vitest';
import { createFrameQuality, stepFrameQuality } from './frame-quality.js';

describe('frame quality', () => {
  it('leans down after sustained slow frames and returns after a calm stretch', () => {
    const state = createFrameQuality();
    for (let i = 0; i < 19; i++) stepFrameQuality(state, 22);
    expect(state.quality).toBe('full');
    expect(stepFrameQuality(state, 22)).toBe('lean');
    for (let i = 0; i < 44; i++) stepFrameQuality(state, 8);
    expect(state.quality).toBe('lean');
    expect(stepFrameQuality(state, 8)).toBe('full');
  });
});