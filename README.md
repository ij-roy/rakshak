# RAKSHAK — Survive the Night

Offline-first Indian-fantasy survivor/roguelite for **Android** (`roy.ij.rakshak`) and **Web** (Next.js / Vercel).

Canonical product contract: [`RAKSHAK_MASTER_SPEC.md`](RAKSHAK_MASTER_SPEC.md)  
Implementation progress: [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md)  
Versioning: [`VERSIONING.md`](VERSIONING.md)

## Versions

| Field | Value |
|---|---|
| Game | `1.0.0` |
| Content | `1.0.0` |
| Save schema | `1` |
| Android `versionCode` | `1` |

## Prerequisites

- Node.js 20+
- pnpm 9+

```bash
pnpm install
```

## Commands

```bash
pnpm test                 # workspace unit/property tests
pnpm typecheck            # TypeScript across packages
pnpm validate:content     # launch roster completeness
pnpm validate:licenses    # approved asset manifest gate
pnpm --filter @rakshak/web build
pnpm dev:web              # Next.js http://localhost:3000
pnpm dev:mobile           # Expo
```

## Architecture

- `packages/game-core` — deterministic 30 Hz simulation (no React/DOM)
- `packages/game-data` — validated launch content/balance
- `apps/web` — Next.js 16.3.6 + PixiJS 8
- `apps/mobile` — Expo SDK 57 + React Native Skia

## License

Original code: All Rights Reserved until the owner chooses otherwise (`LICENSE`).  
Third-party notices: `THIRD_PARTY_LICENSES.md`, `ASSET_LICENSES.md`.
