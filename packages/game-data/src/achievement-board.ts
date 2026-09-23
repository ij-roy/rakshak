import { ACHIEVEMENTS } from './achievements.js';
import { ENEMY_IDS, EVOLUTION_IDS, GUARDIAN_IDS, MAP_IDS, WEAPON_IDS } from './ids.js';
import type { AchievementId, MapId } from './ids.js';

export interface AchievementBoard {
  readonly achievements: Partial<Record<AchievementId, { readonly state: 'locked' | 'complete'; readonly progress: number }>>;
  readonly clears: Partial<Record<MapId, number>>;
  readonly evolutions: readonly string[];
  readonly enemies: readonly string[];
}

export interface AchievementRow {
  readonly id: AchievementId;
  readonly name: string;
  readonly requirement: string;
  readonly current: number;
  readonly target: number;
  readonly progress: string;
  readonly reward: string;
  readonly status: 'In progress' | 'Completed';
}

function bits(mask: number): number {
  let value = mask >>> 0;
  let count = 0;
  while (value > 0) {
    count += value & 1;
    value >>>= 1;
  }
  return count;
}

function capped(done: boolean, value: number, target: number): { current: number; target: number } {
  return { current: done ? target : Math.min(target, Math.max(0, value)), target };
}

export function achievementRows(board: AchievementBoard): readonly AchievementRow[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.predicate.kind !== 'oaths_cleared').map((achievement) => {
    const saved = board.achievements[achievement.id];
    const done = saved?.state === 'complete';
    let measured = capped(done, saved?.progress ?? 0, 1);
    const predicate = achievement.predicate;
    if (predicate.kind === 'survive_seconds') measured = capped(done, saved?.progress ?? 0, predicate.seconds);
    if (predicate.kind === 'clear_map') {
      measured = capped(done, (board.clears[predicate.mapId] ?? 0) > 0 ? 1 : 0, 1);
    }
    if (predicate.kind === 'discover_evolution') {
      measured = capped(done, board.evolutions.includes(predicate.evolutionId) ? 1 : 0, 1);
    }
    if (predicate.kind === 'kills_in_run') measured = capped(done, saved?.progress ?? 0, predicate.count);
    if (predicate.kind === 'level_before_minute') measured = capped(done, saved?.progress ?? 0, predicate.level);
    if (predicate.kind === 'full_slots') measured = capped(done, saved?.progress ?? 0, 12);
    if (predicate.kind === 'discover_all_enemies') measured = capped(done, board.enemies.length, ENEMY_IDS.length);
    if (predicate.kind === 'all_weapons_level8') measured = capped(done, bits(saved?.progress ?? 0), WEAPON_IDS.length);
    if (predicate.kind === 'all_guardians') measured = capped(done, bits(saved?.progress ?? 0), GUARDIAN_IDS.length);
    if (predicate.kind === 'all_maps_and_evolutions') {
      const maps = MAP_IDS.filter((id) => (board.clears[id] ?? 0) > 0).length;
      const evolutions = new Set(board.evolutions).size;
      measured = capped(done, maps + evolutions, MAP_IDS.length + EVOLUTION_IDS.length);
    }
    return {
      id: achievement.id,
      name: achievement.displayName,
      requirement: achievement.description,
      current: measured.current,
      target: measured.target,
      progress: `${measured.current}/${measured.target}`,
      reward: `${achievement.guardianMarks} guardian marks`,
      status: done ? 'Completed' : 'In progress',
    };
  });
}
