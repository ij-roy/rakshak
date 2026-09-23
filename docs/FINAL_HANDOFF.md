# RAKSHAK — Final Handoff

**Date:** 2026-09-23  
**Product version:** `1.0.0`  
**Content version:** `1.0.0`  
**Save schema:** `1`  
**Android package:** `roy.ij.rakshak`  
**Android versionCode:** `1`

## Product Status

RAKSHAK is implemented as a pnpm monorepo with:

- Shared deterministic simulation (`@rakshak/game-core`) at 30 Hz
- Full launch content catalog (4/8/8/6/16/4/4/4/24 + meta tracks)
- Versioned save system with checksum + atomic write protocol
- Playable Next.js web client (PixiJS procedural renderer)
- Expo Android shell (Skia canvas + virtual stick + AsyncStorage)
- Night Watch UI tokens, menus, level-up cards, results, story beat, settings, meta upgrades, achievements/collection
- Procedural audio (Web Audio) and license-gated procedural assets
- Validation tools for content and asset approval status

## Architecture

See `docs/02-TECHNICAL-ARCHITECTURE.md` and `docs/DECISIONS.md`.

```
apps/web          Next.js 16.3.6 + Pixi
apps/mobile       Expo SDK 57 + Skia
packages/game-core|game-data|game-protocol|storage|input|audio|...
tools/validate
```

## Web

```bash
pnpm install
pnpm dev:web
# production
pnpm --filter @rakshak/web build
pnpm --filter @rakshak/web start
```

### Vercel

1. Import the repo; set Root Directory to `apps/web` **or** use monorepo install at root with filter.
2. Install command: `pnpm install`
3. Build command: `pnpm --filter @rakshak/web build`
4. Output: Next default (`.next` under `apps/web`)
5. Headers already in `apps/web/vercel.json`
6. No env secrets required for offline play. Hobby vs commercial plan is an owner decision (D001).

Verified locally: `next build --webpack` succeeds (11 routes).

## Android

```bash
pnpm install
pnpm --filter @rakshak/mobile start
# device/emulator
pnpm --filter @rakshak/mobile android
```

### Release AAB (EAS)

1. `npm i -g eas-cli` and `eas login`
2. Set `EAS_PROJECT_ID` (never commit)
3. From `apps/mobile`: `eas build -p android --profile production`
4. Confirm `app.config.ts`: package `roy.ij.rakshak`, version `1.0.0`, versionCode `1`, landscape, `allowBackup=false`
5. Upload AAB to Play Console; use Play App Signing

Signing keystore generation and Play upload require owner credentials.

## Package

Confirmed in `packages/shared/src/version.ts` and `apps/mobile/app.config.ts`: **`roy.ij.rakshak`**.

## Testing

| Suite | Result (2026-09-23) |
|---|---|
| shared / protocol / data / assets / storage / game-core | Pass (20+ tests incl. stress soak) |
| `validate:content` | Pass — full launch counts |
| `validate:licenses` | Pass — 22 approved procedural assets |
| `@rakshak/web` production build | Pass |
| Mobile EAS/AAB on device | Not executed here (no signing account/device farm) |

## Performance

Headless stress: 90s soak + entity cap checks pass in Vitest. Device FPS/memory budgets from `docs/08-PERFORMANCE-BUDGET.md` still require physical mid-tier Android + browser matrix (owner/device).

## Assets / Audio

Original procedural geometry sprites and Web Audio tones ship as approved project originals (`ASSET_LICENSES.md`). Third-party CC0 pack intake remains optional enhancement after hash/provenance capture. Custom identity art/music commissions remain owner/cultural track.

## Save Data

- Schema v1 (`packages/storage`)
- Slots: primary / backup / candidate
- Checksum + revision bumping
- Migrations table ready for v2+
- Web: IndexedDB · Mobile: AsyncStorage adapter

## Deployment

Web production build verified. Vercel project linking is owner-only.

## Play Store

Repository-side preparation complete for package ID, versioning, landscape, backup policy, privacy copy, EAS production profile. Remaining owner steps: account verification, package registration check, signing, Data Safety/IARC/listing media, closed-test gate if applicable (`docs/10-ANDROID-PLAYSTORE-RELEASE.md`).

## Known Issues / Limitations

- Procedural art/audio is shippable but not final commissioned Night Watch pixel identity.
- Cultural name review still pending (D004).
- Night Oaths / full lore field notes / PWA service worker are partial relative to maximal M9 wishlist; core offline local play works without SW.
- Mobile Skia path compiles in workspace but was not device-smoke-tested in this environment.
- Repository license remains All Rights Reserved pending owner choice (D002).

## External Actions (Owner Only)

1. Choose final business model listing (free vs paid) and Vercel plan.
2. Choose public code license if desired.
3. Cultural review of guardian/map/boss terminology.
4. Register/verify `roy.ij.rakshak` in Play Console before policy deadlines.
5. Create upload keystore; configure EAS secrets; run production AAB; internal/closed tracks.
6. Complete Play App content, Data Safety, IARC, store listing art.
7. Link Vercel project and production domain.
8. Optional: commission final art/music replacing procedural assets after license intake.

## Release Checklist

- [x] Content counts match Master Spec
- [x] Version constants unified (`GAME_VERSION` / `CONTENT_VERSION` / `SCHEMA_VERSION` / `ANDROID_VERSION_CODE`)
- [x] Web production build
- [x] Automated tests + validators
- [x] Privacy page copy matches offline/no-telemetry stance
- [ ] Owner Play Console + signing
- [ ] Owner Vercel production deploy
- [ ] Device performance matrix sign-off
- [ ] Cultural review sign-off
