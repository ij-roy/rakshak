import { xpToNextLevel } from '@rakshak/game-data';
import {
  silhouetteFor,
  silhouetteTint,
  type LevelChoiceHud,
  type MutableRenderSnapshot,
  type SlotHud,
  type SpriteInstance,
} from '@rakshak/game-protocol';
import { HEAL_TINT, HURT_TINT } from '../combat/feedback.js';
import { fillFieldMarks } from './field.js';
import { pushThreatTelegraphs } from './threats.js';
import type { World } from '../world/world.js';

const spritePools = new WeakMap<MutableRenderSnapshot, SpriteInstance[]>();
const headingPools = new WeakMap<MutableRenderSnapshot, { vx: number; vy: number; facing: number }[]>();
const damageText = new Map<number, string>();
let headingComputes = 0;

function spritePool(out: MutableRenderSnapshot): SpriteInstance[] {
  let pool = spritePools.get(out);
  if (!pool) {
    pool = [];
    spritePools.set(out, pool);
  }
  return pool;
}

function headingPool(out: MutableRenderSnapshot): { vx: number; vy: number; facing: number }[] {
  let pool = headingPools.get(out);
  if (!pool) {
    pool = [];
    headingPools.set(out, pool);
  }
  return pool;
}

/** Reuses the last heading when velocity has not changed. */
export function headingFor(
  pool: { vx: number; vy: number; facing: number }[],
  index: number,
  vx: number,
  vy: number,
): number {
  const slot = pool[index];
  if (slot && slot.vx === vx && slot.vy === vy) return slot.facing;
  const facing = Math.atan2(vy, vx);
  headingComputes += 1;
  if (slot) {
    slot.vx = vx;
    slot.vy = vy;
    slot.facing = facing;
    return facing;
  }
  pool[index] = { vx, vy, facing };
  return facing;
}

export function takeHeadingComputes(): number {
  const count = headingComputes;
  headingComputes = 0;
  return count;
}

let tintComputes = 0;

function applySpriteTint(sprite: SpriteInstance, kind: SpriteInstance['kind'], contentId: string): void {
  if (sprite.kind !== kind || sprite.contentId !== contentId) {
    tintComputes += 1;
    sprite.tint = silhouetteTint(silhouetteFor(kind, contentId));
  }
  sprite.kind = kind;
  sprite.contentId = contentId;
}

export function takeTintComputes(): number {
  const count = tintComputes;
  tintComputes = 0;
  return count;
}

function claimSprite(pool: SpriteInstance[], index: number): SpriteInstance {
  const existing = pool[index];
  if (existing) return existing;
  const created: SpriteInstance = {
    entityId: 0,
    kind: 'particle',
    contentId: '',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 0,
    facing: 0,
    tint: 0,
    alpha: 1,
    frame: 0,
    hp: 0,
    maxHp: 0,
  };
  pool[index] = created;
  return created;
}

function damageLabel(amount: number): string {
  const shown = Math.round(amount);
  const cached = damageText.get(shown);
  if (cached) return cached;
  const text = String(shown);
  damageText.set(shown, text);
  return text;
}

export function systemSnapshot(world: World, out: MutableRenderSnapshot): void {
  out.tick = world.tick;
  out.seed = world.seed;
  out.mapId = world.mapId;
  out.mapWidth = world.mapWidth;
  out.mapHeight = world.mapHeight;
  fillFieldMarks(world, out.field);
  out.camera.x = world.player.x;
  out.camera.y = world.player.y;
  out.camera.zoom = 1;

  const pool = spritePool(out);
  const headings = headingPool(out);
  let n = 0;
  let bossHp = 0;
  let bossMax = 0;
  let bossId: string | null = null;
  const player = claimSprite(pool, n);
  n += 1;
  player.entityId = 0;
  applySpriteTint(player, 'player', world.guardianId);
  player.x = world.player.x;
  player.y = world.player.y;
  player.vx = world.player.vx;
  player.vy = world.player.vy;
  player.radius = world.player.radius;
  player.facing = world.player.facing;
  player.alpha = world.tick < world.player.invulnUntil ? 0.6 : 1;
  player.frame = 0;
  player.hp = world.player.hp;
  player.maxHp = world.player.maxHp;

  const enemies = world.enemies.items;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (!e.alive) continue;
    const kind = e.kind === 'boss' ? 'boss' : e.kind === 'elite' ? 'elite' : 'enemy';
    const sprite = claimSprite(pool, n);
    n += 1;
    sprite.entityId = e.id;
    applySpriteTint(sprite, kind, e.contentId);
    sprite.x = e.x;
    sprite.y = e.y;
    sprite.vx = e.vx;
    sprite.vy = e.vy;
    sprite.radius = e.radius;
    sprite.facing = headingFor(headings, n, e.vx, e.vy);
    sprite.alpha = 1;
    sprite.frame = 0;
    sprite.hp = e.hp;
    sprite.maxHp = e.maxHp;
    if (e.kind === 'boss') {
      bossHp = e.hp;
      bossMax = e.maxHp;
      bossId = e.contentId;
    }
  }

  const projectiles = world.projectiles.items;
  for (let i = 0; i < projectiles.length; i++) {
    const p = projectiles[i]!;
    if (!p.alive) continue;
    const sprite = claimSprite(pool, n);
    n += 1;
    sprite.entityId = p.id;
    applySpriteTint(sprite, 'projectile', p.weaponId);
    sprite.x = p.x;
    sprite.y = p.y;
    sprite.vx = p.vx;
    sprite.vy = p.vy;
    sprite.radius = p.radius;
    sprite.facing = headingFor(headings, n, p.vx, p.vy);
    sprite.alpha = 0.9;
    sprite.frame = 0;
    sprite.hp = 0;
    sprite.maxHp = 0;
  }

  const particles = world.particles.items;
  for (let i = 0; i < particles.length; i++) {
    const pt = particles[i]!;
    if (!pt.alive) continue;
    const contentId = pt.tint === HEAL_TINT ? 'heal' : pt.tint === HURT_TINT ? 'hurt' : 'spark';
    const sprite = claimSprite(pool, n);
    n += 1;
    sprite.entityId = pt.id;
    sprite.kind = 'particle';
    sprite.contentId = contentId;
    sprite.x = pt.x;
    sprite.y = pt.y;
    sprite.vx = pt.vx;
    sprite.vy = pt.vy;
    sprite.radius = contentId === 'hurt' ? 16 : 5;
    sprite.facing = headingFor(headings, n, pt.vx, pt.vy);
    sprite.tint = pt.tint;
    sprite.alpha = Math.max(0.35, Math.min(1, pt.lifeTicks / 12));
    sprite.frame = 0;
    sprite.hp = 0;
    sprite.maxHp = 0;
  }

  const labels = world.damageLabels.items;
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i]!;
    if (!label.alive) continue;
    const sprite = claimSprite(pool, n);
    n += 1;
    sprite.entityId = label.id;
    sprite.kind = 'damage_label';
    sprite.contentId = damageLabel(label.amount);
    sprite.x = label.x;
    sprite.y = label.y;
    sprite.vx = 0;
    sprite.vy = -0.6;
    sprite.radius = 8;
    sprite.facing = 0;
    sprite.tint = label.critical ? 0xd65332 : 0xe5d2a6;
    sprite.alpha = Math.max(0.4, Math.min(1, label.lifeTicks / 10));
    sprite.frame = 0;
    sprite.hp = label.amount;
    sprite.maxHp = 0;
  }

  const pickups = world.pickups.items;
  for (let i = 0; i < pickups.length; i++) {
    const p = pickups[i]!;
    if (!p.alive) continue;
    const sprite = claimSprite(pool, n);
    n += 1;
    sprite.entityId = p.id;
    applySpriteTint(sprite, 'pickup', p.kind);
    sprite.x = p.x;
    sprite.y = p.y;
    sprite.vx = 0;
    sprite.vy = 0;
    sprite.radius = 8;
    sprite.facing = 0;
    sprite.alpha = 1;
    sprite.frame = 0;
    sprite.hp = 0;
    sprite.maxHp = 0;
  }

  for (let i = 0; i < n; i++) out.sprites[i] = pool[i]!;
  out.sprites.length = n;

  out.telegraphs.length = 0;
  pushThreatTelegraphs(world, out.telegraphs);
  const hud = out.hud;
  hud.hp = world.player.hp;
  hud.maxHp = world.player.maxHp;
  hud.xp = world.run.xp;
  hud.xpToNext = xpToNextLevel(world.run.level);
  hud.level = world.run.level;
  hud.tick = world.tick;
  hud.survivalSeconds = world.tick / 30;
  hud.kills = world.run.kills;
  hud.guardianMarks = world.run.guardianMarksEarned;
  hud.paused = world.run.paused;
  hud.awaitingLevelChoice = world.offer.awaitingChoice;
  hud.rerollsRemaining = world.offer.rerollsRemaining;
  hud.bossHp = bossHp;
  hud.bossMaxHp = bossMax;
  hud.bossId = bossId;
  hud.runOutcome = world.run.outcome;
  const weapons = hud.weaponSlots as SlotHud[];
  for (let i = 0; i < world.weapons.length; i++) {
    const source = world.weapons[i]!;
    const slot = weapons[i];
    if (slot) {
      slot.contentId = source.weaponId;
      slot.level = source.level;
      slot.evolved = source.evolved;
    } else {
      weapons[i] = { contentId: source.weaponId, level: source.level, evolved: source.evolved };
    }
  }
  weapons.length = world.weapons.length;
  const passives = hud.passiveSlots as SlotHud[];
  for (let i = 0; i < world.passives.length; i++) {
    const source = world.passives[i]!;
    const slot = passives[i];
    if (slot) {
      slot.contentId = source.passiveId;
      slot.level = source.level;
      slot.evolved = false;
    } else {
      passives[i] = { contentId: source.passiveId, level: source.level, evolved: false };
    }
  }
  passives.length = world.passives.length;
  const choices = hud.levelChoices as LevelChoiceHud[];
  const offered = world.offer.choices;
  for (let i = 0; i < offered.length; i++) {
    const source = offered[i]!;
    const slot = choices[i];
    if (slot) {
      slot.contentId = source.contentId;
      slot.kind = source.kind;
      slot.currentLevel = source.currentLevel;
      slot.nextLevel = source.nextLevel;
    } else {
      choices[i] = {
        contentId: source.contentId,
        kind: source.kind,
        currentLevel: source.currentLevel,
        nextLevel: source.nextLevel,
      };
    }
  }
  choices.length = offered.length;
}
