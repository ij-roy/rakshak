import type { SaveFileV1 } from './schema.js';

/**
 * Migration stubs: sequential pure functions vN → vN+1.
 * v1 is current; future migrations append here.
 */
export type SaveMigration = (raw: unknown) => unknown;

export const SAVE_MIGRATIONS: readonly SaveMigration[] = [
  // schemaVersion 0 (pre-release) → 1 would live here when needed.
];

export function migrateSave(raw: unknown): unknown {
  let current = raw;
  if (current && typeof current === 'object' && 'schemaVersion' in current) {
    const version = (current as { schemaVersion: number }).schemaVersion;
    for (let v = version; v < 1; v++) {
      const mig = SAVE_MIGRATIONS[v];
      if (!mig) break;
      current = mig(current);
    }
  }
  return current;
}

export function withBumpedRevision(save: SaveFileV1): Omit<SaveFileV1, 'checksum'> {
  const { checksum: _c, ...rest } = save;
  return {
    ...rest,
    revision: rest.revision + 1,
    updatedAt: rest.updatedAt,
  };
}
