import { describe, expect, it } from 'vitest';
import { frameKeptEveryNode, reclaimStale } from './live-nodes.js';

describe('live picture nodes', () => {
  it('keeps nodes touched this frame and releases the ones left behind', () => {
    const live = [
      { id: 1, gen: 4 },
      { id: 2, gen: 3 },
      { id: 3, gen: 4 },
      { id: 4, gen: 3 },
    ];
    const released: number[] = [];
    reclaimStale(live, 4, (node) => released.push(node.id));
    expect(released.sort((a, b) => a - b)).toEqual([2, 4]);
    expect(live.map((node) => node.id).sort((a, b) => a - b)).toEqual([1, 3]);
    expect(live.every((node) => node.gen === 4)).toBe(true);
  });

  it('releases a stale node that was swapped into the slot just cleared', () => {
    const live = [
      { id: 1, gen: 1 },
      { id: 2, gen: 1 },
    ];
    const released: number[] = [];
    reclaimStale(live, 2, (node) => released.push(node.id));
    expect(released.sort((a, b) => a - b)).toEqual([1, 2]);
    expect(live).toHaveLength(0);
  });

  it('skips the sweep when every live node was touched', () => {
    expect(frameKeptEveryNode(4, 4)).toBe(true);
    expect(frameKeptEveryNode(0, 0)).toBe(true);
    expect(frameKeptEveryNode(3, 4)).toBe(false);
  });
});
