import { describe, expect, it } from 'vitest';
import { createDefaultSave } from './default-save.js';
import { settleRun } from './settle-run.js';
import { validateSave } from './validate.js';

describe('save file', () => {
  it('creates a valid default save', () => {
    const save = createDefaultSave();
    const result = validateSave(save);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.save.meta.currencyId).toBe('guardian_marks');
      expect(result.save.unlocks.characters).toContain('asha');
      expect(result.save.unlocks.maps).toContain('gaon');
      expect(Object.keys(result.save.achievements)).toHaveLength(24);
    }
  });

  it('rejects corrupted checksum', () => {
    const save = createDefaultSave();
    const corrupted = { ...save, checksum: 'deadbeefdeadbeef' };
    const result = validateSave(corrupted);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('checksum_mismatch');
  });

  it('rejects schema corruption', () => {
    const result = validateSave({ schemaVersion: 1, broken: true });
    expect(result.ok).toBe(false);
  });

  it('persists a finished run so a later load still has the marks', () => {
    const before = createDefaultSave();
    const after = settleRun(before, {
      mapId: 'gaon',
      guardianId: 'asha',
      survivalSeconds: 200,
      level: 4,
      kills: 40,
      won: true,
      revivesUsed: 0,
      oathsActive: 0,
      evolutions: [],
      weapons: [{ id: 'talwar_arc', level: 2 }],
      passives: [],
      enemiesSeen: ['chhaya_drifter'],
      bossesSeen: ['bell_warden'],
      bossClearedLowHp: false,
      bellDefeatedClean: false,
      levelBeforeMinute6: 4,
      weaponCountAtMinute8: -1,
    });
    const reloaded = validateSave(JSON.parse(JSON.stringify(after)));
    expect(reloaded.ok).toBe(true);
    if (!reloaded.ok) return;
    expect(reloaded.save.achievements.first_watch?.state).toBe('complete');
    expect(reloaded.save.achievements.dawn_held?.state).toBe('complete');
    expect(reloaded.save.unlocks.maps).toContain('van');
    expect(reloaded.save.discovery.enemies).toContain('chhaya_drifter');
    expect(reloaded.save.records.gaon?.clears).toBe(1);
    const again = settleRun(reloaded.save, {
      mapId: 'gaon',
      guardianId: 'asha',
      survivalSeconds: 200,
      level: 4,
      kills: 0,
      won: true,
      revivesUsed: 0,
      oathsActive: 0,
      evolutions: [],
      weapons: [{ id: 'talwar_arc', level: 2 }],
      passives: [],
      enemiesSeen: ['chhaya_drifter'],
      bossesSeen: [],
      bossClearedLowHp: false,
      bellDefeatedClean: false,
      levelBeforeMinute6: 4,
      weaponCountAtMinute8: -1,
    });
    const firstMarks = reloaded.save.meta.currency - before.meta.currency;
    const secondMarks = again.meta.currency - reloaded.save.meta.currency;
    expect(secondMarks).toBeLessThan(firstMarks);
    expect(again.achievements.first_watch?.state).toBe('complete');
  });
});
