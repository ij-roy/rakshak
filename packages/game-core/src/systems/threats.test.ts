import { EMPTY_INPUT } from '@rakshak/game-protocol';
import { describe, expect, it } from 'vitest';
import { GameRuntime } from '../runtime.js';
import type { EnemyEntity } from '../world/world.js';

function arm(runtime: GameRuntime, contentId: string, x: number, y: number, kind: EnemyEntity['kind'] = 'enemy'): void {
  runtime.world.director.spawnFreeze = true;
  runtime.world.enemies.acquire((enemy) => {
    enemy.contentId = contentId;
    enemy.kind = kind;
    enemy.x = x;
    enemy.y = y;
    enemy.radius = 12;
    enemy.hp = 200;
    enemy.maxHp = 200;
    enemy.contactDamage = 12;
    enemy.attackPhase = 0;
    enemy.attackTimer = 0;
    enemy.aimX = x;
    enemy.aimY = y;
    enemy.aiCooldown = 0;
    enemy.threatCost = 1;
  });
}

describe('attack telegraphs', () => {
  it('lets a player sidestep a sand roller after the lane appears', () => {
    const runtime = new GameRuntime({ seed: 1, guardianId: 'asha', mapId: 'gaon' });
    runtime.world.player.x = 0;
    runtime.world.player.y = 0;
    arm(runtime, 'sand_roller', -150, 0);
    let aimed = false;
    for (let i = 0; i < 20; i++) {
      runtime.step({ ...EMPTY_INPUT, moveY: -1 });
      const line = runtime.snapshot().telegraphs.find((tel) => tel.kind === 'line');
      if (line) {
        expect(Math.abs(line.angle)).toBeLessThan(0.2);
        expect(line.radius).toBeGreaterThan(100);
        aimed = true;
        break;
      }
    }
    expect(aimed).toBe(true);
    const before = runtime.world.player.hp;
    for (let i = 0; i < 40; i++) runtime.step({ ...EMPTY_INPUT, moveY: -1 });
    const roller = runtime.world.enemies.items.find((enemy) => enemy.alive && enemy.contentId === 'sand_roller');
    expect(Math.abs(roller?.y ?? 99)).toBeLessThan(24);
    expect(runtime.world.player.hp).toBe(before);
  });

  it('shows a thorn line before the bolt exists', () => {
    const runtime = new GameRuntime({ seed: 2, guardianId: 'asha', mapId: 'gaon' });
    arm(runtime, 'thorn_spitter', 180, 0);
    let warned = false;
    for (let i = 0; i < 30; i++) {
      runtime.step(EMPTY_INPUT);
      const snap = runtime.snapshot();
      const line = snap.telegraphs.find((tel) => tel.kind === 'line');
      const bolt = snap.sprites.some((sprite) => sprite.contentId === 'thorn_bolt');
      if (line && !bolt) warned = true;
      if (bolt) {
        expect(warned).toBe(true);
        const shot = runtime.world.projectiles.items.find((item) => item.alive && item.weaponId === 'thorn_bolt');
        expect(shot?.faction).toBe('enemy');
        expect(shot?.vx ?? 0).toBeLessThan(0);
        expect(shot?.x ?? 0).toBeGreaterThan(100);
        return;
      }
    }
    throw new Error('thorn bolt never fired');
  });

  it('draws leap, burrow, arc, and boss ring as different shapes', () => {
    const runtime = new GameRuntime({ seed: 3, guardianId: 'asha', mapId: 'gaon' });
    arm(runtime, 'dust_leaper', -80, 40);
    arm(runtime, 'burrow_mite', 70, -30);
    arm(runtime, 'night_maw', 0, 90);
    arm(runtime, 'bell_warden', 40, -80, 'boss');
    runtime.step(EMPTY_INPUT);
    const kinds = new Set(runtime.snapshot().telegraphs.map((tel) => tel.kind));
    expect(kinds).toEqual(new Set(['circle', 'ring', 'arc']));
    const leap = runtime.snapshot().telegraphs.find((tel) => tel.kind === 'circle');
    expect(leap && Math.hypot(leap.x + 80, leap.y - 40)).toBeGreaterThan(40);
  });

  it('draws a warning only for the enemy that is winding up', () => {
    const runtime = new GameRuntime({ seed: 4, guardianId: 'asha', mapId: 'gaon' });
    arm(runtime, 'sand_roller', -20, 0);
    arm(runtime, 'sand_roller', 70, 0);
    const winding = runtime.world.enemies.items.find((enemy) => enemy.alive && enemy.x === 70);
    expect(winding).toBeTruthy();
    winding!.attackPhase = 1;
    winding!.attackTimer = 12;
    winding!.aimX = 180;
    winding!.aimY = 0;
    const snap = runtime.snapshot();
    expect(snap.telegraphs).toHaveLength(1);
    expect(snap.telegraphs[0]?.kind).toBe('line');
    expect(snap.telegraphs[0]?.x).toBeCloseTo(70, 5);
  });
});
