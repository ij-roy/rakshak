export { SaveFileV1Schema, SettingsV1Schema, type SaveFileV1, type SettingsV1 } from './schema.js';
export { canonicalizeSavePayload, computeSaveChecksum } from './checksum.js';
export { createDefaultSave } from './default-save.js';
export { validateSave, type ValidateSaveResult } from './validate.js';
export { migrateSave, SAVE_MIGRATIONS, withBumpedRevision } from './migrations.js';
export {
  atomicWriteProfile,
  commitProfile,
  type AtomicWriteResult,
  type SaveRepository,
  type SaveSlot,
} from './repository.js';
export {
  claimReward,
  EMPTY_HELD_REWARD,
  holdReward,
  PENDING_PROFILE_KEY,
  type HeldReward,
} from './reward-write.js';
export { markParts, marksForRun, recordRunCompletion, type RunCompletionFacts } from './run-result.js';
export { evaluateRun, rewardContextFromSave, settleRun } from './settle-run.js';
export { loadProfile, replaceProfile, type ProfileLoad } from './load-profile.js';
export { describeRunOutcome, type RunOutcomeSummary } from './run-outcome.js';
