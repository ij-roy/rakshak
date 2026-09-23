import { describe, expect, it } from 'vitest';
import { collectionCount, collectionEntry, type DiscoveryView } from './collection.js';

const empty: DiscoveryView = { weapons: [], passives: [], evolutions: [], enemies: [], clears: {} };

describe('collection entries', () => {
  it('hides an unknown weapon and explains a known one, including a discovered recipe', () => {
    const hidden = collectionEntry('weapons', 'talwar_arc', empty);
    expect(hidden?.title).toBe('Unknown weapon');
    expect(hidden?.detail).not.toContain('arc');
    expect(hidden?.recipe).toBeNull();

    const known = collectionEntry('weapons', 'talwar_arc', { ...empty, weapons: ['talwar_arc'] });
    expect(known?.title).toBe('Talwar Arc');
    expect(known?.detail).toContain('close arc');
    expect(known?.stats).toContain('damage 18');
    expect(known?.recipe).toContain('have not discovered the pairing');

    const evolved = collectionEntry('weapons', 'talwar_arc', {
      ...empty,
      weapons: ['talwar_arc'],
      evolutions: ['crescent_guard'],
    });
    expect(evolved?.recipe).toContain('Whetstone');
    expect(evolved?.recipe).toContain('Crescent Guard');
  });

  it('explains a discovered combination and keeps an undiscovered one unnamed', () => {
    const hidden = collectionEntry('evolutions', 'crescent_guard', empty);
    expect(hidden?.title).toBe('Hidden pairing');
    expect(hidden?.recipe).toBeNull();
    expect(hidden?.detail).not.toContain('Whetstone');

    const found = collectionEntry('evolutions', 'crescent_guard', { ...empty, evolutions: ['crescent_guard'] });
    expect(found?.recipe).toBe('Talwar Arc with Whetstone becomes Crescent Guard.');
    expect(found?.detail).toContain('full guarding circle');
  });

  it('records a map note only after that map is cleared', () => {
    expect(collectionCount('lore', empty)).toEqual({ known: 0, total: 4 });
    const hidden = collectionEntry('lore', 'gaon', empty);
    expect(hidden?.title).toBe('Gaon');
    expect(hidden?.detail).toBe('Clear Gaon to record this note.');
    const known = collectionEntry('lore', 'gaon', { ...empty, clears: { gaon: 1 } });
    expect(known?.detail).toContain('Low walls');
    expect(known?.detail).toContain('The Bell-Warden');
  });
});
