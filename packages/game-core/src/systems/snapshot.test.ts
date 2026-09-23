import { describe, expect, it } from 'vitest';
import { copyHud, createEmptyRenderSnapshot, silhouetteFor } from '@rakshak/game-protocol';
import { World } from '../world/world.js';
import { systemSnapshot, takeHeadingComputes, takeTintComputes } from './snapshot.js';

describe('snapshot silhouettes', () => {
  it('does not paint the player and normal enemies as the same white circle', () => {
    const world = new World();
    world.enemies.acquire((enemy) => {
      enemy.contentId = 'chhaya_drifter';
      enemy.kind = 'enemy';
      enemy.x = 40;
    });
    world.enemies.acquire((enemy) => {
      enemy.contentId = 'husk_guard';
      enemy.kind = 'elite';
      enemy.x = 80;
    });
    world.enemies.acquire((enemy) => {
      enemy.contentId = 'bell_warden';
      enemy.kind = 'boss';
      enemy.x = 120;
    });
    world.projectiles.acquire((shot) => {
      shot.x = 20;
    });
    for (const kind of ['xp', 'heal', 'chest', 'magnet'] as const) {
      world.pickups.acquire((pickup) => {
        pickup.kind = kind;
      });
    }

    const snap = createEmptyRenderSnapshot();
    systemSnapshot(world, snap);
    expect(snap.sprites.some((sprite) => sprite.tint === 0xffffff)).toBe(false);

    const shapes = snap.sprites.map((sprite) => silhouetteFor(sprite.kind, sprite.contentId));
    expect(shapes).toContain('shield');
    expect(shapes).toContain('chevron');
    expect(shapes).toContain('diamond');
    expect(shapes).toContain('crest');
    expect(snap.hud.bossId).toBe('bell_warden');
    expect(snap.hud.bossHp).toBeGreaterThan(0);
    expect(snap.hud.bossMaxHp).toBe(snap.hud.bossHp);
    expect(shapes).toContain('gem');
    expect(shapes).toContain('cross');
    expect(shapes).toContain('coffer');
    expect(shapes).toContain('loop');
    expect(new Set(['shield', 'chevron', 'gem', 'cross', 'coffer']).size).toBe(5);
  });

  it('reuses sprite records when the same buffer is filled again', () => {
    const world = new World();
    world.enemies.acquire((enemy) => {
      enemy.contentId = 'chhaya_drifter';
      enemy.kind = 'enemy';
      enemy.x = 40;
      enemy.vx = 4;
      enemy.vy = 0;
    });
    const snap = createEmptyRenderSnapshot();
    systemSnapshot(world, snap);
    const first = snap.sprites[0];
    const second = snap.sprites[1];
    world.player.x = 12;
    systemSnapshot(world, snap);
    expect(snap.sprites[0]).toBe(first);
    expect(snap.sprites[1]).toBe(second);
    expect(snap.sprites[0]?.x).toBe(12);
    expect(snap.sprites[1]?.facing).toBeCloseTo(0, 5);
    expect(snap.sprites).toHaveLength(2);
    takeHeadingComputes();
    systemSnapshot(world, snap);
    expect(takeHeadingComputes()).toBe(0);
    expect(snap.sprites[1]?.facing).toBeCloseTo(0, 5);
    const enemy = world.enemies.items.find((slot) => slot.alive);
    enemy!.vy = 4;
    systemSnapshot(world, snap);
    expect(takeHeadingComputes()).toBe(1);
    expect(snap.sprites[1]?.facing).toBeCloseTo(Math.PI / 4, 5);
    const tint = snap.sprites[1]?.tint;
    takeTintComputes();
    systemSnapshot(world, snap);
    expect(takeTintComputes()).toBe(0);
    expect(snap.sprites[1]?.tint).toBe(tint);
    enemy!.contentId = 'husk_guard';
    systemSnapshot(world, snap);
    expect(takeTintComputes()).toBe(1);
    expect(snap.sprites[1]?.tint).not.toBe(tint);
    expect(snap.sprites[1]?.contentId).toBe('husk_guard');
  });

  it('reuses the HUD record and keeps a copied build stable', () => {
    const world = new World();
    world.weapons.push({
      weaponId: 'talwar_arc',
      level: 1,
      cooldown: 0,
      evolved: false,
      evolutionId: null,
    });
    const snap = createEmptyRenderSnapshot();
    systemSnapshot(world, snap);
    const hud = snap.hud;
    const slot = snap.hud.weaponSlots[0];
    world.weapons[0]!.level = 2;
    systemSnapshot(world, snap);
    expect(snap.hud).toBe(hud);
    expect(snap.hud.weaponSlots[0]).toBe(slot);
    expect(slot?.level).toBe(2);
    const copied = copyHud(snap.hud);
    world.weapons[0]!.level = 4;
    systemSnapshot(world, snap);
    expect(copied.weaponSlots[0]?.level).toBe(2);
    expect(snap.hud.weaponSlots[0]?.level).toBe(4);
  });
});
