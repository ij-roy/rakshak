import type { SaveFileV1 } from './schema.js';

export type SaveSlot =
  | 'profile.primary'
  | 'profile.backup'
  | 'profile.candidate'
  | 'run.checkpoint'
  | 'settings.bootstrap'
  | 'diagnostics.local';

/**
 * Platform adapters implement this port.
 * Atomic write protocol:
 * 1) write candidate → 2) validate/read back → 3) rotate primary→backup → 4) promote candidate.
 */
export interface SaveRepository {
  read(slot: SaveSlot): Promise<string | null>;
  write(slot: SaveSlot, payload: string): Promise<void>;
  remove(slot: SaveSlot): Promise<void>;
}

export interface AtomicWriteResult {
  ok: boolean;
  reason?: string;
  save?: SaveFileV1;
}

export async function atomicWriteProfile(
  repo: SaveRepository,
  serialize: (save: SaveFileV1) => string,
  parseAndValidate: (raw: string) => { ok: true; save: SaveFileV1 } | { ok: false; reason: string },
  nextSave: SaveFileV1,
): Promise<AtomicWriteResult> {
  const candidatePayload = serialize(nextSave);
  await repo.write('profile.candidate', candidatePayload);

  const readBack = await repo.read('profile.candidate');
  if (readBack === null) {
    return { ok: false, reason: 'candidate_missing' };
  }
  const validated = parseAndValidate(readBack);
  if (!validated.ok) {
    return { ok: false, reason: validated.reason };
  }

  const primary = await repo.read('profile.primary');
  if (primary !== null) {
    await repo.write('profile.backup', primary);
  }
  await repo.write('profile.primary', candidatePayload);
  await repo.remove('profile.candidate');
  return { ok: true, save: validated.save };
}

/** Like atomicWriteProfile, but a thrown storage error is a failed result. */
export async function commitProfile(
  repo: SaveRepository,
  serialize: (save: SaveFileV1) => string,
  parseAndValidate: (raw: string) => { ok: true; save: SaveFileV1 } | { ok: false; reason: string },
  nextSave: SaveFileV1,
): Promise<AtomicWriteResult> {
  try {
    return await atomicWriteProfile(repo, serialize, parseAndValidate, nextSave);
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'write_failed' };
  }
}
