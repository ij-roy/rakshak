import type { ExpoConfig, ConfigContext } from 'expo/config';
import {
  ANDROID_VERSION_CODE,
  APPLICATION_ID,
  GAME_VERSION,
  PRODUCT_NAME,
} from '@rakshak/shared';
import { withAndroidManifest, type ConfigPlugin } from 'expo/config-plugins';

/** Disable android:allowBackup for privacy (docs/13). */
const withDisableBackup: ConfigPlugin = (config) =>
  withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (app?.$) {
      app.$['android:allowBackup'] = 'false';
    }
    return cfg;
  });

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: PRODUCT_NAME,
  slug: 'rakshak',
  version: GAME_VERSION,
  orientation: 'landscape',
  scheme: 'rakshak',
  userInterfaceStyle: 'dark',
  android: {
    package: APPLICATION_ID,
    versionCode: ANDROID_VERSION_CODE,
    adaptiveIcon: {
      backgroundColor: '#0B0C14',
    },
  },
  // Expo accepts function config plugins; cast keeps TS plugin union happy.
  plugins: ['expo-router', withDisableBackup] as ExpoConfig['plugins'],
  experiments: {
    typedRoutes: true,
    // New Architecture is default on modern Expo; keep explicit flag in extra for tooling.
  },
  extra: {
    newArchEnabled: true,
    eas: {
      // Set via EAS_PROJECT_ID env / `eas init` — never commit secrets.
      projectId: process.env.EAS_PROJECT_ID,
    },
  },
});
