import type { KeyboardState } from './normalize.js';

export type BindingAction = 'up' | 'down' | 'left' | 'right' | 'pause' | 'confirm' | 'cancel';

export type ControlBindings = Record<BindingAction, string>;

export const DEFAULT_BINDINGS: ControlBindings = {
  up: 'KeyW',
  down: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  pause: 'Escape',
  confirm: 'Enter',
  cancel: 'KeyR',
};

const CHOICE_KEYS = new Set(['Digit1', 'Digit2', 'Digit3', 'Numpad1', 'Numpad2', 'Numpad3']);

const ALWAYS: Record<string, keyof KeyboardState> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  Escape: 'pause',
  KeyP: 'pause',
  Enter: 'confirm',
  Space: 'confirm',
  Backspace: 'cancel',
};

export function resolvedBindings(bindings?: Partial<ControlBindings> | null): ControlBindings {
  return { ...DEFAULT_BINDINGS, ...bindings };
}

export function bindingMap(bindings?: Partial<ControlBindings> | null): Record<string, keyof KeyboardState> {
  const map: Record<string, keyof KeyboardState> = { ...ALWAYS };
  const chosen = resolvedBindings(bindings);
  (Object.keys(chosen) as BindingAction[]).forEach((action) => {
    map[chosen[action]] = action;
  });
  return map;
}

export function keyLabel(code: string): string {
  if (code.startsWith('Key') && code.length === 4) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  const names: Record<string, string> = {
    Escape: 'Esc',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    Space: 'Space',
    Enter: 'Enter',
    Backspace: 'Backspace',
  };
  return names[code] ?? code;
}

export function assignBinding(
  current: Partial<ControlBindings> | null | undefined,
  action: BindingAction,
  code: string,
): { ok: true; bindings: ControlBindings } | { ok: false; reason: string } {
  if (CHOICE_KEYS.has(code)) {
    return { ok: false, reason: '1, 2, and 3 stay the upgrade choices.' };
  }
  const next = { ...resolvedBindings(current), [action]: code };
  const codes = Object.values(next);
  if (new Set(codes).size !== codes.length) {
    return { ok: false, reason: 'That key is already used.' };
  }
  return { ok: true, bindings: next };
}

export function controlPrompt(input: { touch: boolean; bindings?: Partial<ControlBindings> | null }): string {
  if (input.touch) return 'Drag the stick to move. The Pause button freezes the night.';
  const bindings = resolvedBindings(input.bindings);
  return `${keyLabel(bindings.up)}${keyLabel(bindings.left)}${keyLabel(bindings.down)}${keyLabel(bindings.right)} or the arrow keys move. ${keyLabel(bindings.pause)} pauses.`;
}

export function controlsReference(bindings?: Partial<ControlBindings> | null): readonly { action: string; path: string }[] {
  const chosen = resolvedBindings(bindings);
  return [
    {
      action: 'Move',
      path: `${keyLabel(chosen.up)} ${keyLabel(chosen.left)} ${keyLabel(chosen.down)} ${keyLabel(chosen.right)}, the arrow keys, or the stick`,
    },
    { action: 'Pause', path: `${keyLabel(chosen.pause)} or the Pause button` },
    { action: 'Choose an upgrade', path: `${keyLabel(chosen.confirm)}, 1, 2, 3, or the card` },
    { action: 'Reroll', path: `${keyLabel(chosen.cancel)} or the Reroll button` },
  ];
}
