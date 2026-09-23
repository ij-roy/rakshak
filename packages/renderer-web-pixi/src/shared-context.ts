import { GraphicsContext } from 'pixi.js';

const shared = new Map<string, GraphicsContext>();

/** Builds the geometry for a repeated mark once. Later marks with the same key share it. */
export function takeSharedContext(key: string, draw: (context: GraphicsContext) => void): GraphicsContext {
  const existing = shared.get(key);
  if (existing) return existing;
  const created = new GraphicsContext();
  draw(created);
  shared.set(key, created);
  return created;
}

/** Drops shared geometry when the picture is torn down, so the next watch builds it again. */
export function releaseSharedContexts(): void {
  for (const context of shared.values()) context.destroy();
  shared.clear();
}
