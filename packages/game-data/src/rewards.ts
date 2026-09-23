import type { AchievementId, MapId } from './ids.js';
import { grantsForRun, type RunReport } from './progress.js';

export interface RewardContext {
  readonly completedAchievements: readonly AchievementId[];
  readonly priorMapClears: readonly MapId[];
  readonly priorWeaponLevel8Mask: number;
  readonly priorGuardianClearMask: number;
  readonly priorEvolutionCount: number;
}

export const EMPTY_REWARD_CONTEXT: RewardContext = {
  completedAchievements: [],
  priorMapClears: [],
  priorWeaponLevel8Mask: 0,
  priorGuardianClearMask: 0,
  priorEvolutionCount: 0,
};

export interface MarkParts {
  readonly time: number;
  readonly kills: number;
  readonly victory: number;
  readonly total: number;
}

/** Time, kills, and the dawn bonus. Achievement marks are added by rewardForRun. */
export function baseMarkParts(facts: {
  survivalSeconds: number;
  kills: number;
  won: boolean;
}): MarkParts {
  const time = Math.floor(facts.survivalSeconds / 30);
  const kills = Math.floor(facts.kills / 20);
  const victory = facts.won ? 40 : 0;
  return { time, kills, victory, total: time + kills + victory };
}

/** The only run-reward total. Persistence and the simulation both store this number. */
export function rewardForRun(report: RunReport, alreadyComplete: ReadonlySet<AchievementId>) {
  const grant = grantsForRun(report, alreadyComplete);
  const parts = baseMarkParts(report);
  return {
    grant,
    parts,
    total: parts.total + grant.achievementMarks,
  };
}
