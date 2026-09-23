const UP_LEFT = 'Up Left';
const UP_RIGHT = 'Up Right';
const DOWN_LEFT = 'Down Left';
const DOWN_RIGHT = 'Down Right';

/** Screen heading for the stick. Each result is a stable string. */
export function stickHeading(dx: number, dy: number, deadzone: number): string {
  const clampedX = Math.max(-1, Math.min(1, dx));
  const clampedY = Math.max(-1, Math.min(1, dy));
  const mag = Math.hypot(clampedX, clampedY);
  if (mag < deadzone) return 'Centered';
  const horizontal = Math.abs(clampedX) >= Math.abs(clampedY) * 0.6 ? (clampedX > 0 ? 'Right' : 'Left') : '';
  const vertical = Math.abs(clampedY) >= Math.abs(clampedX) * 0.6 ? (clampedY > 0 ? 'Down' : 'Up') : '';
  if (vertical === 'Up' && horizontal === 'Left') return UP_LEFT;
  if (vertical === 'Up' && horizontal === 'Right') return UP_RIGHT;
  if (vertical === 'Down' && horizontal === 'Left') return DOWN_LEFT;
  if (vertical === 'Down' && horizontal === 'Right') return DOWN_RIGHT;
  return vertical || horizontal || 'Centered';
}

/** Writes stick deltas from a cached rectangle. `out` stays until the next write. */
export function writeStickVector(
  out: { dx: number; dy: number },
  clientX: number,
  clientY: number,
  left: number,
  top: number,
  width: number,
  height: number,
): void {
  out.dx = (clientX - (left + width / 2)) / (width / 2 || 1);
  out.dy = (clientY - (top + height / 2)) / (height / 2 || 1);
}
