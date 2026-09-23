import { describeLevelChoice } from '@rakshak/game-data';
import { describe, expect, it } from 'vitest';
import { GameRuntime } from './runtime.js';

describe('live upgrade offers', () => {
  it('explains all three choices on the first level-up', () => {
    const runtime = new GameRuntime({ seed: 7, guardianId: 'asha', mapId: 'gaon' });
    for (let i = 0; i < 30 * 180; i++) {
      runtime.step({
        moveX: 0.4,
        moveY: 0.2,
        pause: false,
        confirm: false,
        cancel: false,
      });
      const hud = runtime.snapshot().hud;
      if (!hud.awaitingLevelChoice || hud.levelChoices.length < 3) continue;
      const explained = hud.levelChoices.map((choice) =>
        describeLevelChoice({
          kind: choice.kind,
          contentId: choice.contentId,
          currentLevel: choice.currentLevel,
          nextLevel: choice.nextLevel,
          weaponCount: hud.weaponSlots.length,
          passiveCount: hud.passiveSlots.length,
          discoveredEvolutions: [],
        }),
      );
      expect(explained).toHaveLength(3);
      for (const card of explained) {
        expect(card.behavior.length).toBeGreaterThan(8);
        expect(card.stats.length).toBeGreaterThan(0);
        expect(card.slot.length).toBeGreaterThan(0);
        expect(card.mark.length).toBeGreaterThan(0);
        expect(['New', 'Upgrade', 'Evolution']).toContain(card.badge);
      }
      const fingerprints = explained.map((card) => `${card.title}|${card.behavior}|${card.stats.join(';')}`);
      expect(new Set(fingerprints).size).toBe(3);
      return;
    }
    throw new Error('the first level-up never offered three choices');
  });
});
