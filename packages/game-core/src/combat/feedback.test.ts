import { describe, expect, it } from 'vitest';
import { systemSnapshot } from '../systems/snapshot.js';
import { createEmptyRenderSnapshot } from '@rakshak/game-protocol';
import { applyDamageToEnemy, applyDamageToPlayer } from './damage.js';
import { HEAL_TINT, HURT_TINT, TRAIL_TINT, noteEnemyDamage, noteHeal, notePickupTrail } from './feedback.js';
import { World } from '../world/world.js';

describe('combat feedback', () => {
  it('merges nearby damage into one number and keeps a heal mark', () => {
    const world = new World();
    const enemy = world.enemies.acquire((slot) => {
      slot.x = 40;
      slot.y = 20;
      slot.hp = 80;
      slot.maxHp = 80;
      slot.radius = 12;
      slot.armor = 0;
      slot.kind = 'enemy';
      slot.contentId = 'drifter';
    });
    expect(enemy).not.toBeNull();
    const index = world.enemies.items.indexOf(enemy!);
    applyDamageToEnemy(world, index, 10);
    world.tick = enemy!.invulnUntil;
    applyDamageToEnemy(world, index, 7);
    noteHeal(world);
    world.tick = 4;
    notePickupTrail(world, 12, 12);

    let labels = 0;
    let amount = 0;
    world.damageLabels.forEachAlive((label) => {
      labels += 1;
      amount = label.amount;
    });
    expect(labels).toBe(1);
    expect(amount).toBe(17);
    noteEnemyDamage(world, 400, 400, 3, false);
    let far = 0;
    labels = 0;
    world.damageLabels.forEachAlive((label) => {
      labels += 1;
      if (label.amount === 3) far += 1;
    });
    expect(labels).toBe(2);
    expect(far).toBe(1);

    const snap = createEmptyRenderSnapshot();
    systemSnapshot(world, snap);
    expect(snap.sprites.some((sprite) => sprite.kind === 'damage_label' && sprite.contentId === '17')).toBe(true);
    expect(snap.sprites.some((sprite) => sprite.kind === 'particle' && sprite.contentId === 'heal')).toBe(true);
    expect(snap.sprites.some((sprite) => sprite.kind === 'particle' && sprite.contentId === 'spark')).toBe(true);
    expect(snap.telegraphs).toBeDefined();

    const sparks = () => {
      let n = 0;
      world.particles.forEachAlive((pt) => {
        if (pt.tint === TRAIL_TINT) n += 1;
      });
      return n;
    };
    const before = sparks();
    world.tick = 5;
    notePickupTrail(world, 12, 12);
    expect(sparks()).toBe(before);
  });

  it('points the hurt streak toward the attacker', () => {
    const world = new World();
    world.player.hp = 100;
    world.player.maxHp = 100;
    world.tick = 10;
    const enemy = world.enemies.acquire((slot) => {
      slot.x = world.player.x + 60;
      slot.y = world.player.y;
      slot.hp = 40;
      slot.maxHp = 40;
      slot.radius = 10;
      slot.armor = 0;
      slot.kind = 'enemy';
      slot.contentId = 'drifter';
    });
    applyDamageToPlayer(world, 12, enemy!.id);
    let vx = 0;
    world.particles.forEachAlive((pt) => {
      if (pt.tint === HURT_TINT) vx = pt.vx;
    });
    expect(vx).toBeGreaterThan(0);
    expect(HEAL_TINT).not.toBe(HURT_TINT);
  });
});
