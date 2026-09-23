import type { SaveFileV1 } from './schema.js';

/** Canonical JSON for checksum: sorted keys, sorted/deduped ID arrays. */
export function canonicalizeSavePayload(save: Omit<SaveFileV1, 'checksum'>): string {
  const normalized = normalizeForChecksum(save);
  return stableStringify(normalized);
}

export function computeSaveChecksum(save: Omit<SaveFileV1, 'checksum'>): string {
  const payload = canonicalizeSavePayload(save);
  return fnv1aHex(payload);
}

function normalizeForChecksum(save: Omit<SaveFileV1, 'checksum'>): unknown {
  return {
    ...save,
    unlocks: {
      characters: sortUnique(save.unlocks.characters),
      weapons: sortUnique(save.unlocks.weapons),
      maps: sortUnique(save.unlocks.maps),
      evolutions: sortUnique(save.unlocks.evolutions),
      nightOaths: sortUnique(save.unlocks.nightOaths),
    },
    discovery: {
      enemies: sortUnique(save.discovery.enemies),
      bosses: sortUnique(save.discovery.bosses),
      weapons: sortUnique(save.discovery.weapons),
      passives: sortUnique(save.discovery.passives),
      evolutions: sortUnique(save.discovery.evolutions),
      lore: sortUnique(save.discovery.lore),
    },
  };
}

function sortUnique(arr: readonly string[]): string[] {
  return [...new Set(arr)].sort();
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

function fnv1aHex(input: string): string {
  let hash = 0xcbf29ce484222325n;
  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, '0');
}
