/** World size both renderers keep on screen. Wider windows zoom in instead of revealing more. */
export const COMBAT_VIEW = { width: 900, height: 506 };

/**
 * Zoom that caps the visible world to COMBAT_VIEW on the longer axis.
 * A 16:9 phone and a 16:9 desktop therefore show the same ground.
 */
export function combatViewZoom(viewW: number, viewH: number, cameraZoom = 1): number {
  const base = cameraZoom > 0 ? cameraZoom : 1;
  if (viewW <= 0 || viewH <= 0) return base;
  const fit = Math.max(viewW / COMBAT_VIEW.width, viewH / COMBAT_VIEW.height);
  return base * fit;
}
