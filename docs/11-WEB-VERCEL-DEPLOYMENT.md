# RAKSHAK — Web and Vercel Deployment

**Research date:** 2026-09-22  
**Architecture:** Next.js shell + client-only PixiJS game + local IndexedDB save

## 1. Decision

Deploy a normal Next.js App Router project to Vercel. Server-render/static-render the light shell and metadata; dynamically mount the Pixi game client with SSR disabled. No API route, database, authentication, or server function is needed.

Vercel provides first-class Next.js deployment through Git or CLI ([framework guide](https://vercel.com/docs/frameworks/full-stack/nextjs), [CLI](https://vercel.com/docs/projects/deploy-from-cli)). Git integration creates preview deployments and a production deployment from the configured branch ([Git docs](https://vercel.com/docs/git)).

## 2. Plan/commercial use

Vercel documents Hobby as personal, non-commercial use. Ads, payments, commercial promotion, or paid commercial work require an appropriate paid plan under current terms ([Hobby](https://vercel.com/docs/plans/hobby), [fair use](https://vercel.com/docs/limits/fair-use-guidelines)). Pricing changes; consult [current pricing](https://vercel.com/pricing). This depends on the owner's business-model decision.

## 3. Rendering and bundles

- Gameplay root is a Client Component (`'use client'`). Next explains that state/events/browser APIs live in Client Components ([docs](https://nextjs.org/docs/app/getting-started/server-and-client-components)).
- Dynamically import Pixi/game mount with `ssr: false` because renderer modules may touch browser globals ([SPA guide](https://nextjs.org/docs/app/guides/single-page-applications)).
- Route splitting and `next/dynamic` defer game, collection art, later maps, and credits/license payloads ([lazy loading](https://nextjs.org/docs/app/guides/lazy-loading)). Analyze bundles before release ([bundle guide](https://nextjs.org/docs/app/guides/package-bundling)).
- `output: 'export'` is optional, not required by Vercel. It removes server-only features and default on-demand image optimization ([static export](https://nextjs.org/docs/pages/guides/static-exports)). Prefer normal deployment unless portability requires export.

## 4. Assets and caching

Next currently gives ordinary `public/` files `max-age=0` because names may not change ([public folder](https://nextjs.org/docs/app/api-reference/file-conventions/public-folder)). Therefore:

- Build/import small assets into hashed outputs where practical.
- Generate content-hashed filenames for large atlases/audio in `public` and a versioned manifest.
- `/_next/static/` immutable hashed outputs receive long caching; Vercel caches static files on its CDN ([Next CDN caching](https://nextjs.org/docs/app/guides/cdn-caching), [Vercel CDN](https://vercel.com/docs/caching/cdn-cache)).
- Recommended immutable policy is one year for content-hashed JS/CSS/fonts; never mark mutable manifest/service worker immutable ([cache headers](https://vercel.com/docs/caching/cache-control-headers)).
- Preload only menu/first-map essentials; load later map/music packs between runs.

## 5. Offline/PWA

The web game cannot be offline on first visit. It becomes offline-capable only after the shell and required assets are cached.

- Provide `app/manifest.ts`/manifest with name, short name, start URL, standalone display, theme/background colors, and 192/512 icons.
- HTTPS is supplied by Vercel.
- Service worker precaches shell, hashed client chunks, fonts, first map, and core audio; remaining release content must be installed/cached before the UI claims “available offline.”
- Cache immutable assets cache-first; navigation/app manifest with explicit revalidation; service worker itself no-cache.
- Version caches, verify new manifest/assets before activation, retain one rollback cache, and show an update-ready prompt outside runs.

Next's [PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps) mentions Serwist but its webpack dependency may conflict with current Next/Turbopack workflows. **UNVERIFIED — DO NOT ADOPT SERWIST UNTIL M9 COMPATIBILITY TEST.** A minimal reviewed service worker may be lower risk. Installability guidance: [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## 6. Browser constraints

### Audio

Audible autoplay is commonly blocked. The Start/Unmute action must resume/create AudioContext and handle rejection ([MDN autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [Web Audio practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices)). Persist volume locally; suspend/duck on visibility loss.

### Input

- Keyboard: WASD/arrows; clear held inputs on blur/visibility.
- Touch: Pointer Events; `touch-action: none` only over the canvas; prevent unwanted page zoom/scroll without breaking surrounding accessibility.
- Mouse not required for gameplay.
- Browser gestures/back need an abandon/resume warning; never trap the user in fullscreen.

### Fullscreen

Call `requestFullscreen()` only from a trusted user action, handle promise rejection and `fullscreenchange/error`, and retain a playable non-fullscreen layout. iOS/browser behavior is not universal ([MDN API](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen), [guide](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide)).

### Resize/visibility/WebGL

- Resize through the viewport adapter; cap combat view to avoid ultrawide advantage.
- Pause and rebase clock on hidden tabs; `requestAnimationFrame` commonly pauses.
- Handle WebGL context loss/restoration and show recoverable UI.

## 7. Browser support

Release support: current and previous Chrome, Edge, Firefox desktop; current Safari; current Chrome Android; current Safari iOS. Do not claim exact versions until M9 tests the pinned renderer/build. WebGL2 may optimize, but WebGL-compatible fallback policy must match Pixi's supported configuration.

## 8. Security headers

Start with a restrictive policy and loosen only for measured needs:

- CSP default/self; scripts/styles/workers/media/fonts/images from self; no third-party analytics/CDN; account for WebAssembly only if used.
- `X-Content-Type-Options: nosniff`.
- strict `Referrer-Policy`.
- frame embedding denied unless an explicit product requirement emerges.
- Permissions Policy disables unused camera, microphone, geolocation, payment, etc.

Test production headers, service worker, source maps, and asset MIME types. Never expose secrets because none are needed.

## 9. Privacy statement boundary

Do not add Vercel Web Analytics/Speed Insights, Google Analytics, crash upload, remote fonts/media, ads, or telemetry in 1.0. Saves stay in IndexedDB.

Nevertheless, a hosted page cannot claim no server receives delivery data. Vercel's privacy notice describes processing end-user traffic such as IP-derived location, request/log, device/system, and telemetry information ([Vercel privacy](https://vercel.com/legal/privacy-notice), [runtime logs](https://vercel.com/docs/logs/runtime)). Approved wording:

> The game contains no developer-operated analytics, advertising, accounts, or gameplay telemetry. Game progress remains in this browser/device. Hosting and app-store providers may process delivery and distribution data under their own privacy notices.

## 10. Deployment checklist

1. Pin current secure Next/Pixi versions; run dependency/license audit.
2. Production build/typecheck/tests/content/license validation.
3. Preview deployment: functional, performance, CSP, media MIME, save, audio, touch, keyboard.
4. Run fresh-cache, repeat-cache, offline, update, failed-update, and rollback cases.
5. Verify content hashes/cache headers and no unintended outbound requests.
6. Production deploy; smoke-test generated and custom domains.
7. Preserve build/deployment hash, manifest, notices, privacy version, and rollback URL.

No backend is added merely for deployment.
