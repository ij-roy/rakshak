# Third-Party Licenses

Production dependencies introduced by the scaffold. Versions below are **lockfile-resolved** where verified via `pnpm list` on 2026-09-23. Confirm against installed package `LICENSE` files before store submission.

| Package | Version | License | Use |
|---|---|---|---|
| next | 16.3.6 | MIT | Web App Router shell |
| react | 19.2.0 | MIT | UI |
| react-dom | 19.2.0 | MIT | Web DOM renderer |
| pixi.js | 8.21.0 | MIT | Web WebGL renderer |
| zod | 3.25.76 | MIT | Save/content schema validation |
| expo | 57.0.24 | MIT | Mobile shell (SDK 57) |
| expo-router | ~6.0.0 (workspace pin) | MIT | Mobile navigation |
| react-native | 0.81.5 (Expo SDK 57 pin) | MIT | Mobile runtime |
| @shopify/react-native-skia | 2.12.0 | MIT | Native canvas renderer |
| react-native-gesture-handler | ~2.28.0 | MIT | Virtual stick |
| react-native-reanimated | ~4.1.0 | MIT | Stick animation |
| @react-native-async-storage/async-storage | 2.2.0 | MIT | Mobile save adapter |
| typescript | ~5.8.3 | Apache-2.0 | Build/typecheck |
| vitest | ^3.2.4 | MIT | Unit tests |

Workspace packages under `@rakshak/*` are first-party project code (owner license TBD per Master Spec §12).

**Not incorporated:** GPL/AGPL libraries, analytics SDKs, ad SDKs, remote font/media CDNs at runtime.

Regenerate/expand this file from the lockfile before release. See `docs/12-LICENSING-AND-CREDITS.md`.
