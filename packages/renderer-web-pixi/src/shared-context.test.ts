import { describe, expect, it } from 'vitest';
import { releaseSharedContexts, takeSharedContext } from './shared-context';

describe('shared mark geometry', () => {
  it('builds a repeated shape once and keeps a different shape separate', () => {
    let draws = 0;
    const first = takeSharedContext('spark:test-a', (context) => {
      draws += 1;
      context.circle(0, 0, 3);
    });
    const again = takeSharedContext('spark:test-a', () => {
      draws += 1;
    });
    const other = takeSharedContext('spark:test-b', (context) => {
      draws += 1;
      context.circle(0, 0, 5);
    });
    expect(again).toBe(first);
    expect(other).not.toBe(first);
    expect(draws).toBe(2);
  });

  it('builds the shape again after the picture is released', () => {
    let draws = 0;
    takeSharedContext('spark:release', () => {
      draws += 1;
    });
    releaseSharedContexts();
    takeSharedContext('spark:release', () => {
      draws += 1;
    });
    expect(draws).toBe(2);
  });
});
