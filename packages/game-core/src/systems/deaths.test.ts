import { describe, expect, it } from 'vitest';
import { NamedRngStreams } from '../rng/streams.js';
import { World } from '../world/world.js';
import { systemDeathsDrops } from './deaths.js';

describe('enemy deaths', () => {
  it('drops the fallen enemy and leaves the living one', () => {
    const world = new World();
    const living = world.enemies.acquire((enemy) => {
      enemy.hp = 8;
      enemy.maxHp = 8;
      enemy.xp = 1;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
    })!;
    world.enemies.acquire((enemy) => {
      enemy.hp = 0;
      enemy.maxHp = 8;
      enemy.xp = 6;
      enemy.x = 15;
      enemy.y = 4;
      enemy.kind = 'enemy';
      enemy.contentId = 'husk_guard';
    });
    systemDeathsDrops(world, new NamedRngStreams(1));
    expect(living.alive).toBe(true);
    expect(world.run.kills).toBe(1);
    let xp = 0;
    world.pickups.forEachAlive((pickup) => {
      if (pickup.kind === 'xp') xp += pickup.amount;
    });
    expect(xp).toBe(6);
  });

  it('drops a chest beside a fallen elite and keeps the experience', () => {
    const world = new World();
    world.enemies.acquire((enemy) => {
      enemy.hp = 0;
      enemy.maxHp = 40;
      enemy.xp = 11;
      enemy.x = 20;
      enemy.y = 10;
      enemy.kind = 'elite';
      enemy.contentId = 'mistcaller';
    });
    systemDeathsDrops(world, new NamedRngStreams(1));
    expect(world.offer.chestEvolutionReady).toBe(true);
    let xp = 0;
    let chestX = -1;
    let chestY = -1;
    world.pickups.forEachAlive((pickup) => {
      if (pickup.kind === 'xp') xp += pickup.amount;
      if (pickup.kind === 'chest') {
        chestX = pickup.x;
        chestY = pickup.y;
      }
    });
    expect(xp).toBe(11);
    expect(chestX).toBe(28);
    expect(chestY).toBe(10);
    let gold = 0;
    world.particles.forEachAlive((spark) => {
      if (spark.tint === 0xffd27a && spark.x === 20 && spark.y === 10) gold += 1;
    });
    expect(gold).toBe(1);
  });
});
