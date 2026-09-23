import { describe, expect, it } from 'vitest';
import { EMPTY_INPUT, boundProximity, createEmptyRenderSnapshot, edgeMarker, telegraphFootprint } from './index.js';

describe('game-protocol contracts', () => {
  it('provides empty input defaults', () => {
    expect(EMPTY_INPUT.moveX).toBe(0);
    expect(EMPTY_INPUT.moveY).toBe(0);
    expect(EMPTY_INPUT.pause).toBe(false);
  });

  it('creates empty render snapshot with ongoing outcome', () => {
    const snap = createEmptyRenderSnapshot();
    expect(snap.hud.runOutcome).toBe('ongoing');
    expect(snap.sprites).toEqual([]);
    expect(snap.hud.levelChoices).toEqual([]);
  });

  it('points at off-screen threats and keeps each telegraph footprint distinct', () => {
    expect(edgeMarker(0, 0, 0, 0, 200, 200, 1)).toBeNull();
    const marker = edgeMarker(400, 0, 0, 0, 200, 200, 1);
    expect(marker).not.toBeNull();
    expect(marker!.x).toBeGreaterThan(150);
    expect(marker!.y).toBeCloseTo(100, 0);
    const reused = { x: 0, y: 0, angle: 0 };
    const first = edgeMarker(400, 0, 0, 0, 200, 200, 1, 28, reused);
    const keptX = first!.x;
    const second = edgeMarker(0, 400, 0, 0, 200, 200, 1, 28, reused);
    expect(second).toBe(reused);
    expect(reused.y).toBeGreaterThan(150);
    expect(keptX).toBeGreaterThan(150);
    expect(edgeMarker(400, 0, 0, 0, 200, 200, 1)).not.toBe(edgeMarker(-400, 0, 0, 0, 200, 200, 1));
    expect(telegraphFootprint('circle')).toBe('disk');
    expect(telegraphFootprint('arc')).toBe('wedge');
    expect(telegraphFootprint('line')).toBe('lane');
    expect(telegraphFootprint('ring')).toBe('ring');
    expect(boundProximity(0, 0, 2200, 1600)).toBe(0);
    expect(boundProximity(1100, 0, 2200, 1600)).toBe(1);
  });
});
