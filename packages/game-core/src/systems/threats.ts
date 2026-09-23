import { normalizeInto } from '@rakshak/shared';
import type { TelegraphInstance } from '@rakshak/game-protocol';
import { applyDamageToPlayer } from '../combat/damage.js';
import type { EnemyEntity, World } from '../world/world.js';

interface AttackSpec {
  kind: TelegraphInstance['kind'];
  windup: number;
  active: number;
  recover: number;
  /** Travel or danger distance in world units. */
  reach: number;
  /** Lane width, landing radius, or arc sweep in radians. */
  sweep: number;
}

const ATTACKS: Record<string, AttackSpec> = {
  sand_roller: { kind: 'line', windup: 24, active: 16, recover: 18, reach: 180, sweep: 28 },
  dust_leaper: { kind: 'circle', windup: 18, active: 8, recover: 16, reach: 130, sweep: 26 },
  thorn_spitter: { kind: 'line', windup: 26, active: 1, recover: 40, reach: 240, sweep: 12 },
  fort_sentry: { kind: 'line', windup: 32, active: 1, recover: 48, reach: 260, sweep: 12 },
  burrow_mite: { kind: 'ring', windup: 28, active: 6, recover: 20, reach: 100, sweep: 24 },
  night_maw: { kind: 'arc', windup: 22, active: 6, recover: 26, reach: 78, sweep: 1.8 },
  ironbound: { kind: 'arc', windup: 24, active: 6, recover: 30, reach: 86, sweep: 2.1 },
};

const BOSS_RING: AttackSpec = { kind: 'ring', windup: 30, active: 6, recover: 50, reach: 130, sweep: 130 };
const aim = { x: 0, y: 0 };

export function attackSpecFor(contentId: string, kind: EnemyEntity['kind']): AttackSpec | null {
  if (kind === 'boss') return BOSS_RING;
  return ATTACKS[contentId] ?? null;
}

export function hasThreat(contentId: string, kind: EnemyEntity['kind']): boolean {
  return attackSpecFor(contentId, kind) !== null;
}

/** True when this enemy is running a special attack and should not use chase movement. */
export function stepThreat(world: World, enemy: EnemyEntity): boolean {
  const spec = attackSpecFor(enemy.contentId, enemy.kind);
  if (!spec) return false;
  if (!Number.isFinite(enemy.attackPhase)) enemy.attackPhase = 0;

  if (enemy.attackPhase === 0) {
    if (enemy.aiCooldown > 0) {
      enemy.aiCooldown -= 1;
      return enemy.contentId === 'fort_sentry';
    }
    const dir = normalizeInto(world.player.x - enemy.x, world.player.y - enemy.y, aim);
    const aimX = dir.x === 0 && dir.y === 0 ? 1 : dir.x;
    const aimY = dir.y;
    enemy.aimX = enemy.x + aimX * spec.reach;
    enemy.aimY = enemy.y + aimY * spec.reach;
    enemy.attackPhase = 1;
    enemy.attackTimer = spec.windup;
    enemy.vx = 0;
    enemy.vy = 0;
    return true;
  }

  enemy.attackTimer -= 1;
  enemy.vx = 0;
  enemy.vy = 0;

  if (enemy.attackPhase === 1 && enemy.attackTimer <= 0) {
    commitThreat(world, enemy, spec);
    enemy.attackPhase = 2;
    enemy.attackTimer = spec.active;
    return true;
  }

  if (enemy.attackPhase === 2) {
    if (spec.kind === 'line' && enemy.contentId === 'sand_roller') {
      advanceTowardAim(enemy, spec.reach / spec.active);
    }
    if (spec.kind === 'circle') {
      advanceTowardAim(enemy, spec.reach / spec.active);
    }
    if (enemy.attackTimer <= 0) {
      enemy.attackPhase = 3;
      enemy.attackTimer = spec.recover;
    }
    return true;
  }

  if (enemy.attackTimer <= 0) {
    enemy.attackPhase = 0;
    enemy.aiCooldown = 15;
  }
  return true;
}

export function threatSkipsContact(enemy: EnemyEntity): boolean {
  if (enemy.contentId === 'burrow_mite' && enemy.attackPhase === 1) return true;
  if (enemy.contentId === 'dust_leaper' && (enemy.attackPhase === 1 || enemy.attackPhase === 2)) return true;
  if (enemy.contentId === 'sand_roller' && enemy.attackPhase === 1) return true;
  if ((enemy.contentId === 'night_maw' || enemy.contentId === 'ironbound') && (enemy.attackPhase === 1 || enemy.attackPhase === 2)) {
    return true;
  }
  return false;
}

const telegraphPools = new WeakMap<TelegraphInstance[], TelegraphInstance[]>();

function claimTelegraph(out: TelegraphInstance[]): TelegraphInstance {
  let pool = telegraphPools.get(out);
  if (!pool) {
    pool = [];
    telegraphPools.set(out, pool);
  }
  const index = out.length;
  const existing = pool[index];
  if (existing) {
    out.push(existing);
    return existing;
  }
  const created: TelegraphInstance = {
    id: 0,
    kind: 'circle',
    x: 0,
    y: 0,
    radius: 0,
    angle: 0,
    sweep: 0,
    progress: 0,
    hostile: true,
  };
  pool[index] = created;
  out.push(created);
  return created;
}

export function pushThreatTelegraphs(world: World, out: TelegraphInstance[]): void {
  const enemies = world.enemies.items;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i]!;
    if (!enemy.alive || (enemy.attackPhase !== 1 && enemy.attackPhase !== 2)) continue;
    const spec = attackSpecFor(enemy.contentId, enemy.kind);
    if (!spec) continue;
    const windupProgress =
      enemy.attackPhase === 1 ? 1 - Math.max(0, enemy.attackTimer) / spec.windup : 1;
    const angle = Math.atan2(enemy.aimY - enemy.y, enemy.aimX - enemy.x);
    const landing = spec.kind === 'circle' || (spec.kind === 'ring' && enemy.kind !== 'boss');
    let radius = spec.reach;
    if (spec.kind === 'circle' || (spec.kind === 'ring' && enemy.kind !== 'boss')) radius = spec.sweep;
    if (spec.kind === 'ring' && enemy.kind === 'boss') radius = spec.reach * (0.35 + 0.65 * windupProgress);
    const mark = claimTelegraph(out);
    mark.id = enemy.id;
    mark.kind = spec.kind;
    mark.x = landing ? enemy.aimX : enemy.x;
    mark.y = landing ? enemy.aimY : enemy.y;
    mark.radius = radius;
    mark.angle = angle;
    mark.sweep = spec.sweep;
    mark.progress = windupProgress;
    mark.hostile = true;
  }
}

function commitThreat(world: World, enemy: EnemyEntity, spec: AttackSpec): void {
  if (enemy.contentId === 'thorn_spitter' || enemy.contentId === 'fort_sentry') {
    const angle = Math.atan2(enemy.aimY - enemy.y, enemy.aimX - enemy.x);
    const speed = spec.reach / 18;
    const shot = world.projectiles.take();
    if (!shot) return;
    shot.hitIds.clear();
    shot.weaponId = 'thorn_bolt';
    shot.x = enemy.x;
    shot.y = enemy.y;
    shot.vx = Math.cos(angle) * speed;
    shot.vy = Math.sin(angle) * speed;
    shot.radius = 6;
    shot.damage = enemy.contactDamage;
    shot.pierceLeft = 1;
    shot.lifeTicks = 22;
    shot.age = 0;
    shot.faction = 'enemy';
    shot.behavior = 'straight';
    shot.homeX = 0;
    shot.homeY = 0;
    shot.returning = false;
    shot.ownerTick = world.tick;
    return;
  }
  if (enemy.contentId === 'burrow_mite') {
    enemy.x = enemy.aimX;
    enemy.y = enemy.aimY;
    return;
  }
  if (spec.kind === 'arc' || enemy.kind === 'boss') {
    const reach = spec.kind === 'arc' ? spec.reach : spec.reach;
    const dx = world.player.x - enemy.x;
    const dy = world.player.y - enemy.y;
    const dist = Math.hypot(dx, dy);
    if (dist > reach + world.player.radius) return;
    if (spec.kind === 'arc') {
      const angle = Math.atan2(enemy.aimY - enemy.y, enemy.aimX - enemy.x);
      let delta = Math.atan2(dy, dx) - angle;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      if (Math.abs(delta) > spec.sweep * 0.5) return;
    }
    applyDamageToPlayer(world, enemy.contactDamage, enemy.id);
  }
}

function advanceTowardAim(enemy: EnemyEntity, step: number): void {
  const dx = enemy.aimX - enemy.x;
  const dy = enemy.aimY - enemy.y;
  const len = Math.hypot(dx, dy);
  if (len <= step || len === 0) {
    enemy.x = enemy.aimX;
    enemy.y = enemy.aimY;
    return;
  }
  enemy.x += (dx / len) * step;
  enemy.y += (dy / len) * step;
}
