import { describe, expect, it } from 'vitest';
import { pictureUnchanged } from './picture-reuse.js';

describe('picture reuse', () => {
  const previous = { id: 'prev' };
  const current = { id: 'current' };

  it('draws the first picture', () => {
    expect(pictureUnchanged(previous, current, 1, null, null, -1)).toBe(false);
  });

  it('keeps a picture when the same snapshots are shown again', () => {
    expect(pictureUnchanged(previous, current, 1, previous, current, 1)).toBe(true);
  });

  it('draws again when the blend changes', () => {
    expect(pictureUnchanged(previous, current, 0.5, previous, current, 1)).toBe(false);
  });

  it('draws again when the snapshot changes', () => {
    expect(pictureUnchanged(previous, { id: 'next' }, 1, previous, current, 1)).toBe(false);
  });
});
