import { describe, expect, it } from 'vitest';
import { NamedRngStreams } from '../rng/streams.js';
import { World } from '../world/world.js';
import { systemWeapons, takeAimScans, takeChainWalks } from './weapons.js';
import { systemAi } from './ai.js';

describe('projectile hits', () => {
  it('clears the previous hit list instead of replacing it', () => {
    const world = new World();
    world.weapons.push({
      weaponId: 'talwar_arc',
      level: 1,
      cooldown: 0,
      evolved: false,
      evolutionId: null,
    });
    const rng = new NamedRngStreams(1);
    systemWeapons(world, rng);
    const first = world.projectiles.items.find((shot) => shot.alive);
    expect(first).toBeTruthy();
    first!.hitIds.add(99);
    const hits = first!.hitIds;
    world.projectiles.release(first!);
    world.weapons[0]!.cooldown = 0;
    systemWeapons(world, rng);
    const second = world.projectiles.items.find((shot) => shot.alive);
    expect(second?.hitIds).toBe(hits);
    expect(second?.hitIds.has(99)).toBe(false);
  });

  it('spreads a spear burst onto separate velocities', () => {
    const world = new World();
    world.weapons.push({
      weaponId: 'spear_burst',
      level: 1,
      cooldown: 0,
      evolved: false,
      evolutionId: null,
    });
    systemWeapons(world, new NamedRngStreams(1));
    const shots = world.projectiles.items.filter((shot) => shot.alive);
    expect(shots).toHaveLength(4);
    for (const shot of shots) {
      expect(Math.hypot(shot.vx, shot.vy)).toBeCloseTo(320 / 30, 5);
    }
    for (let i = 0; i < shots.length; i++) {
      for (let j = i + 1; j < shots.length; j++) {
        const turn = Math.atan2(shots[i]!.vy, shots[i]!.vx) - Math.atan2(shots[j]!.vy, shots[j]!.vx);
        expect(Math.abs(Math.atan2(Math.sin(turn), Math.cos(turn)))).toBeGreaterThan(0.2);
      }
    }
  });

  it('aims a volley at the nearer enemy', () => {
    const world = new World();
    world.enemies.acquire((enemy) => {
      enemy.x = 300;
      enemy.y = 0;
      enemy.hp = 10;
      enemy.maxHp = 10;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
    });
    world.enemies.acquire((enemy) => {
      enemy.x = 0;
      enemy.y = 50;
      enemy.hp = 10;
      enemy.maxHp = 10;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
    });
    world.weapons.push({
      weaponId: 'dhanush_volley',
      level: 1,
      cooldown: 0,
      evolved: false,
      evolutionId: null,
    });
    systemWeapons(world, new NamedRngStreams(2));
    const shots = world.projectiles.items.filter((shot) => shot.alive);
    expect(shots.length).toBeGreaterThan(0);
    for (const shot of shots) {
      expect(shot.vy).toBeGreaterThan(0);
      expect(Math.abs(shot.vx)).toBeLessThan(shot.vy);
    }
  });

  it('places every ember basin around the nearer enemy', () => {
    const world = new World();
    world.enemies.acquire((enemy) => {
      enemy.x = 0;
      enemy.y = 30;
      enemy.hp = 10;
      enemy.maxHp = 10;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
    });
    world.enemies.acquire((enemy) => {
      enemy.x = 400;
      enemy.y = 0;
      enemy.hp = 10;
      enemy.maxHp = 10;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
    });
    world.weapons.push({
      weaponId: 'ember_kund',
      level: 5,
      cooldown: 0,
      evolved: false,
      evolutionId: null,
    });
    systemWeapons(world, new NamedRngStreams(3));
    const zones = world.projectiles.items.filter((shot) => shot.alive);
    expect(zones.length).toBeGreaterThan(1);
    for (const zone of zones) {
      expect(Math.hypot(zone.x, zone.y - 30)).toBeLessThan(30);
      expect(Math.hypot(zone.x - 400, zone.y)).toBeGreaterThan(300);
    }
  });

  it('searches for a target once per tick and again after the tick moves', () => {
    const world = new World();
    const near = world.enemies.acquire((enemy) => {
      enemy.x = 0;
      enemy.y = 50;
      enemy.hp = 10;
      enemy.maxHp = 10;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
    })!;
    world.enemies.acquire((enemy) => {
      enemy.x = 400;
      enemy.y = 0;
      enemy.hp = 10;
      enemy.maxHp = 10;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
    });
    world.weapons.push(
      {
        weaponId: 'dhanush_volley',
        level: 1,
        cooldown: 0,
        evolved: false,
        evolutionId: null,
      },
      {
        weaponId: 'ember_kund',
        level: 1,
        cooldown: 0,
        evolved: false,
        evolutionId: null,
      },
    );
    takeAimScans();
    systemWeapons(world, new NamedRngStreams(4));
    expect(takeAimScans()).toBe(1);
    const firstVolley = world.projectiles.items.filter((shot) => shot.alive && shot.weaponId === 'dhanush_volley');
    expect(firstVolley.length).toBeGreaterThan(0);
    for (const shot of firstVolley) expect(shot.vy).toBeGreaterThan(0);

    near.y = -80;
    world.tick += 1;
    for (const slot of world.weapons) slot.cooldown = 0;
    for (const shot of world.projectiles.items) {
      if (shot.alive) world.projectiles.release(shot);
    }
    takeAimScans();
    systemWeapons(world, new NamedRngStreams(5));
    expect(takeAimScans()).toBe(1);
    const secondVolley = world.projectiles.items.filter((shot) => shot.alive && shot.weaponId === 'dhanush_volley');
    expect(secondVolley.length).toBeGreaterThan(0);
    for (const shot of secondVolley) expect(shot.vy).toBeLessThan(0);
  });

  it('still chains the nearer enemy when the movement grid is not ready', () => {
    const world = new World();
    world.enemies.acquire((enemy) => {
      enemy.x = 30;
      enemy.y = 0;
      enemy.hp = 10;
      enemy.maxHp = 10;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
    });
    world.enemies.acquire((enemy) => {
      enemy.x = 500;
      enemy.y = 0;
      enemy.hp = 10;
      enemy.maxHp = 10;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
    });
    world.weapons.push({
      weaponId: 'monsoon_spark',
      level: 1,
      cooldown: 0,
      evolved: false,
      evolutionId: null,
    });
    takeChainWalks();
    systemWeapons(world, new NamedRngStreams(7));
    expect(takeChainWalks()).toBe(1);
    const sparks = world.projectiles.items.filter((shot) => shot.alive && shot.weaponId === 'monsoon_spark');
    expect(sparks.length).toBeGreaterThan(0);
    for (const spark of sparks) expect(spark.x).toBeLessThan(80);
  });

  it('chains the nearer enemy from the movement grid without walking the whole crowd', () => {
    const world = new World();
    world.player.x = 0;
    world.player.y = 0;
    world.enemies.acquire((enemy) => {
      enemy.x = 40;
      enemy.y = 0;
      enemy.hp = 20;
      enemy.maxHp = 20;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
      enemy.threatCost = 1;
    });
    world.enemies.acquire((enemy) => {
      enemy.x = 500;
      enemy.y = 0;
      enemy.hp = 20;
      enemy.maxHp = 20;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
      enemy.threatCost = 1;
    });
    world.weapons.push({
      weaponId: 'monsoon_spark',
      level: 1,
      cooldown: 0,
      evolved: false,
      evolutionId: null,
    });
    systemAi(world);
    takeChainWalks();
    systemWeapons(world, new NamedRngStreams(6));
    expect(takeChainWalks()).toBe(0);
    const sparks = world.projectiles.items.filter((shot) => shot.alive && shot.weaponId === 'monsoon_spark');
    expect(sparks.length).toBeGreaterThan(0);
    for (const spark of sparks) {
      expect(spark.x).toBeLessThan(120);
      expect(Math.abs(spark.x - 500)).toBeGreaterThan(200);
    }
  });
});
