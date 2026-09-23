import { View } from 'react-native';
import { collectionCount, collectionEntries, type CollectionCategory, type DiscoveryView } from '@rakshak/game-data';
import { copy } from '@rakshak/game-ui';
import { MenuScreen, MobileRecovery, Row } from '../components/MenuScreen';
import { useMobileProfile } from '../components/useMobileProfile';

export default function CollectionScreen() {
  const { load, refresh } = useMobileProfile();
  if (!load) return <MenuScreen title={copy.collection} hint={copy.loadingCore}>{null}</MenuScreen>;
  if (load.status === 'blocked') return <MobileRecovery load={load} onResolved={() => void refresh()} />;
  const discovery: DiscoveryView = {
    weapons: load.save.discovery.weapons,
    passives: load.save.discovery.passives,
    evolutions: load.save.discovery.evolutions,
    enemies: load.save.discovery.enemies,
    clears: Object.fromEntries(Object.entries(load.save.records).map(([id, record]) => [id, record.clears])),
  };
  const categories: readonly CollectionCategory[] = ['weapons', 'passives', 'evolutions', 'foes', 'lore'];

  return (
    <MenuScreen title={copy.collection} hint={copy.collectionHint}>
      {categories.map((category) => {
        const count = collectionCount(category, discovery);
        return (
          <View key={category}>
            <Row title={category} status={`${count.known}/${count.total}`} />
            {collectionEntries(category, discovery).map((entry) => (
              <Row
                key={entry.id}
                title={entry.title}
                status={entry.known ? 'Known' : 'Hidden'}
                detail={[entry.detail, entry.stats, entry.recipe].filter(Boolean).join(' ')}
              />
            ))}
          </View>
        );
      })}
    </MenuScreen>
  );
}
