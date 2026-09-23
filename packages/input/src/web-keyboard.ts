import type { InputSnapshot } from '@rakshak/game-protocol';
import { bindingMap, type ControlBindings } from './bindings.js';
import type { InputAdapter, KeyboardState } from './normalize.js';
import { writeNormalizedKeyboard } from './normalize.js';

export function createWebKeyboardAdapter(
  target: Window = window,
  initial?: Partial<ControlBindings> | null,
): InputAdapter & { release(): void; setBindings(bindings?: Partial<ControlBindings> | null): void } {
  let keyMap = bindingMap(initial);
  const held: KeyboardState = {
    up: false,
    down: false,
    left: false,
    right: false,
    pause: false,
    confirm: false,
    cancel: false,
  };
  const edges = { pause: false, confirm: false, cancel: false };
  const snap: InputSnapshot = { moveX: 0, moveY: 0, pause: false, confirm: false, cancel: false };

  const onKeyDown = (e: KeyboardEvent) => {
    const action = keyMap[e.code];
    if (!action) return;
    if (e.repeat && (action === 'pause' || action === 'confirm' || action === 'cancel')) return;
    if (action === 'pause' || action === 'confirm' || action === 'cancel') {
      if (!held[action]) edges[action] = true;
    }
    held[action] = true;
    if (action === 'up' || action === 'down' || action === 'left' || action === 'right') {
      e.preventDefault();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const action = keyMap[e.code];
    if (!action) return;
    held[action] = false;
  };

  const clear = () => {
    held.up = held.down = held.left = held.right = false;
    held.pause = held.confirm = held.cancel = false;
  };

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);
  target.addEventListener('blur', clear);
  target.document.addEventListener('visibilitychange', () => {
    if (target.document.hidden) clear();
  });

  return {
    sample(): InputSnapshot {
      writeNormalizedKeyboard(snap, held, edges);
      edges.pause = edges.confirm = edges.cancel = false;
      held.pause = held.confirm = held.cancel = false;
      return snap;
    },
    setBindings(bindings) {
      keyMap = bindingMap(bindings);
      clear();
    },
    release() {
      clear();
    },
    dispose() {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      target.removeEventListener('blur', clear);
    },
  };
}
