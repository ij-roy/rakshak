import { describe, expect, it } from 'vitest';
import { createDefaultSave } from './default-save.js';
import { describeRunOutcome } from './run-outcome.js';
import { settleRun } from './settle-run.js';
import type { RunReport } from '@rakshak/game-data';

const victory: RunReport = {
  mapId: 'gaon',
  guardianId: 'asha',
  survivalSeconds: 200,
  level: 4,
  kills: 40,
  won: true,
  revivesUsed: 0,
  oathsActive: 0,
  evolutions: [],
  weapons: [{ id: 'talwar_arc', level: 2 }],
  passives: [{ id: 'hunters_cord', level: 1 }],
  enemiesSeen: ['chhaya_drifter'],
  bossesSeen: ['bell_warden'],
  bossClearedLowHp: false,
  bellDefeatedClean: false,
  levelBeforeMinute6: 4,
  weaponCountAtMinute8: -1,
  damageTaken: 36,
};

describe('run outcome summary', () => {
  it('matches the marks settleRun adds and names the next map', () => {
    const before = createDefaultSave();
    const summary = describeRunOutcome(before, victory);
    const after = settleRun(before, victory);
    expect(summary.totalMarks).toBe(after.meta.currency - before.meta.currency);
    expect(summary.totalMarks).toBe(
      summary.timeMarks + summary.killMarks + summary.victoryMarks + summary.achievementMarks,
    );
    const again = settleRun(after, victory);
    expect(again.meta.currency - after.meta.currency).toBe(
      summary.timeMarks + summary.killMarks + summary.victoryMarks,
    );
    expect(summary.timeMarks).toBe(6);
    expect(summary.killMarks).toBe(2);
    expect(summary.victoryMarks).toBe(40);
    expect(summary.markLines.join(' ')).toContain('First Watch');
    expect(summary.unlocks).toContain('Van');
    expect(summary.build).toContain('Talwar Arc 2');
    expect(summary.build).toContain("Hunter's Cord 1");
    expect(summary.recordLine).toContain('New best clear');
    expect(summary.damageLine).toBe('Damage taken 36.');
    expect(summary.nextStep).toBe('next-map');
    expect(summary.nextMapId).toBe('van');
    expect(summary.flavor).toContain('Gaon is clear');
  });

  it('asks a defeat to try again', () => {
    const summary = describeRunOutcome(createDefaultSave(), { ...victory, won: false, survivalSeconds: 40, kills: 3 });
    expect(summary.title).toBe('The night held.');
    expect(summary.nextStep).toBe('retry');
    expect(summary.victoryMarks).toBe(0);
    expect(summary.flavor).toContain('still count');
  });
});
