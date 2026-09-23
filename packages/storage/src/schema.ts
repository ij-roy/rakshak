import { z } from 'zod';
import {
  ACHIEVEMENT_IDS,
  BOSS_IDS,
  ENEMY_IDS,
  EVOLUTION_IDS,
  GUARDIAN_IDS,
  MAP_IDS,
  META_TRACK_IDS,
  PASSIVE_IDS,
  WEAPON_IDS,
} from '@rakshak/game-data';

function enumOf<T extends string>(values: readonly T[]): z.ZodEnum<[T, ...T[]]> {
  return z.enum(values as [T, ...T[]]);
}

const guardianId = enumOf(GUARDIAN_IDS);
const weaponId = enumOf(WEAPON_IDS);
const mapId = enumOf(MAP_IDS);
const evolutionId = enumOf(EVOLUTION_IDS);
const enemyId = enumOf(ENEMY_IDS);
const bossId = enumOf(BOSS_IDS);
const passiveId = enumOf(PASSIVE_IDS);
const achievementId = enumOf(ACHIEVEMENT_IDS);
const metaTrackId = enumOf(META_TRACK_IDS);

export const SettingsV1Schema = z.object({
  masterVolume: z.number().min(0).max(1),
  musicVolume: z.number().min(0).max(1),
  sfxVolume: z.number().min(0).max(1),
  uiVolume: z.number().min(0).max(1),
  ambienceVolume: z.number().min(0).max(1),
  muted: z.boolean(),
  shakeScale: z.number().min(0).max(1),
  flashScale: z.number().min(0).max(1),
  particleDensity: z.number().min(0).max(1),
  damageNumbers: z.enum(['off', 'low', 'high']),
  stickSide: z.enum(['left', 'right']),
  stickSize: z.enum(['small', 'medium', 'large']).optional(),
  stickMode: z.enum(['fixed', 'floating']).optional(),
  stickDeadzone: z.number().min(0.05).max(0.35).optional(),
  bindings: z
    .object({
      up: z.string().min(1).max(32),
      down: z.string().min(1).max(32),
      left: z.string().min(1).max(32),
      right: z.string().min(1).max(32),
      pause: z.string().min(1).max(32),
      confirm: z.string().min(1).max(32),
      cancel: z.string().min(1).max(32),
    })
    .optional(),
  uiScale: z.number().min(0.8).max(1.5),
  highContrast: z.boolean(),
  reducedEffects: z.boolean(),
  haptics: z.boolean(),
  language: z.string().min(2).max(12),
  localDiagnostics: z.boolean(),
});

export const StatisticsV1Schema = z.object({
  runsStarted: z.number().int().min(0),
  runsCompleted: z.number().int().min(0),
  runsWon: z.number().int().min(0),
  totalSurvivalSeconds: z.number().min(0),
  defeats: z.number().int().min(0),
  totalXp: z.number().int().min(0),
  totalCurrencyEarned: z.number().int().min(0),
  highestLevel: z.number().int().min(1),
  longestSurvivalSeconds: z.number().min(0),
  totalKills: z.number().int().min(0),
});

export const MapRecordV1Schema = z.object({
  attempts: z.number().int().min(0),
  clears: z.number().int().min(0),
  bestTimeSeconds: z.number().min(0).nullable(),
});

export const AchievementStateSchema = z.object({
  state: z.enum(['locked', 'complete']),
  progress: z.number().min(0),
  completedAt: z.string().optional(),
});

export const SaveFileV1Schema = z.object({
  schemaVersion: z.literal(1),
  saveId: z.string().min(8).max(64),
  createdAt: z.string().min(10),
  updatedAt: z.string().min(10),
  gameVersion: z.string().min(1),
  contentVersion: z.string().min(1),
  revision: z.number().int().min(0),
  checksum: z.string().min(8),
  settings: SettingsV1Schema,
  unlocks: z.object({
    characters: z.array(guardianId),
    weapons: z.array(weaponId),
    maps: z.array(mapId),
    evolutions: z.array(evolutionId),
    nightOaths: z.array(z.string()),
  }),
  discovery: z.object({
    enemies: z.array(enemyId),
    bosses: z.array(bossId),
    weapons: z.array(weaponId),
    passives: z.array(passiveId),
    evolutions: z.array(evolutionId),
    lore: z.array(z.string()),
  }),
  achievements: z.record(achievementId, AchievementStateSchema),
  meta: z.object({
    currency: z.number().int().min(0).max(1_000_000),
    currencyId: z.literal('guardian_marks'),
    upgrades: z.record(metaTrackId, z.number().int().min(0).max(5)),
    lifetimeEarned: z.number().int().min(0),
    freeRespecUsed: z.boolean().optional(),
  }),
  statistics: StatisticsV1Schema,
  records: z.record(mapId, MapRecordV1Schema),
  provenance: z.object({
    migratedFrom: z.number().int().optional(),
    recoveredFromBackupCount: z.number().int().min(0),
    resetCount: z.number().int().min(0),
  }),
});

export type SaveFileV1 = z.infer<typeof SaveFileV1Schema>;
export type SettingsV1 = z.infer<typeof SettingsV1Schema>;
