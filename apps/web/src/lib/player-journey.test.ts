import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeGuardianLock, describeMapLock, unlockSnapshot, type UnlockSnapshot } from '@rakshak/game-data';
import { GameRuntime } from '@rakshak/game-core';
import { createWebPlayInputAdapter } from '@rakshak/input/web';
import {
  commitProfile,
  createDefaultSave,
  holdReward,
  EMPTY_HELD_REWARD,
  settleRun,
  type SaveRepository,
} from '@rakshak/storage';
import { describe, expect, it } from 'vitest';
import { applyPlayAction, initialPlaySession, resolvePlayLink } from './play-session';
import { viewportFit } from './viewport-fit';

const freshLocks: UnlockSnapshot = unlockSnapshot({
  characters: ['asha'],
  maps: ['gaon'],
  evolutions: [],
  records: {},
});

const victory = {
  mapId: 'gaon' as const,
  guardianId: 'asha' as const,
  survivalSeconds: 200,
  level: 4,
  kills: 40,
  won: true,
  revivesUsed: 0,
  oathsActive: 0,
  evolutions: [],
  weapons: [{ id: 'talwar_arc' as const, level: 2 }],
  passives: [],
  enemiesSeen: ['chhaya_drifter' as const],
  bossesSeen: ['bell_warden' as const],
  bossClearedLowHp: false,
  bellDefeatedClean: false,
  levelBeforeMinute6: 4,
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

function fakeWindow() {
  const listeners = new Map<string, Set<(event: { code?: string; repeat?: boolean; preventDefault: () => void }) => void>>();
  return {
    addEventListener(type: string, fn: (event: { code?: string; repeat?: boolean; preventDefault: () => void }) => void) {
      const set = listeners.get(type) ?? new Set();
      set.add(fn);
      listeners.set(type, set);
    },
    removeEventListener(type: string, fn: (event: { code?: string; repeat?: boolean; preventDefault: () => void }) => void) {
      listeners.get(type)?.delete(fn);
    },
    document: {
      hidden: false,
      addEventListener() {},
      removeEventListener() {},
    },
    press(code: string) {
      const event = { code, repeat: false, preventDefault() {} };
      for (const fn of listeners.get('keydown') ?? []) fn(event);
    },
  };
}

function offer(seed: number) {
  const runtime = new GameRuntime({ seed, guardianId: 'asha', mapId: 'gaon' });
  for (let i = 0; i < 30 * 120; i++) {
    runtime.step({ moveX: 0.35, moveY: 0.15, pause: false, confirm: false, cancel: false });
    const snap = runtime.snapshot();
    if (snap.hud.awaitingLevelChoice && snap.hud.levelChoices.length >= 3) return { runtime, snap };
  }
  throw new Error('the first watch never offered an upgrade');
}

describe('player journey', () => {
  it('starts the first watch from the selection screen', () => {
    const link = resolvePlayLink({ guardian: null, map: null, locks: freshLocks });
    expect(link.started).toBe(false);
    expect(link.guardianId).toBe('asha');
    expect(link.mapId).toBe('gaon');
    const session = applyPlayAction(initialPlaySession(link), 'start');
    expect(session.started).toBe(true);
    const runtime = new GameRuntime({ seed: 1, guardianId: session.guardianId, mapId: session.mapId });
    const snap = runtime.snapshot();
    expect(snap.hud.level).toBe(1);
    expect(snap.hud.runOutcome).toBe('ongoing');
    expect(snap.tick).toBe(0);
  });

  it('picks the left and right upgrade cards from the digit keys', () => {
    const window = fakeWindow();
    const input = createWebPlayInputAdapter(window as unknown as Window);
    input.setDialogOpen(true);
    window.press('Enter');
    expect(input.sample().confirm).toBe(false);

    window.press('Digit1');
    const leftRecord = input.sample();
    const left = { ...leftRecord };
    expect(left.confirm).toBe(true);
    expect(left.moveX).toBe(-1);
    window.press('Digit3');
    const rightRecord = input.sample();
    const right = { ...rightRecord };
    expect(rightRecord).toBe(leftRecord);
    expect(left.moveX).toBe(-1);
    expect(right.confirm).toBe(true);
    expect(right.moveX).toBe(1);
    input.dispose();

    for (const [seed, sample] of [
      [3, left],
      [9, right],
    ] as const) {
      const { runtime, snap } = offer(seed);
      const index = sample.moveX < -0.33 ? 0 : 2;
      const choice = snap.hud.levelChoices[index]!;
      runtime.step(sample);
      const after = runtime.snapshot();
      expect(after.hud.awaitingLevelChoice).toBe(false);
      const equipped = [...after.hud.weaponSlots, ...after.hud.passiveSlots].some(
        (slot) => slot.contentId === choice.contentId && slot.level === choice.nextLevel,
      );
      expect(equipped).toBe(true);
    }
  });

  it('retries the same watch three times and each retry is a new run', () => {
    let session = initialPlaySession({ guardianId: 'asha', mapId: 'gaon', started: true });
    const nonces = [session.nonce];
    for (let i = 0; i < 3; i++) {
      session = applyPlayAction(session, 'retry');
      nonces.push(session.nonce);
      const runtime = new GameRuntime({
        seed: session.nonce + 1,
        guardianId: session.guardianId,
        mapId: session.mapId,
      });
      expect(runtime.snapshot().tick).toBe(0);
      expect(runtime.snapshot().hud.runOutcome).toBe('ongoing');
    }
    expect(new Set(nonces).size).toBe(4);
    expect(session.guardianId).toBe('asha');
    expect(session.mapId).toBe('gaon');
    expect(session.started).toBe(true);
  });

  it('keeps the profile when a save fails and still grants the next map after a stored victory', async () => {
    const repo = memoryRepo();
    repo.fail = true;
    const failed = await commitProfile(
      repo,
      (save) => JSON.stringify(save),
      () => ({ ok: true, save: createDefaultSave() }),
      createDefaultSave(),
    );
    expect(failed.ok).toBe(false);
    expect(repo.primary).toBeNull();

    const settled = settleRun(createDefaultSave(), victory);
    const held = holdReward(EMPTY_HELD_REWARD, settled);
    expect(held.pending?.meta.currency).toBe(settled.meta.currency);
    expect(held.claimed).toBe(false);

    repo.fail = false;
    const stored = await commitProfile(
      repo,
      (save) => JSON.stringify(save),
      (raw) => {
        const save = JSON.parse(raw) as ReturnType<typeof createDefaultSave>;
        return { ok: true, save };
      },
      settled,
    );
    expect(stored.ok).toBe(true);
    expect(repo.primary).toContain('gaon');

    const locks = unlockSnapshot({
      characters: settled.unlocks.characters,
      maps: settled.unlocks.maps,
      evolutions: settled.discovery.evolutions,
      records: settled.records,
    });
    expect(describeGuardianLock('asha', locks).status).toBe('Ready');
    expect(describeMapLock('gaon', locks).status).toBe('Ready');
    const van = describeMapLock('van', locks);
    expect(van.unlocked).toBe(true);
    expect(van.status).toBe('Ready');
    expect(describeMapLock('durg', locks).unlocked).toBe(false);
  });

  it('keeps play, settings, the field, and pause reachable on the checked viewports', () => {
    const sizes = [
      [375, 812],
      [800, 360],
      [667, 375],
      [768, 1024],
      [1366, 768],
      [2560, 1080],
    ] as const;
    for (const [width, height] of sizes) {
      for (const root of [16, 24]) {
        const fit = viewportFit(width, height, root);
        expect(fit.playReachable).toBe(true);
        expect(fit.settingsReachable).toBe(true);
        expect(fit.fieldFits).toBe(true);
        expect(fit.hudFits).toBe(true);
        expect(fit.pauseFits).toBe(true);
      }
    }
    expect(viewportFit(667, 375).columns).toBe(2);
    expect(viewportFit(800, 360).columns).toBe(2);
    expect(viewportFit(375, 812).columns).toBe(1);
    expect(viewportFit(375, 812).needsRotate).toBe(true);
    expect(viewportFit(800, 360).needsRotate).toBe(false);
    expect(viewportFit(320, 140).fieldFits).toBe(false);
    expect(viewportFit(320, 140).pauseFits).toBe(false);

    const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../app/globals.css'), 'utf8');
    expect(css).toMatch(/\.home \{[^}]*overflow-y:\s*auto/);
    expect(css).toMatch(/@media \(max-height: 420px\) \{[\s\S]*grid-template-columns:\s*1fr 1fr/);
    expect(css).toMatch(/\.app-root:has\(\.play-root\) \.page-exit \{\s*display:\s*none/);
    expect(css).toMatch(/\.play-hud \{[^}]*safe-area-inset-top/);
    expect(css).not.toMatch(/\.play-hud \{[^}]*overflow:\s*hidden/);
  });
});
