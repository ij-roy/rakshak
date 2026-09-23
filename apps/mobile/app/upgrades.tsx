import { useEffect, useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { describeMetaOffer, META_TRACKS, metaSpent } from '@rakshak/game-data';
import { copy } from '@rakshak/game-ui';
import {
  commitProfile,
  computeSaveChecksum,
  validateSave,
  withBumpedRevision,
  type SaveFileV1,
} from '@rakshak/storage';
import { MenuScreen, menuStyles, MobileRecovery, Row } from '../components/MenuScreen';
import { useMobileProfile } from '../components/useMobileProfile';
import { createAsyncStorageRepository } from '../lib/asyncStoragePort';

export default function UpgradesScreen() {
  const { load, refresh } = useMobileProfile();
  const [save, setSave] = useState<SaveFileV1 | null>(null);
  const [message, setMessage] = useState('');
  const buyingRef = useRef(false);

  useEffect(() => {
    if (load && load.status !== 'blocked') setSave(load.save);
  }, [load]);

  async function buyRank(trackId: (typeof META_TRACKS)[number]['id']) {
    if (buyingRef.current || !save) return;
    const track = META_TRACKS.find((item) => item.id === trackId);
    if (!track) return;
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
    const bumped = withBumpedRevision({
      ...save,
      updatedAt: new Date().toISOString(),
      meta: {
        ...save.meta,
        currency: save.meta.currency - offer.cost,
        upgrades: { ...save.meta.upgrades, [trackId]: current + 1 },
      },
    });
    const next: SaveFileV1 = { ...bumped, checksum: computeSaveChecksum(bumped) };
    setMessage('Saving this purchase…');
    try {
    const written = await commitProfile(
      createAsyncStorageRepository(),
      (profile) => JSON.stringify(profile),
      (raw) => validateSave(JSON.parse(raw) as unknown),
      next,
    );
    if (!written.ok || !written.save) {
      setMessage('Could not save this purchase. Spend again to retry.');
      return;
    }
    setSave(written.save);
    setMessage(`${track.displayName} rank ${current + 1} taken.`);
    } finally {
      buyingRef.current = false;
    }
  }

  if (!load) return <MenuScreen title={copy.upgrades} hint={copy.loadingCore}>{null}</MenuScreen>;
  if (load.status === 'blocked') return <MobileRecovery load={load} onResolved={() => void refresh()} />;
  const profile = save ?? load.save;

  return (
    <MenuScreen title={copy.upgrades} hint={copy.upgradesEmpty}>
      {load.notice ? <Text style={menuStyles.message}>{load.notice}</Text> : null}
      <Text style={menuStyles.message}>Guardian Marks: {profile.meta.currency}</Text>
      {message ? <Text style={menuStyles.message}>{message}</Text> : null}
      {META_TRACKS.map((track) => {
        const rank = profile.meta.upgrades[track.id] ?? 0;
        const offer = describeMetaOffer(track.id, rank, profile.meta.currency);
        return (
          <Row
            key={track.id}
            title={`${track.displayName} · ${rank}/5`}
            detail={`${offer.currentText} ${offer.nextText}`}
            status={offer.capped ? 'Capped' : offer.affordable ? 'Spend' : 'Short'}
          />
        );
      })}
      {META_TRACKS.map((track) => {
        const rank = profile.meta.upgrades[track.id] ?? 0;
        const offer = describeMetaOffer(track.id, rank, profile.meta.currency);
        if (!offer.affordable) return null;
        return (
          <Pressable key={`buy-${track.id}`} style={menuStyles.action} onPress={() => void buyRank(track.id)}>
            <Text style={menuStyles.actionText}>Spend on {track.displayName}</Text>
          </Pressable>
        );
      })}
      <Pressable
        style={menuStyles.action}
        disabled={Boolean(profile.meta.freeRespecUsed)}
        onPress={() => {
          if (buyingRef.current || profile.meta.freeRespecUsed) return;
          const refund = metaSpent(profile.meta.upgrades);
          if (refund === 0) {
            setMessage('No ranks to refund.');
            return;
          }
          buyingRef.current = true;
          const bumped = withBumpedRevision({
            ...profile,
            updatedAt: new Date().toISOString(),
            meta: {
              ...profile.meta,
              currency: profile.meta.currency + refund,
              upgrades: Object.fromEntries(META_TRACKS.map((track) => [track.id, 0])),
              freeRespecUsed: true,
            },
          });
          const next: SaveFileV1 = { ...bumped, checksum: computeSaveChecksum(bumped) };
          void commitProfile(
            createAsyncStorageRepository(),
            (saved) => JSON.stringify(saved),
            (raw) => validateSave(JSON.parse(raw) as unknown),
            next,
          ).then((written) => {
            buyingRef.current = false;
            if (!written.ok || !written.save) {
              setMessage('Could not save this change. Try again.');
              return;
            }
            setSave(written.save);
            setMessage(`Free respec returned ${refund} Guardian Marks.`);
          });
        }}
      >
        <Text style={menuStyles.actionText}>{profile.meta.freeRespecUsed ? 'Free respec used' : 'Free respec'}</Text>
      </Pressable>
    </MenuScreen>
  );
}
