import { describe, expect, it } from 'vitest';
import { computeSaveChecksum } from './checksum.js';
import { createDefaultSave } from './default-save.js';
import { loadProfile } from './load-profile.js';
import type { SaveRepository } from './repository.js';

function memoryRepo(): SaveRepository & { slots: Map<string, string> } {
  const slots = new Map<string, string>();
  return {
    slots,
    async read(slot) {
      return slots.get(slot) ?? null;
    },
    async write(slot, payload) {
      slots.set(slot, payload);
    },
    async remove(slot) {
      slots.delete(slot);
    },
  };
}

describe('loadProfile', () => {
  it('starts a new profile when nothing is stored', async () => {
    const loaded = await loadProfile(memoryRepo());
    expect(loaded.status).toBe('new');
  });

  it('restores a valid backup and keeps the damaged primary', async () => {
    const repo = memoryRepo();
    const drafted = createDefaultSave('2026-09-23T00:00:00.000Z', 'backup-save');
    const withMarks = { ...drafted, meta: { ...drafted.meta, currency: 42 } };
    const { checksum: _ignored, ...rest } = withMarks;
    const backup = { ...rest, checksum: computeSaveChecksum(rest) };
    repo.slots.set('profile.backup', JSON.stringify(backup));
    repo.slots.set('profile.primary', '{not json');
    const loaded = await loadProfile(repo);
    expect(loaded.status).toBe('recovered');
    if (loaded.status !== 'recovered') return;
    expect(loaded.save.meta.currency).toBe(42);
    expect(loaded.save.saveId).toBe('backup-save');
    expect(repo.slots.get('diagnostics.local')).toBe('{not json');
    expect(repo.slots.get('profile.backup')).toContain('backup-save');
    expect(repo.slots.get('profile.primary')).toContain('backup-save');
    expect(loaded.notice).toContain('backup was restored');
  });

  it('does not invent a profile when every copy is unreadable', async () => {
    const repo = memoryRepo();
    repo.slots.set('profile.primary', '{"schemaVersion":1}');
    repo.slots.set('profile.backup', 'also bad');
    const loaded = await loadProfile(repo);
    expect(loaded.status).toBe('blocked');
    if (loaded.status !== 'blocked') return;
    expect(loaded.save).toBeNull();
    expect(loaded.damaged).toBe('{"schemaVersion":1}');
    expect(repo.slots.get('profile.primary')).toBe('{"schemaVersion":1}');
    expect(loaded.notice).toContain('Nothing was replaced');
  });
});