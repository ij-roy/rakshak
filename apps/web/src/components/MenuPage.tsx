import Link from 'next/link';
import { copy } from '@rakshak/game-ui';

export function MenuPage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <main className="shell">
      <header>
        <p className="tagline">{copy.brand}</p>
        <h1 className="brand" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          {title}
        </h1>
      </header>
      <section className="page-panel">
        <p>{body}</p>
      </section>
      <footer className="footer">
        <Link href="/" className="back-link">
          {copy.back}
        </Link>
      </footer>
    </main>
  );
}
