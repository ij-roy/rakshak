import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { copy } from '@rakshak/game-ui';
import {
  commitProfile,
  computeSaveChecksum,
  validateSave,
  withBumpedRevision,
  type SaveFileV1,
} from '@rakshak/storage';
import { MenuScreen, menuStyles, MobileRecovery } from '../components/MenuScreen';
import { useMobileProfile } from '../components/useMobileProfile';
import { createAsyncStorageRepository } from '../lib/asyncStoragePort';

export default function SettingsScreen() {
  const { load, refresh } = useMobileProfile();
  const [save, setSave] = useState<SaveFileV1 | null>(null);
  const [status, setStatus] = useState('');

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
    const next: SaveFileV1 = { ...bumped, checksum: computeSaveChecksum(bumped) };
    setStatus('Saving settings…');
    const written = await commitProfile(
      createAsyncStorageRepository(),
      (profile) => JSON.stringify(profile),
      (raw) => validateSave(JSON.parse(raw) as unknown),
      next,
    );
    if (!written.ok || !written.save) {
      setStatus('Could not save settings.');
      return;
    }
    setSave(written.save);
    setStatus('Saved on this device.');
  }

  if (!load) return <MenuScreen title={copy.settings} hint={copy.loadingCore}>{null}</MenuScreen>;
  if (load.status === 'blocked') return <MobileRecovery load={load} onResolved={() => void refresh()} />;
  if (!save) return <MenuScreen title={copy.settings} hint={copy.loadingCore}>{null}</MenuScreen>;
  const settings = save.settings;

  function step(value: number, delta: number) {
    return Math.min(1, Math.max(0, Math.round((value + delta) * 20) / 20));
  }

  return (
    <MenuScreen title={copy.settings} hint={copy.settingsHint}>
      {load.notice ? <Text style={menuStyles.message}>{load.notice}</Text> : null}
      <VolumeRow label="Master" value={settings.masterVolume} onDelta={(delta) => void persist({ ...settings, masterVolume: step(settings.masterVolume, delta) })} />
      <VolumeRow label="Music" value={settings.musicVolume} onDelta={(delta) => void persist({ ...settings, musicVolume: step(settings.musicVolume, delta) })} />
      <VolumeRow label="SFX" value={settings.sfxVolume} onDelta={(delta) => void persist({ ...settings, sfxVolume: step(settings.sfxVolume, delta) })} />
      <Pressable style={menuStyles.action} onPress={() => void persist({ ...settings, muted: !settings.muted })}>
        <Text style={menuStyles.actionText}>Mute: {settings.muted ? 'On' : 'Off'}</Text>
      </Pressable>
      <Pressable style={menuStyles.action} onPress={() => void persist({ ...settings, reducedEffects: !settings.reducedEffects })}>
        <Text style={menuStyles.actionText}>Reduced effects: {settings.reducedEffects ? 'On' : 'Off'}</Text>
      </Pressable>
      <Pressable
        style={menuStyles.action}
        onPress={() => void persist({ ...settings, stickSide: settings.stickSide === 'left' ? 'right' : 'left' })}
      >
        <Text style={menuStyles.actionText}>Stick side: {settings.stickSide}</Text>
      </Pressable>
      {status ? <Text style={menuStyles.message}>{status}</Text> : null}
    </MenuScreen>
  );
}

function VolumeRow({ label, value, onDelta }: { label: string; value: number; onDelta: (delta: number) => void }) {
  return (
    <View style={menuStyles.row}>
      <Text style={menuStyles.name}>
        {label} {Math.round(value * 100)}%
      </Text>
      <Pressable onPress={() => onDelta(-0.05)} style={menuStyles.action}>
        <Text style={menuStyles.actionText}>Lower</Text>
      </Pressable>
      <Pressable onPress={() => onDelta(0.05)} style={menuStyles.action}>
        <Text style={menuStyles.actionText}>Raise</Text>
      </Pressable>
    </View>
  );
}
