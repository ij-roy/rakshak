import { describe, expect, it } from 'vitest';
import { NamedRngStreams } from '../rng/streams.js';
import { World } from '../world/world.js';
import { spawnEnemy } from './spawn.js';

describe('enemy spawn points', () => {
  it('keeps two spawns in one tick on their own coordinates', () => {
    const world = new World();
    const rng = new NamedRngStreams(3);
    spawnEnemy(world, 'chhaya_drifter', 1, 1, rng);
    spawnEnemy(world, 'chhaya_drifter', 1, 1, rng);
    const placed: { x: number; y: number }[] = [];
    world.enemies.forEachAlive((enemy) => placed.push({ x: enemy.x, y: enemy.y }));
    expect(placed).toHaveLength(2);
    expect(placed[0]!.x).not.toBe(placed[1]!.x);
    placed[0]!.x += 50;
    expect(world.enemies.items.find((enemy) => enemy.alive && enemy.x === placed[1]!.x)).toBeTruthy();
    for (const spot of placed) {
      const dx = spot.x - world.player.x;
      const dy = spot.y - world.player.y;
      const dist = Math.hypot(dx, dy);
      expect(dist).toBeGreaterThanOrEqual(320);
      expect(dist).toBeLessThanOrEqual(500);
    }
    for (const enemy of world.enemies.items) {
      if (!enemy.alive) continue;
      expect(enemy.kind).toBe('enemy');
      expect(enemy.contentId).toBe('chhaya_drifter');
      expect(enemy.hp).toBe(enemy.maxHp);
      expect(enemy.hp).toBeGreaterThan(0);
      expect(enemy.vx).toBe(0);
      expect(enemy.aimX).toBe(enemy.x);
    }
  });
});
