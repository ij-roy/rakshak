import { BALANCE } from '@rakshak/game-data';
import { SIM_HZ } from '@rakshak/shared';
import { spawnBoss } from './spawn.js';
import type { World } from '../world/world.js';

export function systemBossRun(world: World): void {
  if (world.run.paused || world.offer.awaitingChoice || world.run.outcome !== 'ongoing') return;

  const t = world.tick / SIM_HZ;
  if (t < 360) world.run.levelBeforeMinute6 = world.run.level;
  if (world.run.weaponCountAtMinute8 < 0 && t >= 480) {
    world.run.weaponCountAtMinute8 = world.weapons.length;
  }
  const times = BALANCE.bossTimesSeconds;
  while (world.director.bossesSpawned < times.length) {
    const next = times[world.director.bossesSpawned]!;
    if (t < next) break;
    const phaseIndex = world.director.bossesSpawned as 0 | 1 | 2;
    spawnBoss(world, phaseIndex);
    world.director.bossesSpawned++;
  }
}
