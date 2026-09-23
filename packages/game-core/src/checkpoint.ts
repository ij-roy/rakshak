import { CONTENT_VERSION } from '@rakshak/shared';
import type { GuardianId, MapId } from '@rakshak/game-data';
import type { GameRuntime } from './runtime.js';
import type { EnemyEntity, PickupEntity, ProjectileEntity } from './world/world.js';

export type CheckpointReason = 'pause' | 'background' | 'boss' | 'quit';

export interface ProjectileCheckpoint extends Omit<ProjectileEntity, 'hitIds'> {
  hitIds: number[];
}

export interface RunCheckpointV1 {
  schemaVersion: 1;
  contentVersion: string;
  reason: CheckpointReason;
  resumeCount: number;
  seed: number;
  guardianId: GuardianId;
  mapId: MapId;
  tick: number;
  mapWidth: number;
  mapHeight: number;
  player: GameRuntime['world']['player'];
  weapons: GameRuntime['world']['weapons'];
  passives: GameRuntime['world']['passives'];
  director: GameRuntime['world']['director'];
  offer: GameRuntime['world']['offer'];
  run: GameRuntime['world']['run'];
  rng: {
    spawn: [number, number, number, number];
    upgrade: [number, number, number, number];
    loot: [number, number, number, number];
    cosmetic: [number, number, number, number];
  };
  enemies: EnemyEntity[];
  projectiles: ProjectileCheckpoint[];
  pickups: PickupEntity[];
  enemyNextId: number;
  projectileNextId: number;
  pickupNextId: number;
  checksum: string;
}

type CheckpointBody = Omit<RunCheckpointV1, 'checksum'>;

function streamState(state: readonly [number, number, number, number]): [number, number, number, number] {
  return [state[0] >>> 0, state[1] >>> 0, state[2] >>> 0, state[3] >>> 0];
}

function checksumOf(body: CheckpointBody): string {
  const json = JSON.stringify(body);
  let hash = 2166136261;
  for (let i = 0; i < json.length; i += 1) {
    hash ^= json.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

function bodyFrom(runtime: GameRuntime, reason: CheckpointReason, resumeCount: number): CheckpointBody {
  const { world, rng } = runtime;
  const enemies: EnemyEntity[] = [];
  world.enemies.forEachAlive((enemy) => {
    enemies.push({ ...enemy });
  });
  const projectiles: ProjectileCheckpoint[] = [];
  world.projectiles.forEachAlive((shot) => {
    projectiles.push({ ...shot, hitIds: [...shot.hitIds] });
  });
  const pickups: PickupEntity[] = [];
  world.pickups.forEachAlive((pickup) => {
    pickups.push({ ...pickup });
  });
  return {
    schemaVersion: 1,
    contentVersion: CONTENT_VERSION,
    reason,
    resumeCount,
    seed: world.seed >>> 0,
    guardianId: world.guardianId,
    mapId: world.mapId,
    tick: world.tick,
    mapWidth: world.mapWidth,
    mapHeight: world.mapHeight,
    player: { ...world.player },
    weapons: world.weapons.map((slot) => ({ ...slot })),
    passives: world.passives.map((slot) => ({ ...slot })),
    director: { ...world.director },
    offer: {
      ...world.offer,
      choices: world.offer.choices.map((choice) => ({ ...choice })),
    },
    run: { ...world.run, seenEnemies: [...world.run.seenEnemies], seenBosses: [...world.run.seenBosses], pauseEdge: false },
    rng: {
      spawn: streamState(rng.spawn.getState()),
      upgrade: streamState(rng.upgrade.getState()),
      loot: streamState(rng.loot.getState()),
      cosmetic: streamState(rng.cosmetic.getState()),
    },
    enemies,
    projectiles,
    pickups,
    enemyNextId: world.enemies.peekNextId(),
    projectileNextId: world.projectiles.peekNextId(),
    pickupNextId: world.pickups.peekNextId(),
  };
}

export function captureRunCheckpoint(
  runtime: GameRuntime,
  reason: CheckpointReason,
  resumeCount = 0,
): RunCheckpointV1 {
  const body = bodyFrom(runtime, reason, resumeCount);
  return { ...body, checksum: checksumOf(body) };
}

export function parseRunCheckpoint(raw: unknown): RunCheckpointV1 | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Partial<RunCheckpointV1>;
  if (record.schemaVersion !== 1 || record.contentVersion !== CONTENT_VERSION) return null;
  if (record.run?.outcome !== 'ongoing') return null;
  if (typeof record.checksum !== 'string' || typeof record.seed !== 'number') return null;
  const { checksum, ...body } = record as RunCheckpointV1;
  if (checksumOf(body) !== checksum) return null;
  return record as RunCheckpointV1;
}

export function applyRunCheckpoint(runtime: GameRuntime, checkpoint: RunCheckpointV1): void {
  const world = runtime.world;
  world.seed = checkpoint.seed >>> 0;
  world.guardianId = checkpoint.guardianId;
  world.mapId = checkpoint.mapId;
  world.mapWidth = checkpoint.mapWidth;
  world.mapHeight = checkpoint.mapHeight;
  world.tick = checkpoint.tick;
  Object.assign(world.player, checkpoint.player);
  world.weapons = checkpoint.weapons.map((slot) => ({ ...slot }));
  world.passives = checkpoint.passives.map((slot) => ({ ...slot }));
  Object.assign(world.director, checkpoint.director);
  world.offer = {
    ...checkpoint.offer,
    choices: checkpoint.offer.choices.map((choice) => ({ ...choice })),
  };
  world.run = {
    ...checkpoint.run,
    seenEnemies: [...checkpoint.run.seenEnemies],
    seenBosses: [...checkpoint.run.seenBosses],
    paused: true,
    pauseEdge: false,
    outcome: 'ongoing',
  };
  runtime.rng.spawn.setState(checkpoint.rng.spawn);
  runtime.rng.upgrade.setState(checkpoint.rng.upgrade);
  runtime.rng.loot.setState(checkpoint.rng.loot);
  runtime.rng.cosmetic.setState(checkpoint.rng.cosmetic);
  world.enemies.replaceAlive(checkpoint.enemyNextId, checkpoint.enemies.map((enemy) => ({ ...enemy, alive: true })));
  const savedAttacks = new Map(checkpoint.enemies.map((enemy) => [enemy.id, enemy]));
  world.enemies.forEachAlive((enemy) => {
    const saved = savedAttacks.get(enemy.id);
    enemy.attackPhase = saved?.attackPhase ?? 0;
    enemy.attackTimer = saved?.attackTimer ?? 0;
    enemy.aimX = saved?.aimX ?? enemy.x;
    enemy.aimY = saved?.aimY ?? enemy.y;
  });
  world.projectiles.replaceAlive(
    checkpoint.projectileNextId,
    checkpoint.projectiles.map((shot) => ({ ...shot, alive: true, hitIds: new Set(shot.hitIds) })),
  );
  world.pickups.replaceAlive(checkpoint.pickupNextId, checkpoint.pickups.map((pickup) => ({ ...pickup, alive: true })));
  world.run.bellAlive = false;
  world.enemies.forEachAlive((enemy) => {
    if (enemy.kind === 'boss' && enemy.contentId === 'bell_warden') world.run.bellAlive = true;
  });
}

export function formatCheckpointTime(tick: number): string {
  const seconds = Math.max(0, Math.floor(tick / 30));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}
