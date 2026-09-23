import { describe, expect, it } from 'vitest';
import { SpatialHash } from './spatial-hash.js';

describe('spatial hash', () => {
  it('drops stale indexes when the grid is cleared and refilled', () => {
    const hash = new SpatialHash(64);
    const found: number[] = [];
    hash.insert(1, 0, 0);
    hash.insert(2, 8, 8);
    hash.clear();
    hash.query(0, 0, 32, found);
    expect(found).toEqual([]);
    hash.insert(3, 4, 4);
    hash.query(0, 0, 32, found);
    expect(found).toEqual([3]);
    hash.insert(4, 10, 6);
    hash.insert(9, 400, 400);
    hash.query(0, 0, 32, found);
    expect(found.sort((a, b) => a - b)).toEqual([3, 4]);
    hash.clear();
    hash.clear();
    hash.insert(5, 4, 4);
    hash.query(0, 0, 32, found);
    expect(found).toEqual([5]);
  });

  it('finds a body in a negative cell and ignores one far away', () => {
    const hash = new SpatialHash(64);
    const found: number[] = [];
    hash.insert(7, -120, -80);
    hash.insert(8, 500, 500);
    hash.query(-100, -70, 40, found);
    expect(found).toEqual([7]);
  });
});
