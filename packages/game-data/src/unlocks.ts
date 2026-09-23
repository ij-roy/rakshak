import type { GuardianId, MapId } from './ids.js';
import { GUARDIAN_BY_ID } from './guardians.js';
import { MAP_BY_ID } from './maps.js';
import { WEAPON_BY_ID } from './weapons.js';

export interface RunFacts {
  readonly mapId: MapId;
  readonly guardianId: GuardianId;
  readonly survivalSeconds: number;
  readonly won: boolean;
  readonly revivesUsed: number;
  readonly uniqueEvolutionsDiscovered: number;
  readonly oathsActive: number;
}

export interface UnlockRule {
  readonly id: string;
  readonly unlocks: {
    readonly guardian?: GuardianId;
    readonly map?: MapId;
  };
  readonly when: (facts: RunFacts) => boolean;
}

export const UNLOCK_RULES: readonly UnlockRule[] = [
  {
    id: 'unlock_veer',
    unlocks: { guardian: 'veer' },
    when: (f) => f.mapId === 'gaon' && f.survivalSeconds >= 480,
  },
  {
    id: 'unlock_tara',
    unlocks: { guardian: 'tara' },
    when: (f) => f.uniqueEvolutionsDiscovered >= 3,
  },
  {
    id: 'unlock_nila',
    unlocks: { guardian: 'nila' },
    when: (f) => f.mapId === 'van' && f.won && f.revivesUsed === 0,
  },
  {
    id: 'unlock_van',
    unlocks: { map: 'van' },
    when: (f) => f.mapId === 'gaon' && f.won,
  },
  {
    id: 'unlock_marusthal',
    unlocks: { map: 'marusthal' },
    when: (f) => f.mapId === 'van' && f.won,
  },
  {
    id: 'unlock_durg',
    unlocks: { map: 'durg' },
    when: (f) => f.mapId === 'marusthal' && f.won,
  },
];

export interface UnlockSnapshot {
  readonly characters: readonly GuardianId[];
  readonly maps: readonly MapId[];
  readonly evolutionsDiscovered: number;
  readonly clears: Partial<Record<MapId, number>>;
}

export interface LockCopy {
  readonly unlocked: boolean;
  readonly status: 'Ready' | 'Locked';
  readonly step: string;
}

function cleared(snapshot: UnlockSnapshot, mapId: MapId): boolean {
  return (snapshot.clears[mapId] ?? 0) > 0;
}

/** The clear the player can actually attempt next, walking the map chain. */
function nextClear(mapId: MapId, snapshot: UnlockSnapshot): string {
  const map = MAP_BY_ID[mapId];
  const previous = map.unlockAfter;
  if (previous && !cleared(snapshot, previous)) return nextClear(previous, snapshot);
  return `Clear ${map.displayName}.`;
}

function guardianStep(id: GuardianId, snapshot: UnlockSnapshot): string {
  if (id === 'veer') return 'Survive 8:00 on Gaon.';
  if (id === 'tara') {
    const found = Math.min(3, snapshot.evolutionsDiscovered);
    return `Discover 3 evolutions. ${found} of 3 found.`;
  }
  if (id === 'nila') {
    if (cleared(snapshot, 'van')) return 'Clear Van again without a revive.';
    const step = nextClear('van', snapshot);
    return step === 'Clear Van.' ? 'Clear Van without a revive.' : step;
  }
  return 'Ready.';
}

export function unlockSnapshot(input: {
  characters: readonly GuardianId[];
  maps: readonly MapId[];
  evolutions: readonly string[];
  records: Partial<Record<MapId, { clears: number }>>;
}): UnlockSnapshot {
  const clears: Partial<Record<MapId, number>> = {};
  for (const [id, record] of Object.entries(input.records) as [MapId, { clears: number }][]) {
    clears[id] = record.clears;
  }
  return {
    characters: input.characters,
    maps: input.maps,
    evolutionsDiscovered: input.evolutions.length,
    clears,
  };
}

export function describeGuardianLock(id: GuardianId, snapshot: UnlockSnapshot): LockCopy {
  const guardian = GUARDIAN_BY_ID[id];
  const unlocked = guardian.unlockDefault || snapshot.characters.includes(id);
  if (unlocked) {
    return {
      unlocked: true,
      status: 'Ready',
      step: `Starts with ${WEAPON_BY_ID[guardian.startWeapon].displayName}.`,
    };
  }
  return { unlocked: false, status: 'Locked', step: guardianStep(id, snapshot) };
}

export function describeMapLock(id: MapId, snapshot: UnlockSnapshot): LockCopy {
  const map = MAP_BY_ID[id];
  const unlocked = map.unlockDefault || snapshot.maps.includes(id);
  if (unlocked) return { unlocked: true, status: 'Ready', step: map.subtitle };
  return { unlocked: false, status: 'Locked', step: nextClear(id, snapshot) };
}

export function evaluateUnlocks(facts: RunFacts): {
  guardians: GuardianId[];
  maps: MapId[];
} {
  const guardians: GuardianId[] = [];
  const maps: MapId[] = [];
  for (const rule of UNLOCK_RULES) {
    if (!rule.when(facts)) continue;
    if (rule.unlocks.guardian) guardians.push(rule.unlocks.guardian);
    if (rule.unlocks.map) maps.push(rule.unlocks.map);
  }
  return { guardians, maps };
}
