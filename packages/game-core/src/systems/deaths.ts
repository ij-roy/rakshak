import { rewardForRun } from '@rakshak/game-data';
import { dropXp } from './xp.js';
import type { NamedRngStreams } from '../rng/streams.js';
import { buildRunReport } from '../report.js';
import type { World } from '../world/world.js';

export function systemDeathsDrops(world: World, rng: NamedRngStreams): void {
  if (world.run.paused || world.offer.awaitingChoice) return;

  let playerDied = world.player.hp <= 0;
  let finalBossDied = false;

  const enemies = world.enemies.items;
  for (let index = 0; index < enemies.length; index++) {
    const enemy = enemies[index]!;
    if (!enemy.alive || enemy.hp > 0) continue;

    const wasFinal = enemy.isFinalBoss;
    const wasBoss = enemy.kind === 'boss';
    const wasElite = enemy.kind === 'elite';
    const xp = enemy.xp;
    const contentId = enemy.contentId;
    const x = enemy.x;
    const y = enemy.y;
    const entityId = enemy.id;

    world.enemies.releaseAt(index);
    world.run.kills++;
    if (!world.run.seenEnemies.includes(contentId) && contentId !== '') {
      world.run.seenEnemies.push(contentId);
    }

    world.emitEnemyKilled(entityId, contentId, xp);

    dropXp(world, x, y, xp);

    if (wasElite || wasBoss) {
      world.offer.chestEvolutionReady = true;
      const chest = world.pickups.take();
      if (chest) {
        chest.kind = 'chest';
        chest.x = x + 8;
        chest.y = y;
        chest.amount = 1;
        chest.magnetized = false;
      }
      if (rng.cosmetic.nextFloat() < 0.9) {
        const spark = world.particles.take();
        if (spark) {
          spark.x = x;
          spark.y = y;
          spark.vx = (rng.cosmetic.nextFloat() - 0.5) * 2;
          spark.vy = (rng.cosmetic.nextFloat() - 0.5) * 2;
          spark.lifeTicks = 20;
          spark.tint = 0xffd27a;
        }
      }
    }

    if (wasBoss) {
      if (contentId === 'bell_warden') world.run.bellAlive = false;
      world.run.bossesDefeated++;
      if (!world.run.seenBosses.includes(contentId)) world.run.seenBosses.push(contentId);
      if (world.player.maxHp > 0 && world.player.hp / world.player.maxHp <= 0.1) {
        world.run.bossClearedLowHp = true;
      }
      if (contentId === 'bell_warden' && !world.run.bellDamaged) {
        world.run.bellDefeatedClean = true;
      }
      world.pushEvent({
        kind: 'boss_defeated',
        tick: world.tick,
        bossId: contentId,
        phase: Math.min(3, world.director.bossesSpawned) as 1 | 2 | 3,
        isFinal: wasFinal,
      });
      if (wasFinal) {
        finalBossDied = true;
        world.run.finalBossAlive = false;
      }
    }
  }

  // Master Spec: if both die same tick, final boss defeat wins.
  if (finalBossDied) {
    endRun(world, 'victory');
    return;
  }
  if (playerDied) {
    endRun(world, 'defeat');
  }
}

function endRun(world: World, outcome: 'victory' | 'defeat'): void {
  if (world.run.outcome !== 'ongoing') return;
  world.run.outcome = outcome;
  const report = {
    ...buildRunReport(world),
    priorMapClears: world.rewardContext.priorMapClears,
    priorWeaponLevel8Mask: world.rewardContext.priorWeaponLevel8Mask,
    priorGuardianClearMask: world.rewardContext.priorGuardianClearMask,
    priorEvolutionCount: world.rewardContext.priorEvolutionCount,
  };
  world.run.guardianMarksEarned = rewardForRun(
    report,
    new Set(world.rewardContext.completedAchievements),
  ).total;
  world.pushEvent({
    kind: 'run_ended',
    tick: world.tick,
    outcome,
    survivalTicks: world.tick,
    level: world.run.level,
    kills: world.run.kills,
  });
}
