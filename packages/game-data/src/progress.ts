import {
  ACHIEVEMENTS,
  ACHIEVEMENT_BY_ID,
} from './achievements.js';
import { ENEMY_IDS, EVOLUTION_IDS, GUARDIAN_IDS, MAP_IDS, WEAPON_IDS } from './ids.js';
import type { AchievementId, BossId, EnemyId, EvolutionId, GuardianId, MapId, PassiveId, WeaponId } from './ids.js';
import { evaluateUnlocks, type RunFacts } from './unlocks.js';

export interface RunReport {
  readonly mapId: MapId;
  readonly guardianId: GuardianId;
  readonly survivalSeconds: number;
  readonly level: number;
  readonly kills: number;
  readonly won: boolean;
  readonly revivesUsed: number;
  readonly oathsActive: number;
  readonly evolutions: readonly EvolutionId[];
  readonly weapons: readonly { id: WeaponId; level: number }[];
  readonly passives: readonly { id: PassiveId; level: number }[];
  readonly enemiesSeen: readonly EnemyId[];
  readonly bossesSeen: readonly BossId[];
  readonly bossClearedLowHp: boolean;
  readonly bellDefeatedClean: boolean;
  readonly levelBeforeMinute6: number;
  /** -1 if the run ended before minute 8. */
  readonly weaponCountAtMinute8: number;
  readonly damageTaken?: number;
  /** Lifetime weapon levels already banked, bitmask over WEAPON_IDS. */
  readonly priorWeaponLevel8Mask?: number;
  readonly priorGuardianClearMask?: number;
  readonly priorEnemyCount?: number;
  readonly priorEvolutionCount?: number;
  readonly priorMapClears?: readonly MapId[];
}

export interface ProgressGrant {
  readonly achievements: readonly AchievementId[];
  readonly achievementMarks: number;
  readonly guardians: readonly GuardianId[];
  readonly maps: readonly MapId[];
  readonly enemies: readonly EnemyId[];
  readonly bosses: readonly BossId[];
  readonly weapons: readonly WeaponId[];
  readonly passives: readonly PassiveId[];
  readonly evolutions: readonly EvolutionId[];
  readonly mapCleared: boolean;
}

function maskWeapons(levels: readonly { id: WeaponId; level: number }[], prior = 0): number {
  let mask = prior;
  levels.forEach((w) => {
    if (w.level >= 8) {
      const bit = WEAPON_IDS.indexOf(w.id);
      if (bit >= 0) mask |= 1 << bit;
    }
  });
  return mask;
}

export function grantsForRun(
  report: RunReport,
  alreadyComplete: ReadonlySet<AchievementId>,
): ProgressGrant {
  const earned: AchievementId[] = [];
  const consider = (id: AchievementId, ok: boolean) => {
    if (ok && !alreadyComplete.has(id)) earned.push(id);
  };

  consider('first_watch', report.survivalSeconds >= 180);
  consider('dawn_held', report.won && report.mapId === 'gaon');
  consider('green_silence', report.won && report.mapId === 'van');
  consider('across_glasswind', report.won && report.mapId === 'marusthal');
  consider('rampart_restored', report.won && report.mapId === 'durg');
  consider('close_call', report.won && report.bossClearedLowHp);
  consider('untouched_bell', report.bellDefeatedClean);
  consider('no_second_breath', report.won && report.revivesUsed === 0);
  for (const evo of report.evolutions) {
    const match = ACHIEVEMENTS.find(
      (a) => a.predicate.kind === 'discover_evolution' && a.predicate.evolutionId === evo,
    );
    if (match) consider(match.id, true);
  }
  consider(
    'full_satchel',
    report.weapons.length >= 6 && report.passives.length >= 6,
  );
  consider(
    'single_purpose',
    report.weaponCountAtMinute8 === 1 && report.survivalSeconds >= 480,
  );
  consider('crowdkeeper', report.kills >= 1000);
  consider('swift_watch', report.levelBeforeMinute6 >= 20);
  const guardianMask =
    (report.priorGuardianClearMask ?? 0) |
    (report.won ? 1 << GUARDIAN_IDS.indexOf(report.guardianId) : 0);
  consider('every_path', guardianMask === (1 << GUARDIAN_IDS.length) - 1);
  consider('oathbound_i', report.won && report.oathsActive >= 1);
  consider('oathbound_iii', report.won && report.oathsActive >= 3);
  const discoveredEnemies = new Set(report.enemiesSeen);
  consider('field_notes', discoveredEnemies.size >= ENEMY_IDS.length);
  const weaponMask = maskWeapons(report.weapons, report.priorWeaponLevel8Mask ?? 0);
  consider('master_of_arms', weaponMask === (1 << WEAPON_IDS.length) - 1);
  const cleared = new Set(report.priorMapClears ?? []);
  if (report.won) cleared.add(report.mapId);
  const evoCount = new Set(report.evolutions).size;
  consider(
    'rakshak',
    MAP_IDS.every((id) => cleared.has(id)) && evoCount >= EVOLUTION_IDS.length,
  );

  const facts: RunFacts = {
    mapId: report.mapId,
    guardianId: report.guardianId,
    survivalSeconds: report.survivalSeconds,
    won: report.won,
    revivesUsed: report.revivesUsed,
    uniqueEvolutionsDiscovered: Math.max(evoCount, report.priorEvolutionCount ?? 0),
    oathsActive: report.oathsActive,
  };
  const unlocks = evaluateUnlocks(facts);
  const marks = earned.reduce((sum, id) => sum + ACHIEVEMENT_BY_ID[id].guardianMarks, 0);

  return {
    achievements: earned,
    achievementMarks: marks,
    guardians: unlocks.guardians,
    maps: unlocks.maps,
    enemies: report.enemiesSeen,
    bosses: report.bossesSeen,
    weapons: report.weapons.map((w) => w.id),
    passives: report.passives.map((p) => p.id),
    evolutions: report.evolutions,
    mapCleared: report.won,
  };
}
