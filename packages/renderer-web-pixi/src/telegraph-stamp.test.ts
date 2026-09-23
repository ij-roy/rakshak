import { describe, expect, it } from 'vitest';
import type { TelegraphInstance } from '@rakshak/game-protocol';
import { blankTelegraphStamp, rememberTelegraph, sameTelegraph } from './telegraph-stamp.js';

const warning: TelegraphInstance = {
  id: 4,
  kind: 'line',
  x: 80,
  y: 12,
  radius: 120,
  angle: 0.4,
  sweep: 18,
  progress: 0.25,
  hostile: true,
};

describe('telegraph stamp', () => {
  it('keeps a repeated warning and notices when it moves', () => {
    const stamp = blankTelegraphStamp();
    expect(sameTelegraph(stamp, warning)).toBe(false);
    rememberTelegraph(stamp, warning);
    expect(sameTelegraph(stamp, warning)).toBe(true);
    expect(sameTelegraph(stamp, { ...warning, progress: 0.5 })).toBe(false);
    expect(sameTelegraph(stamp, { ...warning, x: 90 })).toBe(false);
  });
});
