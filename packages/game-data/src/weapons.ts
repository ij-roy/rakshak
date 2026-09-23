import type { WeaponId } from './ids.js';

export type WeaponBehavior =
  | 'talwar_arc'
  | 'dhanush_volley'
  | 'chakra_return'
  | 'gada_quake'
  | 'ember_kund'
  | 'monsoon_spark'
  | 'spear_burst'
  | 'neel_trail';

export interface WeaponLevelStats {
  readonly damage: number;
  readonly cooldownTicks: number;
  readonly count: number;
  readonly area: number;
  readonly speed: number;
  readonly pierce: number;
  readonly durationTicks: number;
}

export interface WeaponDef {
  readonly id: WeaponId;
  readonly displayName: string;
  readonly behavior: WeaponBehavior;
  readonly maxLevel: 8;
  readonly levels: readonly WeaponLevelStats[];
  readonly hasEvolution: boolean;
}

function levels(
  base: WeaponLevelStats,
  growth: Partial<WeaponLevelStats>,
): readonly WeaponLevelStats[] {
  const out: WeaponLevelStats[] = [];
  for (let i = 0; i < 8; i++) {
    out.push({
      damage: base.damage * (1 + (growth.damage ?? 0.12) * i),
      cooldownTicks: Math.max(
        8,
        Math.round(base.cooldownTicks * (1 - (growth.cooldownTicks ?? 0.04) * i)),
      ),
      count: base.count + Math.floor(((growth.count ?? 0) * i) / 2),
      area: base.area * (1 + (growth.area ?? 0.06) * i),
      speed: base.speed * (1 + (growth.speed ?? 0.05) * i),
      pierce: base.pierce + Math.floor(((growth.pierce ?? 0) * i) / 3),
      durationTicks: Math.round(base.durationTicks * (1 + (growth.durationTicks ?? 0.08) * i)),
    });
  }
  return out;
}

export const WEAPONS: readonly WeaponDef[] = [
  {
    id: 'talwar_arc',
    displayName: 'Talwar Arc',
    behavior: 'talwar_arc',
    maxLevel: 8,
    hasEvolution: true,
    levels: levels(
      { damage: 18, cooldownTicks: 28, count: 1, area: 56, speed: 0, pierce: 99, durationTicks: 6 },
      { damage: 0.14, area: 0.07 },
    ),
  },
  {
    id: 'dhanush_volley',
    displayName: 'Dhanush Volley',
    behavior: 'dhanush_volley',
    maxLevel: 8,
    hasEvolution: true,
    levels: levels(
      { damage: 12, cooldownTicks: 22, count: 1, area: 8, speed: 280, pierce: 1, durationTicks: 45 },
      { damage: 0.12, count: 1, pierce: 1 },
    ),
  },
  {
    id: 'chakra_return',
    displayName: 'Chakra Return',
    behavior: 'chakra_return',
    maxLevel: 8,
    hasEvolution: true,
    levels: levels(
      { damage: 14, cooldownTicks: 36, count: 1, area: 14, speed: 220, pierce: 99, durationTicks: 40 },
      { damage: 0.13, count: 0.5, area: 0.05 },
    ),
  },
  {
    id: 'gada_quake',
    displayName: 'Gada Quake',
    behavior: 'gada_quake',
    maxLevel: 8,
    hasEvolution: true,
    levels: levels(
      { damage: 28, cooldownTicks: 48, count: 1, area: 72, speed: 0, pierce: 99, durationTicks: 8 },
      { damage: 0.15, area: 0.08 },
    ),
  },
  {
    id: 'ember_kund',
    displayName: 'Ember Basin',
    behavior: 'ember_kund',
    maxLevel: 8,
    hasEvolution: true,
    levels: levels(
      { damage: 8, cooldownTicks: 40, count: 1, area: 42, speed: 0, pierce: 99, durationTicks: 60 },
      { damage: 0.12, count: 0.5, durationTicks: 0.1 },
    ),
  },
  {
    id: 'monsoon_spark',
    displayName: 'Monsoon Spark',
    behavior: 'monsoon_spark',
    maxLevel: 8,
    hasEvolution: true,
    levels: levels(
      { damage: 16, cooldownTicks: 32, count: 3, area: 120, speed: 0, pierce: 0, durationTicks: 4 },
      { damage: 0.11, count: 0.5 },
    ),
  },
  {
    id: 'spear_burst',
    displayName: 'Spear Burst',
    behavior: 'spear_burst',
    maxLevel: 8,
    hasEvolution: false,
    levels: levels(
      { damage: 22, cooldownTicks: 34, count: 4, area: 10, speed: 320, pierce: 2, durationTicks: 20 },
      { damage: 0.13, count: 0.5, pierce: 0.5 },
    ),
  },
  {
    id: 'neel_trail',
    displayName: 'Neel Trail',
    behavior: 'neel_trail',
    maxLevel: 8,
    hasEvolution: false,
    levels: levels(
      { damage: 6, cooldownTicks: 6, count: 1, area: 22, speed: 0, pierce: 99, durationTicks: 45 },
      { damage: 0.1, area: 0.08, durationTicks: 0.08 },
    ),
  },
] as const;

export const WEAPON_BY_ID: Readonly<Record<WeaponId, WeaponDef>> = Object.fromEntries(
  WEAPONS.map((w) => [w.id, w]),
) as Readonly<Record<WeaponId, WeaponDef>>;
