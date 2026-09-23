import { BALANCE, xpToNextLevel } from '@rakshak/game-data';
import { SIM_HZ } from '@rakshak/shared';
import { noteHeal, notePickupTrail } from '../combat/feedback.js';
import { tryMarkEvolution } from '../combat/stats.js';
import type { World } from '../world/world.js';
import { generateLevelOffers, applyOfferChoice, tryRerollOffers } from './offers.js';
import type { NamedRngStreams } from '../rng/streams.js';

const XP_FIELD_LIMIT = 400;
const keepers = new Map<number, number>();
const combinedOn = new WeakMap<World, number>();

function cellKey(x: number, y: number): number {
  return Math.floor(x / BALANCE.spatialCellSize) * 100_003 + Math.floor(y / BALANCE.spatialCellSize);
}

/** Nearby XP gems fold together above the field limit. The summed value stays collectable. */
export function combineNearbyXp(world: World): void {
  if (world.pickups.activeCount <= XP_FIELD_LIMIT) return;
  keepers.clear();
    const pickups = world.pickups.items;
    const live = world.pickups.liveIndexes();
    let cursor = 0;
    while (cursor < live.length) {
      const index = live[cursor]!;
      const pickup = pickups[index]!;
      if (pickup.kind !== 'xp') {
        cursor += 1;
        continue;
      }
      const key = cellKey(pickup.x, pickup.y);
      const keeper = keepers.get(key);
      const host = keeper === undefined ? undefined : pickups[keeper];
      if (keeper === undefined || !host || !host.alive || host.kind !== 'xp') {
        keepers.set(key, index);
        cursor += 1;
        continue;
      }
      host.amount += pickup.amount;
      world.pickups.releaseAt(index);
    }
}

function spawnXp(world: World, x: number, y: number, amount: number): boolean {
  const pickup = world.pickups.take();
  if (!pickup) return false;
  pickup.kind = 'xp';
  pickup.x = x;
  pickup.y = y;
  pickup.amount = amount;
  pickup.magnetized = false;
  return true;
}

function combineOnceThisTick(world: World): void {
  if (combinedOn.get(world) === world.tick) return;
  combinedOn.set(world, world.tick);
  combineNearbyXp(world);
}

/** Drops XP, folding nearby gems once per tick so a full field does not discard the value. */
export function dropXp(world: World, x: number, y: number, amount: number): void {
  if (world.pickups.activeCount > XP_FIELD_LIMIT) combineOnceThisTick(world);
  if (spawnXp(world, x, y, amount)) return;
  combineOnceThisTick(world);
  if (spawnXp(world, x, y, amount)) return;
  const pickups = world.pickups.items;
  for (let index = 0; index < pickups.length; index++) {
    const pickup = pickups[index]!;
    if (!pickup.alive || pickup.kind !== 'xp') continue;
    pickup.amount += amount;
    return;
  }
}

export function systemXpLevel(world: World, rng: NamedRngStreams): void {
  if (world.run.outcome !== 'ongoing') return;

  // Pickup magnet / collect
  if (!world.run.paused && !world.offer.awaitingChoice) {
    const magnetR = world.player.pickupRadius;
    const pickups = world.pickups.items;
    const magnetRange = magnetR * magnetR * 4;
    const collectR = world.player.radius + 10;
    const collectR2 = collectR * collectR;
    const step = BALANCE.xpMagnetSpeed / SIM_HZ;
    const live = world.pickups.liveIndexes();
    let cursor = 0;
    while (cursor < live.length) {
      const index = live[cursor]!;
      const pickup = pickups[index]!;
      const dx = world.player.x - pickup.x;
      const dy = world.player.y - pickup.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < magnetRange) pickup.magnetized = true;
      if (pickup.magnetized && d2 > 0) {
        const len = Math.sqrt(d2);
        const scale = step / len;
        pickup.x += dx * scale;
        pickup.y += dy * scale;
        notePickupTrail(world, pickup.x, pickup.y);
        const remain = len - step;
        d2 = remain * remain;
      }
      if (d2 <= collectR2) {
        collectPickup(world, pickup.kind, pickup.amount);
        world.pickups.releaseAt(index);
        continue;
      }
      cursor += 1;
    }
    combineNearbyXp(world);
  }

  // Level-ups from pending XP
  while (world.run.xp >= xpToNextLevel(world.run.level)) {
    world.run.xp -= xpToNextLevel(world.run.level);
    world.run.level++;
    world.offer.pendingLevels++;
    world.pushEvent({ kind: 'level_up', tick: world.tick, level: world.run.level });
  }

  if (world.offer.pendingLevels > 0 && !world.offer.awaitingChoice) {
    world.offer.awaitingChoice = true;
    world.offer.choices = generateLevelOffers(world, rng);
    world.pushEvent({
      kind: 'level_offer',
      tick: world.tick,
      choices: world.offer.choices,
      rerollsRemaining: world.offer.rerollsRemaining,
    });
  }

  if (world.offer.awaitingChoice) {
    // cancel = reroll
    if (world.input.cancel && world.offer.rerollsRemaining > 0) {
      tryRerollOffers(world, rng);
      world.input = { ...world.input, cancel: false };
    }
    // confirm selects choice by moveX bands: -1..-0.33 = 0, -0.33..0.33 = 1, 0.33..1 = 2
    if (world.input.confirm && world.offer.choices.length > 0) {
      let idx = 1;
      if (world.input.moveX < -0.33) idx = 0;
      else if (world.input.moveX > 0.33) idx = 2;
      idx = Math.min(idx, world.offer.choices.length - 1);
      const choice = world.offer.choices[idx]!;
      applyOfferChoice(world, choice);
      world.offer.pendingLevels = Math.max(0, world.offer.pendingLevels - 1);
      world.offer.awaitingChoice = false;
      world.offer.choices = [];
      world.input = { ...world.input, confirm: false };
      // Check evolution after upgrade
      for (const w of world.weapons) tryMarkEvolution(world, w);
    }
  }
}

function collectPickup(world: World, kind: 'xp' | 'heal' | 'chest' | 'magnet', amount: number): void {
  world.emitPickupCollected(kind, amount);
  if (kind === 'xp') {
    world.run.xp += amount;
    world.emitXpGained(amount, world.run.xp);
  } else if (kind === 'heal') {
    world.player.hp = Math.min(world.player.maxHp, world.player.hp + amount);
    noteHeal(world);
  } else if (kind === 'chest') {
    world.offer.chestEvolutionReady = true;
    for (const w of world.weapons) tryMarkEvolution(world, w);
  } else if (kind === 'magnet') {
    const pickups = world.pickups.items;
    for (let index = 0; index < pickups.length; index++) {
      const pickup = pickups[index]!;
      if (pickup.alive && pickup.kind === 'xp') pickup.magnetized = true;
    }
  }
}
