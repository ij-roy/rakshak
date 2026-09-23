import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { achievementRows, type AchievementBoard } from '@rakshak/game-data';
import { copy } from '@rakshak/game-ui';
import { MenuScreen, menuStyles, MobileRecovery, Row } from '../components/MenuScreen';
import { useMobileProfile } from '../components/useMobileProfile';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'progress', label: 'In progress' },
  { id: 'done', label: 'Completed' },
] as const;

export default function AchievementsScreen() {
  const { load, refresh } = useMobileProfile();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  if (!load) return <MenuScreen title={copy.achievements} hint={copy.loadingCore}>{null}</MenuScreen>;
  if (load.status === 'blocked') return <MobileRecovery load={load} onResolved={() => void refresh()} />;

  const board: AchievementBoard = {
    achievements: load.save.achievements,
    clears: Object.fromEntries(Object.entries(load.save.records).map(([id, record]) => [id, record.clears])),
    evolutions: load.save.discovery.evolutions,
    enemies: load.save.discovery.enemies,
  };
  const rows = achievementRows(board).filter((row) => {
    if (filter === 'progress') return row.status === 'In progress';
    if (filter === 'done') return row.status === 'Completed';
    return true;
  });

  return (
    <MenuScreen title={copy.achievements} hint={copy.achievementsHint}>
      {FILTERS.map((item) => (
        <Pressable key={item.id} style={menuStyles.action} onPress={() => setFilter(item.id)}>
          <Text style={menuStyles.actionText}>{filter === item.id ? `${item.label} · showing` : item.label}</Text>
        </Pressable>
      ))}
      {rows.length === 0 ? <Text style={menuStyles.message}>No goals completed yet.</Text> : null}
      {rows.map((row) => (
        <Row
          key={row.id}
          title={row.name}
          detail={`${row.requirement} ${row.progress}. Reward ${row.reward}.`}
          status={row.status}
        />
      ))}
    </MenuScreen>
  );
}
