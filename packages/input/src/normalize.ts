import type { InputSnapshot } from '@rakshak/game-protocol';
import { EMPTY_INPUT } from '@rakshak/game-protocol';
import { clamp, normalizeInto } from '@rakshak/shared';

export interface KeyboardState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pause: boolean;
  confirm: boolean;
  cancel: boolean;
}

export interface VirtualStickState {
  dx: number;
  dy: number;
  active: boolean;
}

export interface EdgeButtons {
  pause: boolean;
  confirm: boolean;
  cancel: boolean;
}

const unit = { x: 0, y: 0 };
const idleEdges: EdgeButtons = { pause: false, confirm: false, cancel: false };

function blankInput(): InputSnapshot {
  return { moveX: 0, moveY: 0, pause: false, confirm: false, cancel: false };
}

/** Writes held keys into `out`. `out` is only valid until the next write. */
export function writeNormalizedKeyboard(
  out: InputSnapshot,
  keys: KeyboardState,
  edges: EdgeButtons = idleEdges,
): InputSnapshot {
  let x = 0;
  let y = 0;
  if (keys.left) x -= 1;
  if (keys.right) x += 1;
  if (keys.up) y -= 1;
  if (keys.down) y += 1;
  normalizeInto(x, y, unit);
  out.moveX = unit.x;
  out.moveY = unit.y;
  out.pause = edges.pause || keys.pause;
  out.confirm = edges.confirm || keys.confirm;
  out.cancel = edges.cancel || keys.cancel;
  return out;
}

/** Convert held keys into a unit movement vector + edge actions. */
export function normalizeKeyboard(keys: KeyboardState, edges: EdgeButtons = idleEdges): InputSnapshot {
  return writeNormalizedKeyboard(blankInput(), keys, edges);
}

/** Writes stick deltas into `out`. Deadzone is applied before normalize. */
export function writeNormalizedStick(
  out: InputSnapshot,
  stick: VirtualStickState,
  edges: EdgeButtons = idleEdges,
  deadzone = 0.12,
): InputSnapshot {
  out.pause = edges.pause;
  out.confirm = edges.confirm;
  out.cancel = edges.cancel;
  if (!stick.active) {
    out.moveX = 0;
    out.moveY = 0;
    return out;
  }
  let x = clamp(stick.dx, -1, 1);
  let y = clamp(stick.dy, -1, 1);
  const mag = Math.hypot(x, y);
  if (mag < deadzone) {
    x = 0;
    y = 0;
  } else {
    normalizeInto(x, y, unit);
    const scaled = (mag - deadzone) / (1 - deadzone);
    const limited = clamp(scaled, 0, 1);
    x = unit.x * limited;
    y = unit.y * limited;
  }
  out.moveX = x;
  out.moveY = y;
  return out;
}

/** Stick deltas in [-1,1]; deadzone applied before normalize. */
export function normalizeVirtualStick(
  stick: VirtualStickState,
  edges: EdgeButtons = idleEdges,
  deadzone = 0.12,
): InputSnapshot {
  return writeNormalizedStick(blankInput(), stick, edges, deadzone);
}

/** Writes the merged snapshot into `out`, preferring the stick while it is active. */
export function writeMergedInputs(
  out: InputSnapshot,
  keyboard: InputSnapshot,
  stick: InputSnapshot,
  stickActive: boolean,
): InputSnapshot {
  out.moveX = stickActive ? stick.moveX : keyboard.moveX;
  out.moveY = stickActive ? stick.moveY : keyboard.moveY;
  out.pause = keyboard.pause || stick.pause;
  out.confirm = keyboard.confirm || stick.confirm;
  out.cancel = keyboard.cancel || stick.cancel;
  return out;
}

/** Merge keyboard + stick preferring stick when active. */
export function mergeInputs(keyboard: InputSnapshot, stick: InputSnapshot, stickActive: boolean): InputSnapshot {
  return writeMergedInputs(blankInput(), keyboard, stick, stickActive);
}

export type InputAdapter = {
  sample(): InputSnapshot;
  dispose(): void;
};

/** Level-up cards encode the chosen index on moveX (see game-core offers). */
export function inputForLevelChoice(index: 0 | 1 | 2): InputSnapshot {
  return {
    moveX: index === 0 ? -1 : index === 2 ? 1 : 0,
    moveY: 0,
    pause: false,
    confirm: true,
    cancel: false,
  };
}

export function inputForReroll(): InputSnapshot {
  return { ...EMPTY_INPUT, cancel: true };
}

export function inputForPauseToggle(): InputSnapshot {
  return { ...EMPTY_INPUT, pause: true };
}

export type InterruptionSignal = 'blur' | 'hidden' | 'pagehide' | 'background' | 'inactive' | 'focus' | 'visible' | 'active';

/** Focus loss pauses. Focus return never resumes; that takes an explicit Resume action. */
/** While a dialog is open, only injected UI actions count. Keyboard confirm must not also fire. */
export function dialogScopedActions(
  dialogOpen: boolean,
  keyboard: { confirm: boolean; cancel: boolean; pause: boolean },
  injected: { confirm: boolean; cancel: boolean; pause: boolean },
): { confirm: boolean; cancel: boolean; pause: boolean } {
  if (!dialogOpen) {
    return {
      confirm: keyboard.confirm || injected.confirm,
      cancel: keyboard.cancel || injected.cancel,
      pause: keyboard.pause || injected.pause,
    };
  }
  return {
    confirm: injected.confirm,
    cancel: injected.cancel,
    pause: injected.pause,
  };
}

export function interruptionResponse(signal: InterruptionSignal): 'pause' | 'ignore' {
  if (signal === 'blur' || signal === 'hidden' || signal === 'pagehide' || signal === 'background' || signal === 'inactive') {
    return 'pause';
  }
  return 'ignore';
}
