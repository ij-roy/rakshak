import { describe, expect, it } from 'vitest';
import { describeGuardianLock, describeMapLock, type UnlockSnapshot } from './unlocks.js';

const fresh: UnlockSnapshot = {
  characters: ['asha'],
  maps: ['gaon'],
  evolutionsDiscovered: 0,
  clears: {},
};

describe('lock explanations', () => {
  it('shows the same ready state for a starting guardian and the next step for the rest', () => {
    expect(describeGuardianLock('asha', fresh)).toMatchObject({ unlocked: true, status: 'Ready' });
    expect(describeGuardianLock('veer', fresh).step).toBe('Survive 8:00 on Gaon.');
    expect(describeGuardianLock('tara', { ...fresh, evolutionsDiscovered: 2 }).step).toBe(
      'Discover 3 evolutions. 2 of 3 found.',
    );
    expect(describeGuardianLock('nila', fresh).step).toBe('Clear Gaon.');
    expect(describeMapLock('gaon', fresh)).toMatchObject({ unlocked: true, status: 'Ready' });
    expect(describeMapLock('van', fresh).step).toBe('Clear Gaon.');
    expect(describeMapLock('marusthal', fresh).step).toBe('Clear Gaon.');
    expect(describeMapLock('durg', fresh).step).toBe('Clear Gaon.');
  });

  it('names Van once Gaon is clear, and a revive-free clear once Van is open', () => {
    const afterGaon: UnlockSnapshot = {
      ...fresh,
      maps: ['gaon', 'van'],
      clears: { gaon: 1 },
      characters: ['asha', 'veer'],
    };
    expect(describeGuardianLock('veer', afterGaon).status).toBe('Ready');
    expect(describeMapLock('van', afterGaon).status).toBe('Ready');
    expect(describeMapLock('marusthal', afterGaon).step).toBe('Clear Van.');
    expect(describeGuardianLock('nila', afterGaon).step).toBe('Clear Van without a revive.');
  });

  it('asks for another clean Van clear when Van was cleared with a revive', () => {
    const revived: UnlockSnapshot = {
      ...fresh,
      maps: ['gaon', 'van', 'marusthal'],
      clears: { gaon: 1, van: 1 },
    };
    expect(describeGuardianLock('nila', revived).step).toBe('Clear Van again without a revive.');
    expect(describeMapLock('durg', revived).step).toBe('Clear Marusthal.');
  });
});
