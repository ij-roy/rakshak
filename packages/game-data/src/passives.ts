import type { PassiveId } from './ids.js';

export type PassiveStat =
  | 'weaponDamage'
  | 'moveSpeed'
  | 'armor'
  | 'duration'
  | 'projectileSpeed'
  | 'area'
  | 'pickupRadius'
  | 'cooldown';

export interface PassiveDef {
  readonly id: PassiveId;
  readonly displayName: string;
  readonly stat: PassiveStat;
  readonly maxLevel: 5;
  /** Per-level additive multiplier (or flat for armor). */
  readonly perLevel: number;
  readonly hardCap?: number;
}

export const PASSIVES: readonly PassiveDef[] = [
  { id: 'whetstone', displayName: "Whetstone", stat: 'weaponDamage', maxLevel: 5, perLevel: 0.08 },
  { id: 'runners_anklet', displayName: "Runner's Anklet", stat: 'moveSpeed', maxLevel: 5, perLevel: 0.05 },
  { id: 'guard_plate', displayName: 'Guard Plate', stat: 'armor', maxLevel: 5, perLevel: 1.5, hardCap: 8 },
  { id: 'oil_flask', displayName: 'Oil Flask', stat: 'duration', maxLevel: 5, perLevel: 0.1 },
  { id: 'hunters_cord', displayName: "Hunter's Cord", stat: 'projectileSpeed', maxLevel: 5, perLevel: 0.1 },
  { id: 'wide_sash', displayName: 'Wide Sash', stat: 'area', maxLevel: 5, perLevel: 0.08 },
  { id: 'copper_bell', displayName: 'Copper Bell', stat: 'pickupRadius', maxLevel: 5, perLevel: 0.2 },
  { id: 'moon_thread', displayName: 'Moon Thread', stat: 'cooldown', maxLevel: 5, perLevel: 0.04, hardCap: 0.35 },
] as const;

export const PASSIVE_BY_ID: Readonly<Record<PassiveId, PassiveDef>> = Object.fromEntries(
  PASSIVES.map((p) => [p.id, p]),
) as Readonly<Record<PassiveId, PassiveDef>>;
