import { describe, expect, it } from 'vitest';
import { clearCombatCueFold, noteCombatCue, type CombatCueFold } from './step-cues';

describe('combat cue fold', () => {
  it('turns a crowd of hits into one enemy cue and keeps the record', () => {
    const fold: CombatCueFold = {
      hitEnemy: false,
      hitPlayer: false,
      pickup: false,
      levelUp: false,
      boss: false,
      ending: '',
    };
    for (let i = 0; i < 300; i++) noteCombatCue(fold, 'enemy_damaged');
    noteCombatCue(fold, 'enemy_killed');
    noteCombatCue(fold, 'pickup_collected');
    noteCombatCue(fold, 'player_damaged');
    expect(fold.hitEnemy).toBe(true);
    expect(fold.hitPlayer).toBe(true);
    expect(fold.pickup).toBe(true);
    clearCombatCueFold(fold);
    noteCombatCue(fold, 'run_ended', 'victory');
    expect(fold.hitEnemy).toBe(false);
    expect(fold.ending).toBe('victory');
    noteCombatCue(fold, 'boss_spawned');
    noteCombatCue(fold, 'level_up');
    expect(fold.boss).toBe(true);
    expect(fold.levelUp).toBe(true);
    expect(fold.ending).toBe('victory');
  });
});
