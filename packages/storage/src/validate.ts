import { computeSaveChecksum } from './checksum.js';
import { SaveFileV1Schema, type SaveFileV1 } from './schema.js';

export type ValidateSaveResult =
  | { ok: true; save: SaveFileV1 }
  | { ok: false; reason: string };

export function validateSave(raw: unknown): ValidateSaveResult {
  const parsed = SaveFileV1Schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, reason: parsed.error.issues[0]?.message ?? 'schema_invalid' };
  }
  const save = parsed.data;
  const { checksum, ...rest } = save;
  const expected = computeSaveChecksum(rest);
  if (checksum !== expected) {
    return { ok: false, reason: 'checksum_mismatch' };
  }
  return { ok: true, save };
}
