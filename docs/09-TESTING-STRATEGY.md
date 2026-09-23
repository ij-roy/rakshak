# RAKSHAK — Testing Strategy

## 1. Test pyramid

1. Pure unit/property tests for core rules, RNG, calculations, migrations, achievements.
2. Deterministic simulation tests and golden replays.
3. Adapter contract tests for render/audio/input/storage/lifecycle.
4. Integration tests in Expo and browser shells.
5. Manual gameplay, accessibility, audiovisual, device, and release testing.

Tests use public behavior and stable IDs. Snapshot tests do not replace assertions about mechanics.

## 2. Automated core coverage

### Combat

- damage order, armor caps, criticals, invulnerability, knockback resistance;
- cooldown/duration/area/pierce stacking and caps;
- projectile hit-once rules, returning paths, chain selection, AoE boundaries;
- status refresh/stack/expiry and boss immunities/resistance;
- evolution prerequisites and chest priority.

### Progression/offers

- XP thresholds, multi-level queue, slot limits, maxed filtering;
- offer uniqueness, owned-item guarantee/bad-luck rule, deterministic reroll;
- permanent costs/caps/respec and no duplicate rewards;
- all 24 achievement predicates and character/map unlocks.

### RNG/determinism

- known-answer vectors for PRNG;
- stream independence;
- same seed/input/content produces per-tick/final checksum on Node, browser, Android JS runtime;
- different render rates and pause intervals produce same simulation result.

### Saves

All tests listed in `07-SAVE-AND-PROGRESSION.md`, including power-loss simulation and schema fuzzing.

## 3. Simulation/golden scenarios

- no-input death baseline;
- circular movement survival baseline;
- each guardian × weapon at fixed seed;
- each evolution against controlled single target, swarm, armored, and boss;
- director minute markers and entity caps;
- full 12-minute replay with checksum milestones;
- stress scene and pool overflow policy;
- boss phase transitions at exact health/tick boundaries.

Golden output records checksums and a compact metrics envelope, not huge serialized worlds. Intentional balance changes update goldens with a reviewed explanation.

## 4. Required edge cases

- Simultaneous player death and level-up: death resolves first.
- Final boss and player death in the same tick: victory after both death sequences, matching the Master Spec; non-final mutual deaths continue normal run-state resolution.
- Pause during hit stop, boss intro, evolution, and audio crossfade.
- Multiple queued levels when boss intro triggers.
- Boss spawn while entity pool is saturated.
- 300+ enemies, projectile overflow, pickup combine, damage-label culling.
- Corrupted primary/backup, interrupted migration, full quota/disk.
- App background/kill/resume; audio interruption/headphones; phone call scenario.
- Android Back in every screen/modal and during loading.
- Browser blur/visibility loss/back/reload/fullscreen exit.
- Resize/orientation/safe-area change; DPR and ultrawide.
- Touch then keyboard, keyboard then touch, stuck pointer/key release.
- Low-memory renderer/context loss where reproducible.

## 5. Platform integration

### Web

- Current/previous Chrome, Edge, Firefox; current Safari.
- Desktop keyboard and touch emulation plus at least one real Android Chrome and iOS Safari device.
- Audio unlock/rejected autoplay, IndexedDB unavailable/private mode, service-worker fresh/install/update/offline/rollback.
- WebGL context loss/restoration; dynamic import/SSR safety; CSP violations.
- Vercel preview and production cache headers/content hashes.

### Android

- Release-like Expo/EAS build, not only Expo Go.
- Clean install/update/downgrade rejection, AAB-generated APK through Play internal test.
- Cold/warm launch, background/foreground, process death, low battery, thermal throttling.
- Cutouts/gesture navigation, different refresh rates, Bluetooth/wired audio, Do Not Disturb/vibration settings.
- No accidental sensitive permissions or unexpected network traffic.

## 6. Device matrix

| Tier | Physical requirement | Purpose |
|---|---|---|
| minimum | Android 10+, 4 GB, low-tier SoC | 30 FPS floor, memory/load |
| reference | Android 13–15, 6 GB, common mid-tier, 60 Hz | primary 60 FPS gate |
| high | Android 15–16, 8+ GB, 120 Hz | interpolation/high refresh |
| alternate GPU | different major GPU vendor from reference | shader/driver issues |
| small/notched | compact landscape with cutout/gesture nav | HUD/touch safe area |

Use Play pre-launch reports/device catalog as additional evidence, never as a substitute for physical profiling. Exact models are selected based on team access and target-market device distribution before M1.

## 7. Gameplay QA sessions

- First-run comprehension: observe without coaching.
- Build viability: controlled players complete every guardian/map and test at least three archetypes.
- Readability: grayscale, reduced-effects, small-screen, sunlight/low brightness, audio-off.
- Difficulty telemetry is recorded locally in test builds and exported manually: deaths by minute/cause, offer histories, DPS, incoming damage, XP curve, entity counts.
- Cultural review: terminology, silhouettes, motifs, enemy framing, audio texture, credits.
- Licensed-content audit: compare runtime bundle against manifests.

## 8. Quality gates

- Pull request: typecheck, lint, unit/property tests, content/license validation, deterministic short replay.
- Nightly/local scheduled: full replay matrix, migration corpus, web/browser smoke, performance trend scene.
- Milestone: manual checklist, physical devices, accessibility, licensing diff, dependency audit.
- Release candidate: no P0/P1; no unresolved save corruption; budgets pass; 12-minute soak repeated; signed AAB/internal Play install; production Vercel offline-update test.

## 9. Severity

- **P0:** data loss, security/privacy breach, cannot launch/install, unlicensed shipped media.
- **P1:** crash, unwinnable run, deterministic divergence, severe performance floor breach, inaccessible required action.
- **P2:** incorrect mechanic/UI, significant audiovisual defect, isolated device issue with workaround.
- **P3:** polish/copy/minor visual issue.

P0/P1 block release. Waivers require owner sign-off, evidence, scope, and expiry.
