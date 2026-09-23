import { describe, expect, it } from 'vitest';
import { BALANCE } from '@rakshak/game-data';
import { applyDamageToEnemy, applyDamageToPlayer } from '../combat/damage.js';
import { NamedRngStreams } from '../rng/streams.js';
import { spawnBoss } from '../systems/spawn.js';
import { systemDeathsDrops } from '../systems/deaths.js';
import { World } from '../world/world.js';

describe('contact damage', () => {
  it('applies mitigation and invulnerability window', () => {
    const world = new World();
    world.player.hp = 100;
    world.player.maxHp = 100;
    world.player.armorFlat = 2;
    world.player.armorPct = 0.1;
    world.tick = 10;

    const dealt = applyDamageToPlayer(world, 20, 1);
    expect(dealt).toBe(Math.max(1, Math.round(20 * 0.9 - 2)));
    expect(world.player.hp).toBe(100 - dealt);
    expect(world.player.invulnUntil).toBe(10 + BALANCE.contactIFramesTicks);

    const second = applyDamageToPlayer(world, 20, 1);
    expect(second).toBe(0);
    expect(world.player.hp).toBe(100 - dealt);

    world.tick = world.player.invulnUntil;
    const third = applyDamageToPlayer(world, 20, 1);
    expect(third).toBe(dealt);
  });

  it('reuses the hit record for the next enemy strike', () => {
    const world = new World();
    const enemy = world.enemies.acquire((slot) => {
      slot.contentId = 'chhaya_drifter';
      slot.kind = 'enemy';
      slot.hp = 40;
      slot.maxHp = 40;
      slot.armor = 0;
      slot.invulnUntil = 0;
    });
    const index = world.enemies.items.indexOf(enemy!);
    world.tick = 3;
    applyDamageToEnemy(world, index, 8, false);
    const first = world.events[0];
    expect(first).toMatchObject({ kind: 'enemy_damaged', amount: 8, tick: 3 });
    world.clearEvents();
    world.tick = 6;
    applyDamageToEnemy(world, index, 5, true);
    expect(world.events[0]).toBe(first);
    expect(world.events[0]).toMatchObject({ kind: 'enemy_damaged', amount: 5, tick: 6, critical: true });
  });

  it('marks the bell from a flag and reuses the player-hit record', () => {
    const world = new World();
    world.tick = 4;
    const firstHit = applyDamageToPlayer(world, 10, 2);
    const first = world.events[0];
    expect(first).toMatchObject({ kind: 'player_damaged', amount: firstHit, remainingHp: world.player.hp });
    expect(world.run.bellDamaged).toBe(false);
    world.clearEvents();
    world.tick = world.player.invulnUntil;
    world.run.bellAlive = true;
    applyDamageToPlayer(world, 10, 2);
    expect(world.events[0]).toBe(first);
    expect(world.run.bellDamaged).toBe(true);
  });

  it('tracks a living bell without walking the crowd on the hit', () => {
    const world = new World();
    for (let i = 0; i < 40; i++) {
      world.enemies.acquire((slot) => {
        slot.contentId = 'chhaya_drifter';
        slot.kind = 'enemy';
        slot.hp = 5;
        slot.maxHp = 5;
      });
    }
    spawnBoss(world, 0);
    expect(world.run.bellAlive).toBe(true);
    world.tick = 40;
    applyDamageToPlayer(world, 12, 1);
    expect(world.run.bellDamaged).toBe(true);
    world.enemies.forEachAlive((enemy) => {
      if (enemy.kind === 'boss') enemy.hp = 0;
    });
    systemDeathsDrops(world, new NamedRngStreams(1));
    expect(world.run.bellAlive).toBe(false);
    world.run.bellDamaged = false;
    world.tick = world.player.invulnUntil;
    applyDamageToPlayer(world, 12, 1);
    expect(world.run.bellDamaged).toBe(false);
  });
});
