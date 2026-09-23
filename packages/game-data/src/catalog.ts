import { ACHIEVEMENTS } from './achievements.js';
import { BOSSES } from './bosses.js';
import { ELITES } from './elites.js';
import { ENEMIES } from './enemies.js';
import { EVOLUTIONS } from './evolutions.js';
import { GUARDIANS } from './guardians.js';
import { MAPS } from './maps.js';
import { META_TRACKS } from './meta.js';
import { PASSIVES } from './passives.js';
import { WEAPONS } from './weapons.js';
import {
  ACHIEVEMENT_IDS,
  BOSS_IDS,
  ELITE_IDS,
  ENEMY_IDS,
  EVOLUTION_IDS,
  GUARDIAN_IDS,
  MAP_IDS,
  PASSIVE_IDS,
  WEAPON_IDS,
} from './ids.js';

export const CONTENT_COUNTS = {
  guardians: GUARDIANS.length,
  weapons: WEAPONS.length,
  passives: PASSIVES.length,
  evolutions: EVOLUTIONS.length,
  enemies: ENEMIES.length,
  elites: ELITES.length,
  maps: MAPS.length,
  bosses: BOSSES.length,
  achievements: ACHIEVEMENTS.length,
  metaTracks: META_TRACKS.length,
} as const;

export function assertLaunchContentComplete(): void {
  const checks: Array<[string, number, number]> = [
    ['guardians', CONTENT_COUNTS.guardians, GUARDIAN_IDS.length],
    ['weapons', CONTENT_COUNTS.weapons, WEAPON_IDS.length],
    ['passives', CONTENT_COUNTS.passives, PASSIVE_IDS.length],
    ['evolutions', CONTENT_COUNTS.evolutions, EVOLUTION_IDS.length],
    ['enemies', CONTENT_COUNTS.enemies, ENEMY_IDS.length],
    ['elites', CONTENT_COUNTS.elites, ELITE_IDS.length],
    ['maps', CONTENT_COUNTS.maps, MAP_IDS.length],
    ['bosses', CONTENT_COUNTS.bosses, BOSS_IDS.length],
    ['achievements', CONTENT_COUNTS.achievements, ACHIEVEMENT_IDS.length],
  ];
  for (const [name, actual, expected] of checks) {
    if (actual !== expected) {
      throw new Error(`Content count mismatch for ${name}: ${actual} !== ${expected}`);
    }
  }
  if (CONTENT_COUNTS.guardians !== 4) throw new Error('Expected 4 guardians');
  if (CONTENT_COUNTS.weapons !== 8) throw new Error('Expected 8 weapons');
  if (CONTENT_COUNTS.passives !== 8) throw new Error('Expected 8 passives');
  if (CONTENT_COUNTS.evolutions !== 6) throw new Error('Expected 6 evolutions');
  if (CONTENT_COUNTS.enemies !== 16) throw new Error('Expected 16 enemies');
  if (CONTENT_COUNTS.elites !== 4) throw new Error('Expected 4 elites');
  if (CONTENT_COUNTS.maps !== 4) throw new Error('Expected 4 maps');
  if (CONTENT_COUNTS.bosses !== 4) throw new Error('Expected 4 bosses');
  if (CONTENT_COUNTS.achievements !== 24) throw new Error('Expected 24 achievements');
}

export const LAUNCH_CATALOG = {
  guardians: GUARDIANS,
  weapons: WEAPONS,
  passives: PASSIVES,
  evolutions: EVOLUTIONS,
  enemies: ENEMIES,
  elites: ELITES,
  maps: MAPS,
  bosses: BOSSES,
  achievements: ACHIEVEMENTS,
  metaTracks: META_TRACKS,
  counts: CONTENT_COUNTS,
} as const;
