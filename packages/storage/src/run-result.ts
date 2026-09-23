import { baseMarkParts } from '@rakshak/game-data';
import { computeSaveChecksum } from './checksum.js';
import { withBumpedRevision } from './migrations.js';
import type { SaveFileV1 } from './schema.js';

export interface RunCompletionFacts {
  readonly survivalSeconds: number;
  readonly level: number;
  readonly kills: number;
  readonly won: boolean;
}

/** The three parts of a run's base marks. Achievement marks are added by rewardForRun. */
export function markParts(facts: RunCompletionFacts) {
  return baseMarkParts(facts);
}

/** Marks granted for a finished run before achievement bonuses. */
export function marksForRun(facts: RunCompletionFacts): number {
  return baseMarkParts(facts).total;
}

/**
 * Apply end-of-run statistics and currency. Achievement/unlock evaluation is layered on later.
 * Always returns a checksum-valid save.
 */
export function recordRunCompletion(save: SaveFileV1, facts: RunCompletionFacts): SaveFileV1 {
  const marks = marksForRun(facts);
  const bumped = withBumpedRevision({
    ...save,
    updatedAt: new Date().toISOString(),
    meta: {
      ...save.meta,
      currency: save.meta.currency + marks,
      lifetimeEarned: save.meta.lifetimeEarned + marks,
    },
    statistics: {
      ...save.statistics,
      runsCompleted: save.statistics.runsCompleted + 1,
      runsWon: save.statistics.runsWon + (facts.won ? 1 : 0),
      defeats: save.statistics.defeats + (facts.won ? 0 : 1),
      totalSurvivalSeconds: save.statistics.totalSurvivalSeconds + facts.survivalSeconds,
      totalKills: save.statistics.totalKills + facts.kills,
      highestLevel: Math.max(save.statistics.highestLevel, facts.level),
      longestSurvivalSeconds: Math.max(save.statistics.longestSurvivalSeconds, facts.survivalSeconds),
    },
  });
  return { ...bumped, checksum: computeSaveChecksum(bumped) };
}
