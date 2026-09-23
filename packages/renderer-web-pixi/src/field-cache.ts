import { boundProximity, type RenderSnapshot } from '@rakshak/game-protocol';

/** Skip a terrain redraw until the camera crosses a grid cell or a hazard changes. */
export function fieldCacheStamp(snap: RenderSnapshot, viewW: number, viewH: number, zoom: number): number {
  const cell = 96;
  const left = Math.floor((snap.camera.x - viewW / (2 * zoom)) / cell);
  const top = Math.floor((snap.camera.y - viewH / (2 * zoom)) / cell);
  const pressure = Math.round(boundProximity(snap.camera.x, snap.camera.y, snap.mapWidth, snap.mapHeight) * 20);
  let hash =
    Math.imul(left, 73856093) ^
    Math.imul(top, 19349663) ^
    Math.imul(pressure, 83492791) ^
    snap.field.length ^
    Math.round(zoom * 100);
  for (const mark of snap.field) {
    hash =
      Math.imul(hash, 16777619) ^
      mark.id ^
      (mark.active >= 1 ? 0x9e3779b9 : Math.round(mark.active * 4)) ^
      Math.round(mark.x) ^
      Math.imul(Math.round(mark.y), 31) ^
      Math.round(mark.w);
  }
  return hash;
}
