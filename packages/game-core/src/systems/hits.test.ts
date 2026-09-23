import { describe, expect, it } from 'vitest';
import { World } from '../world/world.js';
import { systemAi } from './ai.js';
import { systemBroadphase, systemHits, takeBroadphaseBuilds } from './hits.js';

describe('projectile hits', () => {
  it('damages the near enemy, leaves the far one, and spends pierce', () => {
    const world = new World();
    const near = world.enemies.acquire((enemy) => {
      enemy.x = 30;
      enemy.y = 0;
      enemy.radius = 10;
      enemy.hp = 20;
      enemy.maxHp = 20;
      enemy.armor = 0;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
    })!;
    const far = world.enemies.acquire((enemy) => {
      enemy.x = 500;
      enemy.y = 0;
      enemy.radius = 10;
      enemy.hp = 20;
      enemy.maxHp = 20;
      enemy.armor = 0;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
    })!;
    const shot = world.projectiles.acquire((proj) => {
      proj.x = 20;
      proj.y = 0;
      proj.radius = 12;
      proj.damage = 5;
      proj.pierceLeft = 1;
      proj.faction = 'player';
      proj.behavior = 'straight';
      proj.weaponId = 'spear_burst';
    })!;
    systemBroadphase(world);
    systemHits(world);
    expect(near.hp).toBeLessThan(20);
    expect(far.hp).toBe(20);
    expect(shot.alive).toBe(false);
  });

  it('hits a large body across a cell boundary and misses one just beyond the shot', () => {
    const world = new World();
    const struck = world.enemies.acquire((enemy) => {
      enemy.x = 69;
      enemy.y = 0;
      enemy.radius = 42;
      enemy.hp = 80;
      enemy.maxHp = 80;
      enemy.armor = 0;
      enemy.kind = 'boss';
      enemy.contentId = 'bell_warden';
    })!;
    const beyond = world.enemies.acquire((enemy) => {
      enemy.x = 72;
      enemy.y = 0;
      enemy.radius = 42;
      enemy.hp = 80;
      enemy.maxHp = 80;
      enemy.armor = 0;
      enemy.kind = 'boss';
      enemy.contentId = 'bell_warden';
    })!;
    world.projectiles.acquire((proj) => {
      proj.x = 20;
      proj.y = 0;
      proj.radius = 8;
      proj.damage = 5;
      proj.pierceLeft = 3;
      proj.faction = 'player';
      proj.behavior = 'straight';
      proj.weaponId = 'spear_burst';
    });
    systemBroadphase(world);
    systemHits(world);
    expect(struck.hp).toBeLessThan(80);
    expect(beyond.hp).toBe(80);
  });

  it('keeps an arc from hitting behind the guardian', () => {
    const world = new World();
    const behind = world.enemies.acquire((enemy) => {
      enemy.x = -40;
      enemy.y = 0;
      enemy.radius = 10;
      enemy.hp = 20;
      enemy.maxHp = 20;
      enemy.armor = 0;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
    })!;
    world.projectiles.acquire((proj) => {
      proj.x = 0;
      proj.y = 0;
      proj.radius = 48;
      proj.damage = 9;
      proj.pierceLeft = 3;
      proj.faction = 'player';
      proj.behavior = 'arc';
      proj.homeX = 0;
      proj.homeY = Math.PI;
      proj.weaponId = 'talwar_arc';
    });
    systemBroadphase(world);
    systemHits(world);
    expect(behind.hp).toBe(20);
  });

  it('applies contact only while the enemy is not in a leaping attack', () => {
    const world = new World();
    world.player.hp = 100;
    world.enemies.acquire((enemy) => {
      enemy.x = world.player.x;
      enemy.y = world.player.y;
      enemy.radius = 10;
      enemy.hp = 20;
      enemy.maxHp = 20;
      enemy.contactDamage = 8;
      enemy.kind = 'enemy';
      enemy.contentId = 'dust_leaper';
      enemy.attackPhase = 1;
    });
    systemBroadphase(world);
    systemHits(world);
    expect(world.player.hp).toBe(100);
    world.enemies.forEachAlive((enemy) => {
      enemy.attackPhase = 0;
    });
    world.tick = world.player.invulnUntil;
    systemHits(world);
    expect(world.player.hp).toBeLessThan(100);
  });

  it('touches a large body across a cell boundary and ignores one farther out', () => {
    const world = new World();
    world.player.hp = 100;
    world.player.x = 60;
    world.player.y = 0;
    const body = world.enemies.acquire((enemy) => {
      enemy.x = 115;
      enemy.y = 0;
      enemy.radius = 42;
      enemy.hp = 80;
      enemy.maxHp = 80;
      enemy.contactDamage = 9;
      enemy.kind = 'boss';
      enemy.contentId = 'bell_warden';
    })!;
    systemBroadphase(world);
    systemHits(world);
    expect(world.player.hp).toBeLessThan(100);
    world.player.hp = 100;
    world.player.invulnUntil = 0;
    body.x = 400;
    systemBroadphase(world);
    systemHits(world);
    expect(world.player.hp).toBe(100);
  });

  it('reuses the grid built while enemies moved', () => {
    const world = new World();
    world.player.hp = 100;
    world.player.x = 0;
    world.player.y = 0;
    world.enemies.acquire((enemy) => {
      enemy.x = 0;
      enemy.y = 0;
      enemy.radius = 16;
      enemy.hp = 40;
      enemy.maxHp = 40;
      enemy.contactDamage = 8;
      enemy.kind = 'enemy';
      enemy.contentId = 'chhaya_drifter';
      enemy.threatCost = 1;
    });
    takeBroadphaseBuilds();
    systemAi(world);
    systemBroadphase(world);
    expect(takeBroadphaseBuilds()).toBe(0);
    systemHits(world);
    expect(world.player.hp).toBeLessThan(100);
  });
});
