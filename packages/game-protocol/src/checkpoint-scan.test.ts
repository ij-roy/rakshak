import { describe, expect, it } from 'vitest';
import { firstCheckpoint } from './checkpoint-scan';

describe('checkpoint scan', () => {
  it('keeps the first pause or boss defeat and ignores the rest of the step', () => {
    expect(firstCheckpoint([{ kind: 'enemy_damaged' }, { kind: 'paused' }, { kind: 'boss_defeated' }])).toBe('pause');
    expect(firstCheckpoint([{ kind: 'weapon_fired' }, { kind: 'boss_defeated' }])).toBe('boss');
    expect(firstCheckpoint([{ kind: 'enemy_killed' }])).toBeNull();
  });
});
