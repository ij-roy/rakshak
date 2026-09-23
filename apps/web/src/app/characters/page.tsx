'use client';

import Link from 'next/link';
import { useState } from 'react';
import { describeGuardianLock, GUARDIANS, unlockSnapshot } from '@rakshak/game-data';
import { copy } from '@rakshak/game-ui';
import { ProfileRecovery } from '../../components/ProfileRecovery';
import { useProfile } from '../../lib/useProfile';

export default function CharactersPage() {
  const { load, refresh } = useProfile();
  const [inspected, setInspected] = useState<string | null>(null);

  if (!load) {
    return (
      <main className="shell">
        <p>{copy.loadingCore}</p>
      </main>
    );
  }
  if (load.status === 'blocked') {
    return <ProfileRecovery load={load} onResolved={() => void refresh()} />;
  }
  const locks = unlockSnapshot({
    characters: load.save.unlocks.characters,
    maps: load.save.unlocks.maps,
    evolutions: load.save.discovery.evolutions,
    records: load.save.records,
  });

  return (
    <main className="shell">
      <header>
        <p className="tagline">{copy.brand}</p>
        <h1 className="brand" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          {copy.characters}
        </h1>
      </header>
      <section className="page-panel">
        <p>{copy.charactersHint}</p>
        {load.notice ? <p>{load.notice}</p> : null}
        <ul className="content-list" style={{ marginTop: 16 }}>
          {GUARDIANS.map((guardian) => {
            const lock = describeGuardianLock(guardian.id, locks);
            return (
              <li key={guardian.id}>
                <button
                  type="button"
                  className="choice-row"
                  onClick={() => setInspected(guardian.id)}
                >
                  <strong>
                    {guardian.displayName} — {guardian.epithet}
                  </strong>
                  <span className="hud-muted">
                    HP {guardian.maxHp} · Speed {guardian.moveSpeed}
                  </span>
                  <span>
                    {lock.status}. {lock.step}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {inspected ? (
          <p className="hud-muted">
            {GUARDIANS.find((guardian) => guardian.id === inspected)?.displayName} can be read here. A locked guardian
            is not started.
          </p>
        ) : null}
      </section>
      <footer className="footer">
        <Link href="/" className="back-link">
          {copy.back}
        </Link>
      </footer>
    </main>
  );
}
