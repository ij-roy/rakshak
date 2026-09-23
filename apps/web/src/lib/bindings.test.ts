import { describe, expect, it } from 'vitest';
import { assignBinding, bindingMap, controlPrompt, controlsReference } from '@rakshak/input';

describe('control bindings', () => {
  it('keeps arrow, pause, choice, and reroll paths while a remap replaces the letter', () => {
    const changed = assignBinding(undefined, 'up', 'KeyI');
    expect(changed.ok).toBe(true);
    if (!changed.ok) return;
    const map = bindingMap(changed.bindings);
    expect(map.KeyI).toBe('up');
    expect(map.KeyW).toBeUndefined();
    expect(map.ArrowUp).toBe('up');
    expect(map.Escape).toBe('pause');
    expect(map.KeyR).toBe('cancel');
    expect(controlPrompt({ touch: false, bindings: changed.bindings })).toContain('IASD');
    expect(controlPrompt({ touch: true })).toBe('Drag the stick to move. The Pause button freezes the night.');
    expect(controlPrompt({ touch: true })).not.toContain('WASD');
  });

  it('refuses choice keys and duplicates', () => {
    expect(assignBinding(undefined, 'up', 'Digit1')).toMatchObject({
      ok: false,
      reason: '1, 2, and 3 stay the upgrade choices.',
    });
    expect(assignBinding(undefined, 'up', 'KeyS')).toMatchObject({ ok: false });
    const rows = controlsReference();
    expect(rows.map((row) => row.action)).toEqual(['Move', 'Pause', 'Choose an upgrade', 'Reroll']);
    expect(rows.every((row) => row.path.length > 0)).toBe(true);
  });
});