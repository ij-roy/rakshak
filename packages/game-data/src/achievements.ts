import type { AchievementId, EvolutionId, GuardianId, MapId, WeaponId } from './ids.js';

export type AchievementPredicate =
  | { readonly kind: 'survive_seconds'; readonly seconds: number }
  | { readonly kind: 'clear_map'; readonly mapId: MapId }
  | { readonly kind: 'boss_low_hp'; readonly threshold: number }
  | { readonly kind: 'boss_no_damage'; readonly bossId: string }
  | { readonly kind: 'clear_no_revive' }
  | { readonly kind: 'discover_evolution'; readonly evolutionId: EvolutionId }
  | { readonly kind: 'full_slots' }
  | { readonly kind: 'single_weapon_minute'; readonly minute: number }
  | { readonly kind: 'kills_in_run'; readonly count: number }
  | { readonly kind: 'level_before_minute'; readonly level: number; readonly minute: number }
  | { readonly kind: 'all_guardians' }
  | { readonly kind: 'oaths_cleared'; readonly count: number }
  | { readonly kind: 'discover_all_enemies' }
  | { readonly kind: 'all_weapons_level8' }
  | { readonly kind: 'all_maps_and_evolutions' };

export interface AchievementDef {
  readonly id: AchievementId;
  readonly displayName: string;
  readonly description: string;
  readonly predicate: AchievementPredicate;
  readonly guardianMarks: number;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  { id: 'first_watch', displayName: 'First Watch', description: 'Survive 3 minutes.', predicate: { kind: 'survive_seconds', seconds: 180 }, guardianMarks: 15 },
  { id: 'dawn_held', displayName: 'Dawn Held', description: 'Clear Gaon.', predicate: { kind: 'clear_map', mapId: 'gaon' }, guardianMarks: 40 },
  { id: 'green_silence', displayName: 'Green Silence', description: 'Clear Van.', predicate: { kind: 'clear_map', mapId: 'van' }, guardianMarks: 45 },
  { id: 'across_glasswind', displayName: 'Across Glasswind', description: 'Clear Marusthal.', predicate: { kind: 'clear_map', mapId: 'marusthal' }, guardianMarks: 50 },
  { id: 'rampart_restored', displayName: 'Rampart Restored', description: 'Clear Durg.', predicate: { kind: 'clear_map', mapId: 'durg' }, guardianMarks: 60 },
  { id: 'close_call', displayName: 'Close Call', description: 'Clear a boss below 10% health.', predicate: { kind: 'boss_low_hp', threshold: 0.1 }, guardianMarks: 25 },
  { id: 'untouched_bell', displayName: 'Untouched Bell', description: 'Defeat Bell-Warden without damage.', predicate: { kind: 'boss_no_damage', bossId: 'bell_warden' }, guardianMarks: 50 },
  { id: 'no_second_breath', displayName: 'No Second Breath', description: 'Clear a map without revive.', predicate: { kind: 'clear_no_revive' }, guardianMarks: 30 },
  { id: 'crescent_found', displayName: 'Crescent Found', description: 'Discover Crescent Guard.', predicate: { kind: 'discover_evolution', evolutionId: 'crescent_guard' }, guardianMarks: 20 },
  { id: 'monsoon_found', displayName: 'Monsoon Found', description: 'Discover Monsoon Volley.', predicate: { kind: 'discover_evolution', evolutionId: 'monsoon_volley' }, guardianMarks: 20 },
  { id: 'horizon_found', displayName: 'Horizon Found', description: 'Discover Returning Horizon.', predicate: { kind: 'discover_evolution', evolutionId: 'returning_horizon' }, guardianMarks: 20 },
  { id: 'earthwake_found', displayName: 'Earthwake Found', description: 'Discover Earthwake.', predicate: { kind: 'discover_evolution', evolutionId: 'earthwake' }, guardianMarks: 20 },
  { id: 'ember_found', displayName: 'Ember Found', description: 'Discover Sevenfold Ember.', predicate: { kind: 'discover_evolution', evolutionId: 'sevenfold_ember' }, guardianMarks: 20 },
  { id: 'lattice_found', displayName: 'Lattice Found', description: 'Discover Storm Lattice.', predicate: { kind: 'discover_evolution', evolutionId: 'storm_lattice' }, guardianMarks: 20 },
  { id: 'full_satchel', displayName: 'Full Satchel', description: 'Fill all weapon and passive slots.', predicate: { kind: 'full_slots' }, guardianMarks: 25 },
  { id: 'single_purpose', displayName: 'Single Purpose', description: 'Reach minute 8 with only one weapon.', predicate: { kind: 'single_weapon_minute', minute: 8 }, guardianMarks: 30 },
  { id: 'crowdkeeper', displayName: 'Crowdkeeper', description: 'Defeat 1,000 enemies in one run.', predicate: { kind: 'kills_in_run', count: 1000 }, guardianMarks: 35 },
  { id: 'swift_watch', displayName: 'Swift Watch', description: 'Reach level 20 before minute 6.', predicate: { kind: 'level_before_minute', level: 20, minute: 6 }, guardianMarks: 35 },
  { id: 'every_path', displayName: 'Every Path', description: 'Complete one run with each guardian.', predicate: { kind: 'all_guardians' }, guardianMarks: 50 },
  { id: 'oathbound_i', displayName: 'Oathbound I', description: 'Clear with one Night Oath.', predicate: { kind: 'oaths_cleared', count: 1 }, guardianMarks: 20 },
  { id: 'oathbound_iii', displayName: 'Oathbound III', description: 'Clear with three Night Oaths.', predicate: { kind: 'oaths_cleared', count: 3 }, guardianMarks: 45 },
  { id: 'field_notes', displayName: 'Field Notes', description: 'Discover all normal enemies.', predicate: { kind: 'discover_all_enemies' }, guardianMarks: 40 },
  { id: 'master_of_arms', displayName: 'Master of Arms', description: 'Reach level 8 with every weapon across runs.', predicate: { kind: 'all_weapons_level8' }, guardianMarks: 55 },
  { id: 'rakshak', displayName: 'Rakshak', description: 'Complete all four maps and discover all six evolutions.', predicate: { kind: 'all_maps_and_evolutions' }, guardianMarks: 100 },
] as const;

export const ACHIEVEMENT_BY_ID: Readonly<Record<AchievementId, AchievementDef>> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a]),
) as Readonly<Record<AchievementId, AchievementDef>>;

/** Type anchors for unlock consumers. */
export type UnlockTargetGuardian = GuardianId;
export type UnlockTargetWeapon = WeaponId;
