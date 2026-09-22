# RAKSHAK — Audio Manifest and Architecture

**Research date:** 2026-09-22  
**Status:** candidates; no files downloaded

## Audio direction

Music should feel like a night watch becoming a storm: restrained drone and plucked texture early, layered hand percussion and low brass/wood texture under pressure, then a distinct boss ostinato. It must be original Indian-fantasy scoring, not a generalized “exotic” sample collage or imitation of a specific devotional/classical tradition.

Commission/compose final music as stems after gameplay timing is stable. CC0 tracks can support prototypes, but no verified source found provides a coherent four-map, boss, menu, victory, and defeat score at release quality.

## Verified CC0 SFX candidates

### Kenney RPG Audio

- Source: [kenney.nl/assets/rpg-audio](https://kenney.nl/assets/rpg-audio)
- Creator/license: Kenney; CC0 under [Kenney support/license](https://kenney.nl/support).
- Contents/use: footsteps, weapon and foley foundations for movement, talwar/gada impacts, pickups, environment.
- Modification: allowed; layer, trim, EQ, pitch-variate, and loudness-normalize.

### Kenney Impact Sounds

- Source: [kenney.nl/assets/impact-sounds](https://kenney.nl/assets/impact-sounds)
- Creator/license: Kenney; CC0.
- Contents/use: approximately 130 impacts; enemy hits, armor breaks, boss slams.

### Kenney Interface Sounds

- Source: [kenney.nl/assets/interface-sounds](https://kenney.nl/assets/interface-sounds)
- Creator/license: Kenney; CC0.
- Contents/use: approximately 100 UI sounds; selection, confirm, cancel, unlock, settings.

### Ninja Adventure SFX

- Source: [Pixel-Boy/AAA original pack](https://pixel-boy.itch.io/ninja-adventure-asset-pack)
- License: pack authors state CC0.
- Contents/use: 100+ SFX; candidate supplements after file-level listening, normalization, and duplication review.
- Music exclusion: pack music has unresolved third-party soundfont provenance. **UNVERIFIED — DO NOT USE YET.**

## Music candidates

### Electronic Indian tabla tune

- Source: [OpenGameArt](https://opengameart.org/content/electronic-indian-tabla-tune)
- Creator: use the exact uploader/author name from a preserved download record.
- License shown: CC0/public domain dedication.
- Format: MP3.
- Use: prototype combat-loop placeholder only; not sufficient as final score.
- Intake condition: capture the page, author field, file hash, and any embedded metadata before use.

### A Newcomer (Indian tense music)

- Source: [OpenGameArt](https://opengameart.org/content/a-newcomer-indian-tense-music)
- Conflict: page metadata reportedly says CC0 while the work's own notice says CC BY 3.0.
- Status: **UNVERIFIED — DO NOT USE YET** until the creator/source clarifies the controlling license.

## Required release cue set

### Music/ambience

- menu/dawn theme;
- four map beds, each delivered as low/mid/high intensity loop-compatible stems;
- shared elite accent;
- four boss themes or one modular boss system with four identity layers;
- victory, defeat, evolution stingers;
- Gaon night insects/wind, Van canopy/rain, Marusthal wind/sand, Durg stone/wind/metal ambience.

### SFX families

- UI: navigate, confirm, cancel, locked, unlock, pause, results tally.
- Player: step material sets, hurt, low health, death, heal, revive.
- Weapons: eight base families and six evolved variants.
- Elements: ember loop/ignite, storm chain, earth crack, wind pass.
- Combat: fleshless shadow hit, armor hit/break, critical, knockback, enemy death tiers.
- Progression: XP tick buckets, magnet sweep, level-up, chest, evolution, currency, achievement.
- Boss: intro sting, telegraph classes, phase change, death.

No enemy vocalization should mimic a real language, prayer, chant, or community stereotype.

## Cross-platform audio architecture

The core emits semantic events; it never plays files.

```ts
interface AudioCueEvent {
  cueId: AudioCueId;
  bus: 'music' | 'ambience' | 'sfx' | 'ui';
  priority: 0 | 1 | 2 | 3;
  worldPosition?: { x: number; y: number };
  intensity?: number;
  dedupeKey?: string;
}
```

- Android adapter candidate: `expo-audio`, validated against [official Expo docs](https://docs.expo.dev/versions/latest/sdk/audio/) at the pinned SDK.
- Web adapter: Web Audio API with decoded-buffer cache, gain nodes per bus, spatial pan kept subtle, and HTMLAudio fallback only if required.
- Web must unlock/resume audio after an explicit Start/Unmute gesture because autoplay is commonly blocked ([MDN autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)).
- Preload UI/first-map critical cues; stream/defer later music only on web while online, but PWA offline installation must cache all required release audio before claiming offline readiness.

## Mixer and performance budgets

- Buses: master, music, ambience, SFX, UI; settings persist separately.
- Maximum simultaneously audible voices: target 24 mobile / 32 desktop; hard cap 32/48 pending M1 measurements.
- Per-cue concurrency: normal hit 4, enemy death 4, XP 3 aggregated pitch buckets, UI 1 per action, boss telegraph never stolen by low-priority cues.
- Identical dense events coalesce in a 50 ms window; volume grows sublinearly instead of starting a sound per hit.
- Music uses sample-accurate or best-available bar/beat transitions; do not restart stems during routine level-ups.
- Boss intro ducks SFX/ambience, crossfades music, then restores combat bus.
- Target integrated loudness must be decided with the final mixer; avoid hard-coding an untested LUFS number. Prevent clipping with headroom and peak limiting.

## Haptics

Use `expo-haptics` on native ([official docs](https://docs.expo.dev/versions/v57.0.0/sdk/haptics/)); browser vibration is optional and must not affect gameplay.

- Light: UI confirm or critical hit at a throttled rate.
- Medium: level-up, elite armor break.
- Heavy: evolution, boss death, player death—one pulse sequence only.
- Global toggle and reduced-effects setting.
- No vibration per normal collision, continuous weapon, or XP pickup.

## Audio license record

Every file needs original URL, creator, exact license/version, download date, source hash, edits, format conversion, loop points, and attribution text. Rendered music made with third-party samples/soundfonts also needs proof that the instrument/sample license permits commercial rendered works. A track author's CC0 label cannot cure an unlicensed embedded sample.
