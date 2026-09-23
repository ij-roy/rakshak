import type { World } from '../world/world.js';

export const HURT_TINT = 0xd65332;
export const HEAL_TINT = 0x5f9d62;
export const TRAIL_TINT = 0xe5d2a6;

/** Nearby hits share one rising number so a crowd does not cover the threat. */
export function noteEnemyDamage(world: World, x: number, y: number, amount: number, critical: boolean): void {
  const labels = world.damageLabels.items;
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i]!;
    if (!label.alive || label.lifeTicks <= 8) continue;
    const dx = label.x - x;
    const dy = label.y - y;
    if (dx * dx + dy * dy > 28 * 28) continue;
    label.amount += amount;
    label.lifeTicks = 20;
    label.critical = label.critical || critical;
    return;
  }
  const label = world.damageLabels.take();
  if (!label) return;
  label.x = x;
  label.y = y;
  label.amount = amount;
  label.lifeTicks = 20;
  label.critical = critical;
}

/** A short streak points from the guardian toward the hit. */
export function notePlayerHit(world: World, sourceId: number): void {
  let sx = world.player.x;
  let sy = world.player.y - 48;
  const enemies = world.enemies.items;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i]!;
    if (!enemy.alive || enemy.id !== sourceId) continue;
    sx = enemy.x;
    sy = enemy.y;
    break;
  }
  const dx = sx - world.player.x;
  const dy = sy - world.player.y;
  const len = Math.hypot(dx, dy) || 1;
  const streak = world.particles.take();
  if (!streak) return;
  streak.x = world.player.x + (dx / len) * 18;
  streak.y = world.player.y + (dy / len) * 18;
  streak.vx = (dx / len) * 1.5;
  streak.vy = (dy / len) * 1.5;
  streak.lifeTicks = 12;
  streak.tint = HURT_TINT;
}

export function noteHeal(world: World): void {
  const spark = world.particles.take();
  if (!spark) return;
  spark.x = world.player.x;
  spark.y = world.player.y - 14;
  spark.vx = 0;
  spark.vy = -0.7;
  spark.lifeTicks = 18;
  spark.tint = HEAL_TINT;
}

export function notePickupTrail(world: World, x: number, y: number): void {
  if (world.tick % 4 !== 0) return;
  const spark = world.particles.take();
  if (!spark) return;
  spark.x = x;
  spark.y = y;
  spark.vx = 0;
  spark.vy = 0;
  spark.lifeTicks = 8;
  spark.tint = TRAIL_TINT;
}
