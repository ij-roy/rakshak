import { describe, expect, it } from 'vitest';
import { admitSprite, needsEdgePass, noteEdgeSprite, offscreenPicture, recallSlot, wantsEdgeMarker } from './sprite-admit.js';

describe('sprite admission', () => {
  it('reuses a mark that is already on screen', () => {
    expect(admitSprite(false, true, 40, 16)).toBe('reuse');
  });

  it('holds an ordinary new mark when the frame is full', () => {
    expect(admitSprite(false, false, 16, 16)).toBe('skip');
  });

  it('still adds the guardian, a boss, or an elite when the frame is full', () => {
    expect(admitSprite(true, false, 16, 16)).toBe('create');
  });

  it('adds an ordinary mark while the frame has room', () => {
    expect(admitSprite(false, false, 15, 16)).toBe('create');
  });

  it('marks only bosses and elites at the edge of the view', () => {
    expect(wantsEdgeMarker('boss')).toBe(true);
    expect(wantsEdgeMarker('elite')).toBe(true);
    expect(wantsEdgeMarker('enemy')).toBe(false);
    expect(wantsEdgeMarker('pickup')).toBe(false);
    expect(wantsEdgeMarker('player')).toBe(false);
  });

  it('records only the boss and elite indexes, then drops them on the next frame', () => {
    const noted: number[] = [];
    noteEdgeSprite('enemy', 0, noted);
    noteEdgeSprite('boss', 2, noted);
    noteEdgeSprite('pickup', 3, noted);
    noteEdgeSprite('elite', 4, noted);
    expect(noted).toEqual([2, 4]);
    noted.length = 0;
    noteEdgeSprite('player', 1, noted);
    expect(noted).toEqual([]);
  });

  it('detaches a hidden mark until the frame has already removed its share', () => {
    expect(offscreenPicture(true, 0)).toBe('detach');
    expect(offscreenPicture(true, 23)).toBe('detach');
    expect(offscreenPicture(true, 24)).toBe('hide');
    expect(offscreenPicture(false, 0)).toBe('hide');
  });

  it('skips edge arrows when nothing hostile is outside the view', () => {
    expect(needsEdgePass(0, 0)).toBe(false);
    expect(needsEdgePass(1, 0)).toBe(true);
    expect(needsEdgePass(0, 1)).toBe(true);
  });

  it('keeps a mark that stayed in its slot and looks up only a new one', () => {
    const kept = { key: 4 };
    const fresh = { key: 9 };
    const slots: Array<{ key: number } | undefined> = [kept];
    let lookups = 0;
    const found = recallSlot(slots, 0, 4, () => {
      lookups += 1;
      return fresh;
    });
    expect(found).toBe(kept);
    expect(lookups).toBe(0);
    kept.key = 0;
    const next = recallSlot(slots, 0, 9, (key) => {
      lookups += 1;
      return key === 9 ? fresh : undefined;
    });
    expect(next).toBe(fresh);
    expect(lookups).toBe(1);
    expect(slots[0]).toBe(fresh);
  });
});
