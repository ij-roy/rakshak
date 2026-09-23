import type { BossId, EliteId, EnemyId, MapId } from './ids.js';

export interface MapDef {
  readonly id: MapId;
  readonly displayName: string;
  readonly subtitle: string;
  readonly width: number;
  readonly height: number;
  readonly bossId: BossId;
  readonly enemyPool: readonly EnemyId[];
  readonly elitePool: readonly EliteId[];
  readonly hazard: 'low_walls' | 'root_slow' | 'wind_lanes' | 'gate_lanes';
  readonly unlockDefault: boolean;
  readonly unlockAfter?: MapId;
}

export const MAPS: readonly MapDef[] = [
  {
    id: 'gaon',
    displayName: 'Gaon',
    subtitle: 'Moonlit Outskirts',
    width: 2200,
    height: 1600,
    bossId: 'bell_warden',
    enemyPool: [
      'chhaya_drifter',
      'chhaya_runner',
      'husk_guard',
      'thorn_spitter',
      'lantern_wisp',
      'swarm_fragment',
      'burrow_mite',
      'banner_husk',
    ],
    elitePool: ['ironbound', 'mistcaller'],
    hazard: 'low_walls',
    unlockDefault: true,
  },
  {
    id: 'van',
    displayName: 'Van',
    subtitle: 'Whispering Canopy',
    width: 2400,
    height: 1800,
    bossId: 'canopy_maw',
    enemyPool: [
      'chhaya_drifter',
      'root_binder',
      'dust_leaper',
      'burrow_mite',
      'echo_stalker',
      'ember_husk',
      'swarm_fragment',
      'night_maw',
    ],
    elitePool: ['packheart', 'mistcaller'],
    hazard: 'root_slow',
    unlockDefault: false,
    unlockAfter: 'gaon',
  },
  {
    id: 'marusthal',
    displayName: 'Marusthal',
    subtitle: 'Glasswind Expanse',
    width: 2600,
    height: 1800,
    bossId: 'glassback',
    enemyPool: [
      'sand_roller',
      'chhaya_runner',
      'shield_shell',
      'dust_leaper',
      'ember_husk',
      'thorn_spitter',
      'husk_guard',
      'night_maw',
    ],
    elitePool: ['ashhorn', 'ironbound'],
    hazard: 'wind_lanes',
    unlockDefault: false,
    unlockAfter: 'van',
  },
  {
    id: 'durg',
    displayName: 'Durg',
    subtitle: 'Last Rampart',
    width: 2400,
    height: 2000,
    bossId: 'night_standard',
    enemyPool: [
      'fort_sentry',
      'banner_husk',
      'husk_guard',
      'shield_shell',
      'echo_stalker',
      'thorn_spitter',
      'chhaya_drifter',
      'night_maw',
    ],
    elitePool: ['ashhorn', 'packheart'],
    hazard: 'gate_lanes',
    unlockDefault: false,
    unlockAfter: 'marusthal',
  },
] as const;

export const MAP_BY_ID: Readonly<Record<MapId, MapDef>> = Object.fromEntries(
  MAPS.map((m) => [m.id, m]),
) as Readonly<Record<MapId, MapDef>>;
