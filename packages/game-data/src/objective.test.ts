import { describe, expect, it } from 'vitest';
import { isLowHealth, nextWatchObjective } from './balance.js';

describe('watch HUD objective', () => {
  it('names the next lieutenant, the final boss, and a boss already present', () => {
    expect(nextWatchObjective(0, false)).toBe('Lieutenant at 4:00');
    expect(nextWatchObjective(240, false)).toBe('Lieutenant at 8:00');
    expect(nextWatchObjective(480, false)).toBe('Final boss at 12:00');
    expect(nextWatchObjective(720, false)).toBe('Hold the field');
    expect(nextWatchObjective(10, true)).toBe('Boss on the field');
  });

  it('marks the last 30 percent of health as wounded', () => {
    expect(isLowHealth(31, 100)).toBe(false);
    expect(isLowHealth(30, 100)).toBe(true);
  });
});