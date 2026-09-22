# RAKSHAK — Open-Source Research

**Research date:** 2026-09-22  
**Rule:** code license never implies bundled-asset license. Re-source assets from their original publisher.

## Recommendation

Do **not** fork an existing survivor game. Build RAKSHAK's TypeScript core against the architecture in this specification and use permissively licensed projects as behavioral references. Existing candidates use Godot, Unity, Construct, or Bevy; none provides the required Expo + Next.js shared architecture. Directly transplanting them would create a rewrite or engine mismatch.

Best references:

1. `VampireSurvivorsClone` for pooling, mobile controls, data-driven abilities, and localization organization.
2. `SurvivorsStarterKit` for upgrade/controller boundaries and explicit performance caution around per-enemy physics.
3. `free-version-survivors` for touch behavior and JSON-driven wave/content schemas.
4. Small Godot/Bevy projects for meta-progression and data-oriented system ideas only.

Any copied MIT code must be isolated, recorded at file/commit level, adapted deliberately, and retain its notice. Conceptual study is preferred because the target architecture differs.

## Evaluation table

### DarkRewar/SurvivorsStarterKit

- Repository: [DarkRewar/SurvivorsStarterKit](https://github.com/DarkRewar/SurvivorsStarterKit)
- License evidence: [MIT `LICENCE.md`](https://github.com/DarkRewar/SurvivorsStarterKit/blob/main/LICENCE.md), Curtis Pelissier, 2023.
- Status on research date: 104 stars, 17 forks, last push 2026-04-27, not archived.
- Stack: Godot 4.6 Mono, C#/.NET, 3D, Godot Jolt.
- Systems: global game manager, player/enemy stats, spawn/progression, upgrades, boss power-ups, nearest projectile, orbit, aura/lifesteal, ground AoE, damage labels.
- Rendering/physics: Godot 3D with physics; README reports roughly 50 enemies with default physics and about 200 with Jolt. This is author-reported, hardware/content-dependent evidence—not a RAKSHAK budget.
- Mobile/touch: not documented.
- Save/audio: no production-grade cross-platform save/audio finding verified.
- Reuse: system boundaries and data-driven resource patterns; do not reuse scenes or engine code in the TypeScript build.
- Commercial distribution: MIT code permits it with notice.
- Assets: README separately credits KayKit and Kenney. KayKit's [Dungeon Pack](https://kaylousberg.itch.io/kaykit-dungeon) and Kenney's [Pattern Pack](https://kenney.nl/assets/pattern-pack) state CC0, but the repository does not create file-level provenance for RAKSHAK.
- Risks: 3D/rigid-body design, C# engine mismatch, incomplete asset mapping.
- Verdict: **REFERENCE ONLY**.

### matthiasbroske/VampireSurvivorsClone

- Repository: [matthiasbroske/VampireSurvivorsClone](https://github.com/matthiasbroske/VampireSurvivorsClone)
- License evidence: [MIT `LICENSE`](https://github.com/matthiasbroske/VampireSurvivorsClone/blob/main/LICENSE), Matthias Broske, 2024.
- Status: 274 stars, 98 forks, last push 2024-04-29, not archived.
- Stack: Unity 2021.3+, C#, Input System, Localization, Addressables, 2D/mobile packages.
- Systems: 20+ abilities, pools for enemies/projectiles/pickups/chests/damage text, boss patterns, upgrades, ScriptableObject characters/levels, spawn keyframes, infinite-background shader, localization.
- Mobile/touch: left virtual joystick and right D-pad; keyboard also supported.
- Save/audio: not verified as a suitable production implementation.
- Reuse: strongest structural reference for pools, input abstraction, ability controllers, and localization. Direct source reuse would be wasteful outside Unity.
- Commercial distribution: MIT code permits it with notice; Unity and Unity packages have separate terms.
- Assets: README credits Kenney, Bonsaiheldin, and Noto but lacks a complete file map. Bonsaiheldin's [treasure icons](https://opengameart.org/content/gold-treasure-icons-16x16) are CC0; Noto fonts use OFL, not MIT.
- Risks: root MIT does not relicense third-party art/fonts.
- Verdict: **PRIMARY BEHAVIORAL REFERENCE; NO BUNDLED ASSETS**.

### lasermagnet/free-version-survivors

- Repository: [lasermagnet/free-version-survivors](https://github.com/lasermagnet/free-version-survivors); [original itch page](https://fodi.itch.io/free-version-survivors).
- License evidence: [`LICENSE.md`](https://github.com/lasermagnet/free-version-survivors/blob/main/LICENSE.md): code MIT; Kenney media CC0; specified Teebor9/Tibor Kovács media CC BY 4.0.
- Status: 2 stars, 84 commits, last push 2025-12-08; itch project marked in development.
- Stack: Construct 3 event sheets, JavaScript, JSON, HTML5.
- Systems: health/XP, weighted upgrade choices, capped/endless upgrades, waves, multiple weapon types, magnet, damage text, freeze/pause/stats, JSON rules and editor.
- Mobile/touch: floating touch-and-hold joystick, tappable upgrades, responsive viewport; keyboard/mouse/gamepad.
- Save/audio: no reusable production finding verified.
- Reuse: touch behavior and schema concepts; reimplement, do not transplant Construct data.
- Commercial distribution: source licenses allow it, but Construct export/use remains subject to Construct's current proprietary terms.
- Notices: MIT notice for code; CC BY creator/source/license/change notice for retained attributed media.
- Risks: “selective” asset description is not file-level provenance.
- Verdict: **REFERENCE; RE-SOURCE ALL MEDIA**.

### migalvalm/vampire-survivors-clone

- Repository: [migalvalm/vampire-survivors-clone](https://github.com/migalvalm/vampire-survivors-clone)
- License evidence: [MIT `LICENSE`](https://github.com/migalvalm/vampire-survivors-clone/blob/main/LICENSE), 2023.
- Status: 27 stars, 11 forks, last push 2023-04-18.
- Stack: Godot 4.0, GDScript, 2D.
- Systems: arena timer; enemy, XP, upgrade and save managers; weighted tables; meta progression; resource-driven axe/sword/bow/anvil/dash; upgrade cards.
- Mobile/touch: not verified.
- Reuse: small reference for save/meta and weighted offers.
- Commercial distribution: MIT code permits it with notice.
- Asset/audio risk: no reliable attribution manifest; bundled MP3 and externally named VFX are not proven covered by root MIT.
- Verdict: **CODE STUDY ONLY — DO NOT USE ANY BUNDLED ART OR AUDIO**.

### robertdodd/bevy_jam_5

- Repository: [robertdodd/bevy_jam_5](https://github.com/robertdodd/bevy_jam_5)
- License evidence: [MIT](https://github.com/robertdodd/bevy_jam_5/blob/master/LICENSE-MIT), [Apache-2.0](https://github.com/robertdodd/bevy_jam_5/blob/master/LICENSE-APACHE-2.0), and [CC0-1.0](https://github.com/robertdodd/bevy_jam_5/blob/master/LICENSE-CC0-1.0).
- Status: 11 stars, 2 forks, last push 2024-07-28.
- Stack: Rust + Bevy ECS; WebAssembly build.
- Systems: player/enemy/projectile/weapon/health/lifetime/velocity components, spawns, game states, pause/game-over, level-up and power-up UI.
- Mobile/touch: keyboard/mouse only.
- Reuse: data-oriented/ECS reference only. If small code fragments are adapted, choose the MIT option and preserve notice.
- Asset risk: CC0 scope is unclear at file level.
- Verdict: **ALGORITHM REFERENCE — NO ASSETS**.

## Framework/library conclusions

### Approved for M1 evaluation

- React Native Skia: renderer; license and transitive notices must be captured from the exact lockfile version.
- PixiJS: renderer; same requirement.
- Expo/React Native/Next.js/React: platform/runtime.
- React Native Gesture Handler: mobile input.
- Expo Audio and Expo Haptics: mobile presentation adapters.
- IndexedDB via a minimal wrapper or a justified small library; Expo SQLite on native.
- Runtime schema validator: compare Zod, Valibot, and hand-rolled validation at implementation planning. No dependency is approved merely because it appears here.

### Rejected as default

- General physics engine: circles/AABBs plus spatial grid are enough.
- General ECS framework: explicit systems suffice at launch scale.
- Phaser as authoritative engine: web-centric ownership conflicts with shared native core.
- WebView as default mobile runtime: operational/performance risk.
- Networked analytics, remote config, authentication, cloud database: violate offline/no-tracking scope.

## License implications

- **MIT/BSD:** commercial use is allowed; preserve copyright/license notice with substantial copied code.
- **Apache-2.0:** commercial use is allowed; preserve license/NOTICE, mark changes, observe patent clauses.
- **MPL-2.0:** file-level copyleft; legal/architecture review before use.
- **LGPL:** dynamic-linking/relinking obligations require review; avoid unless it uniquely solves a need.
- **GPL/AGPL:** not approved for incorporation. Studying public behavior/documentation is different from copying code.
- **Missing/unclear license:** `UNVERIFIED — DO NOT USE YET`.

## Intake checklist for any repository

1. Record repository and immutable commit URL.
2. Read the actual license and every relevant subdirectory license.
3. Trace asset/font/audio provenance independently.
4. Record copied files or algorithms and modifications.
5. Add required notice before merging code.
6. Run security/maintenance review against the exact pinned version.
7. Reject code whose provenance cannot be explained in `THIRD_PARTY_LICENSES.md`.
