# RAKSHAK — Save and Progression Specification

## 1. Decision

Use one versioned JSON-compatible domain schema and platform storage adapters. Android uses a transactional Expo SQLite key-value table by default; web uses IndexedDB. The storage choice is hidden behind `SaveRepository`; game rules never import platform APIs.

AsyncStorage remains a fallback candidate and explicitly documents that it is unencrypted ([project docs](https://react-native-async-storage.github.io/)). Saves contain no secrets, but transactional recovery is still valuable.

## 2. Logical slots

- `profile.primary` — current validated profile.
- `profile.backup` — previous validated profile.
- `profile.candidate` — temporary write target.
- `run.checkpoint` — recoverable interrupted run at approved safe points.
- `settings.bootstrap` — minimal settings readable before full profile load.
- `diagnostics.local` — bounded debug/crash breadcrumbs; no PII, no upload.

## 3. Schema v1

Illustrative canonical shape:

```ts
interface SaveFileV1 {
  schemaVersion: 1;
  saveId: string;                 // random local UUID, never transmitted
  createdAt: string;              // ISO timestamp, informational only
  updatedAt: string;
  gameVersion: string;
  contentVersion: string;
  revision: number;
  checksum: string;               // checksum over canonical payload
  settings: SettingsV1;
  unlocks: {
    characters: CharacterId[];
    weapons: WeaponId[];
    maps: MapId[];
    evolutions: EvolutionId[];
    nightOaths: OathId[];
  };
  discovery: {
    enemies: EnemyId[];
    bosses: BossId[];
    weapons: WeaponId[];
    passives: PassiveId[];
    evolutions: EvolutionId[];
    lore: LoreId[];
  };
  achievements: Record<AchievementId, {
    state: 'locked' | 'complete';
    progress: number;
    completedAt?: string;
  }>;
  meta: {
    currency: number;
    upgrades: Record<MetaUpgradeId, number>;
    lifetimeEarned: number;
  };
  statistics: StatisticsV1;
  records: Record<MapId, MapRecordV1>;
  provenance: {
    migratedFrom?: number;
    recoveredFromBackupCount: number;
    resetCount: number;
  };
}
```

Arrays are sorted and deduplicated before checksum. Unknown IDs are quarantined during migration, not silently treated as unlocked. Currency/ranks/stats have upper and lower validation bounds.

### Settings groups

- audio bus volumes and mute;
- visual quality, shake, flash, particle, damage-number density;
- controls and key bindings;
- accessibility/UI scale/haptics;
- language;
- privacy/diagnostic preferences (local only in 1.0).

### Statistics

Runs started/completed/won; total time; defeats; XP; currency; per-weapon damage/usage; per-enemy kills; boss attempts/wins; guardian/map usage; highest level; longest survival. Counters saturate at safe integer limits.

## 4. Write protocol

1. Clone the in-memory domain object at a safe point.
2. Normalize, schema-validate, canonicalize, and checksum.
3. Transactionally write `candidate` with incremented revision.
4. Read and validate candidate.
5. Move current primary to backup.
6. Promote candidate to primary and clear candidate.
7. Emit local success/failure diagnostics.

Writes occur after purchases/unlocks/settings changes, at run milestones, on results, and during app backgrounding best-effort. Never write every simulation tick.

## 5. Loading and corruption recovery

1. Read primary and validate shape, IDs, bounds, checksum.
2. If invalid, read backup.
3. If backup is valid, restore it and tell the player what happened.
4. If both invalid, attempt conservative salvage of settings, completed achievements, unlock union, and capped currency/upgrades from parseable data.
5. Present `Recovered partial save` with details and export option where supported.
6. If salvage fails, offer reset; never silently reset.

Checksum detects accidental corruption, not cheating. Anti-cheat is out of scope for an offline single-player game.

## 6. Migrations

- Migrations are pure, sequential functions: `v1 → v2 → v3`; never skip a step.
- Every migration has fixtures for minimum, maximum, missing optional fields, unknown IDs, and corrupted values.
- Migration runs on a copy; original blob remains until the new save validates and commits.
- Removed content IDs map through an explicit tombstone table. Do not reuse IDs.
- Downgrade is unsupported; backup/export preserves original data.
- `schemaVersion` changes for structural meaning. `contentVersion` changes for balance/content catalogs.

## 7. Run checkpoint

Checkpointing is recovery, not save-scumming:

- Write at boss defeat, app background, and clean pause/quit.
- Contains seed, content version, tick, guardian/map, input-independent world state needed to resume, RNG stream states, build, health, XP, director state, and checksum.
- Cleared on results/abandon.
- If app termination occurs between checkpoints, resume from the last checkpoint with a clear message.
- A resumed run is eligible for unlocks because the game is offline; the audit flag records resume count only for debugging.

## 8. Progression economy

- Currency awarded from survival bands, boss defeats, first-clear challenges, and achievements.
- Baseline target: first affordable rank after one attempted run; full meta tree after roughly 8–12 hours of varied play, validated by simulation/playtest.
- Six tracks × five ranks. Each rank has exact data-defined cost/effect.
- Total aggregate baseline power remains around +25%; map mastery and build choice remain decisive.
- Free full respec protects experimentation.
- No clock-based rewards, daily streaks, negative currency, or real-money hooks.

## 9. Unlock rules

Rules consume end-of-run facts and emit idempotent unlock events. Re-evaluating a run cannot duplicate currency or achievement rewards. Examples:

- `survivalSeconds >= 480` unlocks Veer.
- `uniqueEvolutionsDiscovered >= 3` unlocks Tara.
- `mapId === van && won && revivesUsed === 0` unlocks Nila.
- First map clear unlocks the next map.

Rules are content definitions referring to whitelisted predicates, not arbitrary executable scripts.

## 10. Reset/export/privacy

- Reset has two confirmations, names what is lost, preserves nothing except separately confirmed accessibility settings, and increments no remote record.
- Web users can delete data through Settings or browser site-data controls.
- Android backup behavior must be explicit. Android Auto Backup is enabled by default for qualifying apps; choose `allowBackup=false` or precise `data-extraction-rules` and reflect the result in privacy text ([Android documentation](https://developer.android.com/identity/data/autobackup)). Recommendation: allow device-to-device/local platform backup only if the Data Safety/privacy review confirms wording; otherwise disable cloud backup for 1.0.
- Export is a human-readable JSON envelope with checksum and no device identifier. Import is a post-1.0 feature unless implementation is trivial and fully validated.

## 11. Tests

- round-trip and canonical checksum;
- every migration fixture and migration idempotency;
- candidate interruption at each write step;
- primary corrupt/backup valid; both corrupt/salvage; unrecoverable;
- unknown/tombstoned IDs and out-of-range counters;
- simultaneous unlock events and duplicate results processing;
- storage quota/full disk/private browsing failure;
- background/kill/resume and content-version mismatch.
