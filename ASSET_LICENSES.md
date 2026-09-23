# Asset Licenses

Runtime visual/audio art files are **not** bundled in this scaffold. Gameplay uses procedural shapes (Pixi / Skia circles) and procedural oscillator tones only.

## Fonts (web)

| Asset | Source | License | Version / notes | Local path | Modification | Status |
|---|---|---|---|---|---|---|
| Rajdhani | Google Fonts via `next/font/google` (build-time download, self-hosted) | SIL Open Font License 1.1 | Loaded by Next.js font pipeline | Bundled into Next hashed assets | None | Approved for scaffold — OFL |
| Noto Sans | Google Fonts via `next/font/google` (build-time download, self-hosted) | SIL Open Font License 1.1 | Loaded by Next.js font pipeline | Bundled into Next hashed assets | None | Approved for scaffold — OFL |

No runtime CDN font requests. CSS variables `--font-display` / `--font-body` remain for optional local file swaps later.

Candidate art/audio sources in `docs/04-ASSET-MANIFEST.md` and `docs/05-AUDIO-MANIFEST.md` are **not** approved runtime assets until file-level provenance is completed.

See `docs/12-LICENSING-AND-CREDITS.md`.
