'use client';

import Link from 'next/link';
import { useState } from 'react';
import { achievementRows, type AchievementBoard } from '@rakshak/game-data';
import { copy } from '@rakshak/game-ui';
import { ProfileRecovery } from '../../components/ProfileRecovery';
import { useProfile } from '../../lib/useProfile';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'progress', label: 'In progress' },
  { id: 'done', label: 'Completed' },
] as const;

export default function AchievementsPage() {
  const { load, refresh } = useProfile();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');

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
  const save = load.save;
  const board: AchievementBoard = {
    achievements: save.achievements,
    clears: Object.fromEntries(Object.entries(save.records).map(([id, record]) => [id, record.clears])),
    evolutions: save.discovery.evolutions,
    enemies: save.discovery.enemies,
  };
  const rows = achievementRows(board).filter((row) => {
    if (filter === 'progress') return row.status === 'In progress';
    if (filter === 'done') return row.status === 'Completed';
    return true;
  });

  return (
    <main className="shell">
      <header>
        <p className="tagline">{copy.brand}</p>
        <h1 className="brand" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          {copy.achievements}
        </h1>
      </header>
      <section className="page-panel">
        <p>{copy.achievementsHint}</p>
        {load.notice ? <p>{load.notice}</p> : null}
        <div className="collection-tabs" role="tablist" aria-label="Achievement progress">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              className={`collection-tab${filter === item.id ? ' selected' : ''}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        {rows.length === 0 ? <p>No goals completed yet.</p> : null}
        <ul className="content-list" style={{ marginTop: 16 }}>
          {rows.map((row) => (
            <li key={row.id}>
              <div>
                <strong>{row.name}</strong>
                <div className="hud-muted">{row.requirement}</div>
                <div>
                  {row.progress} · Reward {row.reward}
                </div>
              </div>
              <span>{row.status}</span>
            </li>
          ))}
        </ul>
      </section>
      <footer className="footer">
        <Link href="/" className="back-link">
          {copy.back}
        </Link>
      </footer>
    </main>
  );
}
