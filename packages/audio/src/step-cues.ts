export interface CombatCueFold {
  hitEnemy: boolean;
  hitPlayer: boolean;
  pickup: boolean;
  levelUp: boolean;
  boss: boolean;
  ending: '' | 'victory' | 'defeat';
}

export function clearCombatCueFold(out: CombatCueFold): void {
  out.hitEnemy = false;
  out.hitPlayer = false;
  out.pickup = false;
  out.levelUp = false;
  out.boss = false;
  out.ending = '';
}

/** Many strikes in one tick become one cue. Gameplay damage is already applied. */
export function noteCombatCue(out: CombatCueFold, kind: string, outcome?: string): void {
  if (kind === 'enemy_damaged' || kind === 'enemy_killed') out.hitEnemy = true;
  else if (kind === 'player_damaged') out.hitPlayer = true;
  else if (kind === 'pickup_collected') out.pickup = true;
  else if (kind === 'level_up') out.levelUp = true;
  else if (kind === 'boss_spawned') out.boss = true;
  else if (kind === 'run_ended') out.ending = outcome === 'victory' ? 'victory' : 'defeat';
}
