import type { CSSProperties, ReactNode } from 'react';
import type { Metadata } from 'next';
import { Noto_Sans, Rajdhani } from 'next/font/google';
import { GAME_VERSION, PRODUCT_NAME, TAGLINE } from '@rakshak/shared';
import { MenuSounds } from '../components/MenuSounds';
import { PageExit } from '../components/PageExit';
import { TextScale } from '../components/TextScale';
import './globals.css';

/**
 * next/font downloads OFL fonts at build time and self-hosts them
 * (no runtime Google CDN). Rajdhani + Noto Sans are SIL Open Font License.
 */
const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display-loaded',
  display: 'swap',
});

const notoSans = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${PRODUCT_NAME} — ${TAGLINE}`,
  description: 'Offline-first survivor roguelite. Survive the night.',
  applicationName: PRODUCT_NAME,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${notoSans.variable}`}>
      <body
        style={
          {
            ['--font-display']: `var(--font-display-loaded), 'Segoe UI', system-ui, sans-serif`,
            ['--font-body']: `var(--font-body-loaded), 'Segoe UI', system-ui, sans-serif`,
          } as CSSProperties
        }
      >
        <div className="app-root">
          <TextScale />
          <MenuSounds />
          <PageExit />
          {children}
          <span className="sr-only" data-version={GAME_VERSION} />
        </div>
      </body>
    </html>
  );
}
