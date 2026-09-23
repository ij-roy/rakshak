import { BALANCE } from '@rakshak/game-data';
import { noteEnemyDamage, notePlayerHit } from './feedback.js';
import type { World } from '../world/world.js';

export function applyDamageToPlayer(world: World, amount: number, sourceId: number): number {
  if (world.tick < world.player.invulnUntil) return 0;
  if (world.run.outcome !== 'ongoing') return 0;
  const mitigated = Math.max(
    1,
    Math.round(amount * (1 - world.player.armorPct) - world.player.armorFlat),
  );
  world.player.hp = Math.max(0, world.player.hp - mitigated);
  world.player.invulnUntil = world.tick + BALANCE.contactIFramesTicks;
  world.run.damageTaken += mitigated;
  if (world.run.bellAlive) world.run.bellDamaged = true;
  world.emitPlayerDamaged(mitigated, sourceId, world.player.hp);
  notePlayerHit(world, sourceId);
  return mitigated;
}

export function applyDamageToEnemy(
  world: World,
  enemyIndex: number,
  rawDamage: number,
  critical = false,
): number {
  const enemy = world.enemies.items[enemyIndex];
  if (!enemy || !enemy.alive) return 0;
  if (world.tick < enemy.invulnUntil) return 0;
  const dealt = Math.max(1, Math.round(rawDamage - enemy.armor * 0.5));
  enemy.hp = Math.max(0, enemy.hp - dealt);
  enemy.invulnUntil = world.tick + 2;
  world.emitEnemyDamaged(enemy.id, dealt, enemy.hp, critical);
  noteEnemyDamage(world, enemy.x, enemy.y - enemy.radius, dealt, critical);
  return dealt;
}

export function computePlayerDamage(world: World, base: number): number {
  return base * world.player.damageMult;
}
