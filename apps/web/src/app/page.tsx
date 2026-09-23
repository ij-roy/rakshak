import Link from 'next/link';
import { copy, menuRoutes } from '@rakshak/game-ui';
import { GAME_VERSION } from '@rakshak/shared';
import { ContinueWatch } from '../components/ContinueWatch';

export default function HomePage() {
  const play = menuRoutes.find((item) => item.href === '/play');
  const rest = menuRoutes.filter((item) => item.href !== '/play');

  return (
    <main className="home">
      <section className="home-copy">
        <p className="home-place">Gaon · Moonlit Outskirts</p>
        <h1 className="brand">{copy.brand}</h1>
        <p className="tagline">{copy.tagline}</p>
        <p className="home-watch">A guardian keeps the beacon until dawn.</p>
        <nav className="nav-stack" aria-label="Main">
          <ContinueWatch />
          {play ? (
            <Link href={play.href} className="nav-link primary home-play">
              {play.label}
            </Link>
          ) : null}
          {rest.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${item.href === '/settings' ? ' home-settings' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <footer className="footer">
          <span>v{GAME_VERSION}</span>
          <Link href="/privacy">{copy.privacy}</Link>
        </footer>
      </section>
      <div className="home-scene" aria-hidden="true">
        <svg className="home-art" viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" role="img">
          <title>Gaon at night</title>
          <rect width="800" height="520" fill="#0B0C14" />
          <circle cx="620" cy="88" r="42" fill="#E5D2A6" opacity="0.9" />
          <circle cx="604" cy="80" r="36" fill="#0B0C14" />
          <path d="M0 360 C 180 320 320 400 500 350 C 640 316 720 390 800 340 L 800 520 L 0 520 Z" fill="#141624" />
          <path d="M560 300 L 610 256 L 660 300" fill="#191B2B" />
          <rect x="576" y="300" width="68" height="52" fill="#191B2B" />
          <path d="M680 312 L 722 276 L 764 312" fill="#191B2B" />
          <rect x="692" y="312" width="60" height="46" fill="#191B2B" />
          <rect x="708" y="214" width="8" height="150" fill="#C28A2C" />
          <circle cx="712" cy="192" r="26" fill="#D65332" />
          <circle cx="712" cy="180" r="12" fill="#E5D2A6" />
          <path d="M590 326 C 578 368 568 408 560 438 L 630 438 C 626 398 618 358 608 326 Z" fill="#343A73" />
          <circle cx="598" cy="308" r="16" fill="#E5D2A6" />
          <path d="M616 338 L 658 356 L 658 410 L 634 434 L 616 410 Z" fill="#58A6B3" />
          <path d="M628 366 L 646 376 L 646 398 L 634 410 L 628 398 Z" fill="#C28A2C" />
        </svg>
      </div>
    </main>
  );
}
