import type { InputSnapshot } from '@rakshak/game-protocol';
import type { InputAdapter } from './normalize.js';
import { writeMergedInputs, writeNormalizedStick } from './normalize.js';
import type { ControlBindings } from './bindings.js';
import { createWebKeyboardAdapter } from './web-keyboard.js';

/**
 * Combines keyboard, optional virtual stick, and UI-injected edge actions
 * (level-up cards, pause buttons). Digit keys 1–3 force a choice index via moveX.
 */
export function createWebPlayInputAdapter(
  target: Window = window,
  bindings?: Partial<ControlBindings> | null,
): InputAdapter & {
  setStick(dx: number, dy: number, active: boolean): void;
  setDeadzone(deadzone: number): void;
  setBindings(bindings?: Partial<ControlBindings> | null): void;
  injectConfirm(choiceIndex: 0 | 1 | 2): void;
  injectCancel(): void;
  injectPause(): void;
  releaseHold(): void;
  setDialogOpen(open: boolean): void;
} {
  const keyboard = createWebKeyboardAdapter(target, bindings);
  const stick = { dx: 0, dy: 0, active: false };
  const stickSnap: InputSnapshot = { moveX: 0, moveY: 0, pause: false, confirm: false, cancel: false };
  const sampled: InputSnapshot = { moveX: 0, moveY: 0, pause: false, confirm: false, cancel: false };
  let deadzone = 0.12;
  let pendingConfirm: 0 | 1 | 2 | null = null;
  let pendingCancel = false;
  let pendingPause = false;
  let forcedMoveX = 0;
  let dialogOpen = false;

  const onDigit = (e: KeyboardEvent) => {
    if (e.repeat) return;
    if (e.code === 'Digit1' || e.code === 'Numpad1') {
      pendingConfirm = 0;
      forcedMoveX = -1;
      e.preventDefault();
    } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
      pendingConfirm = 1;
      forcedMoveX = 0;
      e.preventDefault();
    } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
      pendingConfirm = 2;
      forcedMoveX = 1;
      e.preventDefault();
    }
  };
  target.addEventListener('keydown', onDigit);

  return {
    setStick(dx, dy, active) {
      stick.dx = dx;
      stick.dy = dy;
      stick.active = active;
    },
    setDeadzone(next) {
      deadzone = Math.min(0.35, Math.max(0.05, next));
    },
    setBindings(next) {
      keyboard.setBindings(next);
    },
    injectConfirm(choiceIndex) {
      pendingConfirm = choiceIndex;
      forcedMoveX = choiceIndex === 0 ? -1 : choiceIndex === 2 ? 1 : 0;
    },
    injectCancel() {
      pendingCancel = true;
    },
    injectPause() {
      pendingPause = true;
    },
    setDialogOpen(open: boolean) {
      dialogOpen = open;
    },
    releaseHold() {
      stick.dx = 0;
      stick.dy = 0;
      stick.active = false;
      pendingConfirm = null;
      pendingCancel = false;
      pendingPause = false;
      forcedMoveX = 0;
      keyboard.release();
    },
    sample(): InputSnapshot {
      const kb = keyboard.sample();
      writeNormalizedStick(stickSnap, stick, undefined, deadzone);
      writeMergedInputs(sampled, kb, stickSnap, stick.active);
      const injectedConfirm = pendingConfirm !== null;
      const injectedCancel = pendingCancel;
      const injectedPause = pendingPause;
      if (dialogOpen) {
        sampled.confirm = injectedConfirm;
        sampled.cancel = injectedCancel;
        sampled.pause = injectedPause;
      } else {
        sampled.confirm = sampled.confirm || injectedConfirm;
        sampled.cancel = sampled.cancel || injectedCancel;
        sampled.pause = sampled.pause || injectedPause;
      }
      if (pendingConfirm !== null) {
        sampled.moveX = forcedMoveX;
        sampled.moveY = 0;
      }
      pendingConfirm = null;
      pendingCancel = false;
      pendingPause = false;
      forcedMoveX = 0;
      return sampled;
    },
    dispose() {
      target.removeEventListener('keydown', onDigit);
      keyboard.dispose();
    },
  };
}
