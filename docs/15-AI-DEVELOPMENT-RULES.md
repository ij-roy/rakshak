# RAKSHAK — Mandatory AI Development Rules

These rules apply to every AI coding/review agent and human contributor. They are optimized to prevent architecture drift, hallucinated dependencies/assets, duplicated rules, and superficially complete features.

## 1. Start-of-task protocol

Before changing code:

1. Read `RAKSHAK_MASTER_SPEC.md` and the relevant numbered documents.
2. Inspect existing code/tests/config and working-tree changes; preserve unrelated work.
3. Restate the requested scope, affected package boundaries, acceptance criteria, and tests in the work plan.
4. Identify conflicts/ambiguity. Do not resolve them by invention. The Master Spec wins unless the developer explicitly amends it.
5. Check asset/dependency/license implications before introducing files/packages.

No agent may begin a neighboring feature “while here” without explicit scope.

## 2. Architecture invariants

- One authoritative gameplay implementation in `packages/game-core`/`game-data`.
- Core cannot import React, React Native, Expo, Next, Pixi, Skia, DOM/browser globals, platform storage/audio/haptics, network, or wall-clock timers.
- Renderer objects never own gameplay state. They consume snapshots/events and may drop only presentation detail.
- Apps depend inward on packages; packages never import from apps.
- Platform-specific behavior is isolated behind documented contracts. It cannot change combat/progression/RNG.
- Fixed simulation ticks and named seeded RNG streams; no `Math.random()` in game/progression code.
- Stable content IDs are not renamed/reused casually. Display names are localization.
- Balance values live in validated game data, not UI/render/system literals.
- Saves use the canonical schema/migrations; no component directly reads/writes storage.
- React state is not used per frame for enemies/projectiles/particles.
- Network/backend/auth is prohibited unless the Master Spec is explicitly changed.

## 3. File/module standards

- One clear responsibility per module; public API/types documented.
- Split before a file becomes difficult to reason about; 400 lines is a review trigger, not an automatic failure. Generated data and cohesive lookup tables are exceptions and must be labeled.
- No giant scene/game component, “manager” dumping ground, cyclic dependency, or cross-package deep import.
- Prefer pure functions and explicit data flow in rules.
- TypeScript strict mode. `any`, non-null assertions, unchecked casts, `@ts-ignore`, and disabled lint rules require a local explanation and reviewer approval.
- Exhaustive switches for domain unions; impossible states represented by types where practical.
- No silent catch, empty catch, ignored Promise, or user-visible failure without recovery/message.
- No dead/abandoned code, commented-out implementation, fake fallback, unexplained magic number, or `TODO` in release paths.
- Logging is structured, bounded, non-PII, and stripped/reduced in production.

## 4. Dependency policy

Every new dependency proposal records:

- exact problem and API surface needed;
- why a local/standard implementation is insufficient;
- alternatives considered;
- license and source;
- maintenance/release/security health;
- runtime/bundle/native-build impact;
- platform compatibility;
- removal/fallback strategy.

Pin through the lockfile. Do not install “just to try” in production work. Do not add a library for trivial math, event emitting, ID generation, or shallow object helpers. Do not implement cryptography or complex parsers casually where a reviewed standard is required.

## 5. Gameplay/data rules

- Update order is canonical and tested.
- Entity iteration is stable where outcomes depend on order.
- Presentation RNG cannot perturb spawn/upgrade/loot streams.
- Mechanics/tooltips/tests share the same data; do not duplicate values in copy.
- New weapon/enemy/status needs schema, stable ID, tests, balance metrics, renderer/audio cue mapping, collection entry, and docs update.
- Performance optimization cannot alter gameplay without a specification change.
- Pools have capacity/overflow behavior and diagnostics; never silently lose gameplay-critical entities.

## 6. Testing rules

- Feature/bug work begins with a failing automated test when the behavior is testable.
- New rules require unit/property tests and deterministic replay coverage where applicable.
- Save changes require migration and corruption fixtures.
- Adapter changes require contract/integration tests on affected platform.
- UI changes require touch + keyboard/focus behavior and relevant screenshots/manual QA.
- Performance-sensitive changes run the standard scene and report before/after evidence.
- Never weaken/remove a test merely to make CI pass. If expectation is wrong, explain the specification evidence.
- Completion claims require running the relevant commands and quoting summarized results; “should pass” is not evidence.

## 7. Asset and license rules

- No asset/code is copied from search results, commercial games, random repositories, or examples without provenance.
- Root repository license never automatically covers bundled third-party media.
- Add source/license manifest record before runtime use; build must reject non-approved status.
- Do not generate placeholder content and leave it in production paths.
- Do not use emoji as final icons.
- AI-generated media requires approved tool terms, input/prompt/source record, and human visual/cultural/license review.
- Cultural terms/symbols marked for review cannot be “approved” by an AI agent.
- Update `THIRD_PARTY_LICENSES.md`, `ASSET_LICENSES.md`, Credits, and docs in the same change that introduces covered material.

## 8. UI/UX rules

- Use `docs/06-UI-UX-SPEC.md` tokens/patterns; do not invent random gradients, glass cards, rounded SaaS panels, icon families, or animation styles.
- Every visible control works, has states, focus/pressed/disabled behavior, and honest copy.
- Required actions support appropriate keyboard and touch input.
- Respect safe areas, reduced effects, contrast, text scaling, and minimum touch targets.
- Gameplay canvas never swallows menu focus or browser escape paths.
- Loading/errors name what is happening and provide recovery.

## 9. Refactoring and architecture changes

- Refactor only what supports requested work or resolves demonstrated risk.
- Preserve behavior with tests before structural change.
- Architecture changes require: problem/evidence, alternatives, migration, risks/fallback, affected docs, explicit owner approval when they contradict Master Spec.
- No mass renames, folder reorganizations, formatter churn, or dependency major upgrades mixed with feature logic.
- Delete obsolete code after consumers migrate; do not keep parallel old/new systems indefinitely.

## 10. Documentation/change discipline

Update the same change when behavior affects:

- Master Spec decision/invariant;
- game-design content/balance/unlock;
- architecture/interface/package boundary;
- save schema/migration;
- performance budget/result;
- release/privacy/store declaration;
- license/asset/audio provenance.

Record why, not only what. Date volatile research and link authoritative sources. Mark unresolved facts `UNVERIFIED — DO NOT USE YET`.

## 11. Security/privacy rules

- Never add analytics, crash upload, ads, remote config, authentication, cloud storage, or background network calls implicitly.
- Never log/export secrets, full user paths, device identifiers, or personal data.
- Validate untrusted saves/content; no executable data, `eval`, remote scripts, or runtime downloads required for native play.
- Secrets/signing keys never enter repository, prompts, logs, fixtures, or screenshots.
- Inspect final manifest/network behavior rather than assuming dependency behavior.

## 12. Git/change hygiene

- Preserve user changes and unrelated dirty files.
- Small coherent commits; generated outputs clearly labeled and reproducible.
- No destructive reset/checkout. No force push without explicit authorization.
- Review diff for accidental binaries, credentials, source assets lacking manifests, lockfile churn, debug code, and platform-generated files.

## 13. Definition of done

A task is done only when:

- requested behavior and acceptance criteria work on all affected platforms;
- relevant automated tests pass and manual/device evidence is recorded;
- determinism/save/performance/license/privacy implications are addressed;
- no placeholder, silent failure, dead path, unresolved warning, or unapproved dependency/asset remains;
- docs/manifests/credits are updated;
- code respects boundaries and types;
- diff is reviewed for scope and regressions;
- any deviation from specification is explicitly approved and reflected in the Master Spec.

## 14. Mandatory stop conditions

Stop and ask the developer when:

- requested implementation conflicts with Master Spec;
- a license, ownership, cultural meaning, privacy declaration, or package name is unclear;
- a destructive migration/data reset is proposed;
- a new backend/network/monetization/analytics feature is implied;
- performance cannot meet budget without changing gameplay scope;
- signing/release credentials or external account actions are required.

Do not hide the conflict behind a “reasonable assumption.”
