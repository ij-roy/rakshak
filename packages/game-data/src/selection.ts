import { BOSS_BY_ID } from './bosses.js';
import { ELITE_BY_ID } from './elites.js';
import { ENEMY_BY_ID } from './enemies.js';
import { GUARDIAN_BY_ID, type GuardianDef } from './guardians.js';
import type { GuardianId, MapId } from './ids.js';
import { MAP_BY_ID, type MapDef } from './maps.js';
import { weaponBehaviorLine } from './upgrade-copy.js';
import { WEAPON_BY_ID } from './weapons.js';

export interface MapBest {
  readonly attempts: number;
  readonly clears: number;
  readonly bestTimeSeconds: number | null;
}

export interface GuardianPreview {
  readonly id: GuardianId;
  readonly name: string;
  readonly epithet: string;
  readonly weaponName: string;
  readonly weaponBehavior: string;
  readonly stats: string;
  readonly role: string;
}

export interface MapPreview {
  readonly id: MapId;
  readonly name: string;
  readonly subtitle: string;
  readonly hazard: string;
  readonly intensity: string;
  readonly expectation: string;
  readonly threats: string;
  readonly best: string;
}

const HAZARD: Record<MapDef['hazard'], string> = {
  low_walls: 'Low walls block movement and leave a gap.',
  root_slow: 'Roots slow you after a warning.',
  wind_lanes: 'Wind lanes push shots while they are active.',
  gate_lanes: 'Gates close beside an open gap.',
};

const INTENSITY: Record<MapId, string> = {
  gaon: 'Opening',
  van: 'Rising',
  marusthal: 'Severe',
  durg: 'Final',
};

const ROLE: Record<GuardianId, string> = {
  asha: 'A close, forgiving watch.',
  veer: 'A faster watch that gives up armor.',
  tara: 'A wider, slower watch.',
  nila: 'A fast watch with a longer pickup reach.',
};

function signedPercent(fraction: number): string {
  const value = Math.round(fraction * 100);
  const body = `${Math.abs(value)}%`;
  return value < 0 ? `−${body}` : `+${body}`;
}

function statLine(guardian: GuardianDef): string {
  const parts = [`${guardian.maxHp} health`, `speed ${guardian.moveSpeed}`];
  if (guardian.armorPct !== 0) parts.push(`${signedPercent(guardian.armorPct)} armor`);
  if (guardian.cooldownMult !== 1) {
    parts.push(`${Math.round((guardian.cooldownMult - 1) * 100)}% slower attacks`);
  }
  if (guardian.areaMult !== 1) parts.push(`${signedPercent(guardian.areaMult - 1)} area`);
  if (guardian.pickupRadius !== 48) parts.push(`pickup ${guardian.pickupRadius}`);
  return parts.join(' · ');
}

function clock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

export function describeGuardianChoice(id: GuardianId): GuardianPreview {
  const guardian = GUARDIAN_BY_ID[id];
  const weapon = WEAPON_BY_ID[guardian.startWeapon];
  return {
    id,
    name: guardian.displayName,
    epithet: guardian.epithet,
    weaponName: weapon.displayName,
    weaponBehavior: weaponBehaviorLine(weapon.id),
    stats: statLine(guardian),
    role: ROLE[id],
  };
}

export function describeBestResult(record: MapBest | undefined): string {
  if (!record || record.attempts <= 0) return 'No watch recorded.';
  const attempts = `${record.attempts} attempt${record.attempts === 1 ? '' : 's'}`;
  const clears = record.clears > 0 ? `${record.clears} clear${record.clears === 1 ? '' : 's'}` : 'No clear';
  const best = record.bestTimeSeconds == null ? '' : ` Best time ${clock(record.bestTimeSeconds)}.`;
  return `${attempts}. ${clears}.${best}`;
}

export function describeMapChoice(id: MapId, record?: MapBest): MapPreview {
  const map = MAP_BY_ID[id];
  const boss = BOSS_BY_ID[map.bossId];
  const foes = map.enemyPool.slice(0, 3).map((enemyId) => ENEMY_BY_ID[enemyId].displayName);
  const elites = map.elitePool.map((eliteId) => ELITE_BY_ID[eliteId].displayName);
  return {
    id,
    name: map.displayName,
    subtitle: map.subtitle,
    hazard: HAZARD[map.hazard],
    intensity: INTENSITY[id],
    expectation: `Lieutenants at 4:00 and 8:00. ${boss.displayName} at 12:00.`,
    threats: `${foes.join(', ')}. Elites: ${elites.join(', ')}.`,
    best: describeBestResult(record),
  };
}

export function describeWatchSummary(guardianId: GuardianId, mapId: MapId, record?: MapBest): string {
  const guardian = describeGuardianChoice(guardianId);
  const map = describeMapChoice(mapId, record);
  return `${guardian.name} with ${guardian.weaponName} on ${map.name}. ${map.intensity} watch. ${map.hazard} ${map.best}`;
}
