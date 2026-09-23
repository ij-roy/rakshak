'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  collectionCount,
  collectionEntries,
  type CollectionCategory,
  type DiscoveryView,
} from '@rakshak/game-data';
import { copy } from '@rakshak/game-ui';
import { ProfileRecovery } from '../../components/ProfileRecovery';
import { useProfile } from '../../lib/useProfile';

const TABS: readonly { id: CollectionCategory; label: string }[] = [
  { id: 'weapons', label: 'Weapons' },
  { id: 'passives', label: 'Passives' },
  { id: 'evolutions', label: 'Evolutions' },
  { id: 'foes', label: 'Foes' },
  { id: 'lore', label: 'Lore' },
];

export default function CollectionPage() {
  const { load, refresh } = useProfile();
  const [tab, setTab] = useState<CollectionCategory>('weapons');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
  const discovery: DiscoveryView = {
    weapons: save.discovery.weapons ?? [],
    passives: save.discovery.passives ?? [],
    evolutions: save.discovery.evolutions ?? [],
    enemies: save.discovery.enemies ?? [],
    clears: Object.fromEntries(Object.entries(save.records).map(([id, record]) => [id, record.clears])),
  };
  const entries = collectionEntries(tab, discovery);
  const selected = entries.find((entry) => entry.id === selectedId) ?? entries[0];

  return (
    <main className="shell">
      <header>
        <p className="tagline">{copy.brand}</p>
        <h1 className="brand" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          {copy.collection}
        </h1>
      </header>
      <section className="page-panel">
        <p>{copy.collectionHint}</p>
        {load.notice ? <p>{load.notice}</p> : null}
        <div className="collection-tabs" role="tablist" aria-label="Collection categories">
          {TABS.map((item) => {
            const count = collectionCount(item.id, discovery);
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={`collection-tab${tab === item.id ? ' selected' : ''}`}
                onClick={() => {
                  setTab(item.id);
                  setSelectedId(null);
                }}
              >
                {tab === item.id ? 'Selected ' : ''}
                {item.label} {count.known}/{count.total}
              </button>
            );
          })}
        </div>
        <div className="collection-layout">
          <ul className="collection-list">
            {entries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className={`choice-row${selected?.id === entry.id ? ' selected' : ''}`}
                  aria-pressed={selected?.id === entry.id}
                  onClick={() => setSelectedId(entry.id)}
                >
                  <span className="collection-mark" aria-hidden="true">
                    {entry.mark}
                  </span>
                  <strong>
                    {selected?.id === entry.id ? 'Selected. ' : ''}
                    {entry.title}
                  </strong>
                  <span className="hud-muted">{entry.known ? 'Known' : 'Hidden'}</span>
                </button>
              </li>
            ))}
          </ul>
          {selected ? (
            <article className="page-panel collection-detail" aria-live="polite">
              <h2>{selected.title}</h2>
              <p>{selected.detail}</p>
              {selected.stats ? <p>{selected.stats}</p> : null}
              {selected.recipe ? <p>{selected.recipe}</p> : null}
            </article>
          ) : null}
        </div>
      </section>
      <footer className="footer">
        <Link href="/" className="back-link">
          {copy.back}
        </Link>
      </footer>
    </main>
  );
}
