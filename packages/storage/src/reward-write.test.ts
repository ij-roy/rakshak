import { describe, expect, it } from 'vitest';
import { createDefaultSave } from './default-save.js';
import { commitProfile } from './repository.js';
import { claimReward, EMPTY_HELD_REWARD, holdReward } from './reward-write.js';
import { settleRun } from './settle-run.js';
import type { SaveRepository } from './repository.js';
import type { RunReport } from '@rakshak/game-data';

const report: RunReport = {
  mapId: 'gaon',
  guardianId: 'asha',
  survivalSeconds: 30,
  level: 1,
  kills: 0,
  won: false,
  revivesUsed: 0,
  oathsActive: 0,
  evolutions: [],
  weapons: [],
  passives: [],
  enemiesSeen: [],
  bossesSeen: [],
  bossClearedLowHp: false,
  bellDefeatedClean: false,
  levelBeforeMinute6: 1,
  weaponCountAtMinute8: -1,
};

function memoryRepo(): SaveRepository & { fail: boolean; primary: string | null } {
  const slots = new Map<string, string>();
  return {
    fail: false,
    get primary() {
      return slots.get('profile.primary') ?? null;
    },
    async read(slot) {
      return slots.get(slot) ?? null;
    },
    async write(slot, payload) {
      if (this.fail) throw new Error('disk full');
      slots.set(slot, payload);
    },
    async remove(slot) {
      slots.delete(slot);
    },
  };
}

describe('reward writes', () => {
  it('keeps one settled profile until the write succeeds', () => {
    const base = createDefaultSave();
    const settled = settleRun(base, report);
    const doubled = settleRun(settled, report);
    let held = holdReward(EMPTY_HELD_REWARD, settled);
    held = holdReward(held, doubled);
    expect(held.pending?.meta.currency).toBe(settled.meta.currency);
    held = claimReward(held, false);
    expect(held.claimed).toBe(false);
    expect(held.pending?.meta.currency).toBe(settled.meta.currency);
    held = claimReward(held, true);
    expect(held.claimed).toBe(true);
    held = holdReward(held, doubled);
    expect(held.pending?.meta.currency).toBe(settled.meta.currency);
  });

  it('reports a thrown write as a failure and leaves the profile untouched', async () => {
    const repo = memoryRepo();
    repo.fail = true;
    const result = await commitProfile(
      repo,
      (save) => JSON.stringify(save),
      () => ({ ok: true, save: createDefaultSave() }),
      createDefaultSave(),
    );
    expect(result.ok).toBe(false);
    expect(repo.primary).toBeNull();
  });
});