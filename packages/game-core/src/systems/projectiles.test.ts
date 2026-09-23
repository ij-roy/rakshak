import { describe, expect, it } from 'vitest';
import { World } from '../world/world.js';
import { systemProjectiles } from './projectiles.js';

describe('projectile motion', () => {
  it('moves a straight shot and retires it when its life ends', () => {
    const world = new World();
    const shot = world.projectiles.acquire((proj) => {
      proj.x = 10;
      proj.y = 4;
      proj.vx = 3;
      proj.vy = -1;
      proj.lifeTicks = 2;
      proj.behavior = 'straight';
      proj.faction = 'player';
    })!;
    systemProjectiles(world);
    expect(shot.alive).toBe(true);
    expect(shot.x).toBe(13);
    expect(shot.y).toBe(3);
    systemProjectiles(world);
    expect(shot.alive).toBe(false);
  });

  it('turns a returning shot toward the guardian without moving the other one backward', () => {
    const world = new World();
    world.player.x = 0;
    world.player.y = 0;
    const returning = world.projectiles.acquire((proj) => {
      proj.x = 30;
      proj.y = 0;
      proj.vx = 6;
      proj.vy = 0;
      proj.lifeTicks = 10;
      proj.age = 5;
      proj.behavior = 'return';
      proj.faction = 'player';
    })!;
    const straight = world.projectiles.acquire((proj) => {
      proj.x = 0;
      proj.y = 20;
      proj.vx = 2;
      proj.vy = 0;
      proj.lifeTicks = 10;
      proj.behavior = 'straight';
      proj.faction = 'player';
    })!;
    systemProjectiles(world);
    expect(returning.vx).toBeLessThan(0);
    expect(straight.x).toBe(2);
    expect(straight.vx).toBe(2);
  });
});
