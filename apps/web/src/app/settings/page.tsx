'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { assignBinding, controlsReference, keyLabel, resolvedBindings, type BindingAction } from '@rakshak/input';
import { copy } from '@rakshak/game-ui';
import {
  commitProfile,
  computeSaveChecksum,
  createDefaultSave,
  validateSave,
  withBumpedRevision,
  type SaveFileV1,
} from '@rakshak/storage';
import { ProfileMaintenance, ProfileRecovery } from '../../components/ProfileRecovery';
import { applyTextScale } from '../../components/TextScale';
import { previewNightTone, previewSettingsCue } from '../../lib/menu-audio';
import { createIndexedDbRepository } from '../../lib/indexedDbStorage';
import { useProfile } from '../../lib/useProfile';

export default function SettingsPage() {
  const { load, refresh } = useProfile();
  const [save, setSave] = useState<SaveFileV1 | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [pendingSettings, setPendingSettings] = useState<SaveFileV1['settings'] | null>(null);
  const [confirmDefaults, setConfirmDefaults] = useState(false);

  useEffect(() => {
    if (load && load.status !== 'blocked') setSave(load.save);
  }, [load]);

  async function persist(nextSettings: SaveFileV1['settings']) {
    if (!save) return;
    const bumped = withBumpedRevision({
      ...save,
      updatedAt: new Date().toISOString(),
      settings: nextSettings,
    });
    const next: SaveFileV1 = {
      ...bumped,
      checksum: computeSaveChecksum(bumped),
    };
    setStatus('saving');
    setPendingSettings(nextSettings);
    const repo = createIndexedDbRepository();
    const written = await commitProfile(
      repo,
      (s) => JSON.stringify(s),
      (raw) => validateSave(JSON.parse(raw) as unknown),
      next,
    );
    if (!written.ok || !written.save) {
      setStatus('failed');
      return;
    }
    setSave(written.save);
    setPendingSettings(null);
    setStatus('saved');
  }

  if (!load) {
    return (
      <main className="shell">
        <p>{copy.loadingCore}</p>
      </main>
    );
  }
  if (load.status === 'blocked') {
    return (
      <ProfileRecovery
        load={load}
        onResolved={(next) => {
          setSave(next);
          void refresh();
        }}
      />
    );
  }
  if (!save) {
    return (
      <main className="shell">
        <p>{copy.loadingCore}</p>
      </main>
    );
  }

  const s = save.settings;

  return (
    <main className="shell">
      <header>
        <p className="tagline">{copy.brand}</p>
        <h1 className="brand" style={{ fontSize: 'clamp(2rem, 6vw, 3rem)' }}>
          {copy.settings}
        </h1>
      </header>
      <section className="page-panel">
        <p>{copy.settingsHint}</p>
        {load.notice ? <p>{load.notice}</p> : null}
        {status === 'saving' ? <p className="hud-muted">Saving settings…</p> : null}
        {status === 'saved' ? <p style={{ color: 'var(--color-leaf-500)' }}>Saved on this device.</p> : null}
        {status === 'failed' ? (
          <p>
            Could not save settings.{' '}
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                if (pendingSettings) void persist(pendingSettings);
              }}
            >
              Save again
            </button>
          </p>
        ) : null}

        <section className="settings-group" aria-labelledby="settings-audio">
          <h2 id="settings-audio">Audio</h2>
          <VolumeSlider
            label="Master volume"
            value={s.masterVolume}
            onChange={(masterVolume) => {
              const next = { ...s, masterVolume };
              void previewSettingsCue(next, 'ui_confirm');
              void persist(next);
            }}
          />
          <VolumeSlider
            label="Music"
            value={s.musicVolume}
            onChange={(musicVolume) => {
              const next = { ...s, musicVolume };
              void previewSettingsCue(next, 'victory');
              void persist(next);
            }}
          />
          <VolumeSlider
            label="SFX"
            value={s.sfxVolume}
            onChange={(sfxVolume) => {
              const next = { ...s, sfxVolume };
              void previewSettingsCue(next, 'pickup');
              void persist(next);
            }}
          />
          <VolumeSlider
            label="UI"
            value={s.uiVolume}
            onChange={(uiVolume) => {
              const next = { ...s, uiVolume };
              void previewSettingsCue(next, 'ui_confirm');
              void persist(next);
            }}
          />
          <VolumeSlider
            label="Night tone"
            value={s.ambienceVolume}
            onChange={(ambienceVolume) => {
              const next = { ...s, ambienceVolume };
              void previewNightTone(next);
              void persist(next);
            }}
          />
          <SwitchRow
            label="Mute"
            on={s.muted}
            onToggle={() => {
              const next = { ...s, muted: !s.muted };
              void previewSettingsCue(next, 'ui_confirm');
              void persist(next);
            }}
          />
          <p className="settings-preview" aria-live="polite">
            {s.muted ? 'Muted. Nothing plays.' : `Heard at ${Math.round(s.masterVolume * 100)}% of the bus levels.`}
            <span className="settings-meter" style={{ width: s.muted ? '0%' : `${Math.round(s.masterVolume * 100)}%` }} />
          </p>
        </section>

        <section className="settings-group" aria-labelledby="settings-controls">
          <h2 id="settings-controls">Controls</h2>
          <div className="settings-choice" role="group" aria-label="Stick side">
            {(['left', 'right'] as const).map((side) => (
              <button
                key={side}
                type="button"
                className={`settings-switch${s.stickSide === side ? ' selected' : ''}`}
                aria-pressed={s.stickSide === side}
                onClick={() => void persist({ ...s, stickSide: side })}
              >
                Stick on the {side}
              </button>
            ))}
          </div>
          <SwitchRow label="Haptics" on={s.haptics} onToggle={() => void persist({ ...s, haptics: !s.haptics })} />
          <div className="settings-choice" role="group" aria-label="Stick size">
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                type="button"
                className={`settings-switch${(s.stickSize ?? 'medium') === size ? ' selected' : ''}`}
                aria-pressed={(s.stickSize ?? 'medium') === size}
                onClick={() => void persist({ ...s, stickSize: size })}
              >
                {size} stick
              </button>
            ))}
          </div>
          <div className="settings-choice" role="group" aria-label="Stick placement">
            {(['fixed', 'floating'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`settings-switch${(s.stickMode ?? 'fixed') === mode ? ' selected' : ''}`}
                aria-pressed={(s.stickMode ?? 'fixed') === mode}
                onClick={() => void persist({ ...s, stickMode: mode })}
              >
                {mode} stick
              </button>
            ))}
          </div>
          <label className="settings-slider">
            <span>Dead zone {Math.round((s.stickDeadzone ?? 0.12) * 100)}%</span>
            <input
              type="range"
              min={0.08}
              max={0.24}
              step={0.04}
              value={s.stickDeadzone ?? 0.12}
              aria-valuetext={`${Math.round((s.stickDeadzone ?? 0.12) * 100)}%`}
              onChange={(event) => void persist({ ...s, stickDeadzone: Number(event.target.value) })}
            />
          </label>
          <p className="settings-preview">
            The {(s.stickSize ?? 'medium')} stick sits on the {s.stickSide}
            {(s.stickMode ?? 'fixed') === 'floating' ? ' and appears where you touch.' : ' in the corner.'} Movement inside the dead zone stays centered.
          </p>
          <BindingEditor settings={s} onSave={(next) => void persist(next)} />
        </section>

        <section className="settings-group" aria-labelledby="settings-visuals">
          <h2 id="settings-visuals">Visuals</h2>
          <p className="settings-preview">
            {s.reducedEffects ? 'Flashes and shake stay reduced.' : 'Flashes and shake play at full strength.'}
          </p>
        </section>

        <section className="settings-group" aria-labelledby="settings-access">
          <h2 id="settings-access">Accessibility</h2>
          <SwitchRow
            label="Reduced effects"
            on={s.reducedEffects}
            onToggle={() => void persist({ ...s, reducedEffects: !s.reducedEffects })}
          />
          <label className="settings-slider">
            <span>Text size {Math.round(s.uiScale * 100)}%</span>
            <input
              type="range"
              min={0.8}
              max={1.5}
              step={0.1}
              value={s.uiScale}
              aria-valuetext={`${Math.round(s.uiScale * 100)}%`}
              onChange={(event) => {
                const uiScale = Number(event.target.value);
                applyTextScale(uiScale);
                void persist({ ...s, uiScale });
              }}
            />
          </label>
        </section>

        <section className="settings-group" aria-labelledby="settings-data">
          <h2 id="settings-data">Data</h2>
          {confirmDefaults ? (
            <div className="settings-choice">
              <button
                type="button"
                className="settings-switch"
                onClick={() => {
                  setConfirmDefaults(false);
                  void persist(createDefaultSave().settings);
                }}
              >
                Confirm restore
              </button>
              <button type="button" className="settings-switch" onClick={() => setConfirmDefaults(false)}>
                Keep current
              </button>
            </div>
          ) : (
            <button type="button" className="settings-switch" onClick={() => setConfirmDefaults(true)}>
              Restore defaults
            </button>
          )}
          <h2>Profile file</h2>
          <p>{copy.webSaveNotice}</p>
          <ProfileMaintenance
            save={save}
            damaged={null}
            backup={null}
            onResolved={(next) => {
              setSave(next);
              void refresh();
            }}
          />
        </section>
      </section>
      <footer className="footer">
        <Link href="/" className="back-link">
          {copy.back}
        </Link>
      </footer>
    </main>
  );
}

function VolumeSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const percent = Math.round(value * 100);
  return (
    <label className="settings-slider">
      <span>
        {label} {percent}%
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        aria-valuetext={`${percent}%`}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function SwitchRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} className="settings-switch" onClick={onToggle}>
      <span>{label}</span>
      <span>{on ? 'On' : 'Off'}</span>
    </button>
  );
}

const BINDING_ACTIONS: readonly { id: BindingAction; label: string }[] = [
  { id: 'up', label: 'Move up' },
  { id: 'down', label: 'Move down' },
  { id: 'left', label: 'Move left' },
  { id: 'right', label: 'Move right' },
  { id: 'pause', label: 'Pause' },
  { id: 'confirm', label: 'Confirm' },
  { id: 'cancel', label: 'Reroll' },
];

function BindingEditor({
  settings,
  onSave,
}: {
  settings: SaveFileV1['settings'];
  onSave: (next: SaveFileV1['settings']) => void;
}) {
  const [listening, setListening] = useState<BindingAction | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!listening) return;
    const onKey = (event: KeyboardEvent) => {
      event.preventDefault();
      const result = assignBinding(settings.bindings, listening, event.code);
      if (!result.ok) {
        setNote(result.reason);
        return;
      }
      setNote(null);
      setListening(null);
      onSave({ ...settings, bindings: result.bindings });
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [listening, onSave, settings]);
  const chosen = resolvedBindings(settings.bindings);
  return (
    <div className="settings-group">
      <h2>Controls reference</h2>
      <ul className="content-list">
        {controlsReference(settings.bindings).map((row) => (
          <li key={row.action}>
            <strong>{row.action}</strong>
            <span>{row.path}</span>
          </li>
        ))}
      </ul>
      {BINDING_ACTIONS.map((action) => (
        <button
          key={action.id}
          type="button"
          className="settings-switch"
          onClick={() => {
            setNote(null);
            setListening(action.id);
          }}
        >
          <span>{action.label}</span>
          <span>{listening === action.id ? 'Press a key' : keyLabel(chosen[action.id])}</span>
        </button>
      ))}
      {note ? <p>{note}</p> : null}
    </div>
  );
}
