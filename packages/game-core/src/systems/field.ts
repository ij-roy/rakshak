import { MAP_BY_ID, type MapId } from '@rakshak/game-data';
import type { FieldMark } from '@rakshak/game-protocol';
import { clamp } from '@rakshak/shared';
import type { World } from '../world/world.js';

/** Warning for 2s, active for 4s, quiet for 4s. Walls and landmarks stay active. */
export function hazardPhase(tick: number, offset: number): number {
  const local = ((tick + offset) % 300 + 300) % 300;
  if (local < 60) return local / 60;
  if (local < 180) return 1;
  return 0;
}

const simMarks: FieldMark[] = [];
let filledTick = -1;
let filledMap = '';
let fieldFills = 0;

function ensureSimMarks(world: Pick<World, 'mapId' | 'tick' | 'mapWidth' | 'mapHeight'>): void {
  if (filledTick === world.tick && filledMap === world.mapId) return;
  fillFieldMarks(world, simMarks);
  filledTick = world.tick;
  filledMap = world.mapId;
  fieldFills += 1;
}

export function takeFieldFills(): number {
  const count = fieldFills;
  fieldFills = 0;
  return count;
}

function writeMark(
  out: FieldMark[],
  index: number,
  id: number,
  kind: FieldMark['kind'],
  x: number,
  y: number,
  w: number,
  h: number,
  dir: number,
  active: number,
): void {
  const existing = out[index];
  if (existing) {
    existing.id = id;
    existing.kind = kind;
    existing.x = x;
    existing.y = y;
    existing.w = w;
    existing.h = h;
    existing.dir = dir;
    existing.active = active;
    return;
  }
  out[index] = { id, kind, x, y, w, h, dir, active };
}

/** Writes terrain into `out`, reusing mark records already stored there. */
export function fillFieldMarks(world: Pick<World, 'mapId' | 'tick' | 'mapWidth' | 'mapHeight'>, out: FieldMark[]): void {
  const map = MAP_BY_ID[world.mapId as MapId];
  const hazard = map?.hazard ?? 'low_walls';
  let n = 0;
  writeMark(out, n++, 1, 'landmark', -280, -160, 16, 16, 0, 1);
  writeMark(out, n++, 2, 'landmark', 320, 140, 18, 12, 0, 1);
  writeMark(out, n++, 3, 'landmark', -180, 260, 14, 22, 0, 1);
  writeMark(out, n++, 4, 'landmark', 220, -280, 20, 14, 0, 1);
  if (hazard === 'low_walls') {
    writeMark(out, n++, 10, 'wall', -300, -200, 360, 18, 0, 1);
    writeMark(out, n++, 11, 'wall', 300, -200, 360, 18, 0, 1);
    writeMark(out, n++, 12, 'wall', -260, 280, 300, 18, 0, 1);
    writeMark(out, n++, 13, 'wall', 280, 280, 280, 18, 0, 1);
  } else if (hazard === 'root_slow') {
    writeMark(out, n++, 20, 'slow', 0, 180, 180, 180, 0, hazardPhase(world.tick, 0));
    writeMark(out, n++, 21, 'slow', -240, -160, 160, 160, 0, hazardPhase(world.tick, 150));
  } else if (hazard === 'wind_lanes') {
    writeMark(out, n++, 30, 'wind', 0, 150, 760, 72, 1, hazardPhase(world.tick, 0));
    writeMark(out, n++, 31, 'wind', 0, -170, 760, 72, -1, hazardPhase(world.tick, 150));
  } else {
    writeMark(out, n++, 40, 'gate', 340, -130, 22, 180, 0, hazardPhase(world.tick, 0));
    writeMark(out, n++, 41, 'gate', 340, 130, 22, 180, 0, hazardPhase(world.tick, 0));
    writeMark(out, n++, 42, 'gate', -360, -130, 22, 180, 0, hazardPhase(world.tick, 140));
    writeMark(out, n++, 43, 'gate', -360, 130, 22, 180, 0, hazardPhase(world.tick, 140));
  }
  out.length = n;
}

export function fieldMarks(world: Pick<World, 'mapId' | 'tick' | 'mapWidth' | 'mapHeight'>): FieldMark[] {
  const marks: FieldMark[] = [];
  fillFieldMarks(world, marks);
  return marks;
}

export function applyPlayerField(world: World): void {
  ensureSimMarks(world);
  let slow = false;
  for (let i = 0; i < simMarks.length; i++) {
    const mark = simMarks[i]!;
    if (mark.kind === 'slow' && mark.active >= 1 && inCircle(world.player.x, world.player.y, mark)) slow = true;
  }
  if (slow) {
    world.player.x -= world.player.vx * 0.45;
    world.player.y -= world.player.vy * 0.45;
  }
  for (let i = 0; i < simMarks.length; i++) {
    const mark = simMarks[i]!;
    if ((mark.kind === 'wall' || mark.kind === 'gate') && mark.active >= 1) {
      pushCircleFromRect(world.player, mark);
    }
  }
  const halfW = world.mapWidth * 0.5 - world.player.radius;
  const halfH = world.mapHeight * 0.5 - world.player.radius;
  world.player.x = clamp(world.player.x, -halfW, halfW);
  world.player.y = clamp(world.player.y, -halfH, halfH);
}

export function applyWindLanes(world: World): void {
  ensureSimMarks(world);
  let wind = false;
  for (let i = 0; i < simMarks.length; i++) {
    const mark = simMarks[i]!;
    if (mark.kind === 'wind' && mark.active >= 1) {
      wind = true;
      break;
    }
  }
  if (!wind) return;
  const shots = world.projectiles.items;
  for (let index = 0; index < shots.length; index++) {
    const shot = shots[index]!;
    if (!shot.alive) continue;
    for (let laneIndex = 0; laneIndex < simMarks.length; laneIndex++) {
      const lane = simMarks[laneIndex]!;
      if (lane.kind !== 'wind' || lane.active < 1) continue;
      if (!inRect(shot.x, shot.y, lane)) continue;
      if (lane.w >= lane.h) shot.vx += lane.dir * 1.6;
      else shot.vy += lane.dir * 1.6;
    }
  }
}

function inCircle(x: number, y: number, mark: FieldMark): boolean {
  const r = mark.w * 0.5;
  const dx = x - mark.x;
  const dy = y - mark.y;
  return dx * dx + dy * dy <= r * r;
}

function inRect(x: number, y: number, mark: FieldMark): boolean {
  return Math.abs(x - mark.x) <= mark.w * 0.5 && Math.abs(y - mark.y) <= mark.h * 0.5;
}

function pushCircleFromRect(body: { x: number; y: number; radius: number }, mark: FieldMark): void {
  const left = mark.x - mark.w * 0.5;
  const right = mark.x + mark.w * 0.5;
  const top = mark.y - mark.h * 0.5;
  const bottom = mark.y + mark.h * 0.5;
  const closestX = clamp(body.x, left, right);
  const closestY = clamp(body.y, top, bottom);
  let dx = body.x - closestX;
  let dy = body.y - closestY;
  const distSq = dx * dx + dy * dy;
  const radius = body.radius;
  if (distSq >= radius * radius) return;
  if (distSq === 0) {
    const penLeft = body.x - left;
    const penRight = right - body.x;
    const penTop = body.y - top;
    const penBottom = bottom - body.y;
    const min = Math.min(penLeft, penRight, penTop, penBottom);
    if (min === penLeft) body.x = left - radius;
    else if (min === penRight) body.x = right + radius;
    else if (min === penTop) body.y = top - radius;
    else body.y = bottom + radius;
    return;
  }
  const dist = Math.sqrt(distSq);
  const push = radius - dist;
  body.x += (dx / dist) * push;
  body.y += (dy / dist) * push;
}
