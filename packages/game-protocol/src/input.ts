/** Normalized per-tick player intent. Axes are unit-clamped [-1, 1]. */
export interface InputSnapshot {
  moveX: number;
  moveY: number;
  pause: boolean;
  confirm: boolean;
  cancel: boolean;
}

export const EMPTY_INPUT: InputSnapshot = {
  moveX: 0,
  moveY: 0,
  pause: false,
  confirm: false,
  cancel: false,
};
