# RAKSHAK — Licensing and Credits Policy

## 1. Release rule

No third-party code, art, font, audio, sample, shader, model, or tool output may enter a production bundle unless its provenance and license are understood, recorded, and compatible. Search snippets, repository badges, copied files, AI summaries, and “free download” labels are not license evidence.

`UNVERIFIED — DO NOT USE YET` means exactly that: excluded from source/runtime builds until resolved.

## 2. Required repository files

- `LICENSE` — license for original RAKSHAK code/content. **OWNER DECISION REQUIRED**; do not create a misleading default.
- `THIRD_PARTY_LICENSES.md` — distributed code/dependency notices and full required license texts or durable references as license requires.
- `ASSET_LICENSES.md` — file-level visual/audio/font provenance, attribution, modifications.
- machine-readable `packages/assets/asset-sources.yaml` and generated runtime allowlist.
- dependency lockfile and release SBOM/notices artifact.

The manifests in `docs/04-ASSET-MANIFEST.md` and `docs/05-AUDIO-MANIFEST.md` list candidates, not proof that files were downloaded/approved.

## 3. License policy

### Pre-approved classes after provenance review

- **CC0-1.0/public-domain dedication:** preferred for media; record source/creator anyway.
- **MIT, BSD-2/3-Clause:** allowed for code; preserve notices.
- **Apache-2.0:** allowed after NOTICE/patent/change review.
- **SIL OFL 1.1:** allowed for fonts; bundle license/copyright; obey Reserved Font Names when modifying.
- **CC BY 4.0/3.0:** media allowed only when attribution placement and modification labeling are accepted before intake.

### Review required

- MPL-2.0, LGPL, EPL, CDDL: reciprocal/file/linking obligations need technical/legal review.
- CC BY-SA: adaptation/share-alike scope may affect bundled art; owner/legal approval.
- custom marketplace/itch licenses: read exact terms, seat/project restrictions, redistribution prohibitions, and AI-use clauses.
- generated content: preserve tool/model terms, source inputs, prompts, human edits, and review result.

### Prohibited by default

- GPL/AGPL code incorporated into the distributed game.
- CC BY-NC/non-commercial media for a potentially commercial release.
- CC BY-ND media that must be edited/animated/recolored.
- ripped commercial-game media, fan art without explicit rights, trademark-confusing logos.
- repositories/files with missing or ambiguous licenses.
- media copied from a code repository without independent file-level license evidence.

## 4. Intake workflow

1. **Original source:** find creator/publisher page, not an aggregator/reupload.
2. **Evidence:** archive URL, license text/version, author, date, pack/version/hash, screenshots/PDF where terms are mutable.
3. **Scope:** determine exactly which files the license covers; check subfolders, fonts, samples, soundfonts, and dependencies.
4. **Compatibility:** legal class plus commercial, modification, redistribution, platform, attribution, and share-alike implications.
5. **Record:** create manifest row before copying into runtime directories.
6. **Transform:** keep original and edited source separate; record modifications.
7. **Review:** designated license reviewer changes status to `approved`.
8. **Build enforcement:** runtime manifest references only approved IDs.
9. **Release audit:** compare packaged files/dependencies against manifests and generated notices.

## 5. Required records

### Code/dependency

- package/repository/name/version/commit;
- homepage/source and exact license URL/text;
- copyright holder;
- direct/transitive/build-only/runtime;
- copied/modified files and changes;
- notice/source-offer obligations;
- reviewer/date.

### Asset/audio/font

- stable internal ID and every local output path;
- creator and original URL;
- exact license/version and evidence snapshot;
- pack/file version/hash/download date;
- commercial/modification/redistribution/attribution conclusions;
- modifications and derivative source file;
- required credit text/link;
- reviewer/status.

Audio additionally records embedded sample/soundfont provenance. A composer cannot license samples they did not have the right to use.

## 6. Credits presentation

- In-game Credits works fully offline and lists team, cultural review, third-party code, art, audio, fonts, and tools.
- Mandatory attribution is legible and available from Main Menu → Credits; web may also link exact licenses.
- CC0 creators receive voluntary credit when practical, clearly labeled rather than falsely implying requirement.
- Do not imply creators endorse RAKSHAK.

## 7. Dependency process

- New dependency proposal states problem, why standard/local code is insufficient, alternatives, maintenance/security/license/bundle impact, exact version.
- Runtime dependencies need architecture owner approval; dev-only tools need normal review.
- Lock exact versions; automated update PRs do not auto-merge.
- Release builds generate a dependency/license inventory and flag unknown/unapproved licenses.
- Removing a package includes removing unused notice only after confirming no bundled code/assets remain.

## 8. Current findings

- Candidate survivor repositories are permissively licensed for code, but their bundled assets are often incompletely mapped. Use them as references; do not import media.
- Ninja Adventure visual/SFX pack page states CC0; its music has unresolved soundfont provenance and is prohibited until clarified.
- Kenney candidates state CC0 at original pages/support policy.
- Rajdhani/Noto font candidates use OFL and require notices.
- OpenGameArt `A Newcomer` has conflicting CC0/CC BY labeling: `UNVERIFIED — DO NOT USE YET`.

See research/manifests for direct evidence links.

## 9. Owner decisions

1. Original repository/game-code license.
2. Whether CC BY media is acceptable operationally or the project remains CC0/original-only.
3. Whether externally generated AI media is permitted and under which approved tools/records.

This document is an engineering compliance process, not jurisdiction-specific legal advice. Ambiguous or high-impact licensing requires qualified counsel.
