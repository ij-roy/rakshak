import { EMPTY_INPUT } from '@rakshak/game-protocol';
import { EMPTY_REWARD_CONTEXT, rewardForRun } from '@rakshak/game-data';
import { describe, expect, it } from 'vitest';
import { buildRunReport } from '../report.js';
import { GameRuntime } from '../runtime.js';

describe('run reward', () => {
  it('stores the same total the results screen and save use', () => {
    const rewardContext = {
      ...EMPTY_REWARD_CONTEXT,
      completedAchievements: ['first_watch' as const],
    };
    const runtime = new GameRuntime({
      seed: 1,
      guardianId: 'asha',
      mapId: 'gaon',
      rewardContext,
    });
    runtime.world.director.spawnFreeze = true;
    runtime.world.player.hp = 0;
    runtime.world.tick = 200 * 30 - 1;
    runtime.world.run.kills = 40;
    runtime.step(EMPTY_INPUT);

    const report = {
      ...buildRunReport(runtime.world),
      priorMapClears: rewardContext.priorMapClears,
      priorWeaponLevel8Mask: rewardContext.priorWeaponLevel8Mask,
      priorGuardianClearMask: rewardContext.priorGuardianClearMask,
      priorEvolutionCount: rewardContext.priorEvolutionCount,
    };
    const expected = rewardForRun(report, new Set(rewardContext.completedAchievements)).total;
    expect(runtime.world.run.outcome).toBe('defeat');
    expect(runtime.world.run.guardianMarksEarned).toBe(expected);
    expect(runtime.world.run.guardianMarksEarned).toBe(8);
    expect(runtime.world.run.guardianMarksEarned).not.toBe(Math.floor(200 / 30) * 5);
  });
});