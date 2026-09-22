# RAKSHAK Master Specification

**Status:** Pre-development source of truth  
**Product:** RAKSHAK — Survive the Night  
**Package/application ID:** `roy.ij.rakshak`  
**Version:** `1.0.0`  
**Research date:** 2026-09-22

> If implementation conflicts with `RAKSHAK_MASTER_SPEC.md`, the Master Spec wins unless the developer explicitly changes the specification.

## 1. Product contract

RAKSHAK is a production-quality, offline-first, Indian-fantasy-inspired survivor/bullet-heaven roguelite with 10–15 minute runs. It ships as an Expo/React Native Android application and a playable Next.js application on Vercel. Version 1 has no account, backend, multiplayer, mandatory API, telemetry, ads, or cloud save.

The player moves; weapons attack automatically; enemies drop XP; level-ups present choices; compatible max-level weapons and passives evolve; pressure rises continuously; milestone bosses punctuate a 12-minute standard run; persistent unlocks create replayability without invalidating player skill.

## 2. Locked product decisions

- Standard run duration: **12:00**, with bosses at **4:00, 8:00, and 12:00**; the final boss ends the run.
- Launch content: **4 guardians, 8 weapons, 8 passives, 6 evolutions, 16 normal enemies, 4 elites, 4 maps, 4 bosses, 24 achievements**.
- Landscape sequence: **Gaon → Van → Marusthal → Durg**. These are short map labels, with localized descriptive subtitles.
- Art: stylized 2D/2.5D top-down sprites with strong silhouettes, warm mineral colors, indigo night shadows, brass accents, and restrained textile geometry. No direct sacred iconography.
- Monetization in 1.0: paid or free premium experience only; no ads/IAP SDK is approved by this specification.
- Simulation: seeded, deterministic, fixed-step, headless TypeScript; the renderer never owns gameplay truth.
- Data: schema-validated, immutable content definitions; no balancing constants scattered through code.
- Save: versioned shared domain schema; native adapter uses Expo SQLite or a measured key-value alternative; web adapter uses IndexedDB. Atomic snapshot, backup, migration, validation, and reset are mandatory.
- Accessibility: remappable desktop movement, left/right virtual-stick option, scalable UI, high-contrast telegraphs, reduced-shake/reduced-flash controls, independent volume controls, and no color-only critical information.

## 3. Architecture decision and prototype gate

### Decision

Use a package-managed TypeScript monorepo with a framework-neutral simulation and data layer. React Native Skia with batched `Atlas` drawing renders Android; PixiJS renders web inside a client-only Next.js route. Expo supplies the Android shell; Next.js supplies the web shell. React renders menus and overlays, not high-count gameplay entities.

Official React Native Skia documentation describes `Atlas` as designed for efficiently drawing many instances; it currently requires React Native 0.79+ and React 19+ and adds approximately 4 MB on Android ([installation](https://shopify.github.io/react-native-skia/docs/getting-started/installation/), [Atlas](https://shopify.github.io/react-native-skia/docs/shapes/atlas/)). PixiJS documents browser sprite batching, spritesheets, bitmap text, culling, and blend-mode ordering ([performance guide](https://pixijs.com/8.x/guides/concepts/performance-tips)). These facts must be rechecked when M1 pins versions.

### Mandatory M1 gate

Before content production, benchmark the same protocol-driven stress scene through Skia and Pixi on low/mid/high Android and representative desktop/mobile browsers. Both adapters must meet the budgets in [`docs/08-PERFORMANCE-BUDGET.md`](docs/08-PERFORMANCE-BUDGET.md) and produce visually equivalent gameplay state.

### Fallback

If maintaining two render adapters proves materially more expensive and CanvasKit meets web load/performance budgets, evaluate React Native Skia Web as the single renderer. If native Skia fails, evaluate the Pixi renderer inside a controlled React Native WebView only after profiling; Phaser/WebView is not the default because it moves lifecycle, storage, audio, accessibility, and native input across a bridge and makes performance dependent on Android System WebView.

## 4. Repository boundaries

```text
rakshak/
  apps/
    mobile/              # Expo shell, lifecycle, native storage/audio/haptics
    web/                 # Next.js shell, client-only game route, PWA option
  packages/
    game-core/           # deterministic simulation and domain interfaces
    game-data/           # validated content/balance definitions
    renderer-native/     # React Native Skia adapter
    renderer-web/        # PixiJS adapter
    game-ui/             # shared tokens and cross-platform overlay primitives
    input/               # normalized intents; platform adapters
    audio/               # cue graph/mixer contract; platform adapters
    storage/             # save schema, migrations, repositories, adapters
    assets/              # typed asset manifest and attribution metadata
    shared/              # narrow generic utilities only
  tools/                 # validation, atlas, balance, license, build tooling
  docs/
```

Packages must not import from `apps/*`. `game-core` must not import React, Expo, Next.js, Skia, Pixi, browser globals, timers, storage, audio, or network APIs. Communication out of the core is via typed events and immutable render snapshots.

## 5. Simulation contract

- Fixed simulation tick: **30 Hz**; rendering may interpolate to display refresh.
- Time is integer ticks, never wall-clock deltas in rules.
- RNG is a documented seeded PRNG with named streams (`spawn`, `upgrade`, `loot`, `cosmetic`) so cosmetic calls cannot perturb combat.
- Entity IDs are stable integers. Hot-loop state uses compact arrays/struct-of-arrays where measurements justify it; React state never represents active entities.
- Broad phase uses a uniform spatial hash/grid. Collision shapes are circles or axis-aligned boxes. No general rigid-body engine is required.
- Pools cover enemies, projectiles, pickups, particles, and damage labels. No per-frame allocations in measured hot paths.
- Update order is specified and tested: input → movement → spawn → AI → weapons → projectile motion → broad phase → hits/status → deaths/drops → XP/level queue → boss/run state → event emission → snapshot.
- A simultaneous lethal hit and level-up resolves lethal damage first; pending level choices do not revive the player unless an explicit revive effect exists.
- Pause freezes simulation ticks and timed gameplay effects; UI animation and audio fades may continue on a separate presentation clock.

## 6. Content contract

Canonical launch content and numerical baselines are defined in [`docs/01-GAME-DESIGN-DOCUMENT.md`](docs/01-GAME-DESIGN-DOCUMENT.md). Content IDs are stable `lower_snake_case` strings and are never reused. Display names are localization data, not IDs.

Evolution requires a level-8 base weapon, its specified passive at level 1+, and an elite/boss chest. Six launch evolutions are intentionally discoverable; two base weapons have no evolution in 1.0 and remain viable through capstone upgrades.

## 7. Save and progression contract

The schema and migration policy in [`docs/07-SAVE-AND-PROGRESSION.md`](docs/07-SAVE-AND-PROGRESSION.md) are normative. Saves contain settings, unlocks, achievements, discovery, permanent upgrades, aggregate statistics, last-run recovery metadata, and provenance. They never contain executable code or unvalidated content IDs.

Writes are checksum-validated and atomic: write candidate → validate/read back → rotate primary to backup → promote candidate. On corruption, try backup, then salvage safe sections, then offer reset. Never silently erase progress.

Permanent upgrades are capped and modest; the full tree contributes no more than approximately +25% effective baseline power/defense. Unlocks expand options more than they inflate stats.

## 8. Presentation contract

- World readability order: player/boss telegraphs > enemy attack telegraphs > pickups > damage feedback > decorative particles.
- Normal enemies cannot use the player's primary outline color. Boss attacks use shape plus color plus timing.
- Camera shake has a global cap and user scale including zero. Hit stop never freezes input sampling and is shorter for routine hits than elites/bosses.
- Audio uses buses: master, music, SFX, UI, ambience. Voice is absent in 1.0. Cue concurrency and priority prevent channel storms.
- Haptics are semantic and optional; never trigger on every normal damage tick.
- Final icons are coherent licensed/custom vector or sprite assets; emoji and placeholder glyphs are forbidden.

## 9. Performance release gates

At M1 and M11, validate:

- 60 FPS target, frame p95 ≤ 18.5 ms on reference mid-tier Android; 30 FPS floor, frame p95 ≤ 33.3 ms on minimum device in worst approved stress scene.
- Stress scene: 300 active enemies, 250 projectiles, 400 pickups, 800 visible particles (pooled), 40 damage labels, full HUD.
- Android steady-state memory target ≤ 220 MB PSS and no unbounded growth across three consecutive runs; hard investigation threshold 300 MB.
- Initial interactive shell ≤ 3 s warm / ≤ 6 s cold on reference mid-tier after local install; web critical loader bundle is budgeted separately from deferred game assets.
- Simulation remains deterministic under 30/60/120 Hz render schedules and after pause/resume.

Budgets may only be changed with recorded device evidence and an explicit Master Spec amendment.

## 10. Release and legal gates

- No code, font, art, audio, or sample asset enters a production bundle without source URL, exact license, creator, local path, modification status, attribution text, and reviewer in the manifests.
- Missing/ambiguous licenses are labeled `UNVERIFIED — DO NOT USE YET` and excluded from builds.
- GPL/AGPL code is not approved for incorporation. LGPL/MPL dependencies need architecture and distribution review. CC-BY media requires preserved attribution. CC-BY-SA and CC-NC assets are not approved for 1.0 without owner/legal approval. CC0 is preferred.
- Repository-owned original code license is an owner decision; third-party notices remain regardless.
- Google Play and target API requirements are time-sensitive and must be reverified from official sources within 30 days of release submission.
- Version 1 declares no personal-data collection. A public privacy policy must accurately state local-only storage and any platform/hosting logs outside the app's control.

## 11. AI-agent invariants

Every coding agent must read this file and [`docs/15-AI-DEVELOPMENT-RULES.md`](docs/15-AI-DEVELOPMENT-RULES.md) before changing code. Agents may not change architecture, dependency policy, IDs, schemas, balancing, or license status implicitly. A conflict is resolved by stopping, citing the conflicting clauses, and requesting an explicit specification change.

## 12. Owner decisions required before implementation milestone M2

1. **Business model:** free/no ads versus one-time paid. The architecture stays ad-free either way.
2. **Repository code license:** proprietary/all-rights-reserved, source-available, or a permissive open-source license.
3. **Cultural review budget/process:** name the reviewers and acceptance gate before final terminology/art approval.
4. **Orientation:** recommendation is landscape-only for 1.0; owner approval is required because it affects store media and mobile control layout.

## 13. Document index

- [Project vision](docs/00-PROJECT-VISION.md)
- [Game design](docs/01-GAME-DESIGN-DOCUMENT.md)
- [Technical architecture](docs/02-TECHNICAL-ARCHITECTURE.md)
- [Open-source research](docs/03-OPEN-SOURCE-RESEARCH.md)
- [Visual assets](docs/04-ASSET-MANIFEST.md)
- [Audio](docs/05-AUDIO-MANIFEST.md)
- [UI/UX](docs/06-UI-UX-SPEC.md)
- [Save and progression](docs/07-SAVE-AND-PROGRESSION.md)
- [Performance](docs/08-PERFORMANCE-BUDGET.md)
- [Testing](docs/09-TESTING-STRATEGY.md)
- [Android/Play release](docs/10-ANDROID-PLAYSTORE-RELEASE.md)
- [Web/Vercel deployment](docs/11-WEB-VERCEL-DEPLOYMENT.md)
- [Licensing and credits](docs/12-LICENSING-AND-CREDITS.md)
- [Security and privacy](docs/13-SECURITY-PRIVACY.md)
- [Development roadmap](docs/14-DEVELOPMENT-ROADMAP.md)
- [AI development rules](docs/15-AI-DEVELOPMENT-RULES.md)
