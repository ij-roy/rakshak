import type { EnemyId } from './ids.js';

export type EnemyRole =
  | 'pursuer'
  | 'runner'
  | 'armored'
  | 'ranged'
  | 'burrower'
  | 'leaper'
  | 'buffer'
  | 'slow_field'
  | 'shielded'
  | 'swarm'
  | 'path_mirror'
  | 'death_patch'
  | 'charger'
  | 'sentry'
  | 'aura'
  | 'bruiser';

export interface EnemyDef {
  readonly id: EnemyId;
  readonly displayName: string;
  readonly role: EnemyRole;
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly contactDamage: number;
  readonly radius: number;
  readonly threatCost: number;
  readonly xp: number;
  readonly armor: number;
  readonly knockbackResist: number;
}

export const ENEMIES: readonly EnemyDef[] = [
  { id: 'chhaya_drifter', displayName: 'Drifter', role: 'pursuer', maxHp: 28, moveSpeed: 42, contactDamage: 8, radius: 12, threatCost: 1, xp: 3, armor: 0, knockbackResist: 0 },
  { id: 'chhaya_runner', displayName: 'Runner', role: 'runner', maxHp: 16, moveSpeed: 90, contactDamage: 6, radius: 10, threatCost: 1.2, xp: 3, armor: 0, knockbackResist: 0 },
  { id: 'husk_guard', displayName: 'Husk Guard', role: 'armored', maxHp: 55, moveSpeed: 32, contactDamage: 12, radius: 14, threatCost: 2.2, xp: 6, armor: 4, knockbackResist: 0.4 },
  { id: 'thorn_spitter', displayName: 'Thorn Spitter', role: 'ranged', maxHp: 22, moveSpeed: 28, contactDamage: 5, radius: 11, threatCost: 1.8, xp: 5, armor: 0, knockbackResist: 0.1 },
  { id: 'burrow_mite', displayName: 'Burrow Mite', role: 'burrower', maxHp: 20, moveSpeed: 50, contactDamage: 7, radius: 9, threatCost: 1.5, xp: 4, armor: 0, knockbackResist: 0 },
  { id: 'dust_leaper', displayName: 'Dust Leaper', role: 'leaper', maxHp: 24, moveSpeed: 70, contactDamage: 10, radius: 11, threatCost: 1.7, xp: 5, armor: 0, knockbackResist: 0.1 },
  { id: 'lantern_wisp', displayName: 'Lantern Wisp', role: 'buffer', maxHp: 18, moveSpeed: 55, contactDamage: 4, radius: 10, threatCost: 2, xp: 6, armor: 0, knockbackResist: 0 },
  { id: 'root_binder', displayName: 'Root Binder', role: 'slow_field', maxHp: 30, moveSpeed: 26, contactDamage: 6, radius: 12, threatCost: 1.9, xp: 5, armor: 1, knockbackResist: 0.2 },
  { id: 'shield_shell', displayName: 'Shield Shell', role: 'shielded', maxHp: 40, moveSpeed: 30, contactDamage: 9, radius: 13, threatCost: 2.1, xp: 6, armor: 3, knockbackResist: 0.5 },
  { id: 'swarm_fragment', displayName: 'Swarm Fragment', role: 'swarm', maxHp: 8, moveSpeed: 75, contactDamage: 3, radius: 7, threatCost: 0.45, xp: 1, armor: 0, knockbackResist: 0 },
  { id: 'echo_stalker', displayName: 'Echo Stalker', role: 'path_mirror', maxHp: 26, moveSpeed: 60, contactDamage: 8, radius: 11, threatCost: 1.8, xp: 5, armor: 0, knockbackResist: 0.1 },
  { id: 'ember_husk', displayName: 'Ember Husk', role: 'death_patch', maxHp: 32, moveSpeed: 38, contactDamage: 9, radius: 12, threatCost: 1.9, xp: 5, armor: 1, knockbackResist: 0.15 },
  { id: 'sand_roller', displayName: 'Sand Roller', role: 'charger', maxHp: 34, moveSpeed: 100, contactDamage: 14, radius: 13, threatCost: 2.3, xp: 7, armor: 2, knockbackResist: 0.35 },
  { id: 'fort_sentry', displayName: 'Fort Sentry', role: 'sentry', maxHp: 36, moveSpeed: 0, contactDamage: 4, radius: 12, threatCost: 2, xp: 6, armor: 2, knockbackResist: 0.8 },
  { id: 'banner_husk', displayName: 'Banner Husk', role: 'aura', maxHp: 42, moveSpeed: 28, contactDamage: 7, radius: 13, threatCost: 2.4, xp: 8, armor: 2, knockbackResist: 0.3 },
  { id: 'night_maw', displayName: 'Night Maw', role: 'bruiser', maxHp: 90, moveSpeed: 36, contactDamage: 16, radius: 18, threatCost: 4, xp: 14, armor: 3, knockbackResist: 0.55 },
] as const;

export const ENEMY_BY_ID: Readonly<Record<EnemyId, EnemyDef>> = Object.fromEntries(
  ENEMIES.map((e) => [e.id, e]),
) as Readonly<Record<EnemyId, EnemyDef>>;
