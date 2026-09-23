import { describe, expect, it } from 'vitest';
import { createMountEpoch, ensureResizeCancel } from './mount-epoch';

describe('renderer mount lifetime', () => {
  it('drops an in-flight mount when cleanup runs before init finishes', () => {
    const epoch = createMountEpoch();
    const first = epoch.begin();
    epoch.cancel();
    expect(epoch.isCurrent(first)).toBe(false);
    const second = epoch.begin();
    expect(epoch.isCurrent(second)).toBe(true);
    expect(epoch.isCurrent(first)).toBe(false);
  });

  it('lets ResizePlugin.destroy run twice without calling a missing cancel', () => {
    const app: { _cancelResize?: (() => void) | null } = {};
    const destroy = () => {
      ensureResizeCancel(app);
      app._cancelResize?.();
      app._cancelResize = null;
    };
    expect(() => {
      destroy();
      destroy();
    }).not.toThrow();
  });
});
