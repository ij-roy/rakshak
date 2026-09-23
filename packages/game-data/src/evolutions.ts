import type { EvolutionId, PassiveId, WeaponId } from './ids.js';

export interface EvolutionDef {
  readonly id: EvolutionId;
  readonly displayName: string;
  readonly baseWeapon: WeaponId;
  readonly requiredPassive: PassiveId;
  readonly damageMult: number;
  readonly areaMult: number;
  readonly countBonus: number;
  readonly special: string;
}

export const EVOLUTIONS: readonly EvolutionDef[] = [
  {
    id: 'crescent_guard',
    displayName: 'Crescent Guard',
    baseWeapon: 'talwar_arc',
    requiredPassive: 'whetstone',
    damageMult: 1.35,
    areaMult: 1.25,
    countBonus: 0,
    special: 'full_circle_deflect',
  },
  {
    id: 'monsoon_volley',
    displayName: 'Monsoon Volley',
    baseWeapon: 'dhanush_volley',
    requiredPassive: 'hunters_cord',
    damageMult: 1.2,
    areaMult: 1,
    countBonus: 3,
    special: 'piercing_fan',
  },
  {
    id: 'returning_horizon',
    displayName: 'Returning Horizon',
    baseWeapon: 'chakra_return',
    requiredPassive: 'runners_anklet',
    damageMult: 1.25,
    areaMult: 1.15,
    countBonus: 1,
    special: 'dual_orbit',
  },
  {
    id: 'earthwake',
    displayName: 'Earthwake',
    baseWeapon: 'gada_quake',
    requiredPassive: 'wide_sash',
    damageMult: 1.15,
    areaMult: 1.4,
    countBonus: 2,
    special: 'shock_rings',
  },
  {
    id: 'sevenfold_ember',
    displayName: 'Sevenfold Ember',
    baseWeapon: 'ember_kund',
    requiredPassive: 'oil_flask',
    damageMult: 1.3,
    areaMult: 1.2,
    countBonus: 2,
    special: 'migrating_zones',
  },
  {
    id: 'storm_lattice',
    displayName: 'Storm Lattice',
    baseWeapon: 'monsoon_spark',
    requiredPassive: 'moon_thread',
    damageMult: 1.25,
    areaMult: 1.3,
    countBonus: 2,
    special: 'reconnect_chains',
  },
] as const;

export const EVOLUTION_BY_ID: Readonly<Record<EvolutionId, EvolutionDef>> = Object.fromEntries(
  EVOLUTIONS.map((e) => [e.id, e]),
) as Readonly<Record<EvolutionId, EvolutionDef>>;

export const EVOLUTION_BY_WEAPON: Readonly<Partial<Record<WeaponId, EvolutionDef>>> =
  Object.fromEntries(EVOLUTIONS.map((e) => [e.baseWeapon, e])) as Partial<Record<WeaponId, EvolutionDef>>;
