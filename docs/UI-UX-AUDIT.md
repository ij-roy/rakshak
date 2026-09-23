# RAKSHAK UI/UX audit

Reviewed 23 September 2026. **43 actionable improvements**, prioritized by impact on the player journey.

## Assessment

RAKSHAK has a coherent Night Watch palette, readable primary text, shallow navigation, automatic combat and a working web level-up pause. Its largest gaps are functional: replay is broken, compact-phone upgrade dialogs overflow, several settings do not affect play, and much of the advertised progression is not connected. Complete these flows before investing heavily in decorative polish.

## Scope and evidence

- Live inspection: all nine web routes (home, play, upgrades, characters, collection, achievements, settings, credits, privacy), opening story, early combat, multiple upgrade choices, pause/resume, defeat, Again and New Watch.
- Production build succeeded. Live production run reached level 4, 131 kills and defeat at 0:36; the upgrades page subsequently showed 7 marks. This was an interaction test with no sustained movement, not a difficulty/balance evaluation.
- Responsive inspection: default browser/desktop layouts, upgrade dialog at 800×360 and 667×375. Other recommended device sizes below are acceptance targets, not claimed completed tests.
- Source review: web and native screens, shared input, renderer, audio, save handling, run rewards, content/unlock data and the existing UI/UX specification.
- Native Android was source-reviewed, not run on a device. Late bosses, victory, all locked content, controller behavior, offline launch, frame rate, thermal load and full assistive-technology testing were not live-verified.
- Evidence labels distinguish direct observation, source-confirmed gaps, and risks needing device testing. This is a comprehensive review of the current implemented surfaces, not a guarantee that every possible issue has been found.
- No game implementation was intentionally changed. Local builds and test play were used for inspection; test play created local browser progress. Next dev also auto-generated its agent guidance files.

## Priorities

- **P0 — complete first:** broken player journeys or controls/progression promises that do not work.
- **P1 — next:** major clarity, recovery, accessibility and decision-making improvements.
- **P2 — follow-up:** presentation, discoverability, broader device support and polish.

## Suggested delivery order

1. Restore the core journey: UX-01, UX-02, UX-03, UX-04 and UX-43; stabilize startup/teardown (UX-05).
2. Make combat readable and safe to interrupt: entity identities, silhouettes, pause/exit, HUD, telegraphs, boundaries and save recovery.
3. Make decisions and progression understandable: onboarding, upgrade effects, unlock requirements, permanent purchases, results and collection.
4. Add presentation and platform polish: setting-specific art/audio, accessible controls, responsive layouts, quality options and complete informational pages.
5. Validate with first-time players and real phones. Suggested usability checks: start without help, explain an upgrade, identify danger, pause safely, recognize rewards and start another run.

## Implementation status

Verified in this working tree. Later items stay open until their own acceptance check passes.

| ID | Status | Evidence |
| --- | --- | --- |
| UX-01 | Verified | Mobile play handles upgrades, pause, results, retry, and `settleRun`. |
| UX-02 | Verified | Compact upgrade overlay scrolls; heading, cards, and reroll stay reachable. |
| UX-03 | Verified | `grantsForRun` / `settleRun` tests cover each published achievement once. |
| UX-04 | Verified | Boot applies mute, buses, reduced effects, and stick side. Mix tests pass. |
| UX-43 | Verified | Again remounts a new run id; New Watch returns to selection. |
| UX-05 | Verified | `dev` uses webpack. Strict-mode startup leaves one canvas and no resize crash. |
| UX-06 | Verified | Render keys include kind. Enemy, projectile, and pickup id 1 stay distinct. |
| UX-07 | Verified | Player, threat roles, and pickups use different shapes; white tint no longer overrides them. Grayscale luminance separates the player from a drifter. |
| UX-08 | Verified | Live pause shows Resume, Settings, the current build, and a confirmed abandon. Resume returns to the same HP and level. |
| UX-09 | Verified | Menu and Back pause and explain that leaving clears the checkpoint and awards nothing. Reload/Continue restores the last checkpoint paused, with a message. Results and a confirmed new watch clear it. |
| UX-10 | Verified | Blur, hidden page, and app background pause the watch and drop held movement. Focus or foreground return leaves it paused until Resume. |
| UX-11 | Verified | First run walks through move, automatic attacks, experience, upgrade choices, and the 12:00 final boss, and can be skipped. Pause can open the same lesson again. |
| UX-12 | Verified | Level-up cards show a mark, New/Upgrade/Evolution, plain behavior, exact stats, slot use, and evolution pairings only after discovery. A live first offer compared Neel Trail, Guard Plate, and Spear Burst without leaving the run. |
| UX-13 | Verified | The open dialog takes focus, traps Tab, and marks the canvas and Pause/Menu inert. Enter on Reroll only rerolled. Enter on the focused third card added that item and did not also pick another. |
| UX-14 | Verified | HUD shows equipped items with levels, separate labeled HP (teal) and XP (brass) bars, a wounded state under 30% health, and the next boss time. A live run showed Talwar Arc 1, HP, XP, and Lieutenant at 4:00. |
| UX-15 | Verified | Wind-up telegraphs match the hit: lane before a sand-roller charge, line before a thorn bolt, landing disk, burrow ring, arc, and expanding boss ring. Sidestepping the lane avoids the charge. Off-screen bosses, elites, and telegraphs get an edge marker. Disk, wedge, lane, and ring paint differently. |
| UX-16 | Verified | The field has a scrolling grid, fixed landmarks, and a border that turns thick and red at the map edge. Gaon walls block and leave a gap. Van roots slow only after a warning. Wind lanes push shots. Durg gates close beside an open gap. A live walk showed the grid shift and the red edge. |
| UX-17 | Verified | Results show the outcome, why the marks were earned, the final build, the record, unlocks, damage taken, and whether the save succeeded. Defeat focuses Again. A Gaon victory focused Next map: Van, and that action started Van. The mark total matches the currency `settleRun` adds. |
| UX-18 | Verified | `rewardForRun` is the only mark total. The simulation stores it when the run ends, and the results breakdown plus achievement marks equal the currency `settleRun` adds. A repeated settle pays the base marks again and does not pay completed achievements twice. The old 5-per-30-seconds total is no longer written. |
| UX-19 | Verified | A failed profile write stays unclaimed, keeps one settled reward, and shows Save again. A live defeat with storage blocked showed “Could not save this run” and no saved message; Save again then stored it and cleared the pending copy. Settings kept Mute off until a successful retry, then showed Saved and Mute on. A purchase is not spent in the UI unless the write succeeds. |
| UX-20 | Verified | `loadProfile` restores a valid backup, keeps the damaged primary, and refuses to invent a profile when every copy is unreadable. A live settings page restored Mute On from backup after the primary was corrupted, then showed a recovery screen with the damaged record left in place. Settings can export, import, and deliberately reset. |
| UX-21 | Verified | Native Upgrades, Characters, Collection, Achievements, and Settings load the saved profile and perform the labeled action: spending marks, showing ready or locked guardians, known or hidden discoveries, held or open achievements, and saving volume, mute, reduced effects, and stick side. Typecheck passed. A device was not launched. |
| UX-22 | Verified | The landscape home menu sits beside the title, wraps destinations into two columns, scrolls if text grows, and pads for safe areas. Play HUD, stick, and Pause use the same insets. Four rows of 44px buttons stay inside a 360px-tall landscape screen; the scroll view covers notches and larger text. |
| UX-23 | Verified | Setup and Characters both read the save. Asha is Ready. Veer says survive 8:00 on Gaon, Tara shows 0 of 3 evolutions, and locked maps say Clear Gaon. Clicking Veer left Asha selected and said the watch does not start. Characters no longer says Feat unlock. |
| UX-24 | Verified | Each track shows the current bonus, the next exact delta, the cost, and either the balance afterward or how many marks are missing. With 0 marks every Spend button was disabled. A purchase in flight is ignored until the write finishes. One free respec refunds the marks spent on the tracks. |
| UX-25 | Verified | The home screen is a full-bleed Gaon night: moon, huts, a lit beacon, and a guardian with a shield. Play is the large brass action and opens `/play` in one click. Settings stays on the first screen at 1280×704 and at 667×375, with the version and privacy footer. |
| UX-26 | Verified | Setup lists each guardian’s weapon and exact stats, and each map’s intensity and hazard. The selected watch shows a portrait, weapon behavior, map art, threats, the 4:00, 8:00, and 12:00 bosses, the best result, and a one-line summary. Asha and Veer differ before the watch starts. Clicking locked Veer leaves Asha selected. |
| UX-27 | Verified | A link is resolved only after the profile loads. `/play?guardian=asha&map=gaon` starts Gaon. An unknown pair stays on selection and says the link does not match. Locked Veer and Van stay on selection with the Gaon step, and Asha remains the watch that can start. |
| UX-28 | Verified | Collection tabs show known/total counts. A discovered Talwar Arc states the close arc, level-1 damage 18, cooldown 28, and that its pairing is still hidden. An undiscovered evolution stays a hidden pairing and does not name the passive. A discovered Crescent Guard states Talwar Arc with Whetstone. Lore notes stay unread until that map is cleared, and each note is named. |
| UX-29 | Verified | Each listed goal shows its requirement, an x/y count, and the guardian-mark reward, with All, In progress, and Completed filters. A fresh profile shows First Watch at 0/180 for 15 marks. Completed is empty until a goal is finished. Oathbound I and III are omitted because Night Oaths cannot be selected. |
| UX-30 | Verified | Settings are grouped into Audio, Controls, Visuals, Accessibility, and Data. Sliders span the panel, show a percent, and take keyboard focus. Switches and stick-side buttons are at least 44px tall and state On, Off, left, or right. Audio and stick previews state the current result. Restore defaults asks for confirmation before writing. |
| UX-31 | Verified | On a fine pointer the stick is not displayed. A touch press shows it, and dragging to the right edge moves the thumb and reads Right. Settings offer small, medium, and large, fixed or floating placement, and a dead-zone percent. The dead zone is the value the input adapter uses. |
| UX-32 | Verified | A keyboard watch says WASD or the arrow keys move and Esc pauses. After a touch, that line changes to the stick and the on-screen Pause button. Settings lists Move, Pause, Choose an upgrade, and Reroll with a key for each. Remapping up to I drops W and keeps the arrows, Esc, and R. 1, 2, and 3 cannot be taken. |
| UX-33 | Verified | Tabbing the home menu draws a 3px sand focus ring, and Enter on Settings opens settings. Selected Asha says Selected and exposes aria-pressed; locked guardians say Locked. Health and experience are progress bars with values. The field canvas is named Night watch field. Secondary HUD text is sand on night, about 13:1. Text size 150% sets the root font to 24px; restoring 100% returns 16px and stays after reload. Pause announces Paused and Resume announces Resumed. The live region stays quiet while the watch is simply running. |
| UX-34 | Verified | Portrait play under 900px wide shows “Turn sideways” and still links to Settings and Menu. Home Play and Settings stay on screen at 375×812, 800×360, 667×375, 768×1024, 1366×768, and 2560×1080. At 24px root text those actions still scroll into view. Health, the field, and pause actions stay inside 800×360 and 667×375. HUD, stick, and menus pad for safe-area insets. |
| UX-35 | Verified | Both renderers zoom so a 16:9 phone and a 16:9 desktop show the same 900×506 world. An ultrawide window stays at that width instead of opening the full 2560. The nearest spawn (320) sits in the outer part of that view, and the farthest (500) starts off-screen. |
| UX-36 | Verified | Enemy hits merge into one rising number, a hurt streak points at the attacker, a heal shows a plus, and a magnetized pickup leaves a spark trail. Telegraphs are drawn after those marks. Reduced effects still omit particles and damage numbers. |
| UX-37 | Verified | Hit, pickup, level-up, boss, victory, defeat, and confirm cues each use a different pitch pattern. Repeated enemy hits wait at least 110ms. Master, music, SFX, UI, and night-tone sliders scale those sounds, and mute silences them. A quiet night tone plays on the ambience bus during a watch. Menu clicks play the UI cue. |
| UX-38 | Verified | Setup says Start Run. An unlocked map says Ready, and a locked one says Clear Gaon. The lesson ends with Start Run, and the results action says Retry. A Home control stays on screen at the top of Settings after scrolling to the bottom, and it is hidden once a watch is running. |
| UX-39 | Verified | Privacy and Settings say the profile lives in this browser, is not uploaded, and is deleted if site data is cleared. Settings can export and import that file. Both pages say the website does not keep a copy for offline launch. No service worker is registered. A paused watch says its checkpoint stays in this browser. |
| UX-40 | Verified | The credits page lists version 1.0.0, the SIL Open Font License for Rajdhani and Noto Sans, the MIT tool notices, and how to report a problem without a server. Pause on a live watch shows the same notices and stays on /play. |
| UX-41 | Open | A filled stress scene of 300 enemies, 250 projectiles, 400 pickups, 800 particles, and 40 labels drew 1716 sprites. On this machine the simulation step plus snapshot stayed at p95 0.915 ms and p99 1.324 ms, inside the 8 ms and 16 ms floors. Filling the same snapshot again reuses the sprite, telegraph, and terrain records instead of allocating one object per mark. Movement and wind read that terrain from one reused list. Enemy chase reuses one direction vector, and the hit grid keeps its cell lists instead of allocating them again each tick. Hits, kills, pickups, and weapon shots write into reused event records. The HUD record is reused too, and the on-screen copy stays stable when the next snapshot arrives. A new shot clears its previous hit list instead of allocating another one. An unchanged warning is not redrawn, and a warning outside the view is hidden while its edge marker remains. A normal enemy retargets on alternate ticks and still moves on the tick in between. Boss attacks and elite steering still run every tick. The phone picture keeps one path per outline and turns it into place instead of rebuilding the points. The phone HUD refreshes when health, level, gear, or the shown clock second changes, not on every simulation tick. Once more than 400 XP gems are on the field, gems in the same cell fold together and the total value stays collectable. The pickup list can hold 600. A burst of drops folds that pile once in the tick instead of scanning the field for every gem. Each enemy in that tick is placed from one reused spawn point, copied onto the enemy before the next spawn. Each drawn sprite writes its interpolated pose into one reused record, and each off-screen warning writes into one reused marker. Weapon bursts and player movement copy from one reused direction, and the input record stays the same object for the whole watch. Each web sample and each phone stick reading write into one reused snapshot, so a copied upgrade choice stays put when the next sample arrives. A player hit writes into a reused event and checks a bell flag, so the hit does not walk the crowd. A display frame keeps its picture until the tick, pause, offer, or result changes, and that check writes into one reused stamp. The boss bar is filled in the same enemy pass as the sprites. A crowd of strikes in one tick plays one hit sound. Nearby damage numbers fold together by scanning the label slots directly, and a hit far from that number stays its own label. Projectile hits walk the neighbor list by index: a near enemy is hurt, a far one is not, and an arc does not hit behind the guardian. A stick drag reuses one vector and a stable direction label, and measures the stick when the gesture starts rather than on every move. The watch picture copies each crowd by index, and an enemy moving to the right faces right. Each tick also moves enemies, shots, and pickups by index: a straight shot advances and then retires, and a returning shot turns back while another shot keeps going. A fallen enemy drops its experience while a living one stays, and a volley aims at the nearer enemy. Attack warnings are built only for enemies that are winding up, so a resting roller draws none and the winding one keeps its lane. A full field folds same-cell gems by walking the pickup slots directly, and a drop that finds no free slot is added to an existing gem so the total stays collectable. Damage numbers, hurt streaks, heals, and pickup sparks claim a pooled slot directly, and a spark is skipped on the ticks between trails. A weapon burst places each shot the same way: the spear still splits onto four headings, the volley still aims at the nearer enemy, and a reused shot still clears its previous hit list. A fallen elite drops its experience and a chest beside it, and the gold spark is written into a claimed slot. Each spawn writes the enemy into a claimed slot, and two spawns in one tick keep separate positions, full health, and their own aim points. Wind pushes a shot by walking the projectile slots directly: a shot inside an active lane gains speed, and a shot outside that lane stays still. A thorn bolt is written into a claimed slot after its warning, and that bolt travels toward the guardian. The picture keeps a list of live nodes and drops only the ones the current frame did not touch, including a stale node swapped into a slot just cleared. The hit grid clears only the cells used since the last tick, a neighbor in that cell is still found, and a body far from the shot is not. A body moving to the right still faces right, and a later picture with the same velocity does not recompute that heading. A drawn mark keeps its silhouette while its kind and tint stay the same, and a different enemy content still gets its own shape. The watch picture keeps a body’s color until that body changes, and a husk guard then takes a different color from the drifter it replaced. Movement and wind share one terrain build per tick, and walls, roots, gates, and wind lanes still behave as before. The phone picture keeps a body’s shape after the first lookup, still skips an enemy outside the view, and still marks an off-screen boss. Each drawn mark writes its silhouette into one reused record, and a changed enemy still receives its own shape. A mark already on screen is updated from one lookup, an ordinary new mark waits when the frame is full, and the guardian, a boss, or an elite is still added. A repeated enemy id stays on the same picture node, and a player, shot, pickup, or warning with that same pool id stays on its own node. Edge arrows are drawn for bosses and elites, not for ordinary enemies, pickups, or the guardian. Those arrows are taken from the boss and elite indexes recorded during the draw, and that list is empty again on the next frame. The phone picture records those same indexes on its draw pass, still skips an enemy outside the view, and still marks an off-screen boss. A gem in reach is collected, a farther gem is pulled closer from that same distance, and a gem outside the magnet stays where it is. A drifter keeps chasing, a sand roller still winds up and stops, and a boss attack still advances every tick. The same watch picture is not drawn again, and a changed blend or a new snapshot still is. The hit grid keeps its cells in a fixed table: a neighbor is still found, a far body is not, and a body in a negative cell is found after a clear. A mark outside the view leaves the picture a few at a time and snaps back when it returns, and edge arrows are rebuilt only while a boss, an elite, or a hostile warning can sit outside the view. Contact searches only the cells that can reach the guardian: a large body across a cell boundary still hurts, and a body farther out does not. Repeated marks of the same shape share one geometry build, a different shape is built on its own, and a warning still redraws on its own picture. The phone picture reuses its draw helpers, still skips an enemy outside the view, and still marks an off-screen boss. Every ember basin is placed from one search around the nearer enemy. Sparks and damage numbers drop out when reduced effects are on or after a run of slow frames, and the guardian is still drawn. The phone picture keeps one brush for the watch, and the first pause or boss defeat in a step is still saved. Weapons that fire on the same tick share one target search, and the next tick searches again. The hit grid is filled while enemies move, the later rebuild is skipped, and a body beside the guardian still hurts. A chain uses that grid when it is current, still strikes the nearer enemy, and walks the crowd only when the grid is not ready. The web renderer keeps each mark's last position on its node, so a frame no longer rebuilds a lookup of the previous crowd. The phone view reuses one paint and one path for the whole watch, and it refreshes the HUD only when a shown value changes. The web renderer reuses node ids and silhouette geometry, hides marks outside the view, redraws terrain only when the camera crosses a grid cell or a hazard changes, and adds only a few new marks per frame. Sparks and damage numbers drop after 20 frames slower than 18.5 ms and return after 45 frames under 12 ms. Damage numbers are digit sprites from one strip. The Pixi ticker is stopped and each watch frame draws once. Render scale stays at 1× on every display, so a high device pixel ratio does not rebuild the framebuffer during a watch. In headless Chrome a moving scene of 1791 sprites at 1382×804 drew at sustained p95 3.4 ms and p99 6.3 ms; the slowest frame was 10.5 ms and a key reached the next frame in 25.4 ms. The same scene in an 800×360 viewport at device pixel ratio 2, with the CPU slowed to one quarter, stayed at sustained p95 18.6 ms and p99 20.1 ms, slowest frame 44.3 ms, key 17.8 ms. At one sixth CPU that viewport stayed at sustained p95 22.2 ms and p99 29.4 ms, slowest frame 47.9 ms, key 24.4 ms. Those slowed runs stay inside the 100 ms stall limit and the 33.3 ms / 45 ms frame floor. The shared phone picture skips off-screen marks and reuses parsed colors. The phone records each frame into one Skia picture, reuses one path for every mark, refreshes the HUD only when the readout changes, and will not start a second save while one is in flight. Building that picture for 300 enemies, 40 damage numbers, and 24 warnings stays within 8 ms at the 95th percentile. adb reports no attached device, and no Android emulator is installed, so input lag and heat on a handset were not measured. Gems are visited only while they are on the field: a gem in reach is still collected after an earlier gem is gone, and a gem outside the magnet stays. A mark that stays in the same picture slot is drawn again without hashing the crowd, and a mark that leaves has its slot cleared so the next body is looked up on its own. A shot still hits a large body across a cell boundary and misses one just beyond its reach. When every mark on screen was touched, the picture does not sweep the crowd again for leftovers, and a mark that was left behind is still removed. This acceptance check is not closed. |
| UX-42 | Verified | `pnpm verify` runs the web tests, including the player journey. That journey starts the first watch, blocks Enter while a dialog is open, picks the left and right cards from 1 and 3, retries three times into a new run, keeps the profile when a save throws, readies Van after a stored Gaon victory, and checks the listed viewports against `globals.css` so the home menu scrolls, the short landscape uses two columns, and the watch chrome uses the safe area. |

Effort is deliberately not estimated here: several interface gaps depend on unfinished progression/runtime work.

## Detailed backlog

### UX-01 · P0 · Complete the mobile run loop

**Area:** Mobile · **Evidence:** Code-confirmed

**Finding:** Mobile sends only movement input. The core freezes on a level-up offer, but the mobile screen has no offer cards or confirm action.

**Improve:** Add touch upgrade selection, reroll, pause/resume, results, retry and end-of-run persistence before treating mobile as playable.

**Acceptance check:** Finish a mobile run through multiple level-ups; earned progression survives relaunch.

**Source:** [apps/mobile/app/play.tsx](D:/Projects/games/rakshak/apps/mobile/app/play.tsx) · [packages/game-core/src/runtime.ts](D:/Projects/games/rakshak/packages/game-core/src/runtime.ts)

### UX-02 · P0 · Keep every upgrade choice reachable

**Area:** Responsive · **Evidence:** Live-confirmed

**Finding:** At 667×375 the three stacked 120px cards overflow the fixed overlay; heading and reroll disappear and the third card is clipped. At 800×360 the dialog competes with HUD and controls.

**Improve:** Use height-aware compact layouts, safe-area padding and a scrollable modal body; prevent background controls from overlapping.

**Acceptance check:** All choices, heading and reroll are reachable at 667×375, 800×360 and 375×812, including enlarged text.

**Source:** [apps/web/src/app/globals.css](D:/Projects/games/rakshak/apps/web/src/app/globals.css) · [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx)

### UX-03 · P0 · Connect all advertised unlocks and achievements

**Area:** Progression · **Evidence:** Code-confirmed

**Finding:** Run-end persistence only handles Veer, Van, First Watch and Dawn Held. Other defined rules are not consumed; discovery and per-map records are not updated.

**Improve:** Evaluate shared rules once per run; persist discoveries, records and achievement rewards atomically. Do not advertise inaccessible progression.

**Acceptance check:** Every published condition can be earned normally, remains earned, and pays its reward exactly once.

**Source:** [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [packages/game-data/src/unlocks.ts](D:/Projects/games/rakshak/packages/game-data/src/unlocks.ts) · [packages/game-data/src/achievements.ts](D:/Projects/games/rakshak/packages/game-data/src/achievements.ts)

### UX-04 · P0 · Make saved settings affect gameplay

**Area:** Settings · **Evidence:** Code-confirmed

**Finding:** Web settings persist, but GameMount does not apply mute or volumes to audio, reduced effects to rendering, or stick side to controls. The stick stays left.

**Improve:** Wire settings into runtime adapters, apply accessible defaults before play, and hide unsupported settings until functional.

**Acceptance check:** Mute produces silence, each exposed slider affects its bus, right-hand stick moves, and settings survive restart.

**Source:** [apps/web/src/app/settings/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/settings/page.tsx) · [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [packages/audio/src/web-procedural.ts](D:/Projects/games/rakshak/packages/audio/src/web-procedural.ts)

### UX-43 · P0 · Make Retry and New Watch actually reset the run

**Area:** Results · **Evidence:** Live-confirmed

**Finding:** After the observed 0:36 defeat, Again changed the query string but retained HP 0, level 4 and the results overlay. New Watch also retained the completed run.

**Improve:** Use explicit restart/setup actions that reset run state and remount the runtime with a new run identifier; do not rely on same-route links alone.

**Acceptance check:** Retry immediately starts a fresh run with the same selection; New Watch opens selection. Repeat both across several runs without stale state.

**Source:** [apps/web/src/app/play/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/play/page.tsx) · [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx)

### UX-05 · P1 · Fix run startup and renderer teardown

**Area:** Reliability · **Evidence:** Live-confirmed

**Finding:** The default dev command fails on the webpack/Turbopack mismatch. With webpack, entering a run crashes in Pixi dispose with this._cancelResize is not a function. The production build did start successfully.

**Improve:** Align the dev command with the existing config; make asynchronous renderer initialization and cleanup cancellation-safe. Add a friendly retry path.

**Acceptance check:** Repeated start/exit cycles and development Strict Mode work without crashes or orphaned canvases.

**Source:** [packages/renderer-web-pixi/src/index.ts](D:/Projects/games/rakshak/packages/renderer-web-pixi/src/index.ts) · [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [apps/web/package.json](D:/Projects/games/rakshak/apps/web/package.json)

### UX-06 · P1 · Give every entity a unique visual identity

**Area:** Combat · **Evidence:** Code-confirmed

**Finding:** Each entity pool starts IDs at 1, while the web renderer stores all kinds in one map keyed only by entityId. Different kinds can share a render node.

**Improve:** Use globally unique or kind-qualified render keys and matching interpolation keys. Then verify that all active enemies and pickups are visible.

**Acceptance check:** Simultaneous enemy, projectile and pickup with the same pool-local ID remain independently visible.

**Source:** [packages/game-core/src/world/entity-pool.ts](D:/Projects/games/rakshak/packages/game-core/src/world/entity-pool.ts) · [packages/renderer-web-pixi/src/index.ts](D:/Projects/games/rakshak/packages/renderer-web-pixi/src/index.ts)

### UX-07 · P1 · Distinguish player, enemies and pickups immediately

**Area:** Combat · **Evidence:** Live + code

**Finding:** Live combat shows similar white circles for the player and normal enemies. Snapshot white tints override the renderer's intended category colors.

**Improve:** Use distinct silhouettes, outlines and motion for player, enemy roles, elites, bosses, XP, healing and chests. Keep the player readable in a crowd.

**Acceptance check:** A player can identify self, threat and reward at a glance, including in grayscale.

**Source:** [packages/game-core/src/systems/snapshot.ts](D:/Projects/games/rakshak/packages/game-core/src/systems/snapshot.ts) · [packages/renderer-web-pixi/src/index.ts](D:/Projects/games/rakshak/packages/renderer-web-pixi/src/index.ts)

### UX-08 · P1 · Build a real pause menu

**Area:** Pause & navigation · **Evidence:** Live-confirmed

**Finding:** Pause only changes a small top-right label to Paused; its button still says Pause. There are no run stats, settings or explicit resume actions.

**Improve:** Dim the world and show Resume, Settings, Build/Run Stats and Abandon Run; use a distinct resume label and optional brief countdown.

**Acceptance check:** Pausing is unmistakable, all pause actions work, and resume cannot be confused with restarting.

**Source:** [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx)

### UX-09 · P1 · Protect active runs from accidental loss

**Area:** Pause & navigation · **Evidence:** Code-confirmed

**Finding:** Menu exits directly; there is no abandonment confirmation or implemented checkpoint/continue path. Browser refresh and native Back are not handled as run-preserving flows.

**Improve:** Pause before exiting, explain retained/lost rewards, confirm abandonment and implement resumable checkpoints if promised.

**Acceptance check:** Menu, Back, reload and interruption each have a predictable tested outcome; no unannounced run loss.

**Source:** [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [apps/mobile/app/play.tsx](D:/Projects/games/rakshak/apps/mobile/app/play.tsx) · [packages/storage/src/repository.ts](D:/Projects/games/rakshak/packages/storage/src/repository.ts)

### UX-10 · P1 · Pause automatically on interruption

**Area:** Pause & navigation · **Evidence:** Code-confirmed

**Finding:** Web blur/visibility handling clears keys but does not pause the simulation. Mobile has no AppState interruption handling.

**Improve:** Pause on focus loss/backgrounding and resume only after deliberate input; clear held keys and stick capture.

**Acceptance check:** Switching apps or losing focus cannot expose the player to unseen damage or resume movement unexpectedly.

**Source:** [packages/input/src/web-keyboard.ts](D:/Projects/games/rakshak/packages/input/src/web-keyboard.ts) · [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [apps/mobile/app/play.tsx](D:/Projects/games/rakshak/apps/mobile/app/play.tsx)

### UX-11 · P1 · Teach the actual survival loop

**Area:** Onboarding · **Evidence:** Live-confirmed

**Finding:** Opening text provides atmosphere but does not explain automatic attacks, XP pickup, upgrade choices or the win condition. Keyboard movement is only a small HUD hint.

**Improve:** Offer a short skippable first-run tutorial: move, auto-attack, collect XP, choose an upgrade, survive to and defeat the final boss. Keep replayable controls help.

**Acceptance check:** A new player can explain the objective and controls after the first minute without external guidance.

**Source:** [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [packages/game-data/src/balance.ts](D:/Projects/games/rakshak/packages/game-data/src/balance.ts)

### UX-12 · P1 · Explain upgrade effects before committing

**Area:** Level-up · **Evidence:** Live-confirmed

**Finding:** Cards show only item name, kind and level. Hunter's Cord and other unfamiliar items give no basis for a decision.

**Improve:** Show icon, plain-language behavior, exact current-to-next stat changes, slot impact and discovered evolution pairing. Label New versus Upgrade clearly.

**Acceptance check:** Players can compare all three choices without memorizing item names or leaving the run.

**Source:** [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [packages/game-data/src/weapons.ts](D:/Projects/games/rakshak/packages/game-data/src/weapons.ts) · [packages/game-data/src/passives.ts](D:/Projects/games/rakshak/packages/game-data/src/passives.ts)

### UX-13 · P1 · Manage modal focus and action priority

**Area:** Accessibility · **Evidence:** Live + code

**Finding:** Story, upgrade and result overlays have a dialog role but no focus management, modal isolation or focus restoration. Pause/Menu remain reachable outside them.

**Improve:** Use one modal controller with focus entry/containment/restoration and inert background controls. Keep Enter/Space activation scoped to the focused choice instead of global gameplay confirmation.

**Acceptance check:** Keyboard-only users can complete dialogs; Enter selects the visibly focused choice and never triggers a second action.

**Source:** [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [packages/input/src/web-keyboard.ts](D:/Projects/games/rakshak/packages/input/src/web-keyboard.ts) · [packages/input/src/web-play.ts](D:/Projects/games/rakshak/packages/input/src/web-play.ts)

### UX-14 · P1 · Show the current build and meaningful progress

**Area:** HUD · **Evidence:** Live + code

**Finding:** Weapon/passive slots exist in the HUD snapshot but are not rendered. Both health and XP bars appear brass because the general bar rule overrides the HP color.

**Improve:** Add compact item slots with levels, distinct labeled HP and XP bars, low-health feedback and a visible objective/boss milestone. Keep detailed stats in pause.

**Acceptance check:** Players can identify their build, remaining health and next objective without opening another screen.

**Source:** [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [apps/web/src/app/globals.css](D:/Projects/games/rakshak/apps/web/src/app/globals.css) · [packages/game-core/src/systems/snapshot.ts](D:/Projects/games/rakshak/packages/game-core/src/systems/snapshot.ts)

### UX-15 · P1 · Make danger and attack timing visible

**Area:** Combat · **Evidence:** Code-confirmed

**Finding:** The snapshot always empties telegraphs, despite renderer support. Different attack behaviors are drawn as circles; no off-screen danger indicators are present.

**Improve:** Emit real wind-up/recovery telegraphs and render each implemented attack's actual footprint. Add edge indicators for important off-screen threats.

**Acceptance check:** A player can predict and avoid each special attack using visual information alone.

**Source:** [packages/game-core/src/systems/snapshot.ts](D:/Projects/games/rakshak/packages/game-core/src/systems/snapshot.ts) · [packages/game-core/src/systems/ai.ts](D:/Projects/games/rakshak/packages/game-core/src/systems/ai.ts) · [packages/renderer-web-pixi/src/index.ts](D:/Projects/games/rakshak/packages/renderer-web-pixi/src/index.ts)

### UX-16 · P1 · Show terrain, movement and arena boundaries

**Area:** Combat · **Evidence:** Live + code

**Finding:** The playfield is a flat dark void, the camera follows the player, and movement clamps at map bounds without visible terrain or walls.

**Improve:** Add restrained ground texture, landmarks and visible bounds. Render hazards only where gameplay mechanics exist; ensure scenery never hides combat.

**Acceptance check:** Players can tell that they are moving, approaching a boundary and entering a functional hazard.

**Source:** [packages/renderer-web-pixi/src/index.ts](D:/Projects/games/rakshak/packages/renderer-web-pixi/src/index.ts) · [packages/game-core/src/systems/input-movement.ts](D:/Projects/games/rakshak/packages/game-core/src/systems/input-movement.ts) · [packages/game-data/src/maps.ts](D:/Projects/games/rakshak/packages/game-data/src/maps.ts)

### UX-17 · P1 · Make the outcome and rewards explicit

**Area:** Results · **Evidence:** Live + code

**Finding:** Results are limited to narrative outcome, time, level and kills. No currency breakdown, build, unlocks, records, damage summary or save status is shown.

**Improve:** Pair Defeat/Victory with flavor text; show earned marks and why, new unlocks, final build, records and one useful next step. Prioritize Retry or Next Map by outcome.

**Acceptance check:** Players understand what happened, what they earned and what to do next within a few seconds.

**Source:** [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx)

### UX-18 · P1 · Use one authoritative reward calculation

**Area:** Progression · **Evidence:** Code-confirmed

**Finding:** Core run rewards use 5 marks per 30 seconds plus boss rewards; web persistence uses 1 per 30 seconds plus kills and a victory bonus. Achievement mark rewards are not applied there.

**Improve:** Calculate the final reward once, store that result and display the same breakdown everywhere.

**Acceptance check:** Displayed reward, saved balance increase and achievement grants reconcile exactly.

**Source:** [packages/game-core/src/systems/deaths.ts](D:/Projects/games/rakshak/packages/game-core/src/systems/deaths.ts) · [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [packages/game-data/src/achievements.ts](D:/Projects/games/rakshak/packages/game-data/src/achievements.ts)

### UX-19 · P1 · Acknowledge saves only when they succeed

**Area:** Save & recovery · **Evidence:** Code-confirmed

**Finding:** Callers ignore atomicWriteProfile's ok result. Result saving is fire-and-forget, and resultsSaved is set before persistence completes; settings can report success without checking the result.

**Improve:** Track saving/saved/failed states, handle exceptions and failure results, allow retry and prevent duplicate rewards.

**Acceptance check:** Storage failure is visible and recoverable; no false Saved message or silently dropped run reward.

**Source:** [packages/storage/src/repository.ts](D:/Projects/games/rakshak/packages/storage/src/repository.ts) · [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [apps/web/src/app/settings/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/settings/page.tsx) · [apps/web/src/app/upgrades/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/upgrades/page.tsx)

### UX-20 · P1 · Recover existing progress instead of silently replacing it

**Area:** Save & recovery · **Evidence:** Code-confirmed

**Finding:** Screens read primary saves directly; invalid validated data falls back to defaults while malformed JSON can reject the load. Backup slots exist but these screen loaders do not use recovery.

**Improve:** Centralize validated load/recovery, try backup, preserve the damaged record and show a recovery notice. Offer local export/import and deliberate reset.

**Acceptance check:** Malformed, missing or invalid saves produce a useful recovery screen rather than lost progress or endless loading.

**Source:** [apps/web/src/app/play/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/play/page.tsx) · [apps/web/src/app/settings/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/settings/page.tsx) · [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [packages/storage/src/repository.ts](D:/Projects/games/rakshak/packages/storage/src/repository.ts)

### UX-21 · P1 · Replace informational stubs with working screens

**Area:** Mobile · **Evidence:** Code-confirmed

**Finding:** Native Upgrades, Characters, Collection, Achievements and Settings all render a short InfoScreen rather than their web counterparts.

**Improve:** Implement real mobile flows using shared progression/settings logic; show only supported capabilities in the menu.

**Acceptance check:** Every native menu destination performs the action its label promises.

**Source:** [apps/mobile/app/upgrades.tsx](D:/Projects/games/rakshak/apps/mobile/app/upgrades.tsx) · [apps/mobile/app/characters.tsx](D:/Projects/games/rakshak/apps/mobile/app/characters.tsx) · [apps/mobile/app/collection.tsx](D:/Projects/games/rakshak/apps/mobile/app/collection.tsx) · [apps/mobile/app/achievements.tsx](D:/Projects/games/rakshak/apps/mobile/app/achievements.tsx) · [apps/mobile/app/settings.tsx](D:/Projects/games/rakshak/apps/mobile/app/settings.tsx)

### UX-22 · P1 · Adapt the native menu to landscape height

**Area:** Mobile · **Evidence:** Code-confirmed

**Finding:** Native is landscape-only, but its home screen vertically stacks the title, seven 44px buttons, gaps and footer in a non-scrollable View.

**Improve:** Use a compact two-column or side-by-side landscape menu, safe-area insets and scroll fallback. Apply safe areas to gameplay too.

**Acceptance check:** All menu destinations and critical HUD controls fit on a short landscape phone with notches and enlarged text.

**Source:** [apps/mobile/app/index.tsx](D:/Projects/games/rakshak/apps/mobile/app/index.tsx) · [apps/mobile/app.config.ts](D:/Projects/games/rakshak/apps/mobile/app.config.ts) · [apps/mobile/app/play.tsx](D:/Projects/games/rakshak/apps/mobile/app/play.tsx)

### UX-23 · P1 · Explain locks and honor actual unlock state

**Area:** Selection · **Evidence:** Live + code

**Finding:** Setup says Locked for guardians. The Characters page uses unlockDefault instead of the player's saved unlocks, so earned guardians still appear as Feat unlock.

**Improve:** Display exact requirements and progress from shared rules, read the saved state, and let locked cards open inspectable details without starting them.

**Acceptance check:** Unlocked guardians display consistently; every locked character and map explains the next achievable step.

**Source:** [apps/web/src/app/play/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/play/page.tsx) · [apps/web/src/app/characters/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/characters/page.tsx) · [packages/game-data/src/unlocks.ts](D:/Projects/games/rakshak/packages/game-data/src/unlocks.ts)

### UX-24 · P1 · Explain permanent purchases and prevent misclicks

**Area:** Upgrades · **Evidence:** Live + code

**Finding:** Tracks show rank and cost but not the stat effect; Spend remains enabled without enough currency. Purchase calls have no in-flight guard.

**Improve:** Show current bonus, next exact delta, cost and balance after purchase. Explain unaffordability, serialize purchases and offer the planned free respec.

**Acceptance check:** Players know precisely what they buy; rapid clicks cannot lose purchases or balances.

**Source:** [apps/web/src/app/upgrades/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/upgrades/page.tsx) · [packages/game-data/src/meta.ts](D:/Projects/games/rakshak/packages/game-data/src/meta.ts)

### UX-25 · P2 · Give the game a recognizable first impression

**Area:** Main menu · **Evidence:** Live-confirmed

**Finding:** The menu is a title and seven similarly weighted rectangular buttons on mostly empty dark space.

**Improve:** Keep the Night Watch palette but add a restrained Gaon/beacon scene, guardian art and stronger Play prominence. Keep Settings easy to find.

**Acceptance check:** The screen communicates setting and primary action without slowing entry to play.

**Source:** [apps/web/src/app/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/page.tsx) · [apps/web/src/app/globals.css](D:/Projects/games/rakshak/apps/web/src/app/globals.css) · [docs/06-UI-UX-SPEC.md](D:/Projects/games/rakshak/docs/06-UI-UX-SPEC.md)

### UX-26 · P2 · Turn guardian and map selection into informed choices

**Area:** Selection · **Evidence:** Live-confirmed

**Finding:** Setup omits guardian traits/stats and map hazards/intensity; names and subtitles carry almost all the information.

**Improve:** Add selected guardian portrait, trait and starting-weapon preview; map artwork, modifiers, best result and run expectations. Show a compact final selection summary.

**Acceptance check:** Players can explain how two available choices differ before starting.

**Source:** [apps/web/src/app/play/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/play/page.tsx) · [packages/game-data/src/guardians.ts](D:/Projects/games/rakshak/packages/game-data/src/guardians.ts) · [packages/game-data/src/maps.ts](D:/Projects/games/rakshak/packages/game-data/src/maps.ts)

### UX-27 · P2 · Validate direct links and remove loading ambiguity

**Area:** Selection · **Evidence:** Code-confirmed

**Finding:** Query values are cast as IDs without validation, can set started before save loading, and are initialized only once. Invalid links can reach missing content definitions.

**Improve:** Validate IDs and unlock state after profile readiness; handle malformed links gracefully and reflect changing URL state deliberately.

**Acceptance check:** Valid shared links work; invalid/locked links return an explanatory selection screen rather than crashing.

**Source:** [apps/web/src/app/play/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/play/page.tsx)

### UX-28 · P2 · Make discovery useful to learning

**Area:** Collection · **Evidence:** Live-confirmed

**Finding:** Collection is a long list of Known/Unknown names or dashes. Discovered entries have no mechanics, recipes, art or interaction; lore is mentioned but has no section.

**Improve:** Use category tabs, discovery counts, icons/silhouettes and an item detail view with behavior, stats and discovered recipes. Add truthful hints and working lore entries.

**Acceptance check:** The collection answers what an encountered item does and how discovered combinations work.

**Source:** [apps/web/src/app/collection/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/collection/page.tsx)

### UX-29 · P2 · Show measurable progress and achievable goals

**Area:** Achievements · **Evidence:** Live-confirmed

**Finding:** The page promises exact progress but only renders Open/Held. Rewards, numerical progress and filters are absent; some listed oaths have no selection UI.

**Improve:** Use In progress/Completed, x/y progress, reward previews and All/In progress/Completed filters. Offer only achievements supported by actual game flows.

**Acceptance check:** Every row communicates requirement, current progress and reward; unsupported goals are not presented as earnable.

**Source:** [apps/web/src/app/achievements/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/achievements/page.tsx) · [packages/game-data/src/achievements.ts](D:/Projects/games/rakshak/packages/game-data/src/achievements.ts)

### UX-30 · P2 · Group settings and give controls room to work

**Area:** Settings · **Evidence:** Live-confirmed

**Finding:** Native-looking short sliders sit in full-width rows while toggle buttons have uneven widths and no spacing between them.

**Improve:** Group Audio, Controls, Visuals, Accessibility and Data. Use labeled switches, wide sliders, explicit value text, contextual previews and restore defaults.

**Acceptance check:** Settings are scannable, touch-friendly and keyboard-operable with clear current states.

**Source:** [apps/web/src/app/settings/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/settings/page.tsx) · [apps/web/src/app/globals.css](D:/Projects/games/rakshak/apps/web/src/app/globals.css)

### UX-31 · P2 · Make touch movement responsive and configurable

**Area:** Controls · **Evidence:** Live + code

**Finding:** Web displays a fixed empty stick circle even on desktop, with no moving thumb/deflection feedback. Side and size are hardcoded.

**Improve:** Show a moving thumb, direction feedback, dead-zone/size and fixed/floating options; honor handedness and use input-aware visibility.

**Acceptance check:** Touch players can see exactly what input is registered; desktop HUD space is not wasted.

**Source:** [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [apps/web/src/app/globals.css](D:/Projects/games/rakshak/apps/web/src/app/globals.css) · [apps/mobile/components/VirtualStick.tsx](D:/Projects/games/rakshak/apps/mobile/components/VirtualStick.tsx)

### UX-32 · P2 · Support remapping and correct input prompts

**Area:** Controls · **Evidence:** Code-confirmed

**Finding:** Keys are fixed; web always shows keyboard hints, including on narrow touch layouts. No controller flow is implemented.

**Improve:** Provide a controls reference, remappable bindings and prompts for the active input method. Consider controller support after existing input paths are reliable.

**Acceptance check:** Prompts match the current device and all supported actions have an accessible input path.

**Source:** [packages/input/src/web-keyboard.ts](D:/Projects/games/rakshak/packages/input/src/web-keyboard.ts) · [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx)

### UX-33 · P2 · Strengthen text, focus and state semantics

**Area:** Accessibility · **Evidence:** Live + code

**Finding:** Secondary HUD text and disabled descriptions are small/faint. Selection is indicated by border color; settings buttons do not expose toggle state, and bars have labels but no progress values.

**Improve:** Support UI/text scale, stronger focus, non-color selected/locked markers, semantic progress bars and switch states. Name the canvas and announce only important status changes.

**Acceptance check:** Menu flows work by keyboard/screen reader; labels remain readable at larger text sizes and in grayscale.

**Source:** [apps/web/src/app/globals.css](D:/Projects/games/rakshak/apps/web/src/app/globals.css) · [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [apps/web/src/app/settings/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/settings/page.tsx) · [apps/web/src/app/play/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/play/page.tsx)

### UX-34 · P2 · Design for orientation and safe areas deliberately

**Area:** Responsive · **Evidence:** Live + code

**Finding:** Web has no portrait guidance or safe-area insets. Fixed HUD widths and inset overlays do not adapt to viewport height.

**Improve:** Keep menus usable in portrait; offer a clear landscape recommendation for combat. Anchor controls within safe areas and test browser bars/zoom.

**Acceptance check:** No clipping at 375×812, 800×360, 667×375, tablet, desktop or ultrawide; menus remain reachable at enlarged text.

**Source:** [apps/web/src/app/globals.css](D:/Projects/games/rakshak/apps/web/src/app/globals.css) · [docs/06-UI-UX-SPEC.md](D:/Projects/games/rakshak/docs/06-UI-UX-SPEC.md)

### UX-35 · P2 · Keep camera coverage fair across aspect ratios

**Area:** Combat · **Evidence:** Code-confirmed

**Finding:** Camera zoom is fixed at 1 and the renderer uses the full viewport, so wider/larger windows show more world. Spawns use a fixed radius of 320–500 world units.

**Improve:** Cap combat view coverage or apply a consistent camera policy and deliberate spawn presentation. Preserve the same danger-reading opportunity across devices.

**Acceptance check:** Phone and desktop players see comparable actionable threat distances; spawns do not appear unexplained beside them.

**Source:** [packages/game-core/src/systems/snapshot.ts](D:/Projects/games/rakshak/packages/game-core/src/systems/snapshot.ts) · [packages/game-core/src/systems/spawn.ts](D:/Projects/games/rakshak/packages/game-core/src/systems/spawn.ts) · [packages/renderer-web-pixi/src/index.ts](D:/Projects/games/rakshak/packages/renderer-web-pixi/src/index.ts)

### UX-36 · P2 · Improve feedback without obscuring threats

**Area:** Combat · **Evidence:** Live + code

**Finding:** Damage and pickups largely rely on basic tones and circles; there is no clear directional damage cue or rendered damage-number system.

**Improve:** Add restrained hit reactions, healing plus signs, pickup trails and optional aggregated damage numbers. Prioritize hostile telegraphs above effects and offer reduced intensity.

**Acceptance check:** Players understand damage, healing and collection even with sound off; dense effects never hide danger.

**Source:** [packages/renderer-web-pixi/src/index.ts](D:/Projects/games/rakshak/packages/renderer-web-pixi/src/index.ts) · [packages/game-core/src/systems/snapshot.ts](D:/Projects/games/rakshak/packages/game-core/src/systems/snapshot.ts) · [packages/audio/src/web-procedural.ts](D:/Projects/games/rakshak/packages/audio/src/web-procedural.ts)

### UX-37 · P2 · Use sound to communicate game state

**Area:** Audio · **Evidence:** Code-confirmed

**Finding:** Web audio consists of short synthesized tones; UI cue definitions exist but menu actions are not wired to them. No music/ambience playback is implemented.

**Improve:** Add restrained UI feedback and distinct damage, pickup, boss and result cues, plus optional thematic ambience. Ensure visual equivalents and meaningful mixer controls.

**Acceptance check:** Important events remain distinguishable without becoming fatiguing; exposed audio channels control actual sounds.

**Source:** [packages/audio/src/web-procedural.ts](D:/Projects/games/rakshak/packages/audio/src/web-procedural.ts) · [apps/web/src/components/GameMount.tsx](D:/Projects/games/rakshak/apps/web/src/components/GameMount.tsx) · [apps/web/src/app/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/page.tsx)

### UX-38 · P2 · Pair atmosphere with plain-language actions

**Area:** Navigation & copy · **Evidence:** Live-confirmed

**Finding:** Labels such as Hold the night, Held/Open, Feat unlock and Clears gaon require interpretation. Back appears only after long content.

**Improve:** Keep narrative flavor in supporting text; use Start Run, Retry, Completed and Clear Gaon to unlock. Provide a consistent reachable Back/Home control.

**Acceptance check:** Every action and status is understandable out of context; long pages do not require scrolling to exit.

**Source:** [packages/game-ui/src/index.ts](D:/Projects/games/rakshak/packages/game-ui/src/index.ts) · [apps/web/src/app/play/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/play/page.tsx) · [apps/web/src/app/achievements/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/achievements/page.tsx)

### UX-39 · P2 · Explain local-only persistence and offline limits

**Area:** Save & recovery · **Evidence:** Live + code

**Finding:** Privacy explains that progress stays on device, but gameplay provides no save location/status, transfer tools or interrupted-run recovery. Offline-first is stated without a verified offline web launch flow.

**Improve:** Show local-save status and an export/import path; explain browser/device isolation and data-clearing consequences. Verify caching before advertising offline launch.

**Acceptance check:** A player knows where progress lives, can back it up and receives truthful offline messaging.

**Source:** [apps/web/src/app/privacy/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/privacy/page.tsx) · [apps/web/src/app/credits/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/credits/page.tsx) · [apps/web/src/lib/indexedDbStorage.ts](D:/Projects/games/rakshak/apps/web/src/lib/indexedDbStorage.ts)

### UX-40 · P2 · Make credits and support information accessible in-game

**Area:** Credits · **Evidence:** Live-confirmed

**Finding:** Credits only says that third-party notices are in repository licenses, with no actual notices or links.

**Improve:** Include creator/tool/font/asset credits and bundled notices, plus version/build information and a useful support/report path.

**Acceptance check:** Players can read credits without finding the repository or leaving an active run.

**Source:** [apps/web/src/app/credits/page.tsx](D:/Projects/games/rakshak/apps/web/src/app/credits/page.tsx) · [ASSET_LICENSES.md](D:/Projects/games/rakshak/ASSET_LICENSES.md) · [THIRD_PARTY_LICENSES.md](D:/Projects/games/rakshak/THIRD_PARTY_LICENSES.md)

### UX-41 · P2 · Offer predictable frame pacing on real devices

**Area:** Performance · **Evidence:** Code-confirmed risk

**Finding:** Web redraws graphics and allocates maps/sets each frame; native copies sprites into React state at 60Hz. This audit did not measure frame rate or thermal load.

**Improve:** Profile late-run crowds on representative phones; reduce per-frame allocations and native React churn, add quality/render-scale options only where needed.

**Acceptance check:** Dense late-run scenes meet the project's frame budget on target hardware without input lag or overheating.

**Source:** [packages/renderer-web-pixi/src/index.ts](D:/Projects/games/rakshak/packages/renderer-web-pixi/src/index.ts) · [apps/mobile/app/play.tsx](D:/Projects/games/rakshak/apps/mobile/app/play.tsx) · [docs/08-PERFORMANCE-BUDGET.md](D:/Projects/games/rakshak/docs/08-PERFORMANCE-BUDGET.md)

### UX-42 · P2 · Test complete player journeys, not only core logic

**Area:** Quality assurance · **Evidence:** Coverage gap

**Finding:** Existing tests cover simulation/data/storage, but no end-to-end UI coverage was found for start, choice, retry, settings or screen sizes.

**Improve:** Add journey tests for first run, keyboard choices, repeated retry, save failure, unlock propagation and viewport overflow. Pair with real-device and first-time-player testing.

**Acceptance check:** Release checks include the actual player flows and the accessibility/responsive acceptance criteria.

**Source:** [packages/game-core/src/runtime.determinism.test.ts](D:/Projects/games/rakshak/packages/game-core/src/runtime.determinism.test.ts) · [docs/09-TESTING-STRATEGY.md](D:/Projects/games/rakshak/docs/09-TESTING-STRATEGY.md) · [docs/06-UI-UX-SPEC.md](D:/Projects/games/rakshak/docs/06-UI-UX-SPEC.md)

## Design direction to preserve

Keep the night/indigo base, sand text, brass emphasis and guardian theme. Increase distinction between foreground threats, safe entities, pickups and scenery. Use art to establish the world while keeping important information legible. Do not introduce extra screens, elaborate animations or new progression systems until the existing loop is dependable.

The project already documents many of these intentions in [the UI/UX specification](D:/Projects/games/rakshak/docs/06-UI-UX-SPEC.md); the main work is bringing the implementation up to that specification.

## Reference basis

Game-specific findings come from the local implementation and live inspection. General guidance on clear controls, readable prompts, touch targets and remembered settings was cross-checked against [Game Accessibility Guidelines — Basic](https://gameaccessibilityguidelines.com/basic/). This audit does not claim accessibility certification or measured compliance.

