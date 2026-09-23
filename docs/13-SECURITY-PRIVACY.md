# RAKSHAK — Security and Privacy

## 1. Privacy posture

Version 1 collects no personal information and operates without accounts, authentication, gameplay telemetry, advertising, cloud save, or developer-operated backend. Native gameplay must remain functional in airplane mode. Web delivery requires a network on first load and hosting providers necessarily process request data.

## 2. Data inventory

Stored locally:

- settings/control/accessibility preferences;
- unlocks, achievements, discovery, upgrades, statistics;
- run checkpoint and local diagnostics;
- random local save UUID used only to distinguish/export saves.

Not collected by the developer:

- name, email, phone, contacts, location, photos, advertising ID;
- account/payment data;
- gameplay events or crash reports transmitted off-device;
- cross-site/device identifiers.

## 3. Permissions

The intended Android app needs no sensitive runtime permission. Audit the merged manifest because dependencies can add permissions. Avoid camera, microphone, contacts, location, notifications, advertising ID, storage/media access, and network state unless an explicit future feature and privacy review require them. Android recommends minimizing permissions ([official guidance](https://developer.android.com/privacy-and-security/minimize-permission-requests)).

Whether `INTERNET` can be omitted depends on Expo/runtime/build behavior; verify the release manifest and airplane-mode operation. Do not promise omission before evidence.

## 4. Threat model

- Corrupt or malicious imported/local save data causing crash/resource exhaustion.
- Dependency or build-chain compromise.
- Web XSS/content injection through deployment/configuration.
- Service-worker cache poisoning/stale incompatible content.
- Accidental secrets/signing keys in repository or logs.
- Unlicensed or privacy-invasive SDK introduced by an agent.
- Debug menus/source maps/diagnostics leaking into production.

Cheating is not a security threat for a local single-player game. Do not add invasive anti-cheat.

## 5. Controls

- Validate all save/content data, bound arrays/numbers/strings, and quarantine unknown IDs.
- No `eval`, remote code, runtime mod loading, or executable save content.
- Lockfile, reviewed dependency updates, provenance/SBOM, vulnerability scanning at release.
- Least-privilege CSP and security headers on web; self-host fonts/assets.
- Content-hashed caches and signed HTTPS deployment; versioned service-worker activation/rollback.
- Signing/upload keys outside Git; secret scanning; minimal Play Console roles and 2-step verification.
- Production builds disable dev menus and verbose diagnostics; logs are bounded and contain no full save unless user explicitly exports it.
- No network SDK can be added without an owner-approved privacy/spec change.

## 6. Google Play Data Safety

On-device-only processing is not collection if data is not transmitted. A final offline/no-SDK artifact may declare no data collected/shared, but the declaration must be based on the built artifact and traffic audit, not intention. Data Safety remains required for closed/open/production and a privacy policy remains required ([Google guidance](https://support.google.com/googleplay/android-developer/answer/10787469?hl=en-AE), [User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en-GB)).

State Android backup behavior accurately. Device/cloud backup may move data off-device even if the developer never receives it.

## 7. Privacy policy minimum

- app/developer identity and contact;
- effective date/version;
- statement that game progress/settings are stored locally and not transmitted to the developer;
- exact backup behavior;
- reset/delete instructions;
- Android/Google Play and Vercel delivery-data boundary;
- child/target-audience statement consistent with Play declarations;
- future-change notice;
- links to third-party provider policies where appropriate.

Privacy policy URL must be public, stable, non-geoblocked, and viewable without login. Include the same text/link inside Settings/Credits.

## 8. Future analytics/crash reporting

Not approved in 1.0. A future proposal must specify event/data fields, purpose, processor, regions/retention, consent/legal basis, opt-out/delete path, offline behavior, SDK permissions/network endpoints, Play Data Safety changes, privacy-policy update, security review, and a no-SDK alternative. Default to aggregate, opt-in, short retention, no advertising identifier.

## 9. Future ads/IAP

Not approved. Ads materially change data collection, network, child-directed treatment, consent, store declarations, dependency risk, performance, and UX. IAP requires restore/purchase validation design and store policy. Either requires a new product/architecture/privacy decision—not a dependency addition.

## 10. Incident/release response

- If a dependency/license/privacy issue is found before release: block release and remove or replace it.
- After release: preserve evidence, assess affected versions/data, remove network behavior, publish corrected disclosure/update, follow provider/store notification obligations.
- Roll back Vercel deployment if web security/update behavior is compromised; revoke/rotate exposed credentials; upload key recovery follows Play's official process.
