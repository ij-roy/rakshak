import { EMPTY_INPUT } from '@rakshak/game-protocol';
import { describe, expect, it } from 'vitest';
import { GameRuntime } from '../runtime.js';
import { fieldMarks, fillFieldMarks, hazardPhase, takeFieldFills } from './field.js';

describe('arena field', () => {
  it('keeps landmarks fixed while the player moves', () => {
    const early = fieldMarks({ mapId: 'gaon', tick: 1, mapWidth: 2200, mapHeight: 1600 });
    const later = fieldMarks({ mapId: 'gaon', tick: 90, mapWidth: 2200, mapHeight: 1600 });
    expect(early.find((mark) => mark.kind === 'landmark')?.x).toBe(later.find((mark) => mark.kind === 'landmark')?.x);
    expect(early).not.toBe(later);
    const buffer = fieldMarks({ mapId: 'van', tick: 1, mapWidth: 2200, mapHeight: 1600 });
    const root = buffer[4];
    fillFieldMarks({ mapId: 'van', tick: 100, mapWidth: 2200, mapHeight: 1600 }, buffer);
    expect(buffer[4]).toBe(root);
    expect(root?.active).toBe(1);
    expect(early[4]?.kind).toBe('wall');
    const runtime = new GameRuntime({ seed: 1, guardianId: 'asha', mapId: 'gaon' });
    runtime.world.director.spawnFreeze = true;
    const start = runtime.world.player.x;
    for (let i = 0; i < 20; i++) runtime.step({ ...EMPTY_INPUT, moveX: 1 });
    expect(runtime.world.player.x).toBeGreaterThan(start + 20);
  });

  it('blocks a low wall and leaves the center gap open', () => {
    const blocked = new GameRuntime({ seed: 1, guardianId: 'asha', mapId: 'gaon' });
    blocked.world.director.spawnFreeze = true;
    blocked.world.player.x = -300;
    blocked.world.player.y = -160;
    for (let i = 0; i < 40; i++) blocked.step({ ...EMPTY_INPUT, moveY: -1 });
    expect(blocked.world.player.y).toBeGreaterThan(-186);
    expect(blocked.world.player.y).toBeLessThan(-160);

    const gap = new GameRuntime({ seed: 1, guardianId: 'asha', mapId: 'gaon' });
    gap.world.director.spawnFreeze = true;
    gap.world.player.x = 0;
    gap.world.player.y = -160;
    for (let i = 0; i < 30; i++) gap.step({ ...EMPTY_INPUT, moveY: -1 });
    expect(gap.world.player.y).toBeLessThan(-200);
  });

  it('slows only after the root patch finishes its warning', () => {
    const warned = travelInRoots(9);
    const rooted = travelInRoots(99);
    expect(hazardPhase(10, 0)).toBeLessThan(1);
    expect(hazardPhase(100, 0)).toBe(1);
    expect(warned).toBeGreaterThan(rooted + 4);
  });

  it('pushes shots only inside an active wind lane', () => {
    const runtime = new GameRuntime({ seed: 1, guardianId: 'asha', mapId: 'marusthal' });
    runtime.world.director.spawnFreeze = true;
    runtime.world.tick = 99;
    const inside = runtime.world.projectiles.acquire((shot) => {
      shot.x = 0;
      shot.y = 150;
      shot.vx = 0;
      shot.vy = 0;
      shot.lifeTicks = 40;
      shot.faction = 'player';
      shot.behavior = 'straight';
      shot.hitIds = new Set();
    });
    const outside = runtime.world.projectiles.acquire((shot) => {
      shot.x = 0;
      shot.y = 0;
      shot.vx = 0;
      shot.vy = 0;
      shot.lifeTicks = 40;
      shot.faction = 'player';
      shot.behavior = 'straight';
      shot.hitIds = new Set();
    });
    runtime.step(EMPTY_INPUT);
    expect(inside?.vx ?? 0).toBeGreaterThan(1);
    expect(outside?.vx ?? 1).toBe(0);
  });

  it('closes a gate beside its gap and still lets the player through the gap', () => {
    const blocked = new GameRuntime({ seed: 1, guardianId: 'asha', mapId: 'durg' });
    blocked.world.director.spawnFreeze = true;
    blocked.world.tick = 99;
    blocked.world.player.x = 300;
    blocked.world.player.y = -130;
    for (let i = 0; i < 30; i++) blocked.step({ ...EMPTY_INPUT, moveX: 1 });
    expect(blocked.world.player.x).toBeLessThan(340);

    const open = new GameRuntime({ seed: 1, guardianId: 'asha', mapId: 'durg' });
    open.world.director.spawnFreeze = true;
    open.world.tick = 99;
    open.world.player.x = 300;
    open.world.player.y = 0;
    for (let i = 0; i < 30; i++) open.step({ ...EMPTY_INPUT, moveX: 1 });
    expect(open.world.player.x).toBeGreaterThan(360);
  });

  it('builds the terrain once when movement and wind share a tick', () => {
    const runtime = new GameRuntime({ seed: 1, guardianId: 'asha', mapId: 'marusthal' });
    runtime.world.director.spawnFreeze = true;
    takeFieldFills();
    runtime.step(EMPTY_INPUT);
    expect(takeFieldFills()).toBe(1);
    runtime.step(EMPTY_INPUT);
    expect(takeFieldFills()).toBe(1);
  });
});

function travelInRoots(startTick: number): number {
  const runtime = new GameRuntime({ seed: 1, guardianId: 'asha', mapId: 'van' });
  runtime.world.director.spawnFreeze = true;
  runtime.world.tick = startTick;
  runtime.world.player.x = 0;
  runtime.world.player.y = 180;
  const start = runtime.world.player.y;
  for (let i = 0; i < 12; i++) runtime.step({ ...EMPTY_INPUT, moveY: 1 });
  return runtime.world.player.y - start;
}
