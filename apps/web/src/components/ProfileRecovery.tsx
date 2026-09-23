'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createDefaultSave, replaceProfile, validateSave, type ProfileLoad, type SaveFileV1 } from '@rakshak/storage';
import { createIndexedDbRepository } from '../lib/indexedDbStorage';

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ProfileMaintenance({
  save,
  damaged,
  backup,
  onResolved,
}: {
  save: SaveFileV1 | null;
  damaged: string | null;
  backup: SaveFileV1 | null;
  onResolved: (save: SaveFileV1) => void;
}) {
  const [message, setMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  async function write(next: SaveFileV1, failure: string) {
    const written = await replaceProfile(createIndexedDbRepository(), next);
    if (!written.ok) {
      setMessage(failure);
      return;
    }
    setConfirmReset(false);
    setMessage('');
    onResolved(written.save);
  }

  return (
    <div className="results-detail">
      {backup ? (
        <button type="button" className="nav-link primary" onClick={() => void write(backup, 'Could not restore the backup.')}>
          Restore backup
        </button>
      ) : null}
      {save ? (
        <button type="button" className="nav-link" onClick={() => download('rakshak-profile.json', JSON.stringify(save, null, 2))}>
          Export profile
        </button>
      ) : null}
      {damaged ? (
        <button type="button" className="nav-link" onClick={() => download('rakshak-damaged-profile.json', damaged)}>
          Export damaged save
        </button>
      ) : null}
      <label className="nav-link">
        Import profile
        <input
          type="file"
          accept="application/json,.json"
          style={{ display: 'block', marginTop: 8 }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            void file.text().then(async (text) => {
              try {
                const parsed = validateSave(JSON.parse(text) as unknown);
                if (!parsed.ok) {
                  setMessage('That file is not a readable profile.');
                  return;
                }
                await write(parsed.save, 'Could not import this profile.');
              } catch {
                setMessage('That file is not a readable profile.');
              }
            });
          }}
        />
      </label>
      {confirmReset ? (
        <button
          type="button"
          className="nav-link"
          onClick={() =>
            void write(
              createDefaultSave(new Date().toISOString(), `local-reset-${Date.now()}`),
              'Could not reset this profile.',
            )
          }
        >
          Reset profile on this device
        </button>
      ) : (
        <button type="button" className="nav-link" onClick={() => setConfirmReset(true)}>
          Reset profile…
        </button>
      )}
      {message ? <p>{message}</p> : null}
    </div>
  );
}

export function ProfileRecovery({
  load,
  onResolved,
  overlay = false,
}: {
  load: Extract<ProfileLoad, { status: 'blocked' }>;
  onResolved: (save: SaveFileV1) => void;
  overlay?: boolean;
}) {
  const body = (
    <>
      <h2>Profile needs recovery</h2>
      <p>{load.notice}</p>
      <ProfileMaintenance save={null} damaged={load.damaged} backup={load.backup} onResolved={onResolved} />
      <p>
        <Link href="/" className="back-link">
          Menu
        </Link>
      </p>
    </>
  );
  if (overlay) {
    return (
      <div className="results-overlay" role="dialog" aria-modal="true" aria-label="Profile recovery">
        {body}
      </div>
    );
  }
  return (
    <main className="shell">
      <section className="page-panel">{body}</section>
    </main>
  );
}
