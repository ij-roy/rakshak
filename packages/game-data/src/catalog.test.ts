import { describe, expect, it } from 'vitest';
import { assertLaunchContentComplete, CONTENT_COUNTS } from './catalog.js';
import { budgetPerSecond } from './balance.js';
import { WEAPON_IDS } from './ids.js';

describe('launch content', () => {
  it('matches locked roster counts', () => {
    expect(CONTENT_COUNTS).toEqual({
      guardians: 4,
      weapons: 8,
      passives: 8,
      evolutions: 6,
      enemies: 16,
      elites: 4,
      maps: 4,
      bosses: 4,
      achievements: 24,
      metaTracks: 6,
    });
    expect(() => assertLaunchContentComplete()).not.toThrow();
  });

  it('uses production weapon ids', () => {
    expect(WEAPON_IDS).toContain('ember_kund');
    expect(WEAPON_IDS).toContain('monsoon_spark');
    expect(WEAPON_IDS).toContain('spear_burst');
    expect(WEAPON_IDS).not.toContain('agni_kund');
    expect(WEAPON_IDS).not.toContain('vajra_spark');
    expect(WEAPON_IDS).not.toContain('bhuj_spear');
  });

  it('budget curve matches documented formula', () => {
    expect(budgetPerSecond(0)).toBeCloseTo(2.2, 5);
    expect(budgetPerSecond(100)).toBeCloseTo(2.2 + 1.8 + 0.35, 5);
  });
});
