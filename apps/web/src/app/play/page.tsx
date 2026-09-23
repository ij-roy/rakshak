'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import {
  describeGuardianChoice,
  describeGuardianLock,
  describeMapChoice,
  describeMapLock,
  describeWatchSummary,
  GUARDIANS,
  MAPS,
  unlockSnapshot,
  type GuardianId,
  type MapId,
} from '@rakshak/game-data';
import { copy } from '@rakshak/game-ui';
import { loadProfile, type ProfileLoad, type SaveFileV1 } from '@rakshak/storage';
import { ProfileRecovery } from '../../components/ProfileRecovery';
import { GuardianMark, MapMark } from '../../components/WatchMarks';
import { createIndexedDbRepository } from '../../lib/indexedDbStorage';
import { applyPlayAction, initialPlaySession, resolvePlayLink, type PlaySession } from '../../lib/play-session';
import {
  clearRunCheckpointSync,
  readRunCheckpointSync,
  RUN_FRESH_FLAG,
  RUN_RESUME_FLAG,
} from '../../lib/runCheckpoint';
import { formatCheckpointTime, type RunCheckpointV1 } from '@rakshak/game-core';

const GameMount = dynamic(() => import('../../components/GameMount').then((m) => m.GameMount), {
  ssr: false,
  loading: () => (
    <main className="shell">
      <p className="tagline">{copy.loadingCore}</p>
    </main>
  ),
});

function parseParam(value: string | null): string | null {
  return value && value.length > 0 ? value : null;
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <main className="shell">
          <p className="tagline">{copy.loadingCore}</p>
        </main>
      }
    >
      <PlayClient />
    </Suspense>
  );
}

function PlayClient() {
  const params = useSearchParams();
  const [save, setSave] = useState<SaveFileV1 | null>(null);
  const [profile, setProfile] = useState<ProfileLoad | null>(null);
  const [linkReady, setLinkReady] = useState(false);
  const [linkNotice, setLinkNotice] = useState<string | null>(null);
  const [session, setSession] = useState<PlaySession>(() =>
    initialPlaySession({
      guardianId: 'asha',
      mapId: 'gaon',
      started: false,
    }),
  );
  const [discardCheckpoint, setDiscardCheckpoint] = useState<RunCheckpointV1 | null>(null);
  const [inspected, setInspected] = useState<string | null>(null);
  const guardianId = session.guardianId;
  const mapId = session.mapId;

  useEffect(() => {
    const repo = createIndexedDbRepository();
    void (async () => {
      const loaded = await loadProfile(repo);
      setProfile(loaded);
      if (loaded.status !== 'blocked') setSave(loaded.save);
    })();
  }, []);

  useEffect(() => {
    if (!save) return;
    const link = resolvePlayLink({
      guardian: parseParam(params.get('guardian')),
      map: parseParam(params.get('map')),
      locks: unlockSnapshot({
        characters: save.unlocks.characters,
        maps: save.unlocks.maps,
        evolutions: save.discovery.evolutions,
        records: save.records,
      }),
    });
    setLinkNotice(link.notice);
    if (link.inspected) setInspected(link.inspected);
    setSession((current) => {
      if (current.started && link.started && current.guardianId === link.guardianId && current.mapId === link.mapId) {
        return current;
      }
      if (current.started && !link.started) return current;
      if (current.started && link.started) {
        return { ...current, guardianId: link.guardianId, mapId: link.mapId, nonce: current.nonce + 1 };
      }
      return { guardianId: link.guardianId, mapId: link.mapId, started: link.started, nonce: current.nonce };
    });
    setLinkReady(true);
  }, [save, params]);

  const locks = unlockSnapshot({
    characters: save?.unlocks.characters ?? ['asha'],
    maps: save?.unlocks.maps ?? ['gaon'],
    evolutions: save?.discovery.evolutions ?? [],
    records: save?.records ?? {},
  });

  if (!profile || (profile.status !== 'blocked' && !linkReady)) {
    return (
      <main className="shell">
        <p className="tagline">{copy.loadingCore}</p>
      </main>
    );
  }
  if (profile.status === 'blocked') {
    return (
      <ProfileRecovery
        load={profile}
        onResolved={(next) => {
          setSave(next);
          setProfile({ status: 'ready', save: next, notice: null, damaged: null, backup: null });
        }}
      />
    );
  }

  if (session.started) {
    return (
      <GameMount
        key={`${session.guardianId}-${session.mapId}-${session.nonce}`}
        guardianId={session.guardianId}
        mapId={session.mapId}
        onRetry={() => {
          clearRunCheckpointSync();
          sessionStorage.setItem(RUN_FRESH_FLAG, '1');
          sessionStorage.removeItem(RUN_RESUME_FLAG);
          setSession((current) => applyPlayAction(current, 'retry'));
        }}
        onNewWatch={() => {
          clearRunCheckpointSync();
          sessionStorage.setItem(RUN_FRESH_FLAG, '1');
          sessionStorage.removeItem(RUN_RESUME_FLAG);
          window.history.replaceState(null, '', '/play');
          setSession((current) => applyPlayAction(current, 'new-watch'));
        }}
        onNextMap={(nextMap) => {
          clearRunCheckpointSync();
          sessionStorage.setItem(RUN_FRESH_FLAG, '1');
          sessionStorage.removeItem(RUN_RESUME_FLAG);
          const nextUrl = `/play?guardian=${session.guardianId}&map=${nextMap}`;
          window.history.replaceState(null, '', nextUrl);
          setSession((current) => ({ ...current, mapId: nextMap, started: true, nonce: current.nonce + 1 }));
        }}
      />
    );
  }

  return (
    <main className="shell setup-shell">
      <header>
        <p className="tagline">{copy.brand}</p>
        <h1 className="brand" style={{ fontSize: 'clamp(2rem, 6vw, 3.2rem)' }}>
          Choose your watch
        </h1>
        {profile.notice ? <p>{profile.notice}</p> : null}
        {linkNotice ? <p>{linkNotice}</p> : null}
      </header>

      <section className="setup-grid">
        <div className="page-panel">
          <h2>Guardian</h2>
          <div className="choice-stack">
            {GUARDIANS.map((g) => {
              const lock = describeGuardianLock(g.id, locks);
              const preview = describeGuardianChoice(g.id);
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`choice-row${guardianId === g.id ? ' selected' : ''}${lock.unlocked ? '' : ' locked'}`}
                  aria-pressed={guardianId === g.id}
                  aria-disabled={!lock.unlocked}
                  onClick={() => {
                    setInspected(g.id);
                    if (!lock.unlocked) return;
                    setSession((current) => ({ ...current, guardianId: g.id }));
                  }}
                >
                  <strong>
                    {guardianId === g.id ? 'Selected. ' : ''}
                    {lock.unlocked ? '' : 'Locked. '}
                    {g.displayName}
                  </strong>
                  <span>{preview.weaponName}</span>
                  <span>{preview.stats}</span>
                  <span className="hud-muted">
                    {lock.status}. {lock.step}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="page-panel">
          <h2>Map</h2>
          <div className="choice-stack">
            {MAPS.map((m) => {
              const lock = describeMapLock(m.id, locks);
              const preview = describeMapChoice(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`choice-row${mapId === m.id ? ' selected' : ''}${lock.unlocked ? '' : ' locked'}`}
                  aria-pressed={mapId === m.id}
                  aria-disabled={!lock.unlocked}
                  onClick={() => {
                    setInspected(m.id);
                    if (!lock.unlocked) return;
                    setSession((current) => ({ ...current, mapId: m.id }));
                  }}
                >
                  <strong>
                    {mapId === m.id ? 'Selected. ' : ''}
                    {lock.unlocked ? '' : 'Locked. '}
                    {m.displayName}
                  </strong>
                  <span>
                    {preview.intensity}. {preview.hazard}
                  </span>
                  <span className="hud-muted">
                    {lock.status}. {lock.step}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
      <section className="watch-preview" aria-label="Selected watch">
        {(() => {
          const guardianPreview = describeGuardianChoice(guardianId);
          const record = save?.records[mapId];
          const mapPreview = describeMapChoice(mapId, record);
          return (
            <>
              <div className="page-panel watch-card">
                <GuardianMark id={guardianId} />
                <div>
                  <h2>{guardianPreview.name}</h2>
                  <p>{guardianPreview.epithet}</p>
                  <p>
                    <strong>{guardianPreview.weaponName}.</strong> {guardianPreview.weaponBehavior}
                  </p>
                  <p>{guardianPreview.stats}</p>
                  <p>{guardianPreview.role}</p>
                </div>
              </div>
              <div className="page-panel watch-card">
                <MapMark id={mapId} />
                <div>
                  <h2>{mapPreview.name}</h2>
                  <p>{mapPreview.subtitle}</p>
                  <p>{mapPreview.hazard}</p>
                  <p>
                    {mapPreview.intensity} watch. {mapPreview.expectation}
                  </p>
                  <p>{mapPreview.threats}</p>
                  <p>{mapPreview.best}</p>
                </div>
              </div>
              <p className="watch-summary">{describeWatchSummary(guardianId, mapId, record)}</p>
            </>
          );
        })()}
      </section>
      {inspected ? (
        <p className="hud-muted">
          {(() => {
            const guardian = GUARDIANS.find((item) => item.id === inspected);
            if (guardian) {
              const lock = describeGuardianLock(guardian.id, locks);
              return `${guardian.displayName}: ${lock.step}${lock.unlocked ? '' : ' This guardian stays locked, so the watch does not start.'}`;
            }
            const map = MAPS.find((item) => item.id === inspected);
            if (!map) return null;
            const lock = describeMapLock(map.id, locks);
            return `${map.displayName}: ${lock.step}${lock.unlocked ? '' : ' This map stays locked, so the watch does not start.'}`;
          })()}
        </p>
      ) : null}

      <div className="setup-actions">
        {discardCheckpoint ? (
          <div className="page-panel">
            <p>
              An interrupted watch on {discardCheckpoint.mapId} is saved at{' '}
              {formatCheckpointTime(discardCheckpoint.tick)}. Starting a new watch clears that checkpoint. Marks from
              the interrupted watch are not awarded.
            </p>
            <button
              type="button"
              className="nav-link primary"
              onClick={() => {
                clearRunCheckpointSync();
                sessionStorage.setItem(RUN_FRESH_FLAG, '1');
                sessionStorage.removeItem(RUN_RESUME_FLAG);
                setDiscardCheckpoint(null);
                setSession((current) => applyPlayAction(current, 'start'));
              }}
            >
              Discard and start
            </button>
            <Link
              href={`/play?continue=1&guardian=${discardCheckpoint.guardianId}&map=${discardCheckpoint.mapId}`}
              className="nav-link"
            >
              Continue that watch
            </Link>
          </div>
        ) : null}
        <button
          type="button"
          className="nav-link primary"
          onClick={() => {
            if (!describeGuardianLock(guardianId, locks).unlocked || !describeMapLock(mapId, locks).unlocked) return;
            const checkpoint = readRunCheckpointSync();
            if (checkpoint) {
              setDiscardCheckpoint(checkpoint);
              return;
            }
            sessionStorage.setItem(RUN_FRESH_FLAG, '1');
            setSession((current) => applyPlayAction(current, 'start'));
          }}
        >
          Start Run
        </button>
        <Link href="/" className="back-link">
          {copy.back}
        </Link>
      </div>
    </main>
  );
}
