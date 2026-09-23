import type { SaveFileV1 } from './schema.js';

export const PENDING_PROFILE_KEY = 'rakshak.run.pending';

export interface HeldReward {
  pending: SaveFileV1 | null;
  claimed: boolean;
}

export const EMPTY_HELD_REWARD: HeldReward = { pending: null, claimed: false };

/** Keep the first settled profile. A later call must not settle the reward again. */
export function holdReward(held: HeldReward, settled: SaveFileV1): HeldReward {
  if (held.claimed || held.pending) return held;
  return { pending: settled, claimed: false };
}

/** Claim only after the write succeeds. Failure leaves the same profile ready to retry. */
export function claimReward(held: HeldReward, ok: boolean): HeldReward {
  if (!held.pending || held.claimed || !ok) return held;
  return { pending: held.pending, claimed: true };
}
