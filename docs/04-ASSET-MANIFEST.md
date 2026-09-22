# RAKSHAK — Proposed Visual Asset Manifest

**Research date:** 2026-09-22  
**Status:** candidate sources only; no assets downloaded or approved for production

## Art direction: Night Watch Pixel Fantasy

Use a single 16×16 logical pixel grid rendered at integer scale where possible. The visual identity combines deep indigo night, monsoon blue, sandstone, turmeric gold, muted vermilion, and aged brass. Architecture uses invented step geometry, courtyards, rain channels, low village walls, forest roots, dunes, and hill-fort silhouettes. Textile-inspired borders use original, non-sacred geometry.

This direction deliberately avoids assembling unrelated packs. One broad CC0 pack supplies neutral production scaffolding; Kenney packs supply UI/effects/control primitives; identity-defining guardians, bosses, weapons, architecture overlays, and final map landmarks are custom-created to a shared palette/style guide.

### Pixel rules

- One base pixel density; no mixing 8×8, 16×16, and 32×32 art without an authored conversion pass.
- Nearest-neighbor scaling; integer camera scale on devices where safe-area/aspect allows.
- Maximum four value bands per normal enemy silhouette; elites add outline/accent, not texture noise.
- Player-safe effects: pale cyan/white + shape; hostile: vermilion/magenta + shape; XP: gold; healing: green + cross-free leaf/drop motif.
- No real flags, religious symbols, deity attributes, temple idols, sacred diagrams, or copied regional heraldry.

## Primary candidate pack

### Ninja Adventure — Pixel-Boy and AAA

- Original source: [itch.io pack page](https://pixel-boy.itch.io/ninja-adventure-asset-pack)
- Creator: Pixel-Boy and AAA.
- License: page explicitly states CC0.
- Commercial use: yes.
- Attribution: not required; voluntary credit recommended.
- Modification: allowed.
- Style/content: 16×16 top-down; 50+ characters, 30+ monsters, nine bosses, environments, items, UI, VFX, 100+ SFX, example project.
- RAKSHAK use: neutral ground/water/vegetation, basic creature motion, generic pickups, and animation timing reference for prototype and possibly final adapted terrain.
- Exclusions: Japanese/ninja-specific characters, torii, katana silhouettes, or identity-defining buildings cannot ship merely renamed. Final guardians/bosses/maps require a cohesive conversion/custom pass.
- Asset license risk: the pack page is the authority for its authors' media. Preserve a dated page capture and hash at intake.
- Music risk: comments indicate a third-party soundfont whose rights were not independently verified. **All 37 music tracks: UNVERIFIED — DO NOT USE YET.**

## Supporting CC0 packs

Kenney's [license/support page](https://kenney.nl/support) states its game assets are CC0; record each downloaded pack/version independently.

### UI Pack — Pixel Adventure

- Source: [Kenney](https://kenney.nl/assets/ui-pack-pixel-adventure)
- Creator/license: Kenney; CC0.
- Commercial/modify/attribution: yes / yes / not required.
- Contents: approximately 500 pixel UI files.
- Use: panel corners, buttons, focus frames, slots, scroll indicators. Recolor and reduce to the RAKSHAK token set; do not mix every variant.

### Mobile Controls

- Source: [Kenney](https://kenney.nl/assets/mobile-controls)
- Creator/license: Kenney; CC0.
- Contents: approximately 900 touch-control/HUD files.
- Use: prototype joystick geometry and touch-state reference. Final joystick should be simplified/recolored and pass visibility tests.

### Particle Pack

- Source: [Kenney](https://kenney.nl/assets/particle-pack)
- Creator/license: Kenney; CC0.
- Contents: 80 particle/VFX assets.
- Use: sparks, dust, impacts, pickup trails after palette/pixel-density normalization.

### Rune Pack

- Source: [Kenney](https://kenney.nl/assets/rune-pack)
- Creator/license: Kenney; CC0.
- Contents: 640 rune/stone assets.
- Use: **prototype abstract upgrade markers only.** Because “runes” may carry unrelated cultural symbolism and visual mismatch, final icons must be original geometric marks reviewed for sacred-symbol collisions.

### Micro Roguelike

- Source: [Kenney](https://kenney.nl/assets/micro-roguelike)
- Creator/license: Kenney; CC0.
- Contents: 320 8×8 sprites/tiles.
- Use: blockout only. Its 8×8 density conflicts with the chosen 16×16 production grid.

## Typography

### Rajdhani

- Source/metadata: [Google Fonts repository](https://github.com/google/fonts/blob/main/ofl/rajdhani/METADATA.pb)
- Creator: Indian Type Foundry contributors identified in the font metadata.
- License: SIL Open Font License 1.1; exact font file and `OFL.txt` must be bundled.
- Use: Latin/Devanagari headings and numerals after small-size legibility tests.

### Noto Sans Devanagari

- Source: [notofonts/devanagari](https://github.com/notofonts/devanagari)
- License evidence: [`OFL.txt`](https://github.com/notofonts/devanagari/blob/main/OFL.txt).
- Commercial embedding/modification: allowed under OFL; Reserved Font Name rules apply to modified versions.
- Use: Hindi/Devanagari body/localization support. English 1.0 may still bundle only used subsets if license and shaping tests pass.

## Custom/commissioned minimum

Existing assets can minimize work, but cultural coherence requires an authored layer:

- four guardians with move/hit/death animations;
- four final bosses and four elite silhouette treatments;
- eight weapons, six evolution icons, eight passives;
- identity tiles/props for Gaon, Van, Marusthal, and Durg;
- 24 achievement icons and core HUD symbols;
- title/logo and store art;
- palette-normalization and atlas cleanup across every retained third-party sprite.

Custom work may be commissioned or generated internally, but each source file needs authorship/rights records. AI-generated art requires a model/tool terms record, prompt/source log, human review for copied marks/styles, and owner approval; it is not automatically public domain.

## File formats and build rules

- Authoring: lossless PNG plus editable source (`.aseprite`, `.kra`, `.svg` as appropriate).
- Runtime: PNG/WebP only after platform/browser alpha and decode tests; atlas JSON is generated.
- Never upscale with smoothing. Trim transparent bounds consistently; store logical pivot/hitbox separately.
- Content hashes and atlas frame IDs are generated; source names are not gameplay IDs.
- No file enters `packages/assets/runtime` without a manifest record.

## Required asset record

```yaml
id: enemy.chhaya_drifter.idle
local_path: packages/assets/runtime/...
source_url: https://original.example/item
creator: Exact credited name
license: CC0-1.0
license_url: https://creativecommons.org/publicdomain/zero/1.0/
downloaded_at: 2026-09-22
source_version_or_hash: ...
modified: true
modifications: recolored; silhouette edited; frames retimed
attribution_required: false
reviewer: ...
status: approved
```

Allowed statuses: `candidate`, `approved`, `rejected`, `unverified`. Build tooling must reject `candidate`, `rejected`, and `unverified` runtime references.
