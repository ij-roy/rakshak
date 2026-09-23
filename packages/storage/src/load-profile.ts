import { createDefaultSave } from './default-save.js';
import { commitProfile, type SaveRepository } from './repository.js';
import type { SaveFileV1 } from './schema.js';
import { validateSave } from './validate.js';

export type ProfileLoad =
  | { status: 'ready'; save: SaveFileV1; notice: null; damaged: null; backup: null }
  | { status: 'new'; save: SaveFileV1; notice: null; damaged: null; backup: null }
  | { status: 'recovered'; save: SaveFileV1; notice: string; damaged: string; backup: null }
  | { status: 'blocked'; save: null; notice: string; damaged: string | null; backup: SaveFileV1 | null; reason: string };

type Interpreted =
  | { state: 'missing' }
  | { state: 'ok'; save: SaveFileV1; raw: string }
  | { state: 'bad'; raw: string; reason: string };

function interpret(raw: string | null): Interpreted {
  if (raw == null) return { state: 'missing' };
  try {
    const parsed = validateSave(JSON.parse(raw) as unknown);
    if (parsed.ok) return { state: 'ok', save: parsed.save, raw };
    return { state: 'bad', raw, reason: parsed.reason };
  } catch {
    return { state: 'bad', raw, reason: 'malformed_json' };
  }
}

async function readSlot(repo: SaveRepository, slot: 'profile.primary' | 'profile.backup'): Promise<string | null> {
  try {
    return await repo.read(slot);
  } catch {
    return null;
  }
}

const RECOVERED_NOTICE =
  'The latest save could not be read, so the backup was restored. The damaged copy is kept on this device.';

/** Write a profile without copying a damaged primary over the backup. */
export async function replaceProfile(
  repo: SaveRepository,
  next: SaveFileV1,
): Promise<{ ok: true; save: SaveFileV1 } | { ok: false; reason: string }> {
  const current = interpret(await readSlot(repo, 'profile.primary'));
  if (current.state === 'ok') {
    return commitProfile(
      repo,
      (save) => JSON.stringify(save),
      (raw) => validateSave(JSON.parse(raw) as unknown),
      next,
    ).then((result) => (result.ok && result.save ? { ok: true, save: result.save } : { ok: false, reason: result.reason ?? 'write_failed' }));
  }
  if (current.state === 'bad') {
    try {
      await repo.write('diagnostics.local', current.raw);
    } catch {
      /* The caller still has the damaged text. */
    }
  }
  try {
    const payload = JSON.stringify(next);
    await repo.write('profile.primary', payload);
    const written = interpret(await repo.read('profile.primary'));
    if (written.state !== 'ok') return { ok: false, reason: written.state === 'bad' ? written.reason : 'replace_missing' };
    return { ok: true, save: written.save };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'write_failed' };
  }
}

/** Read the profile. A bad primary is never replaced with a new save. */
export async function loadProfile(repo: SaveRepository, nowIso?: string): Promise<ProfileLoad> {
  try {
    const primary = interpret(await readSlot(repo, 'profile.primary'));
    if (primary.state === 'ok') {
      return { status: 'ready', save: primary.save, notice: null, damaged: null, backup: null };
    }
    const backup = interpret(await readSlot(repo, 'profile.backup'));
    if (primary.state === 'missing' && backup.state === 'missing') {
      return { status: 'new', save: createDefaultSave(nowIso), notice: null, damaged: null, backup: null };
    }
    if (backup.state === 'ok') {
      const damaged = primary.state === 'bad' ? primary.raw : null;
      if (damaged) {
        try {
          await repo.write('diagnostics.local', damaged);
        } catch {
          /* Kept on the result. */
        }
      }
      const restored = await replaceProfile(repo, backup.save);
      if (restored.ok) {
        return {
          status: 'recovered',
          save: restored.save,
          notice: RECOVERED_NOTICE,
          damaged: damaged ?? '',
          backup: null,
        };
      }
      return {
        status: 'blocked',
        save: null,
        notice: 'A backup is ready, but it could not be written back.',
        damaged,
        backup: backup.save,
        reason: restored.reason,
      };
    }
    const damaged = primary.state === 'bad' ? primary.raw : backup.state === 'bad' ? backup.raw : null;
    if (damaged) {
      try {
        await repo.write('diagnostics.local', damaged);
      } catch {
        /* Kept on the result. */
      }
    }
    return {
      status: 'blocked',
      save: null,
      notice: 'This profile could not be read. Nothing was replaced.',
      damaged,
      backup: null,
      reason: primary.state === 'bad' ? primary.reason : backup.state === 'bad' ? backup.reason : 'unreadable',
    };
  } catch (error) {
    return {
      status: 'blocked',
      save: null,
      notice: 'This profile could not be read. Nothing was replaced.',
      damaged: null,
      backup: null,
      reason: error instanceof Error ? error.message : 'load_failed',
    };
  }
}
