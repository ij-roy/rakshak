import Link from 'next/link';
import { copy, creditSections } from '@rakshak/game-ui';

export default function CreditsPage() {
  return (
    <main className="shell">
      <header>
        <p className="tagline">{copy.brand}</p>
        <h1 className="brand" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          {copy.credits}
        </h1>
      </header>
      <section className="page-panel">
        {creditSections.map((section) => (
          <article key={section.title}>
            <h2>{section.title}</h2>
            {section.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </article>
        ))}
      </section>
      <footer className="footer">
        <Link href="/" className="back-link">
          {copy.back}
        </Link>
      </footer>
    </main>
  );
}
