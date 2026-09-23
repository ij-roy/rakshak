import { describe, expect, it } from 'vitest';
import { achievementRows, type AchievementBoard } from './achievement-board.js';

const empty: AchievementBoard = { achievements: {}, clears: {}, evolutions: [], enemies: [] };

describe('achievement board', () => {
  it('shows requirement, progress, and reward, and omits oaths', () => {
    const rows = achievementRows(empty);
    expect(rows.map((row) => row.id)).not.toContain('oathbound_i');
    expect(rows.map((row) => row.id)).not.toContain('oathbound_iii');
    const watch = rows.find((row) => row.id === 'first_watch');
    expect(watch).toMatchObject({
      requirement: 'Survive 3 minutes.',
      progress: '0/180',
      reward: '15 guardian marks',
      status: 'In progress',
    });
    const dawn = rows.find((row) => row.id === 'dawn_held');
    expect(dawn?.reward).toBe('40 guardian marks');
    expect(dawn?.progress).toBe('0/1');
  });

  it('counts stored progress, discoveries, clears, and bitmasks', () => {
    const rows = achievementRows({
      achievements: {
        first_watch: { state: 'locked', progress: 90 },
        crowdkeeper: { state: 'locked', progress: 40 },
        swift_watch: { state: 'locked', progress: 12 },
        full_satchel: { state: 'locked', progress: 7 },
        master_of_arms: { state: 'locked', progress: 0b101 },
        every_path: { state: 'locked', progress: 0b1 },
        dawn_held: { state: 'complete', progress: 1 },
      },
      clears: { gaon: 1 },
      evolutions: ['crescent_guard'],
      enemies: ['chhaya_drifter', 'chhaya_runner', 'husk_guard'],
    });
    const byId = Object.fromEntries(rows.map((row) => [row.id, row]));
    expect(byId.first_watch?.progress).toBe('90/180');
    expect(byId.crowdkeeper?.progress).toBe('40/1000');
    expect(byId.swift_watch?.progress).toBe('12/20');
    expect(byId.full_satchel?.progress).toBe('7/12');
    expect(byId.master_of_arms?.progress).toBe('2/8');
    expect(byId.every_path?.progress).toBe('1/4');
    expect(byId.dawn_held).toMatchObject({ progress: '1/1', status: 'Completed' });
    expect(byId.crescent_found?.progress).toBe('1/1');
    expect(byId.field_notes?.progress).toBe('3/16');
    expect(byId.rakshak?.progress).toBe('2/10');
  });
});
