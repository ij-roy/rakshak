# RAKSHAK — Implementation Decisions Log

Goal Mode: owner unavailable. Defaults chosen from Master Spec recommendations. Cultural/legal items marked for owner confirmation in final handoff.

## D001 — Business model (Master Spec §12.1)

**Decision:** Free premium experience; no ads, no IAP SDK in 1.0.  
**Rationale:** Architecture and privacy docs assume ad-free offline product.  
**Owner confirm:** Pricing/store listing copy.

## D002 — Repository code license (Master Spec §12.2)

**Decision:** All Rights Reserved for original RAKSHAK code until owner chooses otherwise. Third-party notices remain mandatory.  
**Rationale:** Safest default; does not block local builds or Play/Vercel preparation.  
**Owner confirm:** Switch to MIT/Apache/source-available if desired.

## D003 — Orientation (Master Spec §12.4)

**Decision:** Landscape-only for 1.0 on Android and web gameplay.  
**Rationale:** Explicit Master Spec recommendation; matches UI/UX and control layout.

## D004 — Cultural terminology (GDD §5)

**Decision:** Ship culturally safer production IDs/names:

| Working | Production ID | Display |
|---|---|---|
| Agni Kund | `ember_kund` | Ember Basin |
| Vajra Spark | `monsoon_spark` | Monsoon Spark |
| Bhuj Spear | `spear_burst` | Spear Burst |
| Currency Kadi | `guardian_marks` | Guardian Marks |
| Anubhav | `xp` label “Anubhav” with tooltip “XP” | Keep dual label |

**Owner/cultural review still required** for remaining working names (Asha, Veer, Tara, Nila, map titles, boss epithets).

## D005 — Package manager

**Decision:** `pnpm` workspaces (architecture default). Turborepo deferred until caching proves value.

## D006 — Schema validator

**Decision:** Zod for content and save validation (maintained, typed, lockfile-pinned).

## D007 — Versioning scheme

See `VERSIONING.md`. Single product version `1.0.0`, Android `versionCode` starts at `1`, independent `contentVersion` and `schemaVersion`.

## D008 — Interim art/audio

**Decision:** Original procedural sprites + procedural audio for 1.0 shippable path; third-party CC0 intake only after provenance hashing.  
**Rationale:** Spec forbids unverified assets; finishing the game cannot wait on unavailable commissions.
