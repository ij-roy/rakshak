import type { GuardianId, MapId, RewardContext } from '@rakshak/game-data';
import { GameRuntime } from './runtime.js';

/** Thin factory matching the scaffold shell API. */
export function createGame(
  seed: number,
  options: { guardianId: string; mapId: string; rewardContext?: RewardContext },
): GameRuntime {
  return new GameRuntime({
    seed,
    guardianId: options.guardianId as GuardianId,
    mapId: options.mapId as MapId,
    rewardContext: options.rewardContext,
  });
}
