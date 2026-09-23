import { describe, expect, it } from 'vitest';
import { World } from '../world/world.js';
import { systemAi } from './ai.js';

describe('enemy chase', () => {
  it('keeps a normal enemy moving on the tick it does not retarget', () => {
    const world = new World();
    world.player.x = 200;
    world.player.y = 0;
    const enemy = world.enemies.acquire((slot) => {
      slot.contentId = 'chhaya_drifter';
      slot.kind = 'enemy';
      slot.x = 0;
      slot.y = 0;
      slot.vx = 0;
      slot.vy = 0;
      slot.threatCost = 1;
    });
    world.tick = enemy!.id;
    systemAi(world);
    const speed = enemy!.vx;
    expect(speed).toBeGreaterThan(0);
    const stepped = enemy!.x;
    world.tick = enemy!.id + 1;
    world.player.x = -200;
    systemAi(world);
    expect(enemy!.vx).toBe(speed);
    expect(enemy!.x).toBeGreaterThan(stepped);
  });

  it('winds up a sand roller instead of chasing', () => {
    const world = new World();
    world.player.x = 100;
    const roller = world.enemies.acquire((slot) => {
      slot.contentId = 'sand_roller';
      slot.kind = 'enemy';
      slot.x = 0;
      slot.y = 0;
      slot.vx = 4;
      slot.vy = 0;
      slot.attackPhase = 0;
      slot.attackTimer = 0;
      slot.aiCooldown = 0;
    });
    systemAi(world);
    expect(roller!.attackPhase).toBe(1);
    expect(roller!.vx).toBe(0);
    expect(roller!.aimX).toBeGreaterThan(100);
  });

  it('retargets an elite on every tick and still advances a boss attack', () => {
    const world = new World();
    world.player.x = 100;
    const elite = world.enemies.acquire((slot) => {
      slot.contentId = 'mistcaller';
      slot.kind = 'elite';
      slot.x = 0;
      slot.y = 0;
      slot.vx = 0;
      slot.vy = 0;
    });
    world.tick = 2;
    systemAi(world);
    expect(elite!.vx).toBeGreaterThan(0);
    world.tick = 3;
    world.player.x = -100;
    systemAi(world);
    expect(elite!.vx).toBeLessThan(0);

    const boss = world.enemies.acquire((slot) => {
      slot.contentId = 'bell_warden';
      slot.kind = 'boss';
      slot.x = 40;
      slot.y = 0;
      slot.attackPhase = 0;
      slot.attackTimer = 0;
      slot.aiCooldown = 0;
    });
    world.tick = 4;
    systemAi(world);
    const windup = boss!.attackTimer;
    expect(boss!.attackPhase).toBe(1);
    expect(windup).toBeGreaterThan(0);
    world.tick = 5;
    systemAi(world);
    expect(boss!.attackTimer).toBe(windup - 1);
  });
});
