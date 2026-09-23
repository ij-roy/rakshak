import type { GuardianId, WeaponId } from './ids.js';

export interface GuardianDef {
  readonly id: GuardianId;
  readonly displayName: string;
  readonly epithet: string;
  readonly startWeapon: WeaponId;
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly armorPct: number;
  readonly pickupRadius: number;
  readonly cooldownMult: number;
  readonly areaMult: number;
  readonly traitId: string;
  readonly unlockDefault: boolean;
}

export const GUARDIANS: readonly GuardianDef[] = [
  {
    id: 'asha',
    displayName: 'Asha',
    epithet: 'The Watchkeeper',
    startWeapon: 'talwar_arc',
    maxHp: 100,
    moveSpeed: 110,
    armorPct: 0.1,
    pickupRadius: 48,
    cooldownMult: 1,
    areaMult: 1,
    traitId: 'asha_sixth_hit',
    unlockDefault: true,
  },
  {
    id: 'veer',
    displayName: 'Veer',
    epithet: 'The Pathstrider',
    startWeapon: 'dhanush_volley',
    maxHp: 85,
    moveSpeed: 121,
    armorPct: -0.05,
    pickupRadius: 48,
    cooldownMult: 1,
    areaMult: 1,
    traitId: 'veer_distance_damage',
    unlockDefault: false,
  },
  {
    id: 'tara',
    displayName: 'Tara',
    epithet: 'The Emberwright',
    startWeapon: 'ember_kund',
    maxHp: 90,
    moveSpeed: 110,
    armorPct: 0,
    pickupRadius: 48,
    cooldownMult: 1.1,
    areaMult: 1.15,
    traitId: 'tara_status_duration',
    unlockDefault: false,
  },
  {
    id: 'nila',
    displayName: 'Nila',
    epithet: 'The Shadow Scout',
    startWeapon: 'chakra_return',
    maxHp: 80,
    moveSpeed: 121,
    armorPct: 0,
    pickupRadius: 55,
    cooldownMult: 1,
    areaMult: 1,
    traitId: 'nila_luck_pulse',
    unlockDefault: false,
  },
] as const;

export const GUARDIAN_BY_ID: Readonly<Record<GuardianId, GuardianDef>> = Object.fromEntries(
  GUARDIANS.map((g) => [g.id, g]),
) as Readonly<Record<GuardianId, GuardianDef>>;
