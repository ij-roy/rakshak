# RAKSHAK — UI/UX Specification

**Design system:** Night Watch  
**Primary orientation recommendation:** landscape-only  
**Research inputs:** UI/UX design-system search and platform accessibility guidance, 2026-09-22

## 1. Experience principles

- Game-first, never dashboard-like. Full-bleed illustrated/world backgrounds; framed panels appear only where selection demands focus.
- One dominant action per screen. Navigation is shallow and returns predictably.
- All controls are real and functional. No decorative toggles, fake counters, placeholder badges, or “coming soon” in production.
- Critical meaning uses shape, label, and position—not color alone.
- Touch targets are at least 44×44 logical points/pixels with 8 px separation; focus is visible for keyboard users.
- Respect `prefers-reduced-motion` on web and an in-game reduced-effects setting on both platforms.
- No emoji as final icons. Use the approved sprite/vector icon family.

## 2. Visual system

### Palette tokens

| Token | Suggested value | Use |
|---|---:|---|
| `night.950` | `#0B0C14` | deep background |
| `night.800` | `#191B2B` | panels |
| `indigo.600` | `#343A73` | secondary frames |
| `sand.200` | `#E5D2A6` | primary text |
| `brass.500` | `#C28A2C` | focus/upgrade/XP |
| `ember.500` | `#D65332` | hostile danger |
| `monsoon.400` | `#58A6B3` | player/safe emphasis |
| `leaf.500` | `#5F9D62` | healing/success |
| `ash.400` | `#8A8790` | disabled/muted |

Values are starting tokens and must pass contrast tests on actual backgrounds. Brass is not body text on pale sand. Player and hostile colors are also differentiated by outline and animation.

### Typography

- Display/numerals: Rajdhani, pending small-size and OFL verification.
- Body/localization: Noto Sans/Noto Sans Devanagari, pending bundle-size/subset tests.
- Minimum mobile body: 16 logical px; HUD secondary labels may be 13–14 only with high contrast.
- Use tabular numerals for timer, level, damage summaries, and costs.
- All-caps only for short headings; never for paragraphs.

### Shape and material

- 1–2 px brass/sand keylines, clipped/octagonal corners, restrained shadow.
- Panels resemble painted wood/stone/brass fittings, not translucent SaaS glass cards.
- Original textile geometry may edge major screens; do not use sacred diagrams or uncontrolled ornamental noise.
- One icon grid and stroke/lighting treatment. Weapon/passive/evolution frames differ by silhouette and border pattern, not rainbow rarity clutter.

### Motion

- UI transitions: 150–250 ms ease-out entering, ease-in exiting.
- Upgrade cards stagger no more than 60 ms.
- No layout-shifting hover scale. Use border/tint/offset states.
- Reduced mode eliminates shake, parallax, repeated pulses, and bright full-screen flashes; it retains timing/telegraphs.

## 3. Navigation model

```text
Splash → Main Menu
  ├─ Play → Character Select → Map Select → Gameplay
  │                                  ├─ Pause
  │                                  ├─ Level-Up
  │                                  └─ Results → Retry / Menu / Next Map
  ├─ Permanent Upgrades
  ├─ Characters
  ├─ Collection
  ├─ Achievements
  ├─ Settings
  └─ Credits
```

Android Back: close modal → resume prompt from pause → previous menu; during gameplay it opens Pause and never immediately exits. Browser Back must not destroy an active run without confirmation; route strategy should keep gameplay in a controlled route and handle unload best-effort.

## 4. Screens

### Splash/loading

- RAKSHAK mark, `Survive the Night`, version in lower corner, progress state with named phase: loading core/content/first map.
- First run includes a short photosensitivity/effects advisory and links Settings.
- If save recovery occurred, show a clear non-blocking notice after Main Menu, not on an endless loader.

### Main Menu

- Full-bleed Gaon-at-night scene; guardian silhouette near the lit beacon.
- Primary: `Play`. Secondary vertical actions: Upgrades, Characters, Collection, Achievements, Settings, Credits.
- Footer: version, offline state only if relevant, privacy link on web/Android About.
- Continue appears only for a valid interrupted-run checkpoint and states map/time; New Run never overwrites it without confirmation.

### Character Select

- Horizontal four-slot roster with one large selected guardian, trait summary, starting weapon, exact stats, unlock condition.
- Locked characters show silhouette and truthful condition, never an unusable select action.
- Compare delta uses arrows plus text, not color alone.

### Map Select

- Illustrated route Gaon → Van → Marusthal → Durg.
- Card shows map modifiers, discovered enemies, best time/clear, selected Night Oaths, and estimated intensity.
- Locked map shows exact prerequisite. Start is disabled with reason if content failed validation.

### Gameplay HUD

- Top center: timer and boss bar only when active.
- Top left: health bar, guardian portrait, level.
- Top right: pause, compact active oath indicators.
- Bottom: XP bar edge-to-edge; weapon/passive slots remain compact and can collapse on narrow screens.
- Virtual stick occupies lower-left or lower-right configurable zone; opacity reduces while idle but never disappears in fixed mode.
- Off-screen elite/boss indicator is edge-clamped with distance semantics.
- Damage numbers: normal aggregated/culled; critical larger; healing distinct with `+`; no world-space label may cover boss telegraphs.

### Pause

- Freezes simulation; retains desaturated world context.
- Resume, Settings, Run Stats, Abandon Run. Abandon requires hold-to-confirm or explicit dialog and explains retained rewards.
- Web shows key reference; mobile shows joystick-side option.

### Level-Up Selection

- Three large cards: icon, name, current→new level, exact delta, tags, evolution pairing hint if discovered.
- Owned items and new items use distinct frame shapes. Maxed items never appear.
- Reroll count and skip/convert option appear only if unlocked by design. Keyboard keys 1–3 and focus navigation supported.
- Simulation pauses; background threat silhouettes remain visible under a strong dim layer.

### Results

- Outcome, time, level, enemies defeated, damage dealt/taken, bosses, build grid, evolutions, currency breakdown, unlocks/achievements.
- Tally completes within 2 seconds or skips on input. Primary action depends on outcome: Retry or Next Map; Menu secondary.
- New records are explicit and cannot be mistaken for paid/rewarded actions.

### Permanent Upgrades

- Six compact tracks with five nodes each; current effect, next exact delta, cost, cap.
- Total currency always visible. Purchase previews and confirms; respec clearly states it is free in 1.0.
- No sprawling skill-tree canvas.

### Characters

- Gallery and mastery notes; launch version has unlock state and best clear per guardian, not grind levels.

### Collection

- Tabs: Weapons, Passives, Evolutions, Enemies, Lore.
- Discovered entries have mechanics; undiscovered entries show silhouette and honest hint policy. Evolution recipe becomes exact after discovery.
- Filters are limited to discovered/undiscovered/type; no generic data-table UI.

### Achievements

- 24-item illustrated grid, filters All/Locked/Complete, exact progress where non-secret.
- Secret achievements are not used in 1.0; hidden requirements frustrate an offline discovery system.

### Settings

- Audio: master/music/SFX/UI/ambience.
- Controls: joystick side/fixed/floating/size/dead zone; desktop bindings.
- Visual: shake 0–100, flash reduced, particles low/medium/high, damage-number density, render scale auto/low/high where supported.
- Accessibility: UI scale, high-contrast telegraphs, reduced motion, vibration, hold/toggle behaviors.
- Language: English initially; architecture supports Hindi later without claiming a 1.0 translation.
- Data: export diagnostic/save (where platform allows), reset save with typed/held confirmation, privacy policy, licenses.

### Credits

- Team, cultural reviewers, tools, code licenses, asset creators, audio, fonts, special thanks.
- Links are keyboard-focusable and open outside an active run. Offline Android still displays complete text.

## 5. Responsive and safe-area behavior

- Baseline layouts: 16:9 landscape at 1280×720 logical reference; support ultrawide and mobile notches without exposing extra combat advantage.
- World camera shows a capped horizontal/vertical range; letterbox/decorative extension prevents aspect-ratio advantage.
- HUD anchors to safe area. Critical controls never sit under cutouts, browser bars, or gesture zones.
- Test 360×800/800×360 mobile browser, 375×812, 768×1024, 1366×768, 1920×1080, and ultrawide.
- Portrait mobile browser: show a rotate prompt but keep settings/credits accessible; owner must approve landscape lock.

## 6. Input/focus/accessibility

- Menus support touch, mouse, keyboard; focus order follows visual order.
- Escape/Android Back maps to cancel/pause. Enter/Space confirms. Never trap focus in the canvas.
- Canvas has an accessible name and concise live status outside it; do not announce every combat event.
- Screen readers can navigate menus/collection/settings. Real-time combat is not claimed screen-reader playable in 1.0; document this honestly.
- Minimum contrast 4.5:1 for normal text, 3:1 for large text and UI boundaries where applicable.
- Provide photosensitivity controls before the first intense scene.

## 7. UX acceptance tests

- A first-time player starts a run in ≤4 intentional actions after Splash.
- All menu actions are possible with touch and keyboard only.
- Level-up choice is readable at arm's length on a 6-inch phone.
- No critical HUD information is clipped across safe-area matrix.
- Simultaneous level-up/boss intro/pause produces one deterministic modal priority.
- Reduced effects removes full-screen flashes and shake without hiding danger.
- Every locked item explains its unlock; every displayed control works.
