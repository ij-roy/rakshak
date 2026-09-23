import { MAP_BY_ID, type GuardianId, type MapId, type MetaTrackId, type RewardContext } from '@rakshak/game-data';
import type { DomainEvent, InputSnapshot, MutableRenderSnapshot, RenderSnapshot } from '@rakshak/game-protocol';
import { createEmptyRenderSnapshot } from '@rakshak/game-protocol';
import { computeChecksum } from './checksum.js';
import { initPlayerFromGuardian } from './combat/stats.js';
import { NamedRngStreams } from './rng/streams.js';
import { systemAi } from './systems/ai.js';
import { systemBossRun } from './systems/boss-run.js';
import { systemDeathsDrops } from './systems/deaths.js';
import { systemBroadphase, systemHits } from './systems/hits.js';
import { systemInput, systemMovement } from './systems/input-movement.js';
import { systemProjectiles } from './systems/projectiles.js';
import { systemSnapshot } from './systems/snapshot.js';
import { systemSpawn } from './systems/spawn.js';
import { systemWeapons } from './systems/weapons.js';
import { systemXpLevel } from './systems/xp.js';
import { World } from './world/world.js';

export interface GameRuntimeConfig {
  readonly seed: number;
  readonly guardianId?: GuardianId;
  readonly mapId?: MapId;
  readonly meta?: Partial<Record<MetaTrackId, number>>;
  readonly rewardContext?: RewardContext;
}

export interface WatchStamp {
  tick: number;
  paused: boolean;
  awaitingChoice: boolean;
  outcome: string;
  level: number;
  rerolls: number;
  choiceId: string;
}

/** Writes the visible watch into `out`. The record stays until the next write. */
export function readWatchStamp(world: World, out: WatchStamp): WatchStamp {
  out.tick = world.tick;
  out.paused = world.run.paused;
  out.awaitingChoice = world.offer.awaitingChoice;
  out.outcome = world.run.outcome;
  out.level = world.run.level;
  out.rerolls = world.offer.rerollsRemaining;
  out.choiceId = world.offer.choices[0]?.contentId ?? '';
  return out;
}

/** A display frame can keep its picture until the tick or the visible watch state changes. */
export function watchChanged(before: WatchStamp, world: World): boolean {
  return (
    before.tick !== world.tick ||
    before.paused !== world.run.paused ||
    before.awaitingChoice !== world.offer.awaitingChoice ||
    before.outcome !== world.run.outcome ||
    before.level !== world.run.level ||
    before.rerolls !== world.offer.rerollsRemaining ||
    before.choiceId !== (world.offer.choices[0]?.contentId ?? '')
  );
}

/**
 * Authoritative fixed-step simulation (30 Hz).
 * Update order: input → movement → spawn → AI → weapons → projectiles →
 * broadphase → hits → deaths/drops → XP/level → boss/run → events → snapshot.
 */
export class GameRuntime {
  readonly world: World;
  readonly rng: NamedRngStreams;
  private lastEvents: DomainEvent[] = [];

  constructor(config: GameRuntimeConfig) {
    this.world = new World();
    this.world.seed = config.seed >>> 0;
    this.rng = new NamedRngStreams(this.world.seed);
    const mapId = config.mapId ?? 'gaon';
    const map = MAP_BY_ID[mapId];
    this.world.mapId = mapId;
    this.world.mapWidth = map.width;
    this.world.mapHeight = map.height;
    initPlayerFromGuardian(this.world, config.guardianId ?? 'asha', config.meta ?? {});
    if (config.rewardContext) this.world.rewardContext = config.rewardContext;
  }

  get tick(): number {
    return this.world.tick;
  }

  step(input: InputSnapshot): readonly DomainEvent[] {
    this.world.clearEvents();
    systemInput(this.world, input);

    const frozen =
      this.world.run.paused ||
      this.world.offer.awaitingChoice ||
      this.world.run.outcome !== 'ongoing';

    if (!frozen) {
      this.world.tick++;
      systemMovement(this.world);
      systemSpawn(this.world, this.rng);
      systemAi(this.world);
      systemWeapons(this.world, this.rng);
      systemProjectiles(this.world);
      systemBroadphase(this.world);
      systemHits(this.world);
      systemDeathsDrops(this.world, this.rng);
      systemBossRun(this.world);
    }

    // XP/level and offer resolution always process (offers use confirm/cancel).
    if (this.world.run.outcome === 'ongoing') {
      systemXpLevel(this.world, this.rng);
    }

    this.lastEvents = this.world.events;
    return this.lastEvents;
  }

  snapshot(out: MutableRenderSnapshot = createEmptyRenderSnapshot()): RenderSnapshot {
    systemSnapshot(this.world, out);
    return out;
  }

  checksum(): bigint {
    return computeChecksum(this.world);
  }
}
