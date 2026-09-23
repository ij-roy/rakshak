import { describe, expect, it } from 'vitest';
import { createEmptyRenderSnapshot } from '@rakshak/game-protocol';
import { fieldCacheStamp } from './field-cache';

function scene() {
  const snap = createEmptyRenderSnapshot();
  snap.mapWidth = 2400;
  snap.mapHeight = 2400;
  snap.camera = { x: 0, y: 0, zoom: 1 };
  return snap;
}

describe('terrain cache', () => {
  it('keeps the same stamp while the camera stays in a grid cell', () => {
    const first = scene();
    const second = scene();
    second.camera = { x: 10, y: 8, zoom: 1 };
    expect(fieldCacheStamp(second, 1280, 720, 1.4)).toBe(fieldCacheStamp(first, 1280, 720, 1.4));
  });

  it('changes the stamp when a hazard becomes active or the camera crosses a cell', () => {
    const still = scene();
    const moved = scene();
    moved.camera = { x: 100, y: 0, zoom: 1 };
    expect(fieldCacheStamp(moved, 1280, 720, 1.4)).not.toBe(fieldCacheStamp(still, 1280, 720, 1.4));

    const quiet = scene();
    quiet.field.push({ id: 1, kind: 'slow', x: 40, y: 0, w: 80, h: 80, dir: 0, active: 0 });
    const warned = scene();
    warned.field.push({ id: 1, kind: 'slow', x: 40, y: 0, w: 80, h: 80, dir: 0, active: 1 });
    expect(fieldCacheStamp(warned, 1280, 720, 1.4)).not.toBe(fieldCacheStamp(quiet, 1280, 720, 1.4));
  });
});
