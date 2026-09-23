import {
  BALANCE,
  EVOLUTION_BY_WEAPON,
  PASSIVE_IDS,
  WEAPON_IDS,
  type PassiveId,
  type WeaponId,
} from '@rakshak/game-data';
import type { LevelOfferChoice } from '@rakshak/game-protocol';
import { recomputeDerivedStats } from '../combat/stats.js';
import type { NamedRngStreams } from '../rng/streams.js';
import type { World } from '../world/world.js';

export function generateLevelOffers(world: World, rng: NamedRngStreams): LevelOfferChoice[] {
  const pool = buildEligiblePool(world);
  const forceOwned = world.offer.badLuckStreak >= BALANCE.badLuckProtectionStreak;
  const choices: LevelOfferChoice[] = [];
  const used = new Set<string>();

  if (forceOwned) {
    const owned = pool.filter((c) => c.currentLevel > 0);
    if (owned.length > 0) {
      const pick = rng.upgrade.pick(owned);
      choices.push(pick);
      used.add(pick.contentId);
    }
  }

  // Evolution offer weight after minute 4
  if (world.tick / 30 >= 240 && rng.upgrade.nextFloat() < 0.15) {
    const evo = findReadyEvolution(world);
    if (evo && !used.has(evo.contentId)) {
      choices.push(evo);
      used.add(evo.contentId);
    }
  }

  let guard = 40;
  while (choices.length < BALANCE.levelOfferCount && guard-- > 0) {
    const remaining = pool.filter((c) => !used.has(c.contentId));
    if (remaining.length === 0) break;
    const pick = rng.upgrade.pick(remaining);
    choices.push(pick);
    used.add(pick.contentId);
  }

  // Pad with any leftover unique
  while (choices.length < BALANCE.levelOfferCount) {
    const filler = pool.find((c) => !used.has(c.contentId));
    if (!filler) break;
    choices.push(filler);
    used.add(filler.contentId);
  }

  const hasOwnedUpgrade = choices.some((c) => c.currentLevel > 0);
  if (hasOwnedUpgrade) world.offer.badLuckStreak = 0;
  else world.offer.badLuckStreak++;

  return choices;
}

function findReadyEvolution(world: World): LevelOfferChoice | null {
  for (const w of world.weapons) {
    if (w.level < 8 || w.evolved) continue;
    const evo = EVOLUTION_BY_WEAPON[w.weaponId];
    if (!evo) continue;
    if (!world.passives.some((p) => p.passiveId === evo.requiredPassive)) continue;
    if (!world.offer.chestEvolutionReady) continue;
    return {
      contentId: evo.id,
      kind: 'evolution',
      currentLevel: 0,
      nextLevel: 1,
    };
  }
  return null;
}

function buildEligiblePool(world: World): LevelOfferChoice[] {
  const out: LevelOfferChoice[] = [];

  for (const w of world.weapons) {
    if (w.level < 8) {
      out.push({
        contentId: w.weaponId,
        kind: 'weapon',
        currentLevel: w.level,
        nextLevel: w.level + 1,
      });
    }
  }
  if (world.weapons.length < BALANCE.maxWeaponSlots) {
    for (const id of WEAPON_IDS) {
      if (world.weapons.some((w) => w.weaponId === id)) continue;
      out.push({ contentId: id, kind: 'weapon', currentLevel: 0, nextLevel: 1 });
    }
  }

  for (const p of world.passives) {
    if (p.level < 5) {
      out.push({
        contentId: p.passiveId,
        kind: 'passive',
        currentLevel: p.level,
        nextLevel: p.level + 1,
      });
    }
  }
  if (world.passives.length < BALANCE.maxPassiveSlots) {
    for (const id of PASSIVE_IDS) {
      if (world.passives.some((p) => p.passiveId === id)) continue;
      out.push({ contentId: id, kind: 'passive', currentLevel: 0, nextLevel: 1 });
    }
  }

  return out;
}

export function applyOfferChoice(world: World, choice: LevelOfferChoice): void {
  if (choice.kind === 'weapon') {
    const existing = world.weapons.find((w) => w.weaponId === choice.contentId);
    if (existing) {
      existing.level = Math.min(8, existing.level + 1);
    } else if (world.weapons.length < BALANCE.maxWeaponSlots) {
      world.weapons.push({
        weaponId: choice.contentId as WeaponId,
        level: 1,
        cooldown: 0,
        evolved: false,
        evolutionId: null,
      });
    }
  } else if (choice.kind === 'passive') {
    const existing = world.passives.find((p) => p.passiveId === choice.contentId);
    if (existing) {
      existing.level = Math.min(5, existing.level + 1);
    } else if (world.passives.length < BALANCE.maxPassiveSlots) {
      world.passives.push({
        passiveId: choice.contentId as PassiveId,
        level: 1,
      });
    }
    recomputeDerivedStats(world);
  } else if (choice.kind === 'evolution') {
    world.offer.chestEvolutionReady = true;
    for (const w of world.weapons) {
      const evo = EVOLUTION_BY_WEAPON[w.weaponId];
      if (evo && evo.id === choice.contentId) {
        w.evolved = true;
        w.evolutionId = evo.id;
        world.pushEvent({
          kind: 'evolution_unlocked',
          tick: world.tick,
          evolutionId: evo.id,
        });
      }
    }
  }

  world.pushEvent({
    kind: 'upgrade_chosen',
    tick: world.tick,
    contentId: choice.contentId,
    level: choice.nextLevel,
  });
}

export function tryRerollOffers(world: World, rng: NamedRngStreams): void {
  if (world.offer.rerollsRemaining <= 0) return;
  world.offer.rerollsRemaining--;
  world.offer.choices = generateLevelOffers(world, rng);
  world.pushEvent({
    kind: 'level_offer',
    tick: world.tick,
    choices: world.offer.choices,
    rerollsRemaining: world.offer.rerollsRemaining,
  });
}
