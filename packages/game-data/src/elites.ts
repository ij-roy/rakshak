import type { EliteId } from './ids.js';

export interface EliteDef {
  readonly id: EliteId;
  readonly displayName: string;
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly contactDamage: number;
  readonly radius: number;
  readonly threatCost: number;
  readonly xp: number;
  readonly armor: number;
  readonly knockbackResist: number;
  readonly pattern: 'slam_armor' | 'decoy_summon' | 'link_pack' | 'triple_charge';
}

export const ELITES: readonly EliteDef[] = [
  {
    id: 'ironbound',
    displayName: 'Ironbound',
    maxHp: 420,
    moveSpeed: 38,
    contactDamage: 18,
    radius: 22,
    threatCost: 18,
    xp: 40,
    armor: 8,
    knockbackResist: 0.7,
    pattern: 'slam_armor',
  },
  {
    id: 'mistcaller',
    displayName: 'Mistcaller',
    maxHp: 300,
    moveSpeed: 48,
    contactDamage: 12,
    radius: 18,
    threatCost: 16,
    xp: 38,
    armor: 2,
    knockbackResist: 0.4,
    pattern: 'decoy_summon',
  },
  {
    id: 'packheart',
    displayName: 'Packheart',
    maxHp: 340,
    moveSpeed: 44,
    contactDamage: 14,
    radius: 20,
    threatCost: 17,
    xp: 42,
    armor: 3,
    knockbackResist: 0.5,
    pattern: 'link_pack',
  },
  {
    id: 'ashhorn',
    displayName: 'Ashhorn',
    maxHp: 380,
    moveSpeed: 70,
    contactDamage: 20,
    radius: 20,
    threatCost: 18,
    xp: 44,
    armor: 4,
    knockbackResist: 0.55,
    pattern: 'triple_charge',
  },
] as const;

export const ELITE_BY_ID: Readonly<Record<EliteId, EliteDef>> = Object.fromEntries(
  ELITES.map((e) => [e.id, e]),
) as Readonly<Record<EliteId, EliteDef>>;
