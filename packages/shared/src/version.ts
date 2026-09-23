/** Canonical product versions — single source of truth for apps and saves. */
export const GAME_VERSION = '1.0.0' as const;
export const CONTENT_VERSION = '1.0.0' as const;
export const SCHEMA_VERSION = 1 as const;
/** Android Play versionCode for GAME_VERSION 1.0.0 first upload. */
export const ANDROID_VERSION_CODE = 1 as const;
export const APPLICATION_ID = 'roy.ij.rakshak' as const;
export const PRODUCT_NAME = 'RAKSHAK' as const;
export const TAGLINE = 'Survive the Night' as const;

/** Simulation tick rate (Hz). Rules use integer ticks only. */
export const SIM_HZ = 30 as const;
export const TICK_MS = 1000 / SIM_HZ;
export const RUN_DURATION_SECONDS = 12 * 60;
export const RUN_DURATION_TICKS = RUN_DURATION_SECONDS * SIM_HZ;

export const BOSS_TIMES_SECONDS = [4 * 60, 8 * 60, 12 * 60] as const;
