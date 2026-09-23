# RAKSHAK Versioning

## Product version (SemVer)

Format: `MAJOR.MINOR.PATCH` — currently **`1.0.0`**.

| Change | Bump |
|---|---|
| Breaking save/schema or incompatible content IDs | MAJOR |
| New features/content compatible with existing saves | MINOR |
| Bugfix, balance tweak, polish | PATCH |

 Canonical constant: `packages/shared/src/version.ts` → `GAME_VERSION`.

Apps must read the same value:

- Web: `apps/web` package.json + UI footer
- Android: Expo `version` (= versionName) and monotonic `android.versionCode`

## Android versionCode

- Starts at **`1`** for `1.0.0`.
- Strictly increases for every Play upload (even if `versionName` unchanged for hotfixes).
- Source of truth: `apps/mobile/app.config.ts` → `android.versionCode`.
- Never reuse a prior `versionCode` for a different binary.

## Content version

`CONTENT_VERSION` (string SemVer) changes when balance catalogs or content definitions change in a way that affects replays/checksums. Independent of `GAME_VERSION` when only shell/UI changes.

## Save schema version

Integer `schemaVersion` in save files. Migrations are sequential pure functions. Downgrade unsupported.

## Changelog

Keep a Changelog format in root `CHANGELOG.md`. Every release notes entry must list contentVersion and schemaVersion.
