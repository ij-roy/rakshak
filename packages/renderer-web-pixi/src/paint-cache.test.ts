import { describe, expect, it } from 'vitest';
import { cachedPaint, type PaintCache, type PaintResult } from './paint-cache.js';

describe('paint cache', () => {
  const out: PaintResult = { shape: 'mote', tint: 0 };

  it('keeps a stored silhouette when the sprite has not changed', () => {
    const node: PaintCache = {
      paintKind: 'enemy',
      paintContent: 'chhaya_drifter',
      paintShape: 'shield',
      paintTint: 1,
      sourceTint: 5,
    };
    const first = cachedPaint(node, 'enemy', 'chhaya_drifter', 5, out);
    const second = cachedPaint(node, 'enemy', 'chhaya_drifter', 5, out);
    expect(first).toBe(out);
    expect(second).toBe(out);
    expect(second.shape).toBe('shield');
    expect(second.tint).toBe(1);
  });

  it('looks up a new silhouette when the content changes', () => {
    const node: PaintCache = {
      paintKind: 'enemy',
      paintContent: 'chhaya_drifter',
      paintShape: 'shield',
      paintTint: 1,
      sourceTint: 5,
    };
    const paint = cachedPaint(node, 'enemy', 'husk_guard', 5, out);
    expect(paint).toBe(out);
    expect(paint.shape).toBe('block');
    expect(paint.tint).not.toBe(1);
  });
});
