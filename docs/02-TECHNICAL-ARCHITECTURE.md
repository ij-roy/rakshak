# RAKSHAK — Technical Architecture

**Research date:** 2026-09-22  
**Decision state:** approved for prototype validation, not dependency installation

## 1. Decision

Build one framework-neutral TypeScript simulation and two thin render adapters:

- **Android:** Expo/React Native shell + React Native Skia renderer.
- **Web:** Next.js client route + PixiJS renderer, deployed to Vercel.
- **Shared:** rules, deterministic RNG, entities, combat, AI, spawning, upgrades, progression, content, protocol, save schema/migrations, asset IDs, audio cues, achievements, balance, and tests.

This is one game with two presentation backends—not two gameplay implementations.

As of the research date, the version candidates are Expo SDK 57, Next.js 16.3.6, PixiJS 8.21.0, and React Native Skia 2.10.1. These are **research observations, not pins**. M1 must recheck official release/security pages and lock exact versions: [Expo SDK 57](https://expo.dev/changelog/sdk-57), [Next.js release/security blog](https://nextjs.org/blog), [PixiJS releases](https://github.com/pixijs/pixijs/releases), [React Native Skia releases](https://github.com/Shopify/react-native-skia/releases).

## 2. Alternatives considered

### A. React Native Skia everywhere

Skia officially supports web through CanvasKit, but web adds asynchronous WASM loading and roughly 2.9 MB according to its installation documentation, and some APIs differ on web ([web setup](https://shopify.github.io/react-native-skia/docs/getting-started/web/)). It offers maximum render-code sharing, but browser startup and Next integration are worse fits than Pixi. Keep as a prototype comparison, not default.

### B. Phaser on web + Phaser in Android WebView

Phaser provides scenes, input, loader, audio, and physics and is productive for a web-only game. Phaser 4 is a young WebGL-focused major release; Canvas rendering was deprecated in v4 ([Phaser v4 changelog](https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/CHANGELOG-v4.0.0.md)). A WebView would share renderer code but introduces asynchronous bridges, Android System WebView variability, lifecycle/audio focus complexity, and accessibility boundaries. It remains a schedule fallback only. The bridge must never carry per-frame transforms ([React Native WebView guide](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Guide.md?plain=1)).

### C. Phaser/Pixi gameplay ownership

Letting a browser engine own physics, timing, and entities would force either WebView everywhere or a second native game. Rejected. Renderer objects are projections of core state.

### D. Raw Canvas2D/WebGL/WebGPU

Canvas2D lacks the GPU-oriented batching headroom desired for effects; raw WebGL/WebGPU creates unnecessary shader, resource, context-loss, and compatibility work. Pixi and Skia already provide the relevant primitives.

### E. React Native component-per-entity

Rejected. Hundreds of React reconciliation nodes are the wrong abstraction for a real-time sprite field. React owns screens, menus, accessibility overlays, and low-frequency HUD state; a single canvas/stage owns world rendering.

## 3. Why the decision fits RAKSHAK

PixiJS is a browser-first renderer. Its official performance guidance recommends spritesheets, batched sprites, bitmap text, deliberate draw ordering, explicit hit areas/culling, and limiting masks/filters—exactly the controls needed here ([guide](https://pixijs.com/8.x/guides/concepts/performance-tips)). WebGL remains its production recommendation; WebGPU is documented as subject to browser inconsistencies ([renderers](https://pixijs.com/8.x/guides/components/renderers)).

React Native Skia is native/JSI-oriented. `Atlas` is explicitly designed to draw many similar sprites/tiles with transform buffers, suitable for high-count enemies and particles ([Atlas](https://shopify.github.io/react-native-skia/docs/shapes/atlas/)). Its current documented floor is RN 0.79/React 19 and it supports Expo ([installation](https://shopify.github.io/react-native-skia/docs/getting-started/installation/)).

The split avoids compromising each platform while keeping the costly, bug-prone game rules singular.

## 4. Monorepo

Use `pnpm` workspaces plus Turborepo only if task caching demonstrates value; workspace scripts alone are sufficient initially. Do not initialize until owner approves this phase.

```text
apps/
  mobile/                    Expo Router shell and Android config
  web/                       Next.js App Router shell
packages/
  game-core/                 deterministic world and systems
  game-data/                 schema-validated launch content/balance
  game-protocol/             input, snapshot, event, replay types
  platform-contracts/        ports and contract test suites
  renderer-native-skia/      native scene projection
  renderer-web-pixi/         browser scene projection
  game-ui/                   tokens + logical layouts; platform components
  input/                     normalization and adapters
  audio/                     cue catalog, mixer policies, adapters
  storage/                   schema, migrations, repositories, adapters
  assets/                    typed manifest, atlases, license metadata
  shared/                    small platform-neutral utilities only
tools/
  atlas/ validate-content/ validate-licenses/ balance-sim/
```

### Dependency direction

```text
apps → adapters/UI → contracts/protocol → game-core + game-data
                                  storage → save-domain

game-core → protocol primitives + game-data types only
```

Enforce with TypeScript project references, workspace dependency declarations, and an import-boundary lint rule. `packages/shared` must not become a dumping ground.

## 5. Core API and data flow

Illustrative interfaces, not implementation:

```ts
type Tick = number;
type EntityId = number;

interface GameRuntime {
  readonly tick: Tick;
  step(input: InputSnapshot): readonly DomainEvent[];
  snapshot(out: MutableRenderSnapshot): RenderSnapshot;
  checksum(): bigint;
}

interface RendererPort {
  load(manifest: AssetManifest): Promise<void>;
  render(previous: RenderSnapshot, current: RenderSnapshot, alpha: number): void;
  resize(viewport: Viewport): void;
  dispose(): void;
}
```

The shell samples input. A fixed-step runner advances the core. The renderer interpolates immutable snapshots. Semantic events request audio, haptics, UI, or persistence. Adapters may drop low-priority presentation events under pressure; they may never drop gameplay events.

## 6. Fixed-step loop

- Authoritative tick: 30 Hz for launch, chosen to reduce JS work and snapshot bandwidth; render at the device refresh rate.
- Accumulate frame delta; clamp resume gaps; cap catch-up at four ticks. If still behind, record telemetry locally in debug builds and discard excess presentation time rather than spiral.
- Browser driver: `requestAnimationFrame`, using its timestamp and visibility lifecycle. MDN notes callback rates vary and calls are paused in most background tabs ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame)).
- Native: authoritative simulation begins on the JS thread. Skia/Reanimated frame callbacks drive presentation; benchmark snapshot transfer. Moving hot loops to worklets/native code requires a measured M1 failure and an architecture amendment.
- Rules use integer ticks, fixed-point or well-bounded IEEE-754 operations, stable iteration ordering, and documented rounding. Determinism is verified on both clients by replay checksums.

## 7. Entities, AI, and collision

Do not adopt a full ECS framework in 1.0. Use explicit systems over a world store with stable IDs and pooled dense arrays. This provides ECS-like data locality without framework indirection.

- Components: transform, motion, health, hurtbox, faction, enemy brain, weapon runtime, projectile, pickup, status, lifetime.
- Broad phase: rebuild a uniform spatial grid each tick for active combat bounds. Cell size derives from the common collision diameter and is benchmarked.
- Narrow phase: squared-distance circle tests; AABBs only for map blockers/rectangular telegraphs.
- AI: simple finite state functions and steering vectors; stagger expensive decisions over ticks by stable entity ID.
- Physics: no Matter.js/rigid-body engine. Phaser's own docs position Arcade Physics for simple shapes, but renderer/engine-owned physics would violate shared authority ([Phaser physics](https://docs.phaser.io/phaser/concepts/physics)).

## 8. RNG and replayability

Use a small, explicitly specified PRNG whose algorithm and 64-bit seed serialization are stable across JS environments. Candidate: `xoshiro128**` with unsigned 32-bit operations, implemented in-house from the published algorithm only after license/provenance review.

Named child streams ensure a cosmetic random draw cannot alter spawns. A replay stores content version, seed, initial loadout, and per-tick normalized input. Replays are debug/test artifacts, not a 1.0 user feature.

## 9. Rendering

### Shared render protocol

Snapshots contain camera, sprites, animation frame IDs, tint/alpha, telegraphs, particle emit commands, and HUD aggregates. They reference typed asset IDs—not framework textures.

### Native Skia

- Group same-atlas sprites into a small number of `Atlas` draws.
- Use transform/color buffers; avoid one React node per sprite.
- Keep static terrain cached or tiled; clamp device pixel ratio/render scale.
- Presentation-only particles can run in adapter buffers, seeded from domain events.

### Web Pixi

- WebGL/WebGL2 default; do not require WebGPU in 1.0.
- Regular pooled Sprites first. Consider `ParticleContainer` only after profiling because current documentation calls its API stable but experimental ([ParticleContainer](https://pixijs.com/8.x/guides/components/scene-objects/particle-container)).
- Atlas/spritesheet batching; bitmap fonts for frequently changing numbers; order by texture/blend; no per-entity interaction handlers.
- Handle context loss, resize, visibility, and reduced-motion preferences.

## 10. Input

Normalize to `InputSnapshot { moveX, moveY, pause, confirm, cancel }` at each tick.

- Android: React Native Gesture Handler pan/tap stream; it integrates with Reanimated and is built for native touch handling ([official docs](https://docs.swmansion.com/react-native-gesture-handler/)).
- Web: Pointer Events plus Keyboard Events; `touch-action: none` only on the game surface. Ignore key repeat for edge actions and clear held state on blur/visibility loss.
- Map screen pixels through a viewport transform. Simulation consumes unit vectors, never device coordinates.

## 11. Audio and haptics

`game-core` emits cue IDs with position, intensity, and deduplication key. Mixer policy limits concurrency by cue group and ducks buses for level-up/boss transitions.

- Mobile: `expo-audio` candidate; preload bundled cues and verify overlapping short sounds, audio focus, headphone changes, interruptions, and backgrounding against [official documentation](https://docs.expo.dev/versions/latest/sdk/audio/).
- Web: Web Audio adapter is preferred for low-latency pooling and bus control. Unlock/resume only after user activation.
- Haptics: `expo-haptics` adapter; web vibration is optional/non-authoritative ([official docs](https://docs.expo.dev/versions/v57.0.0/sdk/haptics/)).

## 12. Assets

A generated manifest maps stable asset IDs to platform-resolved sources, atlas rectangles, dimensions, frame timing, hashes, license record IDs, and preload groups. Critical native assets are embedded; Expo warns runtime cache downloads are not durable enough for mandatory offline assets ([Expo Asset](https://docs.expo.dev/versions/latest/sdk/asset/)). Web uses content-hashed filenames and a service worker only after an offline-cache prototype.

## 13. Storage

The save domain owns serialization, validation, migrations, backup, and checksums. Platform adapters provide atomic-ish blobs/transactions:

- Android default: Expo SQLite `kv-store` or a small SQLite table; benchmark and pin after M1. AsyncStorage is an alternative and is unencrypted ([official project](https://react-native-async-storage.github.io/)).
- Web: IndexedDB. `localStorage` is settings/emergency fallback only because it is synchronous and quota-limited.

See [`07-SAVE-AND-PROGRESSION.md`](07-SAVE-AND-PROGRESSION.md).

## 14. Error handling and observability

- Release builds have a local rotating diagnostic log with no PII and a user-triggered export action; nothing uploads automatically.
- Fatal renderer errors pause the game, persist a safe checkpoint if possible, and show a recovery screen.
- Invalid content fails CI/build, never degrades silently.
- Missing optional presentation asset uses an explicit debug fallback only; release validation forbids it.
- Debug HUD exposes frame p50/p95/p99, sim time, render time, active/pool counts, allocations where measurable, draw calls, and memory estimate.

## 15. Risks and fallbacks

| Risk | Gate | Fallback |
|---|---|---|
| JS→Skia snapshot bandwidth | M1 stress/soak | compact typed buffers; 30 Hz snapshots; measured worklet hot path |
| two renderers drift visually | golden snapshot/protocol tests | renderer conformance scenes and reference captures |
| Pixi/WebGL device variance | browser matrix | render-scale/VFX LOD; Skia Web spike |
| native Skia blocker | M1 | WebView-hosted Pixi adapter, discrete bridge only |
| service-worker stale content | M9 update tests | versioned caches, rollback deployment, online-only first load disclaimer |
| dependency major churn | quarterly audit | pinned versions; no blind upgrades during content milestones |

## 16. M1 acceptance gate

The architecture is validated only when a throwaway vertical prototype—not production content—demonstrates:

- identical seeded checksums on Android and web;
- 300 enemies, 250 projectiles, 400 XP pickups, 800 pooled particles, and 40 labels;
- budgets from `08-PERFORMANCE-BUDGET.md` on reference devices;
- pause/resume, resize, focus loss, audio unlock/interruption, and touch/keyboard behavior;
- no per-frame React reconciliation for world entities;
- a measured decision log confirming or amending the renderer choices.
