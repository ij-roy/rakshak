import { describe, expect, it } from 'vitest';
import { BALANCE, xpToNextLevel } from '@rakshak/game-data';
import { EMPTY_INPUT } from '@rakshak/game-protocol';
import { NamedRngStreams } from '../rng/streams.js';
import { GameRuntime } from '../runtime.js';
import { World } from '../world/world.js';
import { dropXp, systemXpLevel } from './xp.js';

describe('XP leveling', () => {
  it('levels when XP threshold crossed', () => {
    const rt = new GameRuntime({ seed: 7, guardianId: 'asha', mapId: 'gaon' });
    expect(rt.world.run.level).toBe(1);
    const need = xpToNextLevel(1);
    rt.world.run.xp = need;
    // Drive offer resolution path without combat via step while paused? inject via pickup collect.
    // Directly call system by stepping with forced XP and skip enemies.
    rt.world.director.spawnFreeze = true;
    rt.world.run.xp = need;
    // Manually trigger level via step — systemXpLevel runs each step.
    rt.step({ ...EMPTY_INPUT });
    expect(rt.world.run.level).toBe(2);
    expect(rt.world.offer.awaitingChoice).toBe(true);
    expect(rt.world.offer.choices).toHaveLength(3);
  });

  it('resolves successive level-up offers with the same confirm encoding mobile uses', () => {
    const rt = new GameRuntime({ seed: 11, guardianId: 'asha', mapId: 'gaon' });
    rt.world.director.spawnFreeze = true;
    const choose = (index: 0 | 1 | 2) => {
      rt.step({
        moveX: index === 0 ? -1 : index === 2 ? 1 : 0,
        moveY: 0,
        pause: false,
        confirm: true,
        cancel: false,
      });
    };
    rt.world.run.xp = xpToNextLevel(rt.world.run.level);
    rt.step(EMPTY_INPUT);
    expect(rt.world.offer.awaitingChoice).toBe(true);
    const first = rt.world.offer.choices[0]!.contentId;
    choose(0);
    expect(rt.world.offer.awaitingChoice).toBe(false);
    expect(
      rt.world.weapons.some((w) => w.weaponId === first) ||
        rt.world.passives.some((p) => p.passiveId === first),
    ).toBe(true);

    rt.world.run.xp = xpToNextLevel(rt.world.run.level);
    rt.step(EMPTY_INPUT);
    expect(rt.world.offer.awaitingChoice).toBe(true);
    const beforeReroll = rt.world.offer.choices.map((c) => c.contentId).join(',');
    rt.step({ ...EMPTY_INPUT, cancel: true });
    expect(rt.world.offer.awaitingChoice).toBe(true);
    expect(rt.world.offer.rerollsRemaining).toBe(0);
    expect(rt.world.offer.choices.map((c) => c.contentId).join(',')).not.toBe('');
    void beforeReroll;
    choose(1);
    expect(rt.world.offer.awaitingChoice).toBe(false);
    expect(rt.world.run.level).toBe(3);
  });

  it('folds a full pile of XP and keeps every point', () => {
    const world = new World();
    for (let i = 0; i < 400; i++) {
      world.pickups.acquire((pickup) => {
        pickup.kind = 'xp';
        pickup.x = 0;
        pickup.y = 0;
        pickup.amount = 1;
        pickup.magnetized = false;
      });
    }
    world.pickups.acquire((pickup) => {
      pickup.kind = 'xp';
      pickup.x = 500;
      pickup.y = 500;
      pickup.amount = 3;
      pickup.magnetized = false;
    });
    world.pickups.acquire((pickup) => {
      pickup.kind = 'heal';
      pickup.x = 0;
      pickup.y = 0;
      pickup.amount = 4;
      pickup.magnetized = false;
    });
    dropXp(world, 0, 0, 7);
    let xp = 0;
    let xpCount = 0;
    let heal = 0;
    let far = 0;
    world.pickups.forEachAlive((pickup) => {
      if (pickup.kind === 'heal') heal += 1;
      if (pickup.kind !== 'xp') return;
      xp += pickup.amount;
      xpCount += 1;
      if (pickup.x === 500) far = pickup.amount;
    });
    expect(xp).toBe(410);
    expect(xpCount).toBeLessThanOrEqual(400);
    expect(far).toBe(3);
    expect(heal).toBe(1);
  });

  it('folds one piled burst without losing the later drops', () => {
    const world = new World();
    for (let i = 0; i < 400; i++) {
      world.pickups.acquire((pickup) => {
        pickup.kind = 'xp';
        pickup.x = 10;
        pickup.y = 10;
        pickup.amount = 1;
        pickup.magnetized = false;
      });
    }
    for (let i = 0; i < 30; i++) dropXp(world, 10, 10, 1);
    let xp = 0;
    let xpCount = 0;
    world.pickups.forEachAlive((pickup) => {
      if (pickup.kind !== 'xp') return;
      xp += pickup.amount;
      xpCount += 1;
    });
    expect(xp).toBe(430);
    expect(xpCount).toBeLessThanOrEqual(400);
  });

  it('adds a drop to an existing gem when every slot is already full', () => {
    const world = new World();
    const step = BALANCE.spatialCellSize;
    for (let i = 0; i < BALANCE.maxPickups; i++) {
      world.pickups.acquire((pickup) => {
        pickup.kind = 'xp';
        pickup.x = i * step;
        pickup.y = 0;
        pickup.amount = 1;
        pickup.magnetized = false;
      });
    }
    const before = world.pickups.activeCount;
    dropXp(world, 0, 0, 9);
    let xp = 0;
    let xpCount = 0;
    world.pickups.forEachAlive((pickup) => {
      if (pickup.kind !== 'xp') return;
      xp += pickup.amount;
      xpCount += 1;
    });
    expect(before).toBe(BALANCE.maxPickups);
    expect(xp).toBe(BALANCE.maxPickups + 9);
    expect(xpCount).toBe(BALANCE.maxPickups);
  });

  it('collects a gem in reach and pulls a farther gem closer', () => {
    const world = new World();
    world.player.pickupRadius = 40;
    world.pickups.acquire((pickup) => {
      pickup.kind = 'xp';
      pickup.x = 10;
      pickup.y = 0;
      pickup.amount = 5;
      pickup.magnetized = false;
    });
    world.pickups.acquire((pickup) => {
      pickup.kind = 'xp';
      pickup.x = 0;
      pickup.y = 0;
      pickup.amount = 2;
      pickup.magnetized = true;
    });
    world.pickups.acquire((pickup) => {
      pickup.kind = 'xp';
      pickup.x = 70;
      pickup.y = 0;
      pickup.amount = 3;
      pickup.magnetized = false;
    });
    world.pickups.acquire((pickup) => {
      pickup.kind = 'xp';
      pickup.x = 500;
      pickup.y = 0;
      pickup.amount = 1;
      pickup.magnetized = false;
    });
    systemXpLevel(world, new NamedRngStreams(1));
    expect(world.run.xp).toBe(7);
    let near = 0;
    let far = 0;
    world.pickups.forEachAlive((pickup) => {
      if (pickup.x > 400) far = pickup.x;
      else near = pickup.x;
    });
    expect(far).toBe(500);
    expect(near).toBeLessThan(70);
    expect(near).toBeGreaterThan(24);
  });

  it('collects a later gem after an earlier gem is already gone', () => {
    const world = new World();
    world.player.pickupRadius = 40;
    const gone = world.pickups.acquire((pickup) => {
      pickup.kind = 'xp';
      pickup.x = 10;
      pickup.y = 0;
      pickup.amount = 9;
      pickup.magnetized = false;
    });
    if (gone) world.pickups.release(gone);
    world.pickups.acquire((pickup) => {
      pickup.kind = 'xp';
      pickup.x = 8;
      pickup.y = 0;
      pickup.amount = 4;
      pickup.magnetized = false;
    });
    systemXpLevel(world, new NamedRngStreams(1));
    expect(world.run.xp).toBe(4);
  });

  it('xpToNextLevel increases with level', () => {
    expect(xpToNextLevel(2)).toBeGreaterThan(xpToNextLevel(1));
    expect(xpToNextLevel(10)).toBeGreaterThan(xpToNextLevel(5));
  });
});
