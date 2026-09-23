import {
  ACHIEVEMENT_IDS,
  MAP_IDS,
  META_TRACK_IDS,
  WEAPON_IDS,
} from '@rakshak/game-data';
import { CONTENT_VERSION, GAME_VERSION } from '@rakshak/shared';
import { computeSaveChecksum } from './checksum.js';
import type { SaveFileV1 } from './schema.js';

export function createDefaultSave(nowIso = '2026-09-23T00:00:00.000Z', saveId = 'local-default-save-001'): SaveFileV1 {
  const achievements = Object.fromEntries(
    ACHIEVEMENT_IDS.map((id) => [id, { state: 'locked' as const, progress: 0 }]),
  );

  const upgrades = Object.fromEntries(META_TRACK_IDS.map((id) => [id, 0]));
  const records = Object.fromEntries(
    MAP_IDS.map((id) => [id, { attempts: 0, clears: 0, bestTimeSeconds: null }]),
  );

  const withoutChecksum = {
    schemaVersion: 1 as const,
    saveId,
    createdAt: nowIso,
    updatedAt: nowIso,
    gameVersion: GAME_VERSION,
    contentVersion: CONTENT_VERSION,
    revision: 0,
    settings: {
      masterVolume: 1,
      musicVolume: 0.8,
      sfxVolume: 0.9,
      uiVolume: 0.85,
      ambienceVolume: 0.6,
      muted: false,
      shakeScale: 1,
      flashScale: 1,
      particleDensity: 1,
      damageNumbers: 'high' as const,
      stickSide: 'left' as const,
      uiScale: 1,
      highContrast: false,
      reducedEffects: false,
      haptics: true,
      language: 'en',
      localDiagnostics: false,
    },
    unlocks: {
      characters: ['asha' as const],
      weapons: [...WEAPON_IDS],
      maps: ['gaon' as const],
      evolutions: [],
      nightOaths: [],
    },
    discovery: {
      enemies: [],
      bosses: [],
      weapons: ['talwar_arc' as const],
      passives: [],
      evolutions: [],
      lore: [],
    },
    achievements,
    meta: {
      currency: 0,
      currencyId: 'guardian_marks' as const,
      upgrades,
      lifetimeEarned: 0,
      freeRespecUsed: false,
    },
    statistics: {
      runsStarted: 0,
      runsCompleted: 0,
      runsWon: 0,
      totalSurvivalSeconds: 0,
      defeats: 0,
      totalXp: 0,
      totalCurrencyEarned: 0,
      highestLevel: 1,
      longestSurvivalSeconds: 0,
      totalKills: 0,
    },
    records,
    provenance: {
      recoveredFromBackupCount: 0,
      resetCount: 0,
    },
  };

  return {
    ...withoutChecksum,
    checksum: computeSaveChecksum(withoutChecksum),
  };
}
