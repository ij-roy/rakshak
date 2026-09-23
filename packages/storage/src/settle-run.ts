import {
  BALANCE,
  rewardForRun,
  WEAPON_IDS,
  GUARDIAN_IDS,
  type AchievementId,
  type BossId,
  type EnemyId,
  type EvolutionId,
  type GuardianId,
  type MapId,
  type PassiveId,
  type RewardContext,
  type RunReport,
  type WeaponId,
} from '@rakshak/game-data';
import { computeSaveChecksum } from './checksum.js';
import { withBumpedRevision } from './migrations.js';
import type { SaveFileV1 } from './schema.js';

function union<T extends string>(current: readonly T[], extra: readonly T[]): T[] {
  return [...new Set([...current, ...extra])];
}

function collectRunGrant(save: SaveFileV1, report: RunReport): {
  grant: ReturnType<typeof rewardForRun>['grant'];
  merged: RunReport;
  marks: number;
} {
  const already = completedAchievements(save);
  const context = rewardContextFromSave(save);
  const merged: RunReport = {
    ...report,
    enemiesSeen: union(save.discovery.enemies, report.enemiesSeen),
    bossesSeen: union(save.discovery.bosses, report.bossesSeen),
    evolutions: union(save.discovery.evolutions, report.evolutions),
    priorMapClears: context.priorMapClears,
    priorWeaponLevel8Mask: context.priorWeaponLevel8Mask,
    priorGuardianClearMask: context.priorGuardianClearMask,
    priorEvolutionCount: context.priorEvolutionCount,
  };
  const reward = rewardForRun(merged, already);
  return { grant: reward.grant, merged, marks: reward.total };
}

/** Discoveries, achievements and mark total for a finished run. Shared by save and results. */
export function evaluateRun(save: SaveFileV1, report: RunReport): {
  grant: ReturnType<typeof rewardForRun>['grant'];
  merged: RunReport;
  marks: number;
} {
  return collectRunGrant(save, report);
}

function completedAchievements(save: SaveFileV1): Set<AchievementId> {
  return new Set(
    (Object.entries(save.achievements) as [AchievementId, { state: string }][])
      .filter(([, value]) => value.state === 'complete')
      .map(([id]) => id),
  );
}

/** Priors the simulation needs so its stored reward matches settleRun. */
export function rewardContextFromSave(save: SaveFileV1): RewardContext {
  const priorMaps = (Object.entries(save.records) as [MapId, { clears: number }][])
    .filter(([, rec]) => rec.clears > 0)
    .map(([id]) => id);
  return {
    completedAchievements: [...completedAchievements(save)],
    priorMapClears: priorMaps,
    priorWeaponLevel8Mask: Number(save.achievements.master_of_arms?.progress ?? 0),
    priorGuardianClearMask: Number(save.achievements.every_path?.progress ?? 0),
    priorEvolutionCount: save.discovery.evolutions.length,
  };
}

/** Apply discoveries, unlocks, records, achievements and currency. Completed achievements pay once. */
export function settleRun(save: SaveFileV1, report: RunReport): SaveFileV1 {
  const { grant, marks } = evaluateRun(save, report);
  const weaponMask = Number(save.achievements.master_of_arms?.progress ?? 0);
  const guardianMask = Number(save.achievements.every_path?.progress ?? 0);
  const achievements: SaveFileV1['achievements'] = { ...save.achievements };
  const now = new Date().toISOString();
  for (const id of grant.achievements) {
    const prev = achievements[id];
    achievements[id] = {
      state: 'complete',
      progress: Math.max(prev?.progress ?? 0, 1),
      completedAt: now,
    };
  }
  const nextWeaponMask = report.weapons.reduce((mask, weapon) => {
    if (weapon.level < 8) return mask;
    const bit = WEAPON_IDS.indexOf(weapon.id);
    return bit >= 0 ? mask | (1 << bit) : mask;
  }, weaponMask);
  if (achievements.master_of_arms?.state !== 'complete') {
    achievements.master_of_arms = {
      state: 'locked',
      progress: nextWeaponMask,
    };
  }
  const guardianBit = report.won ? 1 << Math.max(0, GUARDIAN_IDS.indexOf(report.guardianId)) : 0;
  if (achievements.every_path?.state !== 'complete') {
    achievements.every_path = {
      state: 'locked',
      progress: guardianMask | guardianBit,
    };
  }
  const watch = achievements.first_watch ?? { state: 'locked' as const, progress: 0 };
  if (watch.state !== 'complete') {
    achievements.first_watch = {
      ...watch,
      progress: Math.max(watch.progress, Math.min(180, report.survivalSeconds)),
    };
  }
  const raise = (id: AchievementId, value: number, cap: number) => {
    const row = achievements[id];
    if (!row || row.state === 'complete') return;
    achievements[id] = { state: 'locked', progress: Math.min(cap, Math.max(row.progress, value)) };
  };
  raise('crowdkeeper', report.kills, 1000);
  raise('swift_watch', report.levelBeforeMinute6, 20);
  raise(
    'full_satchel',
    Math.min(BALANCE.maxWeaponSlots, report.weapons.length) + Math.min(BALANCE.maxPassiveSlots, report.passives.length),
    BALANCE.maxWeaponSlots + BALANCE.maxPassiveSlots,
  );

  const records = { ...save.records };
  const rec = records[report.mapId] ?? { attempts: 0, clears: 0, bestTimeSeconds: null };
  records[report.mapId] = {
    attempts: rec.attempts + 1,
    clears: rec.clears + (report.won ? 1 : 0),
    bestTimeSeconds: report.won
      ? rec.bestTimeSeconds == null
        ? report.survivalSeconds
        : Math.min(rec.bestTimeSeconds, report.survivalSeconds)
      : rec.bestTimeSeconds,
  };

  const bumped = withBumpedRevision({
    ...save,
    updatedAt: now,
    achievements,
    discovery: {
      enemies: union(save.discovery.enemies, grant.enemies as EnemyId[]),
      bosses: union(save.discovery.bosses, grant.bosses as BossId[]),
      weapons: union(save.discovery.weapons, grant.weapons as WeaponId[]),
      passives: union(save.discovery.passives, grant.passives as PassiveId[]),
      evolutions: union(save.discovery.evolutions, grant.evolutions as EvolutionId[]),
      lore: save.discovery.lore,
    },
    unlocks: {
      ...save.unlocks,
      characters: union(save.unlocks.characters, grant.guardians as GuardianId[]),
      maps: union(save.unlocks.maps, grant.maps as MapId[]),
      evolutions: union(save.unlocks.evolutions, grant.evolutions as EvolutionId[]),
    },
    records,
    meta: {
      ...save.meta,
      currency: save.meta.currency + marks,
      lifetimeEarned: save.meta.lifetimeEarned + marks,
    },
    statistics: {
      ...save.statistics,
      runsCompleted: save.statistics.runsCompleted + 1,
      runsWon: save.statistics.runsWon + (report.won ? 1 : 0),
      defeats: save.statistics.defeats + (report.won ? 0 : 1),
      totalSurvivalSeconds: save.statistics.totalSurvivalSeconds + report.survivalSeconds,
      totalKills: save.statistics.totalKills + report.kills,
      highestLevel: Math.max(save.statistics.highestLevel, report.level),
      longestSurvivalSeconds: Math.max(save.statistics.longestSurvivalSeconds, report.survivalSeconds),
      totalCurrencyEarned: save.statistics.totalCurrencyEarned + marks,
    },
  });
  return { ...bumped, checksum: computeSaveChecksum(bumped) };
}
