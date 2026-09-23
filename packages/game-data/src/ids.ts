export const GUARDIAN_IDS = ['asha', 'veer', 'tara', 'nila'] as const;
export type GuardianId = (typeof GUARDIAN_IDS)[number];

export const WEAPON_IDS = [
  'talwar_arc',
  'dhanush_volley',
  'chakra_return',
  'gada_quake',
  'ember_kund',
  'monsoon_spark',
  'spear_burst',
  'neel_trail',
] as const;
export type WeaponId = (typeof WEAPON_IDS)[number];

export const PASSIVE_IDS = [
  'whetstone',
  'runners_anklet',
  'guard_plate',
  'oil_flask',
  'hunters_cord',
  'wide_sash',
  'copper_bell',
  'moon_thread',
] as const;
export type PassiveId = (typeof PASSIVE_IDS)[number];

export const EVOLUTION_IDS = [
  'crescent_guard',
  'monsoon_volley',
  'returning_horizon',
  'earthwake',
  'sevenfold_ember',
  'storm_lattice',
] as const;
export type EvolutionId = (typeof EVOLUTION_IDS)[number];

export const ENEMY_IDS = [
  'chhaya_drifter',
  'chhaya_runner',
  'husk_guard',
  'thorn_spitter',
  'burrow_mite',
  'dust_leaper',
  'lantern_wisp',
  'root_binder',
  'shield_shell',
  'swarm_fragment',
  'echo_stalker',
  'ember_husk',
  'sand_roller',
  'fort_sentry',
  'banner_husk',
  'night_maw',
] as const;
export type EnemyId = (typeof ENEMY_IDS)[number];

export const ELITE_IDS = ['ironbound', 'mistcaller', 'packheart', 'ashhorn'] as const;
export type EliteId = (typeof ELITE_IDS)[number];

export const MAP_IDS = ['gaon', 'van', 'marusthal', 'durg'] as const;
export type MapId = (typeof MAP_IDS)[number];

export const BOSS_IDS = [
  'bell_warden',
  'canopy_maw',
  'glassback',
  'night_standard',
] as const;
export type BossId = (typeof BOSS_IDS)[number];

export const ACHIEVEMENT_IDS = [
  'first_watch',
  'dawn_held',
  'green_silence',
  'across_glasswind',
  'rampart_restored',
  'close_call',
  'untouched_bell',
  'no_second_breath',
  'crescent_found',
  'monsoon_found',
  'horizon_found',
  'earthwake_found',
  'ember_found',
  'lattice_found',
  'full_satchel',
  'single_purpose',
  'crowdkeeper',
  'swift_watch',
  'every_path',
  'oathbound_i',
  'oathbound_iii',
  'field_notes',
  'master_of_arms',
  'rakshak',
] as const;
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

export const META_TRACK_IDS = [
  'vitality',
  'guard',
  'footwork',
  'force',
  'focus',
  'fortune',
] as const;
export type MetaTrackId = (typeof META_TRACK_IDS)[number];

export const CURRENCY_ID = 'guardian_marks' as const;
