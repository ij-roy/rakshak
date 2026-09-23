import { BOSSES, ELITES, ENEMIES } from '@rakshak/game-data';
import { distSq } from '@rakshak/shared';
import { applyDamageToEnemy, applyDamageToPlayer } from '../combat/damage.js';
import { threatSkipsContact } from './threats.js';
import { takeSpatialSkip } from '../world/spatial-fill.js';
import type { World } from '../world/world.js';

function widestBody(): number {
  let reach = 0;
  for (let i = 0; i < ENEMIES.length; i++) reach = Math.max(reach, ENEMIES[i]!.radius);
  for (let i = 0; i < ELITES.length; i++) reach = Math.max(reach, ELITES[i]!.radius);
  for (let i = 0; i < BOSSES.length; i++) reach = Math.max(reach, BOSSES[i]!.radius);
  return reach;
}

/** Largest body in the catalog. Contact only searches cells that can touch the guardian. */
const WIDEST_BODY = widestBody();
let broadphaseBuilds = 0;

export function takeBroadphaseBuilds(): number {
  const count = broadphaseBuilds;
  broadphaseBuilds = 0;
  return count;
}

export function systemBroadphase(world: World): void {
  if (takeSpatialSkip(world, world.tick)) return;
  broadphaseBuilds += 1;
  world.spatial.clear();
  const enemies = world.enemies.items;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i]!;
    if (enemy.alive) world.spatial.insert(i, enemy.x, enemy.y);
  }
}

export function systemHits(world: World): void {
  if (world.run.paused || world.offer.awaitingChoice || world.run.outcome !== 'ongoing') return;

  const projectiles = world.projectiles.items;
  const enemies = world.enemies.items;
  for (let pIndex = 0; pIndex < projectiles.length; pIndex++) {
    const proj = projectiles[pIndex]!;
    if (!proj.alive || proj.faction !== 'player') continue;
    world.spatial.query(proj.x, proj.y, proj.radius + WIDEST_BODY, world.queryScratch);
    const neighbors = world.queryScratch;
    for (let n = 0; n < neighbors.length; n++) {
      const enemyIndex = neighbors[n]!;
      const enemy = enemies[enemyIndex];
      if (!enemy || !enemy.alive) continue;
      if (proj.hitIds.has(enemy.id)) continue;
      const r = proj.radius + enemy.radius;
      if (distSq(proj.x, proj.y, enemy.x, enemy.y) > r * r) continue;

      if (proj.behavior === 'arc') {
        const facing = proj.homeX;
        const sweep = proj.homeY;
        const ang = Math.atan2(enemy.y - world.player.y, enemy.x - world.player.x);
        let delta = ang - facing;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        if (Math.abs(delta) > sweep * 0.5) continue;
      }

      applyDamageToEnemy(world, enemyIndex, proj.damage, false);
      proj.hitIds.add(enemy.id);

      if (world.guardianId === 'asha' && (proj.weaponId === 'talwar_arc' || proj.behavior === 'arc')) {
        world.player.ashaHitCounter++;
        if (world.player.ashaHitCounter >= 6) {
          world.player.ashaHitCounter = 0;
          world.player.ashaSpeedUntil = world.tick + 45;
        }
      }

      if (proj.behavior === 'straight' || proj.behavior === 'chain') {
        proj.pierceLeft--;
        if (proj.pierceLeft <= 0) {
          world.projectiles.releaseAt(pIndex);
          break;
        }
      }
    }
  }

  for (let index = 0; index < projectiles.length; index++) {
    const proj = projectiles[index]!;
    if (!proj.alive || proj.faction !== 'enemy') continue;
    const r = proj.radius + world.player.radius;
    if (distSq(proj.x, proj.y, world.player.x, world.player.y) <= r * r) {
      applyDamageToPlayer(world, proj.damage, proj.id);
      world.projectiles.releaseAt(index);
    }
  }

  world.spatial.query(world.player.x, world.player.y, world.player.radius + WIDEST_BODY, world.queryScratch);
  const near = world.queryScratch;
  for (let n = 0; n < near.length; n++) {
    const enemy = enemies[near[n]!];
    if (!enemy || !enemy.alive || threatSkipsContact(enemy)) continue;
    const r = enemy.radius + world.player.radius;
    if (distSq(enemy.x, enemy.y, world.player.x, world.player.y) <= r * r) {
      applyDamageToPlayer(world, enemy.contactDamage, enemy.id);
    }
  }
}
