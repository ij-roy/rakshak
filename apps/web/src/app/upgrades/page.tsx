'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { describeMetaOffer, META_TRACKS, metaSpent } from '@rakshak/game-data';
import { copy } from '@rakshak/game-ui';
import {
  commitProfile,
  computeSaveChecksum,
  validateSave,
  withBumpedRevision,
  type SaveFileV1,
} from '@rakshak/storage';
import { ProfileRecovery } from '../../components/ProfileRecovery';
import { createIndexedDbRepository } from '../../lib/indexedDbStorage';
import { useProfile } from '../../lib/useProfile';

export default function UpgradesPage() {
  const { load, refresh } = useProfile();
  const [save, setSave] = useState<SaveFileV1 | null>(null);
  const [message, setMessage] = useState('');
  const [buying, setBuying] = useState(false);
  const buyingRef = useRef(false);

  useEffect(() => {
    if (load && load.status !== 'blocked') setSave(load.save);
  }, [load]);

  async function commitNext(next: SaveFileV1, success: string) {
    const written = await commitProfile(
      createIndexedDbRepository(),
      (s) => JSON.stringify(s),
      (raw) => validateSave(JSON.parse(raw) as unknown),
      next,
    );
    if (!written.ok || !written.save) {
      setMessage('Could not save this change. Try again.');
      return;
    }
    setSave(written.save);
    setMessage(success);
  }

  async function buyRank(trackId: (typeof META_TRACKS)[number]['id']) {
    if (buyingRef.current || !save) return;
    const track = META_TRACKS.find((t) => t.id === trackId)!;
    const current = save.meta.upgrades[trackId] ?? 0;
    const offer = describeMetaOffer(trackId, current, save.meta.currency);
    if (offer.capped) {
      setMessage('Track complete.');
      return;
    }
    if (!offer.affordable || offer.cost == null) {
      setMessage(offer.nextText);
      return;
    }
    buyingRef.current = true;
    setBuying(true);
    const bumped = withBumpedRevision({
      ...save,
      updatedAt: new Date().toISOString(),
      meta: {
        ...save.meta,
        currency: save.meta.currency - offer.cost,
        upgrades: { ...save.meta.upgrades, [trackId]: current + 1 },
      },
    });
    const next: SaveFileV1 = {
      ...bumped,
      checksum: computeSaveChecksum(bumped),
    };
    setMessage('Saving this purchase…');
    try {
      await commitNext(next, `${track.displayName} rank ${current + 1} taken.`);
    } finally {
      buyingRef.current = false;
      setBuying(false);
    }
  }

  async function respec() {
    if (buyingRef.current || !save || save.meta.freeRespecUsed) return;
    const refund = metaSpent(save.meta.upgrades);
    if (refund === 0) {
      setMessage('No ranks to refund.');
      return;
    }
    buyingRef.current = true;
    setBuying(true);
    const bumped = withBumpedRevision({
      ...save,
      updatedAt: new Date().toISOString(),
      meta: {
        ...save.meta,
        currency: save.meta.currency + refund,
        upgrades: Object.fromEntries(META_TRACKS.map((track) => [track.id, 0])),
        freeRespecUsed: true,
      },
    });
    const next: SaveFileV1 = { ...bumped, checksum: computeSaveChecksum(bumped) };
    try {
      await commitNext(next, `Free respec returned ${refund} Guardian Marks.`);
    } finally {
      buyingRef.current = false;
      setBuying(false);
    }
  }

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

  return (
    <main className="shell">
      <header>
        <p className="tagline">{copy.brand}</p>
        <h1 className="brand" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          {copy.upgrades}
        </h1>
      </header>
      <section className="page-panel">
        <p>
          Guardian Marks: <strong>{save?.meta.currency ?? 0}</strong>
        </p>
        <p className="hud-muted">{copy.upgradesEmpty}</p>
        {load.notice ? <p>{load.notice}</p> : null}
        {message ? <p style={{ color: 'var(--color-brass-500)' }}>{message}</p> : null}
        <ul className="content-list" style={{ marginTop: 16 }}>
          {META_TRACKS.map((t) => {
            const rank = save?.meta.upgrades[t.id] ?? 0;
            const offer = describeMetaOffer(t.id, rank, save?.meta.currency ?? 0);
            return (
              <li key={t.id}>
                <div>
                  <strong>
                    {t.displayName} · {rank}/5
                  </strong>
                  <div className="hud-muted">{offer.currentText}</div>
                  <div className="hud-muted">{offer.nextText}</div>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  disabled={buying || !offer.affordable}
                  onClick={() => void buyRank(t.id)}
                >
                  Spend
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="nav-link"
          disabled={buying || Boolean(save?.meta.freeRespecUsed)}
          onClick={() => void respec()}
        >
          {save?.meta.freeRespecUsed ? 'Free respec used' : 'Free respec'}
        </button>
        <p className="hud-muted">One free respec in this version. It returns every mark spent on these tracks.</p>
      </section>
      <footer className="footer">
        <Link href="/" className="back-link">
          {copy.back}
        </Link>
      </footer>
    </main>
  );
}
