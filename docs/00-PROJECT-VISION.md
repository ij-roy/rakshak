# RAKSHAK — Project Vision

**Tagline:** Survive the Night  
**Application ID:** `roy.ij.rakshak`  
**Initial release:** `1.0.0`  
**Research baseline:** 2026-09-22

## Vision

RAKSHAK is a polished, offline, 10–15 minute survivor roguelite set in an original Indian-fantasy frontier. The player is a mortal guardian holding back the Chhaya—an invented supernatural blight—across village, forest, desert, and fort landscapes. Movement is direct; attacks are automatic; decisions are concentrated in positioning, build construction, risk, and route mastery.

The same rules, content data, saves, and deterministic simulation must power Android and web. Platform shells may differ; the game must not.

## Audience

- Players who enjoy readable power growth, short repeatable runs, and build discovery.
- Mobile players who need responsive one-thumb play and reliable offline sessions.
- Desktop/browser players who expect keyboard controls and instant access.
- Ages 12+ as the content target, subject to the final ratings questionnaire.

## Design pillars

1. **Readable chaos.** Hundreds of actors may be present, but silhouettes, telegraphs, threat colors, and effect priority keep decisions legible.
2. **Every run tells a build story.** A run should create at least one meaningful pivot: a synergy, evolution, risky challenge, or recovery.
3. **Indian-fantasy, not religious spectacle.** Identity comes from landscape, fortification, craft, textiles, weapons, rhythm, and an original lexicon—not disposable depictions of deities or sacred figures.
4. **Feel before feature count.** Hit stop, sound, shake, haptics, pickup flow, and transitions are production requirements.
5. **Offline ownership.** No account, server, tracking, ad SDK, or network is required to play or progress.
6. **One simulation, two shells.** Gameplay behavior is platform-independent and deterministic under the same seed and input stream.
7. **Evidence-led scope.** Content and technology graduate only after performance, licensing, and playability gates pass.

## Product goals

- Stable 60 FPS target and graceful 30 FPS floor on the defined Android test matrix.
- A complete 12-minute run with four maps, four guardians, eight weapons, eight passives, six evolutions, 16 normal enemies, four elites, and four bosses.
- Meaningful unlocks for roughly 8–12 hours without grind-only gates.
- Fully playable offline after installation/first web load; web installability is an enhancement, not a release dependency.
- Production-ready signed Android App Bundle and a playable Vercel deployment.
- Every third-party code and media item traceable to a license record.

## Non-goals for 1.0

- Multiplayer, accounts, cloud saves, leaderboards, live operations, backend services.
- Gacha, ads, premium currency, energy systems, or daily-login pressure.
- Complex equipment inventories, crafting trees, dialogue-heavy quests, or branching narrative campaigns.
- Physics-heavy combat, procedural terrain generation, user-created content, mod support.
- Direct portrayals of living deities, sacred beings, worship, or real communities as enemies.
- Pixel-perfect parity of platform shell UI where native conventions improve accessibility; gameplay rules remain identical.

## Success criteria

- A new player understands movement, danger, XP, and level-up choices without a text tutorial longer than three short panels.
- At least three distinct viable build archetypes per guardian during internal balance testing.
- First meaningful upgrade within 45 seconds; first evolution is discoverable in early runs and reliably achievable by a skilled player.
- No required permission beyond those imposed by platform/runtime packaging.
- All release blockers in the Master Spec are satisfied and no `UNVERIFIED — DO NOT USE YET` item ships.

## Cultural review principle

Terminology is provisional until reviewed by at least one fluent Hindi speaker and one Indian cultural sensitivity reader who is not on the core design path. Terms with sacred, ritual, or deity-specific associations must be replaced or narrowly contextualized. Government cultural resources such as [IGNCA's terminology work](https://ignca.gov.in/divisionss/kalakosa/kalatattvakosa-terms/) and the [Ministry of Culture's village mapping initiative](https://culture.gov.in/meri-gaon-meri-dharohar) are research starting points, not permission to flatten regional differences.

## Authority

Detailed requirements live in [`RAKSHAK_MASTER_SPEC.md`](../RAKSHAK_MASTER_SPEC.md). If implementation conflicts with it, the Master Spec wins unless the owner explicitly changes the specification.
