import { describeGuardianLock, GUARDIANS, unlockSnapshot } from '@rakshak/game-data';
import { copy } from '@rakshak/game-ui';
import { MenuScreen, MobileRecovery, Row } from '../components/MenuScreen';
import { useMobileProfile } from '../components/useMobileProfile';

export default function CharactersScreen() {
  const { load, refresh } = useMobileProfile();
  if (!load) return <MenuScreen title={copy.characters} hint={copy.loadingCore}>{null}</MenuScreen>;
  if (load.status === 'blocked') return <MobileRecovery load={load} onResolved={() => void refresh()} />;
  const locks = unlockSnapshot({
    characters: load.save.unlocks.characters,
    maps: load.save.unlocks.maps,
    evolutions: load.save.discovery.evolutions,
    records: load.save.records,
  });

  return (
    <MenuScreen title={copy.characters} hint={copy.charactersHint}>
      {load.notice ? <Row title={load.notice} status="" /> : null}
      {GUARDIANS.map((guardian) => {
        const lock = describeGuardianLock(guardian.id, locks);
        return (
          <Row
            key={guardian.id}
            title={`${guardian.displayName} — ${guardian.epithet}`}
            detail={`HP ${guardian.maxHp} · Speed ${guardian.moveSpeed}. ${lock.step}`}
            status={lock.status}
          />
        );
      })}
    </MenuScreen>
  );
}
