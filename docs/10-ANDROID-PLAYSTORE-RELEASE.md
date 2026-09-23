# RAKSHAK — Android and Google Play Release

**Research date:** 2026-09-22  
**Package:** `roy.ij.rakshak`  
**Initial version name:** `1.0.0`  
**Time-sensitive:** reverify every policy within 30 days of submission.

## 1. Immediate prerequisite

### OWNER ACTION REQUIRED — package registration

Google's 2026 developer-verification guidance says Play package names must be registered by **2026-09-30** or risk removal; new Play apps are generally auto-registered, but Play Console must be checked immediately ([Play help](https://support.google.com/googleplay/android-developer/answer/16984799?hl=en), [2026 guide](https://developer.android.com/developer-verification/guides/pdf-guides/pdc-guide.pdf)).

Public research cannot prove whether `roy.ij.rakshak` is available or owned. Create/check the app record in the correct Play Console account without uploading unfinished binaries. Google describes package names as unique and effectively permanent; changing `applicationId` later creates a different app ([Android build docs](https://developer.android.com/build/configure-app-module), [Play setup](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en)).

## 2. Current Android baseline

- As of 2026-08-31, new mobile/tablet apps and updates must target **Android 16 / API 36 or higher**. Treat API 36 as mandatory; do not rely on an optional extension ([official target API policy](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)).
- `applicationId`: `roy.ij.rakshak` exactly.
- `versionName`: `1.0.0`; numeric `versionCode` starts at an owner-defined positive value and strictly increases. Play documents a maximum of 2,100,000,000 ([app setup](https://support.google.com/googleplay/android-developer/answer/9859152?hl=en)).
- 64-bit native libraries and supported ABI output must be confirmed from the Expo/Skia build.
- Minimum SDK is chosen from the pinned Expo/Skia floor and the tested device audience, not guessed now.

## 3. Developer account

- Owner must be 18+, have a Google Account, accept the Developer Distribution Agreement, and pay the current one-time US$25 registration fee; payment methods vary and prepaid cards are not accepted ([official signup help](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en-AU)).
- Account types: Personal or Organization; core Play functionality is the same ([account type help](https://support.google.com/googleplay/android-developer/answer/13634885?hl=en)).
- Identity verification is required before submission. Personal accounts may require government ID; organization accounts require D-U-N-S and representative/organization evidence ([verification help](https://support.google.com/googleplay/android-developer/answer/10841920?hl=en)).
- New personal accounts require verification using a non-rooted physical Android 10+ device through the Play Console app ([device verification](https://support.google.com/googleplay/android-developer/answer/14316361?hl=en)).
- Public contact/legal information differs by account/monetization. Review [developer information requirements](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en) before choosing the account.

## 4. Testing and production access

### Track behavior

- Internal: up to 100 testers, rapid distribution, can start before full listing, internal-only apps exempt from Data Safety.
- Closed: invited groups; app setup complete; opt-in link required.
- Open: publicly discoverable opt-in.
- Production: general users in selected regions.

Sources: [testing overview](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en-GB), [test setup](https://support.google.com/googleplay/android-developer/answer/9859348?hl=en).

### New personal-account gate

For Personal accounts created after **2023-11-13**, Google requires a closed test with at least **12 testers continuously opted in for the preceding 14 days**, then an application for production access. Google reviews test/game/readiness answers; documentation says review usually takes seven days or less but may take longer ([official requirement](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB)).

This gate is based on account type/date, not app creation date. The official source reviewed does not state the same gate for older personal or organization accounts. Record the actual account type/date in the release checklist.

## 5. AAB and signing

- New Play apps publish as Android App Bundles (`.aab`) ([official AAB requirement](https://support.google.com/googleplay/android-developer/answer/9844679?hl=en-GB)).
- Use Play App Signing. Sign uploads with the private upload key; Google holds the app-signing key and signs device APKs ([official signing guide](https://support.google.com/googleplay/android-developer/answer/9842756?hl=en)).
- Generate/store upload keystore and credentials outside Git and routine cloud-sync folders; maintain an encrypted, access-controlled backup and recovery record.
- If APIs or Digital Asset Links are added later, register Play app-signing certificate fingerprints, not merely upload-key fingerprints.
- Every update preserves package/signing lineage and increases `versionCode` ([update guidance](https://support.google.com/googleplay/android-developer/answer/9859350?hl=en)).
- Play currently documents a 200 MB maximum compressed per-device APK generated from an AAB. Stay far below; asset delivery expansion requires a new architectural decision.

## 6. App content declarations

Complete, truthfully:

- privacy policy;
- ads: `No` for the 1.0 artifact;
- target audience/content;
- app access: no login required;
- sensitive/high-risk permission declarations only if the final manifest requires them;
- Data Safety;
- IARC content rating.

Official checklist: [App content](https://support.google.com/googleplay/android-developer/answer/9859455?hl=en).

Unrated apps are not permitted. Complete the IARC game questionnaire and repeat if content materially changes ([content rating](https://support.google.com/googleplay/android-developer/answer/9859655?hl=en-GB), [2026 clarification](https://support.google.com/googleplay/android-developer/answer/17134731?hl=en)). Violence is stylized fantasy but must still be declared accurately.

## 7. Data Safety and privacy

If the final artifact truly has no network calls, telemetry, ads, analytics, crash upload, accounts, or cloud save, Data Safety may state no user data collected/shared. On-device-only processing is not collection where nothing is transmitted; nevertheless, the form is mandatory for closed/open/production and a privacy policy is required ([Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en-AE)).

Google requires a privacy-policy link in Console and a link/text inside the app even when no personal/sensitive data is accessed ([User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en-GB)). Audit the final dependency graph, manifest, and actual traffic. Minimize permissions ([Android guidance](https://developer.android.com/privacy-and-security/minimize-permission-requests)).

Decide Android Auto Backup explicitly; it is enabled by default for eligible apps ([Auto Backup](https://developer.android.com/identity/data/autobackup)). Privacy wording must match `allowBackup`/`data-extraction-rules` and observed behavior.

## 8. Store listing

- App name: ≤30 characters.
- Short description: ≤80.
- Full description: ≤4,000.
- Icon: 512×512, 32-bit PNG with alpha, ≤1,024 KB.
- Feature graphic: 1,024×500, JPEG or 24-bit PNG without alpha.
- Screenshots: minimum two across device types; up to eight per type; JPEG/24-bit PNG, no alpha, dimensions 320–3,840 px, longest side ≤2× shortest.
- For stronger game featuring eligibility: at least three true gameplay screenshots at 16:9 and ≥1,920×1,080, or 9:16 and ≥1,080×1,920.
- Preview video: optional YouTube URL, recommended for a game.
- Provide current, truthful gameplay; no unsupported awards/rank/price claims. Add alt text where Console supports/requires it.

Source: [Google Play graphic asset requirements](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en-GB).

## 9. Device catalog

After first AAB upload, review Device Catalog categories and export evidence. Compatibility derives from min SDK, ABI/native libraries, required features, screen/form factor, and exclusions. Avoid accidental required sensors/features. Exclusion rules override otherwise supported devices ([Device Catalog](https://support.google.com/googleplay/android-developer/answer/7353455?hl=en)).

## 10. Release process

1. Reserve/verify package and account.
2. Recheck policy/target API and pin Expo build stack.
3. Generate secure upload key; configure Play App Signing.
4. Build production AAB with no dev menu, debug assets, source maps in bundle, placeholder media, or undeclared permissions.
5. Inspect manifest, dependencies, SBOM/license reports, network traffic, size, ABIs, target/min SDK.
6. Upload internal track; install Play-generated build on device matrix.
7. Complete listing/App content/Data Safety/IARC/privacy policy.
8. Run closed test and satisfy account-specific production-access gate.
9. Fix pre-launch report/device issues; re-run performance and save-upgrade tests.
10. Stage rollout; monitor Play vitals manually without adding a tracking SDK.
11. Preserve AAB, mapping/symbol artifacts, lockfile, notices, screenshots, policy answers, signing runbook, and release hash.

## 11. Release blockers

- package ownership unverified;
- target below API 36;
- unresolved Data Safety/dependency behavior;
- untested AAB/signing lineage;
- unlicensed asset/font/audio;
- missing privacy policy/IARC/listing media;
- personal-account closed-test gate incomplete;
- P0/P1 defects or performance floor failure.
