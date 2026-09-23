import { lerp } from '@rakshak/shared';

export interface SpritePose {
  x: number;
  y: number;
  facing: number;
  radius: number;
  alpha: number;
}

/** Writes the interpolated pose into the caller’s record. The record is only valid until the next write. */
export function writeLerpedPose(
  out: SpritePose,
  prevX: number,
  prevY: number,
  prevFacing: number,
  prevRadius: number,
  prevAlpha: number,
  x: number,
  y: number,
  facing: number,
  radius: number,
  alpha: number,
  t: number,
): SpritePose {
  out.x = lerp(prevX, x, t);
  out.y = lerp(prevY, y, t);
  out.facing = lerp(prevFacing, facing, t);
  out.radius = Math.max(2, lerp(prevRadius, radius, t));
  out.alpha = lerp(prevAlpha, alpha, t);
  return out;
}
