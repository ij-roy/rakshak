import { applyWindLanes } from './field.js';
import type { World } from '../world/world.js';

export function systemProjectiles(world: World): void {
  if (world.run.paused || world.offer.awaitingChoice) return;

  const projectiles = world.projectiles.items;
  for (let index = 0; index < projectiles.length; index++) {
    const p = projectiles[index]!;
    if (!p.alive) continue;
    p.age++;
    if (p.behavior === 'return') {
      const halfLife = Math.floor(p.lifeTicks * 0.5);
      if (!p.returning && p.age >= halfLife) {
        p.returning = true;
        p.hitIds.clear();
      }
      if (p.returning) {
        const dx = world.player.x - p.x;
        const dy = world.player.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        const spd = Math.hypot(p.vx, p.vy) || 6;
        p.vx = (dx / len) * spd;
        p.vy = (dy / len) * spd;
      }
    }

    if (p.behavior === 'trail') {
      p.x = world.player.x;
      p.y = world.player.y;
    } else if (p.behavior !== 'arc' && p.behavior !== 'zone' && p.behavior !== 'chain') {
      p.x += p.vx;
      p.y += p.vy;
    }

    if (p.age >= p.lifeTicks) {
      world.projectiles.releaseAt(index);
    }
  }
  applyWindLanes(world);

  const particles = world.particles.items;
  for (let index = 0; index < particles.length; index++) {
    const pt = particles[index]!;
    if (!pt.alive) continue;
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.lifeTicks--;
    if (pt.lifeTicks <= 0) world.particles.releaseAt(index);
  }

  const labels = world.damageLabels.items;
  for (let index = 0; index < labels.length; index++) {
    const d = labels[index]!;
    if (!d.alive) continue;
    d.y -= 0.6;
    d.lifeTicks--;
    if (d.lifeTicks <= 0) world.damageLabels.releaseAt(index);
  }
}
