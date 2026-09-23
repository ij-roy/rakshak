import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@rakshak/shared',
    '@rakshak/game-protocol',
    '@rakshak/game-data',
    '@rakshak/game-core',
    '@rakshak/storage',
    '@rakshak/input',
    '@rakshak/audio',
    '@rakshak/renderer-web-pixi',
    '@rakshak/game-ui',
  ],
  reactStrictMode: true,
  // Workspace packages use ESM `.js` import specifiers that map to `.ts` sources.
  // Webpack extensionAlias resolves them; Turbopack currently does not.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
