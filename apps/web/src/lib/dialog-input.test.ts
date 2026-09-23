import { dialogScopedActions } from '@rakshak/input';
import { describe, expect, it } from 'vitest';
import { nextTabIndex } from './modalFocus';

describe('dialog action priority', () => {
  it('drops keyboard confirm while a dialog is open so Enter cannot also pick a card', () => {
    const keyboard = { confirm: true, cancel: false, pause: false };
    const injected = { confirm: false, cancel: true, pause: false };
    expect(dialogScopedActions(true, keyboard, injected)).toEqual({
      confirm: false,
      cancel: true,
      pause: false,
    });
    expect(dialogScopedActions(false, keyboard, injected)).toEqual({
      confirm: true,
      cancel: true,
      pause: false,
    });
  });

  it('wraps tab through the visible choices', () => {
    expect(nextTabIndex(4, 0, false)).toBe(1);
    expect(nextTabIndex(4, 3, false)).toBe(0);
    expect(nextTabIndex(4, 0, true)).toBe(3);
    expect(nextTabIndex(4, -1, false)).toBe(0);
  });
});
