import {
  describeGuardianLock,
  describeMapLock,
  GUARDIAN_BY_ID,
  GUARDIAN_IDS,
  MAP_BY_ID,
  MAP_IDS,
  type GuardianId,
  type MapId,
  type UnlockSnapshot,
} from '@rakshak/game-data';

export type PlaySession = {
  guardianId: GuardianId;
  mapId: MapId;
  started: boolean;
  nonce: number;
};

export type PlayLink = {
  guardianId: GuardianId;
  mapId: MapId;
  started: boolean;
  notice: string | null;
  inspected: string | null;
};

function isGuardianId(value: string | null): value is GuardianId {
  return value != null && (GUARDIAN_IDS as readonly string[]).includes(value);
}

function isMapId(value: string | null): value is MapId {
  return value != null && (MAP_IDS as readonly string[]).includes(value);
}

/** Decide whether a /play link may start, only after the profile locks are known. */
export function resolvePlayLink(input: {
  guardian: string | null;
  map: string | null;
  locks: UnlockSnapshot;
}): PlayLink {
  const guardian = input.guardian;
  const map = input.map;
  if (guardian == null && map == null) {
    return { guardianId: 'asha', mapId: 'gaon', started: false, notice: null, inspected: null };
  }

  const guardianOk = isGuardianId(guardian);
  const mapOk = isMapId(map);
  if ((guardian != null && !guardianOk) || (map != null && !mapOk) || !guardianOk || !mapOk) {
    const unknown = (guardian != null && !guardianOk) || (map != null && !mapOk);
    return {
      guardianId: guardianOk ? guardian : 'asha',
      mapId: mapOk ? map : 'gaon',
      started: false,
      notice: unknown
        ? 'That link does not match a guardian or a map. Choose a watch from the list.'
        : 'That link does not name both a guardian and a map.',
      inspected: null,
    };
  }

  const guardianLock = describeGuardianLock(guardian, input.locks);
  const mapLock = describeMapLock(map, input.locks);
  if (!guardianLock.unlocked || !mapLock.unlocked) {
    const blocked = !guardianLock.unlocked
      ? `${GUARDIAN_BY_ID[guardian].displayName}: ${guardianLock.step}`
      : `${MAP_BY_ID[map].displayName}: ${mapLock.step}`;
    return {
      guardianId: guardianLock.unlocked ? guardian : 'asha',
      mapId: mapLock.unlocked ? map : 'gaon',
      started: false,
      notice: `${blocked} This link stays on the selection screen.`,
      inspected: !guardianLock.unlocked ? guardian : map,
    };
  }

  return { guardianId: guardian, mapId: map, started: true, notice: null, inspected: null };
}

export function initialPlaySession(input: {
  guardianId: GuardianId;
  mapId: MapId;
  started: boolean;
}): PlaySession {
  return { ...input, nonce: 0 };
}

export function applyPlayAction(
  session: PlaySession,
  action: 'start' | 'retry' | 'new-watch',
): PlaySession {
  if (action === 'start') return { ...session, started: true };
  if (action === 'retry') return { ...session, started: true, nonce: session.nonce + 1 };
  return { ...session, started: false };
}
