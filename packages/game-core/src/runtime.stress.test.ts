import { describe, expect, it } from 'vitest';
import { GameRuntime } from './runtime.js';
import { EMPTY_INPUT, createEmptyRenderSnapshot } from '@rakshak/game-protocol';

describe('stress soak (headless)', () => {
  it('survives 90 seconds of idle combat without crashing', () => {
    const runtime = new GameRuntime({ seed: 42, guardianId: 'asha', mapId: 'gaon' });
    const ticks = 90 * 30;
    let lastChecksum = 0n;
    for (let i = 0; i < ticks; i++) {
      // Mild oscillation so weapons have targets while moving
      const t = i / 30;
      runtime.step({
        moveX: Math.sin(t) * 0.6,
        moveY: Math.cos(t * 0.7) * 0.6,
        pause: false,
        confirm: false,
        cancel: false,
      });
      // Auto-pick middle upgrade when offered
      const snap = runtime.snapshot();
      if (snap.hud.awaitingLevelChoice) {
        runtime.step({ ...EMPTY_INPUT, confirm: true, moveX: 0 });
      }
      if (i % 300 === 0) {
        lastChecksum = runtime.checksum();
      }
    }
    const end = runtime.snapshot();
    expect(end.hud.level).toBeGreaterThanOrEqual(1);
    expect(end.tick).toBeGreaterThan(0);
    expect(lastChecksum).not.toBe(0n);
  });

  it('entity counts stay within hard caps under pressure', () => {
    const runtime = new GameRuntime({ seed: 99, guardianId: 'asha', mapId: 'gaon' });
    for (let i = 0; i < 60 * 30; i++) {
      runtime.step({
        moveX: 0.2,
        moveY: -0.1,
        pause: false,
        confirm: false,
        cancel: false,
      });
      const snap = runtime.snapshot();
      if (snap.hud.awaitingLevelChoice) {
        runtime.step({ ...EMPTY_INPUT, confirm: true });
      }
      expect(snap.sprites.length).toBeLessThan(2000);
    }
  });

  it('keeps the approved stress scene inside the simulation floor', () => {
    const runtime = new GameRuntime({ seed: 7, guardianId: 'asha', mapId: 'gaon' });
    const world = runtime.world;
    world.director.spawnFreeze = true;
    world.player.hp = 100000;
    world.player.maxHp = 100000;
    for (let i = 0; i < 300; i++) {
      const angle = (i / 300) * Math.PI * 2;
      const dist = 180 + (i % 12) * 28;
      world.enemies.acquire((enemy) => {
        enemy.contentId = 'chhaya_drifter';
        enemy.kind = 'enemy';
        enemy.x = Math.cos(angle) * dist;
        enemy.y = Math.sin(angle) * dist;
        enemy.radius = 12;
        enemy.hp = 5000;
        enemy.maxHp = 5000;
        enemy.contactDamage = 1;
        enemy.armor = 0;
        enemy.threatCost = 1;
        enemy.attackPhase = 0;
        enemy.attackTimer = 30;
        enemy.aiCooldown = i % 8;
      });
    }
    for (let i = 0; i < 250; i++) {
      world.projectiles.acquire((shot) => {
        shot.weaponId = 'talwar_arc';
        shot.x = (i % 25) * 24 - 300;
        shot.y = Math.floor(i / 25) * 24 - 120;
        shot.vx = 4;
        shot.vy = 0;
        shot.radius = 6;
        shot.damage = 1;
        shot.pierceLeft = 0;
        shot.lifeTicks = 90;
        shot.faction = 'player';
        shot.behavior = 'straight';
      });
    }
    for (let i = 0; i < 400; i++) {
      world.pickups.acquire((pickup) => {
        pickup.kind = 'xp';
        pickup.x = (i % 20) * 30 - 300;
        pickup.y = Math.floor(i / 20) * 30 - 300;
        pickup.amount = 1;
        pickup.magnetized = false;
      });
    }
    for (let i = 0; i < 800; i++) {
      world.particles.acquire((particle) => {
        particle.x = (i % 40) * 16 - 320;
        particle.y = Math.floor(i / 40) * 16 - 160;
        particle.lifeTicks = 90;
        particle.tint = 0xe5d2a6;
      });
    }
    for (let i = 0; i < 40; i++) {
      world.damageLabels.acquire((label) => {
        label.x = i * 8;
        label.y = 0;
        label.amount = 3;
        label.lifeTicks = 90;
      });
    }
    const samples: number[] = [];
    const buffer = createEmptyRenderSnapshot();
    let peakSprites = 0;
    for (let i = 0; i < 60; i++) {
      const started = performance.now();
      runtime.step({
        moveX: 0.2,
        moveY: -0.1,
        pause: false,
        confirm: false,
        cancel: false,
      });
      const snap = runtime.snapshot(buffer);
      samples.push(performance.now() - started);
      if (snap.sprites.length > peakSprites) peakSprites = snap.sprites.length;
    }
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
    const p99 = samples[Math.floor(samples.length * 0.99)] ?? 0;
    expect(world.enemies.activeCount).toBeGreaterThan(200);
    expect(peakSprites).toBeGreaterThan(500);
    expect(p95).toBeLessThanOrEqual(8);
    expect(p99).toBeLessThanOrEqual(16);
  });
});
