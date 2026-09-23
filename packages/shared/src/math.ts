export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function length(x: number, y: number): number {
  return Math.hypot(x, y);
}

export function normalize(x: number, y: number): { x: number; y: number } {
  const len = Math.hypot(x, y);
  if (len <= 1e-8) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

/** Writes a unit vector into `out` so a crowd chase does not allocate one object per enemy. */
export function normalizeInto(x: number, y: number, out: { x: number; y: number }): { x: number; y: number } {
  const len = Math.hypot(x, y);
  if (len <= 1e-8) {
    out.x = 0;
    out.y = 0;
    return out;
  }
  out.x = x / len;
  out.y = y / len;
  return out;
}

export function distSq(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
