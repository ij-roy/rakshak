let filledWorld: object | null = null;
let filledTick = -1;
let skipRebuild = false;

/** Enemies were just written into the hit grid for this tick. The next rebuild can be skipped once. */
export function markSpatialFilled(world: object, tick: number): void {
  filledWorld = world;
  filledTick = tick;
  skipRebuild = true;
}

export function takeSpatialSkip(world: object, tick: number): boolean {
  if (!skipRebuild || filledWorld !== world || filledTick !== tick) return false;
  skipRebuild = false;
  return true;
}

/** The hit grid matches this tick, whether or not the later rebuild was already skipped. */
export function spatialCurrent(world: object, tick: number): boolean {
  return filledWorld === world && filledTick === tick;
}
