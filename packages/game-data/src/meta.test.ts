import { describe, expect, it } from 'vitest';
import { describeMetaOffer, metaSpent } from './meta.js';

describe('meta offer copy', () => {
  it('states the next health bonus, the cost, and why it cannot be bought', () => {
    const offer = describeMetaOffer('vitality', 0, 0);
    expect(offer.currentText).toBe('No bonus yet.');
    expect(offer.nextText).toBe('Next rank +3% maximum health costs 20 marks. You have 0.');
    expect(offer.affordable).toBe(false);
  });

  it('states the balance after an affordable rank', () => {
    const offer = describeMetaOffer('vitality', 1, 40);
    expect(offer.currentText).toBe('Current bonus 3% maximum health.');
    expect(offer.nextText).toContain('Balance afterward: 5.');
    expect(offer.affordable).toBe(true);
    expect(offer.cost).toBe(35);
  });

  it('refunds every purchased rank once', () => {
    expect(metaSpent({ vitality: 2, guard: 1 })).toBe(20 + 35 + 20);
  });
});