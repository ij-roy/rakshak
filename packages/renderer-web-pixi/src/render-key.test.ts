import { describe, expect, it } from 'vitest';
import { renderNodeId } from './render-key';

describe('render node keys', () => {
  it('keeps an enemy, projectile and pickup with the same pool id on separate nodes', () => {
    const enemy = renderNodeId('enemy', 1);
    const projectile = renderNodeId('projectile', 1);
    const pickup = renderNodeId('pickup', 1);
    const telegraph = renderNodeId('telegraph', 1);
    expect(new Set([enemy, projectile, pickup, telegraph]).size).toBe(4);
    expect(renderNodeId('enemy', 2)).not.toBe(enemy);
    expect(renderNodeId('enemy', 1)).toBe(enemy);
    expect(renderNodeId('player', 1)).not.toBe(enemy);
    const custom = renderNodeId('custom', 1);
    expect(custom).not.toBe(enemy);
    expect(renderNodeId('custom', 1)).toBe(custom);
  });
});
