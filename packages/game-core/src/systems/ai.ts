import { normalizeInto, SIM_HZ } from '@rakshak/shared';
import { hasThreat, stepThreat } from './threats.js';
import { markSpatialFilled } from '../world/spatial-fill.js';
import type { World } from '../world/world.js';

const chase = { x: 0, y: 0 };

export function systemAi(world: World): void {
  if (world.run.paused || world.offer.awaitingChoice || world.run.outcome !== 'ongoing') return;
  const px = world.player.x;
  const py = world.player.y;

  const enemies = world.enemies.items;
  world.spatial.clear();
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (!e.alive) continue;
    if (!(hasThreat(e.contentId, e.kind) && stepThreat(world, e))) {
      if (e.contentId === 'fort_sentry') {
        e.vx = 0;
        e.vy = 0;
      } else {
        const steer = e.kind !== 'enemy' || (e.id & 1) === (world.tick & 1);
        if (steer) {
          const dir = normalizeInto(px - e.x, py - e.y, chase);
          let speed = 40;
          if (e.kind === 'elite') speed = 48;
          if (e.kind === 'boss') speed = 34;
          if (e.kind === 'enemy') speed = 20 + Math.min(80, e.threatCost * 20);
          e.vx = dir.x * (speed / SIM_HZ);
          e.vy = dir.y * (speed / SIM_HZ);
        }
        e.x += e.vx;
        e.y += e.vy;
      }
    }
    world.spatial.insert(i, e.x, e.y);
  }
  markSpatialFilled(world, world.tick);
}
