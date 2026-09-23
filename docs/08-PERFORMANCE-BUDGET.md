# RAKSHAK — Performance Budget

## 1. Target tiers

The exact device models must be selected from available hardware before M1. Use capability tiers, not marketing labels.

- **Minimum Android:** Android 10+, 4 GB RAM, low-tier 64-bit GPU/CPU still eligible in Play catalog.
- **Reference Android:** currently common mid-tier device, 6 GB RAM, 60 Hz.
- **High Android:** 8+ GB, 90/120 Hz for refresh/interpolation checks.
- **Web:** current and previous major Chrome/Edge/Firefox desktop; current Safari desktop; current Chrome Android; current Safari iOS for browser version.

`minSdk` is not a performance claim. Final Android OS/device coverage follows Expo/Play constraints and real device results.

## 2. Frame targets

| Metric | Reference target | Minimum floor |
|---|---:|---:|
| display FPS | 60 | stable 30 with auto quality |
| frame p95 | ≤18.5 ms | ≤33.3 ms |
| frame p99 | ≤25 ms | ≤45 ms, no repeated spikes |
| simulation tick | 30 Hz; p95 ≤8 ms | p95 ≤16 ms |
| input-to-visible movement | ≤100 ms | ≤150 ms |
| long stalls | none >100 ms in standard run | max one investigated incident |

Capture CPU, GPU/UI, JS/sim, GC, memory, thermal behavior, and battery drain where tools allow. Averages alone cannot pass a gate.

## 3. Approved stress scene

- 300 active enemies (350 hard allocation capacity).
- 250 gameplay projectiles (400 capacity).
- 400 uncollected XP objects (600 capacity); excess combines spatially.
- 800 visible presentation particles (1,200 pool), with quality LOD.
- 40 damage labels (64 pool); dense damage aggregates.
- 24 concurrent mobile audio voices target, 32 hard cap.
- Full HUD, boss telegraph, map hazard, and touch input active.

These are design budgets, not promises from a library. M1 measurements may lower content density only with equivalent perceived pressure and a Master Spec amendment.

## 4. Rendering budgets

- Target world draw calls/batches: ≤30 typical, ≤50 stress; verify with renderer tooling.
- Texture bindings: group by atlases; target ≤4 world atlases resident per map plus UI/font atlases.
- Atlas maximum dimension defaults to 2048×2048 for broad mobile support; 4096 only after device validation.
- Base render resolution capped independently of screen DPR; auto mode may reduce to 0.75/0.5 scale under sustained pressure.
- Dynamic bitmap text or pooled glyph sprites for combat labels; do not regenerate canvas/native text per hit.
- Avoid full-screen filters, nested masks, uncontrolled blend changes. Pixi documents batch breaks and filter/mask costs in its [performance guide](https://pixijs.com/8.x/guides/concepts/performance-tips).
- Cull off-camera presentation while keeping simulation as designed. Never use rendering cull to change combat outcomes.

## 5. Memory and package budgets

- Android steady-state PSS: target ≤220 MB; investigate >250 MB; release blocker at sustained >300 MB on reference device.
- No upward memory trend across three back-to-back runs after returning to menu.
- Decoded textures per map: target ≤96 MB at full quality; low tier ≤48 MB.
- Audio decoded-buffer pool: target ≤32 MB; stream long music when the platform adapter supports reliable offline playback.
- Native install/download sizes are tracked per build; Google Play's current per-device compressed APK limit is documented in the release guide, but the project target should remain far below it.
- Web initial shell JS target ≤250 KB gzip excluding framework baseline where measurable; defer renderer/map/audio. First playable critical assets target ≤8 MB compressed on typical first map, then lazy-load.

## 6. Load targets

- Installed Android cold launch to responsive menu: ≤6 s minimum, ≤3 s reference.
- Warm launch: ≤2 s reference.
- Menu to first run after assets cached/bundled: ≤3 s reference, ≤6 s minimum.
- Web first visit on simulated mid-tier mobile/4G: visible loader ≤1 s, interactive menu ≤4 s, first run ≤10 s; cached repeat ≤4 s to run.
- Never show a frozen blank canvas. Load stages and recovery errors are named.

## 7. Simulation optimization

- Fixed 30 Hz authoritative update with render interpolation.
- Uniform spatial hash rebuilt without per-entity allocations; squared distance tests.
- Pool all high-churn objects. Pools have observed high-water marks and overflow policies.
- No closures/temporary arrays/string formatting in hot entity loops.
- Stable staggered AI: costly targeting/steering is divided across ticks by entity ID.
- XP combines after thresholds by nearby cell and value; collection preserves total XP.
- Damage events aggregate presentation only; every gameplay hit remains correctly applied.
- Use typed arrays/SoA only where profiler evidence shows benefit. Clear object-oriented records are acceptable outside hot loops.

## 8. Quality degradation ladder

Automatic degradation affects presentation, in this order:

1. Reduce decorative particle emission/lifetime.
2. Reduce damage-number density.
3. Lower render scale.
4. Lower non-critical enemy animation rate while preserving movement/telegraphs.
5. Simplify shadows/lighting/full-screen effects.

Never reduce enemy logic, collision frequency, attack telegraphs, input sampling, boss behavior, or XP value. Simulation tick downgrade to 20 Hz is not approved for 1.0.

## 9. Profiling protocol

- Record 60-second scripted scenarios at minutes 1, 6, 10, and stress scene; then a full 12-minute soak.
- Run release/profile builds, not developer mode.
- Repeat three times after thermal stabilization; report median and worst.
- Android: Perfetto/Android Studio profiler, frame metrics, PSS, thermal status.
- Web: browser Performance/Memory tools, Pixi stats, Lighthouse only for shell/loading—not gameplay FPS.
- Store device/OS/build/content hash, power mode, temperature notes, resolution, quality, and raw traces.

## 10. Gates

- **M1:** renderer/core feasibility with synthetic art.
- **M5:** complete-run worst-wave validation.
- **M8:** VFX/audio budgets and reduced-effects parity.
- **M9:** browser loading/cache/update and mobile web.
- **M10:** signed-like Android release profile.
- **M11:** full matrix, memory/thermal soak, regression thresholds in CI where possible.

No “runs smoothly on my phone” sign-off is acceptable.
