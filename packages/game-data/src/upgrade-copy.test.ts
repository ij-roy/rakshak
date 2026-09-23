import { describe, expect, it } from 'vitest';
import { describeLevelChoice } from './upgrade-copy.js';

const base = {
  weaponCount: 1,
  passiveCount: 0,
  discoveredEvolutions: [] as string[],
};

describe('upgrade explanations', () => {
  it('lets a player compare a new passive, a weapon upgrade, and a hidden evolution', () => {
    const cord = describeLevelChoice({
      ...base,
      kind: 'passive',
      contentId: 'hunters_cord',
      currentLevel: 0,
      nextLevel: 1,
    });
    expect(cord.badge).toBe('New');
    expect(cord.behavior.toLowerCase()).toContain('projectile');
    expect(cord.stats.join(' ')).toContain('10%');
    expect(cord.slot).toContain('1/6');
    expect(cord.evolution.toLowerCase()).not.toContain('monsoon');

    const bow = describeLevelChoice({
      ...base,
      kind: 'weapon',
      contentId: 'dhanush_volley',
      currentLevel: 1,
      nextLevel: 2,
    });
    expect(bow.badge).toBe('Upgrade');
    expect(bow.stats.some((line) => line.includes('→'))).toBe(true);
    expect(bow.slot).toContain('Stays in its weapon slot');
    expect(bow.evolution.toLowerCase()).toContain('not discovered');
    expect(bow.evolution).not.toContain('Monsoon Volley');

    const known = describeLevelChoice({
      ...base,
      kind: 'weapon',
      contentId: 'dhanush_volley',
      currentLevel: 1,
      nextLevel: 2,
      discoveredEvolutions: ['monsoon_volley'],
    });
    expect(known.evolution).toContain("Hunter's Cord");
    expect(known.evolution).toContain('Monsoon Volley');

    const evolved = describeLevelChoice({
      ...base,
      kind: 'evolution',
      contentId: 'monsoon_volley',
      currentLevel: 0,
      nextLevel: 1,
    });
    expect(evolved.badge).toBe('Evolution');
    expect(evolved.behavior.toLowerCase()).toContain('piercing');
    expect(evolved.stats.join(' ')).toContain('×1.2');
    expect(evolved.slot.toLowerCase()).toContain('replaces');
    expect(evolved.evolution).toContain("Hunter's Cord");
  });
});
