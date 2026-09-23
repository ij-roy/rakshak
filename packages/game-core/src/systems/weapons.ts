import { EVOLUTION_BY_ID, WEAPON_BY_ID, type WeaponId } from '@rakshak/game-data';
import { distSq } from '@rakshak/shared';
import { computePlayerDamage } from '../combat/damage.js';
import type { NamedRngStreams } from '../rng/streams.js';
import type { ProjectileEntity, World } from '../world/world.js';
import { spatialCurrent } from '../world/spatial-fill.js';

export function systemWeapons(world: World, rng: NamedRngStreams): void {
  if (world.run.paused || world.offer.awaitingChoice || world.run.outcome !== 'ongoing') return;

  for (const slot of world.weapons) {
    if (slot.cooldown > 0) {
      slot.cooldown--;
      continue;
    }
    const def = WEAPON_BY_ID[slot.weaponId];
    const stats = def.levels[slot.level - 1]!;
    let cooldown = Math.max(4, Math.round(stats.cooldownTicks * world.player.cooldownMult));
    let damage = computePlayerDamage(world, stats.damage);
    let count = stats.count;
    let area = stats.area * world.player.areaMult;
    let speed = stats.speed * world.player.projectileSpeedMult;
    let pierce = stats.pierce;
    let duration = Math.round(stats.durationTicks * world.player.durationMult);

    if (slot.evolved && slot.evolutionId) {
      const evo = EVOLUTION_BY_ID[slot.evolutionId];
      damage *= evo.damageMult;
      area *= evo.areaMult;
      count += evo.countBonus;
    }

    fireWeapon(world, rng, slot.weaponId, damage, count, area, speed, pierce, duration);
    slot.cooldown = cooldown;
    world.emitWeaponFired(slot.weaponId, world.player.x, world.player.y);
  }
}

function fireWeapon(
  world: World,
  rng: NamedRngStreams,
  weaponId: WeaponId,
  damage: number,
  count: number,
  area: number,
  speed: number,
  pierce: number,
  duration: number,
): void {
  switch (weaponId) {
    case 'talwar_arc':
      fireArc(world, weaponId, damage, area, duration, world.player.facing, Math.PI * (count > 1 || false ? 2 : 1));
      break;
    case 'dhanush_volley':
      fireTowardNearest(world, weaponId, damage, count, area, speed, pierce, duration);
      break;
    case 'chakra_return':
      fireReturn(world, weaponId, damage, count, area, speed, duration);
      break;
    case 'gada_quake':
      fireZone(world, weaponId, damage, area, duration, world.player.x, world.player.y, 'zone');
      break;
    case 'ember_kund':
      fireNearDense(world, rng, weaponId, damage, count, area, duration);
      break;
    case 'monsoon_spark':
      fireChain(world, weaponId, damage, count, area);
      break;
    case 'spear_burst':
      fireRadial(world, weaponId, damage, count, area, speed, pierce, duration);
      break;
    case 'neel_trail':
      fireZone(world, weaponId, damage, area, duration, world.player.x, world.player.y, 'trail');
      break;
  }
}

function placeShot(
  world: World,
  weaponId: WeaponId,
  x: number,
  y: number,
  vx: number,
  vy: number,
  radius: number,
  damage: number,
  pierceLeft: number,
  lifeTicks: number,
  behavior: ProjectileEntity['behavior'],
  homeX: number,
  homeY: number,
): void {
  const shot = world.projectiles.take();
  if (!shot) return;
  shot.hitIds.clear();
  shot.weaponId = weaponId;
  shot.x = x;
  shot.y = y;
  shot.vx = vx;
  shot.vy = vy;
  shot.radius = radius;
  shot.damage = damage;
  shot.pierceLeft = pierceLeft;
  shot.lifeTicks = lifeTicks;
  shot.age = 0;
  shot.faction = 'player';
  shot.behavior = behavior;
  shot.homeX = homeX;
  shot.homeY = homeY;
  shot.returning = false;
  shot.ownerTick = world.tick;
}

function fireArc(
  world: World,
  weaponId: WeaponId,
  damage: number,
  area: number,
  duration: number,
  facing: number,
  sweep: number,
): void {
  placeShot(
    world,
    weaponId,
    world.player.x + Math.cos(facing) * (area * 0.35),
    world.player.y + Math.sin(facing) * (area * 0.35),
    0,
    0,
    area,
    damage,
    99,
    duration,
    'arc',
    facing,
    sweep,
  );
}

const nearest = { x: 0, y: 0 };
let aimedWorld: World | null = null;
let aimedTick = -1;
let aimedFound = false;
let aimScans = 0;

export function takeAimScans(): number {
  const count = aimScans;
  aimScans = 0;
  return count;
}

function nearestEnemy(world: World): { x: number; y: number } | null {
  if (aimedWorld === world && aimedTick === world.tick) return aimedFound ? nearest : null;
  aimedWorld = world;
  aimedTick = world.tick;
  aimScans += 1;
  aimedFound = false;
  let bestD = Infinity;
  const enemies = world.enemies.items;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (!e.alive) continue;
    const d = distSq(world.player.x, world.player.y, e.x, e.y);
    if (d < bestD) {
      bestD = d;
      nearest.x = e.x;
      nearest.y = e.y;
      aimedFound = true;
    }
  }
  return aimedFound ? nearest : null;
}
const chainCandidates: { x: number; y: number; d: number }[] = Array.from({ length: 300 }, () => ({
  x: 0,
  y: 0,
  d: 0,
}));

function fireTowardNearest(
  world: World,
  weaponId: WeaponId,
  damage: number,
  count: number,
  area: number,
  speed: number,
  pierce: number,
  duration: number,
): void {
  const target = nearestEnemy(world);
  const baseAngle = target
    ? Math.atan2(target.y - world.player.y, target.x - world.player.x)
    : world.player.facing;
  const spread = 0.12;
  for (let i = 0; i < count; i++) {
    const a = baseAngle + (i - (count - 1) / 2) * spread;
    const vx = (Math.cos(a) * speed) / 30;
    const vy = (Math.sin(a) * speed) / 30;
    placeShot(
      world,
      weaponId,
      world.player.x,
      world.player.y,
      vx,
      vy,
      area,
      damage * (i === count - 1 && count > 1 ? 1.4 : 1),
      pierce,
      duration,
      'straight',
      0,
      0,
    );
  }
}

function fireReturn(
  world: World,
  weaponId: WeaponId,
  damage: number,
  count: number,
  area: number,
  speed: number,
  duration: number,
): void {
  for (let i = 0; i < count; i++) {
    const a = world.player.facing + i * 0.4;
    placeShot(
      world,
      weaponId,
      world.player.x,
      world.player.y,
      (Math.cos(a) * speed) / 30,
      (Math.sin(a) * speed) / 30,
      area,
      damage,
      99,
      duration,
      'return',
      world.player.x,
      world.player.y,
    );
  }
}

function fireZone(
  world: World,
  weaponId: WeaponId,
  damage: number,
  area: number,
  duration: number,
  x: number,
  y: number,
  behavior: 'zone' | 'trail',
): void {
  placeShot(world, weaponId, x, y, 0, 0, area, damage, 99, duration, behavior, x, y);
}

function fireNearDense(
  world: World,
  rng: NamedRngStreams,
  weaponId: WeaponId,
  damage: number,
  count: number,
  area: number,
  duration: number,
): void {
  const target = nearestEnemy(world);
  const baseX = target ? target.x : world.player.x + 40;
  const baseY = target ? target.y : world.player.y;
  for (let i = 0; i < count; i++) {
    const jitterX = target ? (rng.spawn.nextFloat() - 0.5) * 40 : 0;
    const jitterY = target ? (rng.spawn.nextFloat() - 0.5) * 40 : 0;
    fireZone(world, weaponId, damage, area, duration, baseX + jitterX, baseY + jitterY, 'zone');
  }
}

let chainWalks = 0;

export function takeChainWalks(): number {
  const count = chainWalks;
  chainWalks = 0;
  return count;
}

function rememberChainTarget(
  enemies: World['enemies']['items'],
  index: number,
  originX: number,
  originY: number,
  reach: number,
  candidates: number,
): number {
  if (candidates >= chainCandidates.length) return candidates;
  const enemy = enemies[index];
  if (!enemy || !enemy.alive) return candidates;
  const d = distSq(originX, originY, enemy.x, enemy.y);
  if (d > reach) return candidates;
  const slot = chainCandidates[candidates]!;
  slot.x = enemy.x;
  slot.y = enemy.y;
  slot.d = d;
  chainCandidates[candidates] = slot;
  return candidates + 1;
}

function fireChain(
  world: World,
  weaponId: WeaponId,
  damage: number,
  count: number,
  area: number,
): void {
  let candidates = 0;
  const enemies = world.enemies.items;
  const reach = area * area;
  if (spatialCurrent(world, world.tick)) {
    world.spatial.query(world.player.x, world.player.y, area, world.queryScratch);
    const near = world.queryScratch;
    for (let i = 0; i < near.length; i++) {
      candidates = rememberChainTarget(enemies, near[i]!, world.player.x, world.player.y, reach, candidates);
    }
  } else {
    chainWalks += 1;
    for (let i = 0; i < enemies.length; i++) {
      candidates = rememberChainTarget(enemies, i, world.player.x, world.player.y, reach, candidates);
    }
  }
  for (let i = 1; i < candidates; i++) {
    const slot = chainCandidates[i]!;
    let j = i - 1;
    while (j >= 0 && chainCandidates[j]!.d > slot.d) {
      chainCandidates[j + 1] = chainCandidates[j]!;
      j -= 1;
    }
    chainCandidates[j + 1] = slot;
  }
  const n = Math.min(count, candidates);
  for (let i = 0; i < n; i++) {
    const c = chainCandidates[i]!;
    placeShot(world, weaponId, c.x, c.y, 0, 0, 18, damage * Math.pow(0.75, i), 1, 3, 'chain', 0, 0);
  }
}

function fireRadial(
  world: World,
  weaponId: WeaponId,
  damage: number,
  count: number,
  area: number,
  speed: number,
  pierce: number,
  duration: number,
): void {
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + world.player.facing;
    placeShot(
      world,
      weaponId,
      world.player.x,
      world.player.y,
      (Math.cos(a) * speed) / 30,
      (Math.sin(a) * speed) / 30,
      area,
      damage,
      pierce,
      duration,
      'straight',
      0,
      0,
    );
  }
}
