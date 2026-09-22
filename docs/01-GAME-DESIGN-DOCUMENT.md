# RAKSHAK — Game Design Document

**Design baseline:** 2026-09-22  
**Run target:** 12 minutes  
**Mode:** single-player, offline, landscape

## 1. Player promise

Begin as an outnumbered guardian, turn movement and a few automatic attacks into a coherent build, survive three escalating night phases, and defeat the source of the local Chhaya before dawn. A good run moves from caution to control to spectacular pressure without becoming visually unreadable.

## 2. Core loop

```text
Choose guardian + map
  → move, evade, auto-attack
  → defeat enemies, collect Anubhav (XP)
  → choose 1 of 3 upgrades
  → complete weapon/passive pair
  → claim elite/boss chest and evolve
  → defeat final boss or fall
  → results, unlocks, permanent spending
  → choose a new build/challenge
```

`Anubhav` means experience and is a readable UI label, but cultural/localization review may replace it with plain `XP`. Mechanical clarity wins over decorative terminology.

### Run rhythm

- **0:00–1:30 — Establish:** sparse basic enemies; first level within 30–45 seconds.
- **1:30–4:00 — Commit:** first specialist enemies, first elite, boss at 4:00.
- **4:00–8:00 — Synergize:** denser waves, map hazard introduced, elite at 6:00, boss at 8:00.
- **8:00–11:30 — Stress:** mixed counters, two elite windows, build capstones.
- **11:30–12:00 — Siege:** spawn pressure rises, then freezes as the final boss enters.
- **12:00+ — Final:** timer stops; boss battle resolves the run.

Level-up pauses the simulation. The player selects from three cards; one reroll per run is granted by default. At most two pending level-ups are presented consecutively before a short return-to-play beat unless the player opts to resolve all.

## 3. Controls and combat rules

- Mobile: floating virtual stick in a configurable left/right zone; optional fixed-stick accessibility mode.
- Desktop: WASD and arrows; gamepad is a post-1.0 stretch goal.
- Weapons select targets automatically using weapon-specific policies: nearest, densest cluster, facing vector, orbit, random valid target, or ground trail.
- Player has health, move speed, armor, recovery, pickup radius, cooldown, power, duration, projectile speed, and luck. All modifiers have explicit stacking rules.
- Contact damage uses per-source invulnerability windows to prevent frame-rate-dependent melting.
- Knockback resistance, not immunity, differentiates elites and bosses.
- A run ends only after death resolution completes; revive effects, death, pending XP, and boss defeat use the deterministic priority documented in the Master Spec.

## 4. Guardians

Names are original working names and require language/cultural review.

### Asha — The Watchkeeper

- Start: `talwar_arc`
- Trait: every sixth close-range hit grants 1.5 seconds of +15% move speed; cannot stack.
- Stats: 100 health, normal speed, +10% armor.
- Role: forgiving all-rounder; available immediately.
- Unlock: default.

### Veer — The Pathstrider

- Start: `dhanush_volley`
- Trait: projectiles gain up to +20% damage over distance.
- Stats: 85 health, +10% move speed, −5% armor.
- Role: kiting and projectile builds.
- Unlock: survive 8 minutes in Gaon.

### Tara — The Emberwright

- Start: `agni_kund`
- Trait: elemental status effects last +20%; status damage cannot exceed balance caps.
- Stats: 90 health, +10% cooldown duration penalty (slower), +15% area.
- Role: zones and status synergy.
- Unlock: discover three evolutions.

### Nila — The Shadow Scout

- Start: `chakra_return`
- Trait: collecting XP at full pickup acceleration grants a stacking luck pulse, capped at +15% for 3 seconds.
- Stats: 80 health, +15% pickup radius, +10% speed.
- Role: mobile, technical, economy-forward.
- Unlock: defeat the Van boss without using a revive.

No guardian is a deity, sacred figure, caste/community stereotype, or historical person.

## 5. Primary weapons

Each weapon has 8 levels. Levels alter a small vocabulary—damage, count, cooldown, area, speed, pierce, duration, behavior—rather than bespoke exceptions. Weapon DPS budgets are measured against controlled swarms, not tooltip arithmetic alone.

1. **Talwar Arc (`talwar_arc`)** — alternating close semicircle slashes; high knockback, positional dead zone behind. Level 8 adds a follow-through.
2. **Dhanush Volley (`dhanush_volley`)** — arrows toward nearest targets; reliable range, limited pierce. Level 8 fires a marked heavy arrow.
3. **Chakra Return (`chakra_return`)** — thrown disc travels out and back; may hit once per leg; rewards line-up. The common weapon term has religious associations in some contexts; visual design must be a plain forged throwing ring, not a sacred emblem.
4. **Gada Quake (`gada_quake`)** — timed ground impact around the player; slow, large, strong knockback. Visual design is a practical fantasy war club, not deity-linked iconography.
5. **Agni Kund (`agni_kund`)** — short-lived ground flame zones placed near dense groups. `Agni` also names a deity and fire in Sanskrit-derived usage; **OWNER/CULTURAL REVIEW REQUIRED**. Preferred fallback ID/name: `ember_kund` / Ember Basin.
6. **Vajra Spark (`vajra_spark`)** — chain lightning with diminishing damage. `Vajra` has significant Hindu/Buddhist/Jain ritual and symbolic associations; **recommended production rename: `monsoon_spark`** unless cultural review approves a non-sacred contextual use.
7. **Bhuj Spear (`bhuj_spear`)** — rotating radial spear bursts; high single-hit damage, narrow lanes. Term requires weapons-history verification; fallback: `barchha_burst` or plain `spear_burst`.
8. **Neel Trail (`neel_trail`)** — damaging indigo trail behind the player; defensive pathing tool, no launch evolution.

## 6. Passive upgrades

Each passive has 5 levels and one primary stat axis.

1. **Whetstone** — weapon damage, +8% per level.
2. **Runner's Anklet** — move speed, +5% per level.
3. **Guard Plate** — armor, flat reduction with a hard cap.
4. **Oil Flask** — projectile/zone duration, +10% per level.
5. **Hunter's Cord** — projectile speed, +10% per level.
6. **Wide Sash** — area, +8% per level.
7. **Copper Bell** — pickup radius, +20% per level; subtle directional XP chime only.
8. **Moon Thread** — cooldown reduction, +4% per level, multiplicative cap at 35% total.

Passives use ordinary material/craft language. Items must not masquerade as sacred objects.

## 7. Evolutions

Recipe: base weapon level 8 + paired passive level 1+ + chest from an elite/boss. Chests queue evolution before ordinary rewards. The collection shows discovered recipes and silhouettes for undiscovered ones; it never lies about prerequisites.

1. **Talwar Arc + Whetstone → Crescent Guard** — full-circle alternating cuts; every third cut deflects minor hostile projectiles.
2. **Dhanush Volley + Hunter's Cord → Monsoon Volley** — rapid piercing arrow fan with controlled target spread.
3. **Chakra Return + Runner's Anklet → Returning Horizon** — two orbiting return paths widen as the player moves.
4. **Gada Quake + Wide Sash → Earthwake** — sequential outward shock rings; lower knockback per ring.
5. **Agni/Ember Kund + Oil Flask → Sevenfold Ember** — zones migrate between nearby clusters; name avoids ritual claims.
6. **Vajra/Monsoon Spark + Moon Thread → Storm Lattice** — chains may reconnect through shocked enemies with per-target cooldown.

`Bhuj Spear` and `Neel Trail` receive level-8 capstones but no launch evolution. This prevents every run from collapsing into identical six recipes and reserves clear expansion space.

## 8. Enemies

The Chhaya is an invented phenomenon that distorts animals, abandoned armor, dust, roots, and shadow. Human cultural or religious groups are never enemy factions.

### Shared roster roles (16)

| ID | Working name | Role | Readable counterplay |
|---|---|---|---|
| `chhaya_drifter` | Drifter | slow pursuer | baseline spacing |
| `chhaya_runner` | Runner | fast, fragile | prioritize lanes |
| `husk_guard` | Husk Guard | armored front | flank/area damage |
| `thorn_spitter` | Thorn Spitter | ranged telegraph | sidestep line |
| `burrow_mite` | Burrow Mite | delayed emergence | watch ground ring |
| `dust_leaper` | Dust Leaper | commit leap | bait, change direction |
| `lantern_wisp` | Lantern Wisp | buffs nearby speed | kill aura source |
| `root_binder` | Root Binder | slow field | leave marked patch |
| `shield_shell` | Shield Shell | directional shield | attack rear/area |
| `swarm_fragment` | Swarm Fragment | tiny flock | area weapons |
| `echo_stalker` | Echo Stalker | mirrors recent path | break rhythm |
| `ember_husk` | Ember Husk | death patch | reposition before kill |
| `sand_roller` | Sand Roller | straight charge | sidestep; wall stun |
| `fort_sentry` | Fort Sentry | stationary bolts | use cover/distance |
| `banner_husk` | Banner Husk | damage aura | focus target |
| `night_maw` | Night Maw | large bruiser | respect contact arc |

Each map draws from six core roles, introduces two local roles, then mixes previously learned enemies. Palette swaps do not count as enemy types unless behavior and silhouette also change.

### Elites (4)

- **Ironbound:** armored bruiser; armor breaks after telegraphed slam.
- **Mistcaller:** summons short-lived decoys; true body retains a rim light.
- **Packheart:** links nearby enemies; breaking links weakens it.
- **Ashhorn:** three charge patterns; colliding with terrain creates a damage window.

Elites guarantee a chest, have boss-bar-lite UI, and obey the same core combat rules.

## 9. Maps and bosses

### Gaon — Moonlit Outskirts

- Identity: crop edges, wells, low walls, carts, woven fences; no real village or community is named.
- Hazard: low walls shape paths but never trap the player permanently.
- Boss: **The Hollow Zamindar is prohibited** because it maps a loaded historical social role to evil. Production boss: **The Bell-Warden**, an original animated watch construct using expanding sound rings and summoned lantern wisps.

### Van — Whispering Canopy

- Identity: layered sal/teak-inspired forest shapes, monsoon pools, roots, ruined waymarkers.
- Hazard: roots briefly telegraph before forming slow zones.
- Boss: **The Canopy Maw**, a plant-shadow mass with sweep, seed, and burrow phases.

### Marusthal — Glasswind Expanse

- Identity: dunes, stone step structures, wind-carved ruins, indigo tents as distant set dressing.
- Hazard: wind lanes alter projectiles visually and mechanically only during clear telegraphs.
- Boss: **The Glassback**, a sand-armored beast that sheds reflective plates.

### Durg — Last Rampart

- Identity: invented hill fort, courtyards, gates, bastions, rain channels, banners using original geometry.
- Hazard: gate lanes periodically close after strong warnings; there is always an escape route.
- Boss: **The Night Standard**, a possessed siege-banner construct with lane control and add phases. Avoid religious flags, emblems, or real dynastic heraldry.

Bosses appear at 4:00 and 8:00 as map-specific lieutenants drawn from two patterns, and the named map boss at 12:00. Each boss intro lasts no more than 2.5 seconds, can be reduced/skipped after first viewing, and never removes player positional awareness.

## 10. Difficulty and balance

### Spawn budget

Every enemy has a threat cost. A director receives budget per second from a continuous curve plus phase modifiers. It spends only on map-approved groups with caps for ranged, chargers, buffers, and simultaneous telegraphs. Difficulty is not raw health inflation alone.

Baseline curve (subject to simulation tuning):

```text
budgetPerSecond(t) = 2.2 + 0.018t + 0.000035t², t in seconds
enemyHealthMultiplier(t) = 1 + 0.0012t, capped 1.85 before final boss
enemyDamageMultiplier(t) = 1 + 0.00065t, capped 1.45
```

The equations are starting hypotheses, not hidden scattered constants. Balance data owns them and test simulations chart time-to-kill, incoming damage, XP/minute, and entity counts.

### Upgrade offer rules

- Three choices; no duplicate content IDs in an offer.
- At least one owned-item upgrade when eligible, unless the player has locked a slot.
- New weapon/passive offers respect six weapon and six passive slots.
- Evolution prerequisites gain a modest offer weight after minute 4, disclosed via recipe UI; never guaranteed.
- Bad-luck protection prevents more than three consecutive offers with no owned-item upgrade.
- Reroll reuses the same eligibility state but advances the `upgrade` RNG stream.

### Difficulty modifiers after first clear

`Night Oaths` are optional and additive: +enemy speed, +elite frequency, reduced healing, or restricted rerolls. Completing an oath grants a one-time unlock/currency bonus and a permanent badge, not an endlessly scaling resource multiplier.

## 11. Permanent progression

- Currency: **Kadi** is a working fictional token; cultural/language review required. Fallback: `Guardian Marks`.
- Earned from time survived, bosses, first-clear challenges, and achievements; quitting grants only banked boss rewards to discourage exploit loops without punishing interruptions.
- Six capped tracks: Vitality, Guard, Footwork, Force, Focus, Fortune.
- Five ranks each; escalating costs; total power ceiling deliberately modest.
- One free full respec at any time in 1.0. Experimentation should not be punished.
- Characters, weapons, maps, and evolutions unlock through feats. Currency never replaces skill-based discovery requirements.

## 12. Achievements (24)

1. First Watch — survive 3 minutes.
2. Dawn Held — clear Gaon.
3. Green Silence — clear Van.
4. Across Glasswind — clear Marusthal.
5. Rampart Restored — clear Durg.
6. Close Call — clear a boss below 10% health.
7. Untouched Bell — defeat Bell-Warden without damage.
8. No Second Breath — clear a map without revive.
9. Crescent Found — discover Crescent Guard.
10. Monsoon Found — discover Monsoon Volley.
11. Horizon Found — discover Returning Horizon.
12. Earthwake Found — discover Earthwake.
13. Ember Found — discover Sevenfold Ember.
14. Lattice Found — discover Storm Lattice.
15. Full Satchel — fill all weapon and passive slots.
16. Single Purpose — reach minute 8 with only one weapon.
17. Crowdkeeper — defeat 1,000 enemies in one run.
18. Swift Watch — reach level 20 before minute 6.
19. Every Path — complete one run with each guardian.
20. Oathbound I — clear with one Night Oath.
21. Oathbound III — clear with three Night Oaths.
22. Field Notes — discover all normal enemies.
23. Master of Arms — reach level 8 with every weapon across runs.
24. Rakshak — complete all four maps and discover all six evolutions.

Achievements are local. No platform achievement service is required.

## 13. Narrative framework

The Chhaya has returned with an unnaturally long night. Four watchkeepers light a chain of ward beacons from the outlying Gaon to the sealed Durg. The cause is not a god or demon from living religion; it is an original force created by a failed defensive artifact called the Night Standard.

- Opening: 25–35 second skippable sequence—beacons extinguish one by one; the chosen guardian relights the first.
- Map intro: one sentence and a strong establishing image.
- Boss intro: name, epithet, two-second silhouette reveal.
- Post-boss: one or two lines showing the next beacon/path.
- Lore: 16 short Field Notes unlocked by enemies, maps, and bosses; 40–90 words each.
- Ending: dawn reaches the Durg, but a remaining unlit road supports future content without undermining the clear.

## 14. Replayability rationale

- **Seeded offers** create adaptation while allowing deterministic debugging.
- **Distinct starting weapons/traits** change early positioning rather than merely stats.
- **Six evolutions plus two capstone-only weapons** create route planning and incomplete information.
- **Map enemy mixes and hazards** change weapon value, preventing a universal build.
- **Night Oaths** provide opt-in mastery without fragmenting the base difficulty.
- **Discovery collection** gives concrete goals while keeping recipes honest after discovery.
- **Capped meta upgrades and free respec** reduce grind and promote experimentation.
- **Feat unlocks** teach mechanics: survive, avoid damage, use narrow builds, and face modifiers.

No daily streak, rotating shop, online seed, or fear-of-missing-out mechanic is allowed.

## 15. Game-feel specification

| Event | Visual | Audio | Haptic | Limits |
|---|---|---|---|---|
| normal hit | 1–2 frame tint, small directional particles | pooled impact variation | none | no global stop |
| critical hit | stronger flash, outlined number | bright transient | light optional | ≤25 ms hit stop |
| elite break | ring burst, brief shake | low crack + tail | medium | shake cap |
| XP collect | curved streak into player | pitch-bucketed ticks | none | aggregate dense pickups |
| level up | world desaturates, radial seal motif (original geometry) | rising cue, duck combat bus | medium | pause simulation |
| evolution | 1.8 s reveal, weapon silhouette then color | unique layered sting | heavy once | skippable after first |
| boss intro | vignette, title, camera ease | boss motif crossfade | medium | 2.5 s max |
| boss death | staged fracture, silence beat, release burst | resolved motif | heavy once | particles obey budget |
| player death | color drain, slowed presentation clock | low-pass + fall cue | heavy once | no input loss before result |

Reduced-effects settings replace flashes with outline pulses, reduce particles/shake, and preserve all mechanical telegraphs.

## 16. Content acceptance rules

- Every enemy and boss must be identifiable in grayscale silhouette tests.
- Every attack must communicate origin, affected space, and timing.
- Every upgrade card states exact mechanical changes.
- No final text, icon, name, or visual with unresolved cultural or license status.
- Balance changes require data updates, deterministic tests, and a changelog entry.
