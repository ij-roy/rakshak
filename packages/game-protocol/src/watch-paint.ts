import { combatViewZoom } from './combat-view.js';
import { resolveSpriteTint, silhouetteFor, silhouetteMarks } from './silhouette.js';
import { boundProximity, type RenderSnapshot } from './snapshot.js';
import { edgeMarker, telegraphFootprint, type EdgeMarker } from './telegraph-edge.js';

/**
 * The point list is only valid until the call returns.
 * A recorder must copy it during the call.
 */
export interface WatchBrush {
  circle(x: number, y: number, radius: number, color: string, opacity: number, strokeWidth: number): void;
  polygon(points: ArrayLike<number>, color: string, opacity: number, strokeWidth: number): void;
  polyline(points: ArrayLike<number>, color: string, opacity: number, strokeWidth: number): void;
  text(value: string, x: number, y: number, color: string, opacity: number): void;
  /** Draw one cached local outline at a translated, rotated origin. */
  silhouette?(
    points: ArrayLike<number>,
    originX: number,
    originY: number,
    facing: number,
    color: string,
    opacity: number,
    strokeWidth: number,
  ): void;
}

const hexCache = new Map<number, string>();
const scratch: number[] = [];
const laneLocal = [0, 0, 0, 0, 0, 0, 0, 0];
const edgeIndex: number[] = [];
const edgeOut: EdgeMarker = { x: 0, y: 0, angle: 0 };

function screenX(worldX: number, camX: number, viewW: number, zoom: number): number {
  return viewW / 2 + (worldX - camX) * zoom;
}

function screenY(worldY: number, camY: number, viewH: number, zoom: number): number {
  return viewH / 2 + (worldY - camY) * zoom;
}

function inView(x: number, y: number, camX: number, camY: number, halfW: number, halfH: number): boolean {
  return Math.abs(x - camX) <= halfW && Math.abs(y - camY) <= halfH;
}

function placeLocal(local: ArrayLike<number>, originX: number, originY: number, facing: number): void {
  const cos = Math.cos(facing);
  const sin = Math.sin(facing);
  scratch.length = 0;
  for (let i = 0; i < local.length; i += 2) {
    const localX = local[i] ?? 0;
    const localY = local[i + 1] ?? 0;
    scratch.push(originX + localX * cos - localY * sin, originY + localX * sin + localY * cos);
  }
}

function paintEdgeArrow(
  brush: WatchBrush,
  worldX: number,
  worldY: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  zoom: number,
): void {
  const marker = edgeMarker(worldX, worldY, camX, camY, viewW, viewH, zoom, 28, edgeOut);
  if (!marker) return;
  const ax = Math.cos(marker.angle);
  const ay = Math.sin(marker.angle);
  const px = -ay;
  const py = ax;
  scratch.length = 0;
  scratch.push(
    marker.x + ax * 10,
    marker.y + ay * 10,
    marker.x - ax * 4 + px * 6,
    marker.y - ay * 4 + py * 6,
    marker.x - ax * 4 - px * 6,
    marker.y - ay * 4 - py * 6,
  );
  brush.polygon(scratch, '#d65332', 1, 0);
}

function hexColor(value: number): string {
  const cached = hexCache.get(value);
  if (cached) return cached;
  const next = `#${(value & 0xffffff).toString(16).padStart(6, '0')}`;
  hexCache.set(value, next);
  return next;
}

const shapeByKind = new Map<string, Map<string, ReturnType<typeof silhouetteFor>>>();
let shapeLookups = 0;

function cachedShape(kind: string, contentId: string): ReturnType<typeof silhouetteFor> {
  let byContent = shapeByKind.get(kind);
  if (!byContent) {
    byContent = new Map();
    shapeByKind.set(kind, byContent);
  }
  const found = byContent.get(contentId);
  if (found) return found;
  shapeLookups += 1;
  const shape = silhouetteFor(kind, contentId);
  byContent.set(contentId, shape);
  return shape;
}

export function takeShapeLookups(): number {
  const count = shapeLookups;
  shapeLookups = 0;
  return count;
}

/** Draw one watch frame as brush calls. The native view records this into a single picture. */
export function paintWatch(
  snap: RenderSnapshot,
  viewW: number,
  viewH: number,
  brush: WatchBrush,
  decorative = true,
): void {
  const zoom = combatViewZoom(viewW, viewH, snap.camera.zoom || 1);
  const camX = snap.camera.x;
  const camY = snap.camera.y;
  const halfW = viewW / (2 * zoom) + 80;
  const halfH = viewH / (2 * zoom) + 80;
  const viewLeft = camX - halfW;
  const viewRight = camX + halfW;
  const viewTop = camY - halfH;
  const viewBottom = camY + halfH;

  if (snap.mapWidth > 0 && snap.mapHeight > 0) {
    const near = boundProximity(camX, camY, snap.mapWidth, snap.mapHeight);
    const left = screenX(-snap.mapWidth / 2, camX, viewW, zoom);
    const top = screenY(-snap.mapHeight / 2, camY, viewH, zoom);
    const right = screenX(snap.mapWidth / 2, camX, viewW, zoom);
    const bottom = screenY(snap.mapHeight / 2, camY, viewH, zoom);
    scratch.length = 0;
    scratch.push(left, top, right, top, right, bottom, left, bottom);
    brush.polygon(scratch, near > 0.15 ? '#d65332' : '#c28a2c', 1, 2 + near * 4);
  }

  const field = snap.field;
  for (let i = 0; i < field.length; i++) {
    const mark = field[i]!;
    const left = mark.x - mark.w * 0.5;
    const right = mark.x + mark.w * 0.5;
    const top = mark.y - mark.h * 0.5;
    const bottom = mark.y + mark.h * 0.5;
    if (right < viewLeft || left > viewRight || bottom < viewTop || top > viewBottom) continue;
    const color =
      mark.kind === 'slow'
        ? '#5f9d62'
        : mark.kind === 'wind'
          ? '#58a6b3'
          : mark.kind === 'gate'
            ? '#d65332'
            : mark.kind === 'landmark'
              ? '#8a8790'
              : '#c28a2c';
    if (mark.kind === 'slow') {
      brush.circle(
        screenX(mark.x, camX, viewW, zoom),
        screenY(mark.y, camY, viewH, zoom),
        mark.w * 0.5 * zoom,
        color,
        0.35 + mark.active * 0.5,
        mark.active >= 1 ? 3 : 1.5,
      );
      continue;
    }
    const markLeft = screenX(mark.x - mark.w / 2, camX, viewW, zoom);
    const markTop = screenY(mark.y - mark.h / 2, camY, viewH, zoom);
    const width = mark.w * zoom;
    const height = mark.h * zoom;
    scratch.length = 0;
    scratch.push(markLeft, markTop, markLeft + width, markTop, markLeft + width, markTop + height, markLeft, markTop + height);
    brush.polygon(scratch, color, 0.4 + mark.active * 0.5, mark.active >= 1 ? 3 : 1.5);
  }

  const sprites = snap.sprites;
  edgeIndex.length = 0;
  for (let i = 0; i < sprites.length; i++) {
    const sprite = sprites[i]!;
    if (!decorative && (sprite.kind === 'particle' || sprite.kind === 'damage_label')) continue;
    if (sprite.kind === 'boss' || sprite.kind === 'elite') edgeIndex.push(i);
    if (!inView(sprite.x, sprite.y, camX, camY, halfW, halfH)) continue;
    const x = screenX(sprite.x, camX, viewW, zoom);
    const y = screenY(sprite.y, camY, viewH, zoom);
    if (sprite.kind === 'damage_label') {
      brush.text(sprite.contentId, x - 8, y, '#e5d2a6', sprite.alpha);
      continue;
    }
    if (sprite.contentId === 'spark') {
      brush.circle(x, y, 3, '#e5d2a6', sprite.alpha, 0);
      continue;
    }
    if (sprite.contentId === 'heal') {
      scratch.length = 0;
      scratch.push(x, y - 8, x, y + 8);
      brush.polyline(scratch, '#5f9d62', sprite.alpha, 3);
      scratch.length = 0;
      scratch.push(x - 8, y, x + 8, y);
      brush.polyline(scratch, '#5f9d62', sprite.alpha, 3);
      continue;
    }
    if (sprite.contentId === 'hurt') {
      scratch.length = 0;
      scratch.push(x, y, x + Math.cos(sprite.facing) * 16, y + Math.sin(sprite.facing) * 16);
      brush.polyline(scratch, '#d65332', sprite.alpha, 3);
      continue;
    }
    const shape = cachedShape(sprite.kind, sprite.contentId);
    const bob = sprite.kind === 'pickup' ? Math.sin((snap.tick + sprite.entityId) * 0.2) * 3 : 0;
    const color = hexColor(resolveSpriteTint(shape, sprite.tint));
    const outline = shape === 'shield' ? '#f4efe4' : '#c28a2c';
    const marks = silhouetteMarks(shape, Math.max(2, sprite.radius) * zoom);
    for (let m = 0; m < marks.length; m++) {
      const mark = marks[m]!;
      const strokeWidth = mark.mode === 'stroke' ? 2 : 0;
      const markColor = mark.mode === 'stroke' ? outline : color;
      if (brush.silhouette) {
        brush.silhouette(mark.points, x, y + bob, sprite.facing, markColor, sprite.alpha, strokeWidth);
      } else {
        placeLocal(mark.points, x, y + bob, sprite.facing);
        brush.polygon(scratch, markColor, sprite.alpha, strokeWidth);
      }
    }
  }

  const telegraphs = snap.telegraphs;
  for (let i = 0; i < telegraphs.length; i++) {
    const tel = telegraphs[i]!;
    if (!inView(tel.x, tel.y, camX, camY, halfW, halfH)) continue;
    const x = screenX(tel.x, camX, viewW, zoom);
    const y = screenY(tel.y, camY, viewH, zoom);
    const mode = telegraphFootprint(tel.kind);
    const color = tel.hostile ? '#d65332' : '#58a6b3';
    const radius = Math.max(4, tel.radius * zoom);
    if (mode === 'disk' || mode === 'ring') {
      brush.circle(x, y, radius, color, 0.4 + tel.progress * 0.45, mode === 'ring' ? 3 : 0);
      continue;
    }
    if (mode === 'lane') {
      const length = tel.radius * zoom;
      const half = Math.max(3, tel.sweep * 0.5 * zoom);
      laneLocal[1] = -half;
      laneLocal[2] = length;
      laneLocal[3] = -half;
      laneLocal[4] = length;
      laneLocal[5] = half;
      laneLocal[7] = half;
      placeLocal(laneLocal, x, y, tel.angle);
      brush.polygon(scratch, color, 0.7, 0);
      continue;
    }
    const start = tel.angle - tel.sweep / 2;
    scratch.length = 0;
    scratch.push(x, y);
    for (let step = 0; step <= 10; step++) {
      const angle = start + tel.sweep * (step / 10);
      scratch.push(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    brush.polygon(scratch, color, 0.45, 0);
  }

  for (let i = 0; i < telegraphs.length; i++) {
    const tel = telegraphs[i]!;
    if (tel.hostile) paintEdgeArrow(brush, tel.x, tel.y, camX, camY, viewW, viewH, zoom);
  }
  for (let e = 0; e < edgeIndex.length; e++) {
    const sprite = sprites[edgeIndex[e]!]!;
    paintEdgeArrow(brush, sprite.x, sprite.y, camX, camY, viewW, viewH, zoom);
  }
}
