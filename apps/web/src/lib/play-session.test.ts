import { describe, expect, it } from 'vitest';
import { unlockSnapshot, type UnlockSnapshot } from '@rakshak/game-data';
import { applyPlayAction, initialPlaySession, resolvePlayLink } from './play-session';

const freshLocks: UnlockSnapshot = unlockSnapshot({
  characters: ['asha'],
  maps: ['gaon'],
  evolutions: [],
  records: {},
});

describe('play session reset', () => {
  it('retries the same watch with a new run id and opens selection for a new watch', () => {
    let session = initialPlaySession({ guardianId: 'asha', mapId: 'gaon', started: true });
    const nonces = [session.nonce];
    for (let i = 0; i < 3; i += 1) {
      session = applyPlayAction(session, 'retry');
      nonces.push(session.nonce);
      expect(session.started).toBe(true);
      expect(session.guardianId).toBe('asha');
      expect(session.mapId).toBe('gaon');
    }
    expect(new Set(nonces).size).toBe(4);

    session = applyPlayAction(session, 'new-watch');
    expect(session.started).toBe(false);
    expect(session.guardianId).toBe('asha');
    expect(session.mapId).toBe('gaon');

    session = applyPlayAction({ ...session, guardianId: 'veer', mapId: 'van' }, 'start');
    expect(session).toMatchObject({ guardianId: 'veer', mapId: 'van', started: true });
    const afterRetry = applyPlayAction(session, 'retry');
    expect(afterRetry.nonce).toBe(session.nonce + 1);
    expect(afterRetry.guardianId).toBe('veer');
  });
});

describe('play links', () => {
  it('starts a valid unlocked link and refuses unknown or locked ones', () => {
    expect(resolvePlayLink({ guardian: null, map: null, locks: freshLocks })).toMatchObject({
      started: false,
      guardianId: 'asha',
      mapId: 'gaon',
      notice: null,
    });

    expect(resolvePlayLink({ guardian: 'asha', map: 'gaon', locks: freshLocks })).toMatchObject({
      started: true,
      guardianId: 'asha',
      mapId: 'gaon',
      notice: null,
    });

    const unknown = resolvePlayLink({ guardian: 'nope', map: 'zzz', locks: freshLocks });
    expect(unknown.started).toBe(false);
    expect(unknown.guardianId).toBe('asha');
    expect(unknown.mapId).toBe('gaon');
    expect(unknown.notice).toContain('does not match');

    const locked = resolvePlayLink({ guardian: 'veer', map: 'van', locks: freshLocks });
    expect(locked.started).toBe(false);
    expect(locked.guardianId).toBe('asha');
    expect(locked.mapId).toBe('gaon');
    expect(locked.notice).toContain('Survive 8:00 on Gaon.');
    expect(locked.inspected).toBe('veer');

    const opened = unlockSnapshot({
      characters: ['asha', 'veer'],
      maps: ['gaon', 'van'],
      evolutions: [],
      records: { gaon: { clears: 1 } },
    });
    expect(resolvePlayLink({ guardian: 'veer', map: 'van', locks: opened })).toMatchObject({
      started: true,
      guardianId: 'veer',
      mapId: 'van',
    });
  });
});
