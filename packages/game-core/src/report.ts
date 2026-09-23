import type { EvolutionId, RunReport } from '@rakshak/game-data';
import type { World } from './world/world.js';

/** Snapshot the facts progression rules need. Discovery arrays are this run only. */
export function buildRunReport(world: World): RunReport {
  const evolutions = world.weapons
    .map((w) => w.evolutionId)
    .filter((id): id is EvolutionId => id != null);
  return {
    mapId: world.mapId,
    guardianId: world.guardianId,
    survivalSeconds: Math.floor(world.tick / 30),
    level: world.run.level,
    kills: world.run.kills,
    won: world.run.outcome === 'victory',
    revivesUsed: 0,
    oathsActive: 0,
    evolutions,
    weapons: world.weapons.map((w) => ({ id: w.weaponId, level: w.level })),
    passives: world.passives.map((p) => ({ id: p.passiveId, level: p.level })),
    enemiesSeen: world.run.seenEnemies as RunReport['enemiesSeen'],
    bossesSeen: world.run.seenBosses as RunReport['bossesSeen'],
    bossClearedLowHp: world.run.bossClearedLowHp,
    bellDefeatedClean: world.run.bellDefeatedClean,
    levelBeforeMinute6: world.run.levelBeforeMinute6,
    weaponCountAtMinute8: world.run.weaponCountAtMinute8,
    damageTaken: world.run.damageTaken,
  };
}
