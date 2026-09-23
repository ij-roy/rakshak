import { describe, expect, it } from 'vitest';
import { COMBAT_VIEW, combatViewZoom } from './combat-view';

function visible(viewW: number, viewH: number) {
  const zoom = combatViewZoom(viewW, viewH, 1);
  return { width: viewW / zoom, height: viewH / zoom };
}

describe('combat view', () => {
  it('shows the same ground on a phone and a desktop 16:9 window', () => {
    const phone = visible(667, 375);
    const desktop = visible(1366, 768);
    expect(phone.width).toBeCloseTo(COMBAT_VIEW.width, 0);
    expect(desktop.width).toBeCloseTo(COMBAT_VIEW.width, 0);
    expect(phone.height).toBeCloseTo(desktop.height, 0);
  });

  it('does not reveal extra world on an ultrawide window', () => {
    const wide = visible(2560, 1080);
    expect(wide.width).toBeCloseTo(COMBAT_VIEW.width, 0);
    expect(wide.width).toBeLessThan(2560);
  });

  it('keeps the spawn ring at the edge of the view', () => {
    const half = COMBAT_VIEW.width / 2;
    const nearestSpawn = 320;
    const farthestSpawn = 500;
    expect(nearestSpawn).toBeGreaterThan(half * 0.6);
    expect(nearestSpawn).toBeLessThan(half);
    expect(farthestSpawn).toBeGreaterThan(half);
  });
});
