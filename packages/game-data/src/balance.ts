import { SIM_HZ } from '@rakshak/shared';

/** Threat budget spent by the wave director each second at time t. */
export function budgetPerSecond(tSeconds: number): number {
  return 2.2 + 0.018 * tSeconds + 0.000035 * tSeconds * tSeconds;
}

export function enemyHealthMultiplier(tSeconds: number): number {
  return Math.min(1.85, 1 + 0.0012 * tSeconds);
}

export function enemyDamageMultiplier(tSeconds: number): number {
  return Math.min(1.45, 1 + 0.00065 * tSeconds);
}

/** XP required to go from `level` to `level + 1`. Level is 1-based. */
export function xpToNextLevel(level: number): number {
  return Math.floor(12 + level * 8 + level * level * 1.35);
}

export const BALANCE = {
  simHz: SIM_HZ,
  maxWeaponSlots: 6,
  maxPassiveSlots: 6,
  contactIFramesTicks: 18,
  playerBasePickupRadius: 48,
  xpMagnetSpeed: 220,
  bossTimesSeconds: [240, 480, 720] as const,
  lieutenantHpScale: [0.45, 0.7] as const,
  eliteSpawnMinutes: [3, 6, 9, 10.5] as const,
  maxEnemies: 300,
  maxProjectiles: 250,
  maxPickups: 600,
  maxParticles: 800,
  maxDamageLabels: 40,
  spatialCellSize: 64,
  worldPadding: 40,
  defaultRerolls: 1,
  badLuckProtectionStreak: 3,
  cooldownReductionCap: 0.35,
  armorFlatCap: 8,
  levelOfferCount: 3,
  metaPowerCeiling: 0.25,
} as const;

const OBJECTIVE_LABEL = ['Lieutenant at 4:00', 'Lieutenant at 8:00', 'Final boss at 12:00'] as const;

/** Next timed threat, or the boss already on the field. */
export function nextWatchObjective(survivalSeconds: number, bossActive: boolean): string {
  if (bossActive) return 'Boss on the field';
  for (let i = 0; i < BALANCE.bossTimesSeconds.length; i++) {
    const at = BALANCE.bossTimesSeconds[i];
    const label = OBJECTIVE_LABEL[i];
    if (at != null && label && survivalSeconds < at) return label;
  }
  return 'Hold the field';
}

export function isLowHealth(hp: number, maxHp: number): boolean {
  return maxHp > 0 && hp / maxHp <= 0.3;
}
