import type { BossId, MapId } from './ids.js';

export interface BossPhase {
  readonly hpThreshold: number;
  readonly pattern: string;
  readonly addIntervalTicks: number;
}

export interface BossDef {
  readonly id: BossId;
  readonly displayName: string;
  readonly epithet: string;
  readonly mapId: MapId;
  readonly maxHp: number;
  readonly moveSpeed: number;
  readonly contactDamage: number;
  readonly radius: number;
  readonly xp: number;
  readonly armor: number;
  readonly knockbackResist: number;
  readonly phases: readonly BossPhase[];
}

export const BOSSES: readonly BossDef[] = [
  {
    id: 'bell_warden',
    displayName: 'The Bell-Warden',
    epithet: 'Watch Construct',
    mapId: 'gaon',
    maxHp: 2400,
    moveSpeed: 34,
    contactDamage: 22,
    radius: 36,
    xp: 120,
    armor: 6,
    knockbackResist: 0.85,
    phases: [
      { hpThreshold: 1, pattern: 'sound_rings', addIntervalTicks: 180 },
      { hpThreshold: 0.55, pattern: 'wisp_summon', addIntervalTicks: 120 },
      { hpThreshold: 0.25, pattern: 'ring_storm', addIntervalTicks: 90 },
    ],
  },
  {
    id: 'canopy_maw',
    displayName: 'The Canopy Maw',
    epithet: 'Plant-Shadow Mass',
    mapId: 'van',
    maxHp: 2800,
    moveSpeed: 30,
    contactDamage: 24,
    radius: 40,
    xp: 140,
    armor: 5,
    knockbackResist: 0.9,
    phases: [
      { hpThreshold: 1, pattern: 'sweep', addIntervalTicks: 160 },
      { hpThreshold: 0.6, pattern: 'seed_burst', addIntervalTicks: 110 },
      { hpThreshold: 0.3, pattern: 'burrow', addIntervalTicks: 80 },
    ],
  },
  {
    id: 'glassback',
    displayName: 'The Glassback',
    epithet: 'Sand-Armored Beast',
    mapId: 'marusthal',
    maxHp: 3000,
    moveSpeed: 40,
    contactDamage: 26,
    radius: 38,
    xp: 150,
    armor: 8,
    knockbackResist: 0.88,
    phases: [
      { hpThreshold: 1, pattern: 'plate_shed', addIntervalTicks: 150 },
      { hpThreshold: 0.5, pattern: 'reflect_charge', addIntervalTicks: 100 },
      { hpThreshold: 0.2, pattern: 'glass_storm', addIntervalTicks: 70 },
    ],
  },
  {
    id: 'night_standard',
    displayName: 'The Night Standard',
    epithet: 'Siege-Banner Construct',
    mapId: 'durg',
    maxHp: 3400,
    moveSpeed: 28,
    contactDamage: 28,
    radius: 42,
    xp: 180,
    armor: 7,
    knockbackResist: 0.92,
    phases: [
      { hpThreshold: 1, pattern: 'lane_control', addIntervalTicks: 140 },
      { hpThreshold: 0.55, pattern: 'add_wave', addIntervalTicks: 95 },
      { hpThreshold: 0.25, pattern: 'banner_siege', addIntervalTicks: 65 },
    ],
  },
] as const;

export const BOSS_BY_ID: Readonly<Record<BossId, BossDef>> = Object.fromEntries(
  BOSSES.map((b) => [b.id, b]),
) as Readonly<Record<BossId, BossDef>>;

export const BOSS_BY_MAP: Readonly<Record<MapId, BossDef>> = Object.fromEntries(
  BOSSES.map((b) => [b.mapId, b]),
) as Readonly<Record<MapId, BossDef>>;
