import { GAME_VERSION, PRODUCT_NAME } from '@rakshak/shared';

/** Night Watch design tokens — docs/06-UI-UX-SPEC.md */
export const colors = {
  night950: '#0B0C14',
  night800: '#191B2B',
  indigo600: '#343A73',
  sand200: '#E5D2A6',
  brass500: '#C28A2C',
  ember500: '#D65332',
  monsoon400: '#58A6B3',
  leaf500: '#5F9D62',
  ash400: '#8A8790',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 40,
  xxl: 64,
} as const;

export const cssVarNames = {
  night950: '--color-night-950',
  night800: '--color-night-800',
  indigo600: '--color-indigo-600',
  sand200: '--color-sand-200',
  brass500: '--color-brass-500',
  ember500: '--color-ember-500',
  monsoon400: '--color-monsoon-400',
  leaf500: '--color-leaf-500',
  ash400: '--color-ash-400',
  fontDisplay: '--font-display',
  fontBody: '--font-body',
} as const;

export type ScreenName =
  | 'splash'
  | 'main_menu'
  | 'play'
  | 'upgrades'
  | 'characters'
  | 'collection'
  | 'achievements'
  | 'settings'
  | 'credits'
  | 'privacy'
  | 'pause'
  | 'results';

export const copy = {
  brand: 'RAKSHAK',
  tagline: 'Survive the Night',
  play: 'Play',
  upgrades: 'Upgrades',
  characters: 'Characters',
  collection: 'Collection',
  achievements: 'Achievements',
  settings: 'Settings',
  credits: 'Credits',
  privacy: 'Privacy',
  back: 'Back',
  resume: 'Resume',
  abandon: 'Abandon Run',
  pauseHint: 'Esc pauses. WASD or arrows move.',
  loadingCore: 'Loading core…',
  runDefeat: 'The night held.',
  runVictory: 'Dawn reached the beacon.',
  privacyBody:
    'The game contains no developer-operated analytics, advertising, accounts, or gameplay telemetry. Progress is stored only on this device. It is not sent to a server, and another device does not receive it. Clearing the app data, or this site’s data in a browser, deletes it. Hosting and app-store providers may process delivery and distribution data under their own privacy notices.',
  webSaveNotice:
    'On this website the profile lives in this browser’s local database. Settings can export that file and import it later. Clearing this site’s data deletes the profile. This website does not keep a copy of the game for offline launch, so opening it again needs a connection.',
  upgradesEmpty: 'Permanent tracks await currency from completed nights.',
  charactersHint: 'Four guardians. One starts unlocked. The rest earn their place.',
  collectionHint: 'Discovered weapons, passives, foes, and lore gather here.',
  achievementsHint: 'Each goal shows its requirement, your progress, and the guardian marks it pays.',
  settingsHint: 'Volume, stick side, reduced motion. Changes stay on this device.',
  creditsHint: 'Credits, font licenses, and tool notices are listed on this screen.',
} as const;

export const tutorialSteps = [
  {
    title: 'Move',
    body: 'WASD or the arrow keys move. On a touch screen, drag the stick. Esc or Pause freezes the night.',
  },
  {
    title: 'Your weapon fires itself',
    body: 'You do not aim or press an attack button. The weapon you carry strikes nearby foes on its own.',
  },
  {
    title: 'Pick up experience',
    body: 'Walk over the glowing stars foes drop. They fill the experience bar. A cross restores health. A coffer can evolve a weapon.',
  },
  {
    title: 'Choose an upgrade',
    body: 'When the bar fills, the night pauses and offers three choices. Pick one. Reroll only while a reroll remains.',
  },
  {
    title: 'Hold until the final boss',
    body: 'Lieutenants arrive at 4:00 and 8:00. The final boss arrives at 12:00. Defeat that boss to win. If you fall first, the watch ends.',
  },
] as const;

export const creditSections = [
  {
    title: 'Version',
    lines: [`${PRODUCT_NAME} ${GAME_VERSION}. There is no account and no server that receives a report.`],
  },
  {
    title: 'This game',
    lines: [
      'The guardians, maps, weapons, and night-watch rules are original to this project. A watch draws its pictures and synthesizes its sounds in the app. No external image pack or sound pack is included.',
    ],
  },
  {
    title: 'Fonts',
    lines: [
      'Rajdhani and Noto Sans are used under the SIL Open Font License 1.1. The website downloads them when it is built and serves them itself. They are not requested from a font service while you play.',
    ],
  },
  {
    title: 'Tools',
    lines: [
      'The website uses Next.js 16.3.6, React 19.2.0, PixiJS 8.21.0, and Zod 3, each under the MIT license.',
      'The Android app uses Expo SDK 57, React Native 0.81.5, React Native Skia 2.12.0, and Async Storage 2.2.0, each under the MIT license.',
      'TypeScript is Apache-2.0. Vitest is MIT and is used only to test the project.',
    ],
  },
  {
    title: 'Support',
    lines: [
      `Include ${PRODUCT_NAME} ${GAME_VERSION} and what you were doing when you write to the person who gave you this copy. The game has nowhere to send that note itself.`,
    ],
  },
] as const;

export const creditBody = creditSections.map((section) => `${section.title}. ${section.lines.join(' ')}`).join('\n\n');

export const menuRoutes = [
  { href: '/play', label: copy.play, primary: true },
  { href: '/upgrades', label: copy.upgrades },
  { href: '/characters', label: copy.characters },
  { href: '/collection', label: copy.collection },
  { href: '/achievements', label: copy.achievements },
  { href: '/settings', label: copy.settings },
  { href: '/credits', label: copy.credits },
] as const;
