# RAKSHAK — Functional Development Roadmap

No calendar estimates are promises. A milestone exits only on evidence and acceptance criteria. Implementation may not begin until the owner approves the pre-development specification.

## M0 — Research and architecture

**Objective:** remove major product, technical, legal, cultural, and release uncertainty.

**Systems:** vision, GDD, architecture, repositories/assets/audio research, UI, save, performance, tests, release, privacy, roadmap, AI rules.

**Dependencies:** none.

**Acceptance criteria:** all documents exist; no unmarked uncertainty; owner decisions listed; direct sources recorded; Master Spec consistent; no game implementation/dependency initialization.

**Tests/review:** link/license spot checks, contradiction/placeholder scan, content-count reconciliation.

**Deliverables:** this documentation set and owner review record.

## M1 — Technical prototype

**Objective:** validate shared core/protocol, Pixi web, Skia native, input/audio/storage lifecycles, and performance assumptions using disposable shapes/assets.

**Required systems:** workspace boundaries; fixed-step runner; seeded RNG; snapshot/event protocol; synthetic 300-enemy stress; two renderer adapters; minimal touch/keyboard; lifecycle; debug metrics.

**Dependencies:** M0 approval; physical reference devices; exact version recheck.

**Acceptance criteria:** identical deterministic checksums; performance budgets pass or architecture amendment approved; pause/resume/resize/focus/audio unlock work; no React entity loop.

**Tests:** RNG known answers, replay checksum, adapter contracts, 12-minute soak, memory/thermal traces.

**Deliverables:** throwaway prototype, benchmark report, pinned-dependency decision record. No production art/content pipeline yet.

## M2 — Core combat

**Objective:** production-quality player movement, damage, collision, health, one enemy, and two representative weapons.

**Required systems:** world/entity store, spatial grid, pools, Talwar/Dhanush behaviors, hit/status event pipeline, camera, basic HUD.

**Dependencies:** M1 renderer/core pass.

**Acceptance criteria:** deterministic combat; exact stat stacking/caps; readable hit/death flow; keyboard/touch parity.

**Tests:** combat/property suite, collision boundaries, contact invulnerability, pool overflow, replay parity.

**Deliverables:** controlled combat arena and authored combat metrics.

## M3 — Enemy and wave systems

**Objective:** scalable director, roster roles, elite framework, boss state machine, map boundaries/hazards.

**Required systems:** threat budgets, spawn groups/caps, 16 data definitions initially using prototype visuals, four elites, reusable boss phase framework.

**Dependencies:** M2.

**Acceptance criteria:** minute-based pressure curve; no unavoidable telegraph combinations; entity caps/budgets hold; first boss pattern complete.

**Tests:** director seeds, spawn caps, AI states, boss saturation/phase edges, stress profiles.

**Deliverables:** wave sandbox, director graphs, enemy/boss authoring guide.

## M4 — Weapons and upgrades

**Objective:** complete build-construction loop.

**Required systems:** eight weapons, eight passives, six evolutions, level offers, reroll/bad-luck rules, chest/evolution sequence, tooltips.

**Dependencies:** M2/M3; content schema validation.

**Acceptance criteria:** all content data-defined; recipes correct; at least three viable prototype archetypes; no scattered balance constants.

**Tests:** offer properties, every weapon/evolution scenario, stacking caps, deterministic rerolls, tooltip/value consistency.

**Deliverables:** build matrix, balance simulator output, complete prototype arsenal.

## M5 — First complete playable run

**Objective:** one polished Gaon run from selection through results.

**Required systems:** Asha, Gaon, 16-role subset/mixes, lieutenant bosses, Bell-Warden, XP/level-up, results, pause, checkpoint.

**Dependencies:** M3/M4; minimal licensed art/audio intake.

**Acceptance criteria:** 12-minute run starts/ends/resumes correctly; first-run comprehension; performance and save gates pass; audiovisual feedback baseline feels intentional.

**Tests:** full golden replay, edge-case matrix, first-time playtest, release-like web/native builds.

**Deliverables:** vertical slice and review capture.

## M6 — Meta progression

**Objective:** replayable offline profile loop.

**Required systems:** save schema/migrations/recovery, currency, six capped tracks/respec, unlock engine, collection, characters, achievements, settings.

**Dependencies:** M5 run facts/results.

**Acceptance criteria:** no duplicate rewards/data loss; reset/recovery truthful; all 24 achievement rules and launch unlocks functional.

**Tests:** migration/corruption/power-loss corpus, idempotency, economy simulation, three-run app-kill soak.

**Deliverables:** complete menu→run→meta→run loop.

## M7 — Full content

**Objective:** deliver four guardians/maps/bosses and final launch roster.

**Required systems:** Van/Marusthal/Durg hazards and bosses; all guardian traits; field notes; Night Oaths; custom identity art.

**Dependencies:** M5/M6; cultural review workflow; approved asset manifests.

**Acceptance criteria:** every map/guardian clearable; distinct build values; no placeholder/unverified media; terminology/cultural review passed.

**Tests:** content validator, map/guardian replay matrix, silhouette/telegraph tests, cultural/license audit.

**Deliverables:** content-complete alpha.

## M8 — Audiovisual and UX polish

**Objective:** production game feel and cohesive interface.

**Required systems:** final particles, shake/hit stop, death/XP/evolution/boss sequences, haptics, adaptive music/mixer, all screens/transitions/accessibility.

**Dependencies:** content timing stable; final audio/art sources.

**Acceptance criteria:** reduced-effects parity; audio concurrency budgets; coherent style; no fake/placeholder UI; Credits complete.

**Tests:** audiovisual checklist, accessibility/control matrix, audio interruption, performance with full effects.

**Deliverables:** beta candidate and final manifests/notices draft.

## M9 — Web production build

**Objective:** secure, fast playable Next.js/Vercel version with reliable local saves and subsequent offline use.

**Required systems:** client-only mount, asset hashing/caching, IndexedDB, PWA manifest/service worker/update UX, CSP/security headers, privacy page.

**Dependencies:** M8; Vercel plan/domain decision.

**Acceptance criteria:** browser matrix; audio/fullscreen/input; cache fresh/update/rollback/offline; no unintended network calls/analytics; load budgets pass.

**Tests:** preview/production smoke, CSP, context loss, private/quota storage, Lighthouse shell plus gameplay profiling.

**Deliverables:** production deployment, rollback runbook, deployment evidence.

## M10 — Android production build

**Objective:** signed production-ready AAB for `roy.ij.rakshak`.

**Required systems:** Expo/EAS Android config, API 36+, secure upload signing, Play App Signing setup, manifest/privacy/backup decisions, release build.

**Dependencies:** package/account verification; M8; current policy recheck.

**Acceptance criteria:** AAB installs via Play internal track; no unexpected permission/network; lifecycle/device tests; size/ABI/signing correct.

**Tests:** clean install/update/process death/audio/back/device matrix, artifact inspection.

**Deliverables:** versioned AAB and secure release artifacts/runbook.

## M11 — QA and performance

**Objective:** prove release quality across full content and target devices.

**Required systems:** regression triage, balance tuning, optimization, localization readiness, license/security audits.

**Dependencies:** M9/M10 candidates.

**Acceptance criteria:** no P0/P1; performance/memory/load budgets; 24 achievements; save upgrades; full manifest matches bundles; owner/cultural acceptance.

**Tests:** complete strategy, three-run soak, all maps/guardians/oaths, pre-launch report, browser/device matrix.

**Deliverables:** release candidate, signed QA report, known-issues/waiver log.

## M12 — Play testing and release

**Objective:** satisfy Play track/account requirements and safely launch.

**Required systems:** listing, media, IARC, Data Safety, privacy policy, testers/feedback, staged rollout, vitals monitoring.

**Dependencies:** M11; package registration; account-specific 12-testers/14-days gate if applicable.

**Acceptance criteria:** production access approved; listing truthful; store artifact matches QA hash; staged rollout healthy; web version stable.

**Tests:** Play-delivered build smoke, upgrade from test build, listing links, post-release save/performance check.

**Deliverables:** Google Play 1.0.0 release, Vercel production release, archived compliance/release record.
