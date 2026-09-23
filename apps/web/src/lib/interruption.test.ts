import { describe, expect, it } from 'vitest';
import { interruptionResponse } from '@rakshak/input';

describe('interruption pause', () => {
  it('pauses when focus is lost and does not resume when focus returns', () => {
    expect(interruptionResponse('blur')).toBe('pause');
    expect(interruptionResponse('hidden')).toBe('pause');
    expect(interruptionResponse('pagehide')).toBe('pause');
    expect(interruptionResponse('background')).toBe('pause');
    expect(interruptionResponse('inactive')).toBe('pause');
    expect(interruptionResponse('focus')).toBe('ignore');
    expect(interruptionResponse('visible')).toBe('ignore');
    expect(interruptionResponse('active')).toBe('ignore');
  });
});
