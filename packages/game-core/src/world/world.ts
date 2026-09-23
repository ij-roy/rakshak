import { BALANCE, EMPTY_REWARD_CONTEXT, type RewardContext } from '@rakshak/game-data';
import type { EnemyId, EvolutionId, GuardianId, MapId, PassiveId, WeaponId } from '@rakshak/game-data';
import type { DomainEvent, InputSnapshot, LevelOfferChoice } from '@rakshak/game-protocol';
import { EntityPool } from './entity-pool.js';
import { SpatialHash } from './spatial-hash.js';

export type Faction = 'player' | 'enemy';

export interface EnemyEntity {
  id: number;
  alive: boolean;
  contentId: EnemyId | string;
  kind: 'enemy' | 'elite' | 'boss';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  contactDamage: number;
  armor: number;
  knockbackResist: number;
  xp: number;
  threatCost: number;
  invulnUntil: number;
  aiCooldown: number;
  phase: number;
  isFinalBoss: boolean;
  /** 0 idle, 1 wind-up, 2 commit, 3 recover. */
  attackPhase: number;
  attackTimer: number;
  aimX: number;
  aimY: number;
}

export interface ProjectileEntity {
  id: number;
  alive: boolean;
  weaponId: WeaponId | string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  pierceLeft: number;
  lifeTicks: number;
  age: number;
  faction: Faction;
  hitMask: number; // bitset of hit enemy indices (simplified: last hit id)
  behavior: 'straight' | 'return' | 'arc' | 'zone' | 'trail' | 'chain';
  homeX: number;
  homeY: number;
  returning: boolean;
  ownerTick: number;
  hitIds: Set<number>;
}

export interface PickupEntity {
  id: number;
  alive: boolean;
  kind: 'xp' | 'heal' | 'chest' | 'magnet';
  x: number;
  y: number;
  amount: number;
  magnetized: boolean;
}

export interface ParticleEntity {
  id: number;
  alive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  lifeTicks: number;
  tint: number;
}

export interface DamageLabelEntity {
  id: number;
  alive: boolean;
  x: number;
  y: number;
  amount: number;
  lifeTicks: number;
  critical: boolean;
}

export interface WeaponSlot {
  weaponId: WeaponId;
  level: number;
  cooldown: number;
  evolved: boolean;
  evolutionId: EvolutionId | null;
}

export interface PassiveSlot {
  passiveId: PassiveId;
  level: number;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  moveSpeed: number;
  armorFlat: number;
  armorPct: number;
  pickupRadius: number;
  damageMult: number;
  areaMult: number;
  durationMult: number;
  projectileSpeedMult: number;
  cooldownMult: number;
  luck: number;
  invulnUntil: number;
  facing: number;
  ashaHitCounter: number;
  ashaSpeedUntil: number;
}

export interface DirectorState {
  budgetCarry: number;
  eliteIndex: number;
  bossesSpawned: number;
  spawnFreeze: boolean;
}

export interface OfferState {
  pendingLevels: number;
  choices: LevelOfferChoice[];
  rerollsRemaining: number;
  badLuckStreak: number;
  awaitingChoice: boolean;
  chestEvolutionReady: boolean;
}

export interface RunState {
  outcome: 'ongoing' | 'victory' | 'defeat';
  kills: number;
  xp: number;
  level: number;
  guardianMarksEarned: number;
  bossesDefeated: number;
  damageTaken: number;
  finalBossAlive: boolean;
  paused: boolean;
  pauseEdge: boolean;
  seenEnemies: string[];
  seenBosses: string[];
  bossClearedLowHp: boolean;
  bellAlive: boolean;
  bellDamaged: boolean;
  bellDefeatedClean: boolean;
  levelBeforeMinute6: number;
  weaponCountAtMinute8: number;
}

export class World {
  tick = 0;
  seed = 0;
  guardianId: GuardianId = 'asha';
  mapId: MapId = 'gaon';
  mapWidth = 2200;
  mapHeight = 1600;

  player: PlayerState = createDefaultPlayer();
  weapons: WeaponSlot[] = [];
  passives: PassiveSlot[] = [];
  director: DirectorState = {
    budgetCarry: 0,
    eliteIndex: 0,
    bossesSpawned: 0,
    spawnFreeze: false,
  };
  offer: OfferState = {
    pendingLevels: 0,
    choices: [],
    rerollsRemaining: BALANCE.defaultRerolls,
    badLuckStreak: 0,
    awaitingChoice: false,
    chestEvolutionReady: false,
  };
  rewardContext: RewardContext = EMPTY_REWARD_CONTEXT;
  run: RunState = {
    outcome: 'ongoing',
    kills: 0,
    xp: 0,
    level: 1,
    guardianMarksEarned: 0,
    bossesDefeated: 0,
    damageTaken: 0,
    finalBossAlive: false,
    paused: false,
    pauseEdge: false,
    seenEnemies: [],
    seenBosses: [],
    bossClearedLowHp: false,
    bellAlive: false,
    bellDamaged: false,
    bellDefeatedClean: false,
    levelBeforeMinute6: 1,
    weaponCountAtMinute8: -1,
  };

  input: InputSnapshot = {
    moveX: 0,
    moveY: 0,
    pause: false,
    confirm: false,
    cancel: false,
  };

  events: DomainEvent[] = [];
  private eventSlots: Array<Record<string, unknown>> = [];
  queryScratch: number[] = [];

  enemies = new EntityPool<EnemyEntity>(BALANCE.maxEnemies, () => createEnemy());
  projectiles = new EntityPool<ProjectileEntity>(BALANCE.maxProjectiles, () => createProjectile());
  pickups = new EntityPool<PickupEntity>(BALANCE.maxPickups, () => createPickup());
  particles = new EntityPool<ParticleEntity>(BALANCE.maxParticles, () => createParticle());
  damageLabels = new EntityPool<DamageLabelEntity>(BALANCE.maxDamageLabels, () => createDamageLabel());
  spatial = new SpatialHash(BALANCE.spatialCellSize);

  pushEvent(event: DomainEvent): void {
    Object.assign(this.beginEvent(event.kind), event);
  }

  emitPlayerDamaged(amount: number, sourceId: number, remainingHp: number): void {
    const slot = this.beginEvent('player_damaged');
    slot.amount = amount;
    slot.sourceId = sourceId;
    slot.remainingHp = remainingHp;
  }

  emitEnemyDamaged(entityId: number, amount: number, remainingHp: number, critical: boolean): void {
    const slot = this.beginEvent('enemy_damaged');
    slot.entityId = entityId;
    slot.amount = amount;
    slot.remainingHp = remainingHp;
    slot.critical = critical;
  }

  emitEnemyKilled(entityId: number, enemyId: string, xp: number): void {
    const slot = this.beginEvent('enemy_killed');
    slot.entityId = entityId;
    slot.enemyId = enemyId;
    slot.xp = xp;
  }

  emitPickupCollected(pickupKind: 'xp' | 'heal' | 'chest' | 'magnet', amount: number): void {
    const slot = this.beginEvent('pickup_collected');
    slot.pickupKind = pickupKind;
    slot.amount = amount;
  }

  emitXpGained(amount: number, total: number): void {
    const slot = this.beginEvent('xp_gained');
    slot.amount = amount;
    slot.total = total;
  }

  emitWeaponFired(weaponId: string, originX: number, originY: number): void {
    const slot = this.beginEvent('weapon_fired');
    slot.weaponId = weaponId;
    slot.originX = originX;
    slot.originY = originY;
  }

  private beginEvent(kind: DomainEvent['kind']): Record<string, unknown> {
    const index = this.events.length;
    let slot = this.eventSlots[index];
    if (!slot) {
      slot = {};
      this.eventSlots[index] = slot;
    }
    slot.kind = kind;
    slot.tick = this.tick;
    this.events[index] = slot as unknown as DomainEvent;
    return slot;
  }

  clearEvents(): void {
    this.events.length = 0;
  }
}

function createDefaultPlayer(): PlayerState {
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 14,
    hp: 100,
    maxHp: 100,
    moveSpeed: 110,
    armorFlat: 0,
    armorPct: 0,
    pickupRadius: BALANCE.playerBasePickupRadius,
    damageMult: 1,
    areaMult: 1,
    durationMult: 1,
    projectileSpeedMult: 1,
    cooldownMult: 1,
    luck: 0,
    invulnUntil: 0,
    facing: 0,
    ashaHitCounter: 0,
    ashaSpeedUntil: 0,
  };
}

function createEnemy(): EnemyEntity {
  return {
    id: 0,
    alive: false,
    contentId: 'chhaya_drifter',
    kind: 'enemy',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 12,
    hp: 1,
    maxHp: 1,
    contactDamage: 1,
    armor: 0,
    knockbackResist: 0,
    xp: 1,
    threatCost: 1,
    invulnUntil: 0,
    aiCooldown: 0,
    phase: 0,
    isFinalBoss: false,
    attackPhase: 0,
    attackTimer: 0,
    aimX: 0,
    aimY: 0,
  };
}

function createProjectile(): ProjectileEntity {
  return {
    id: 0,
    alive: false,
    weaponId: 'talwar_arc',
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    radius: 8,
    damage: 1,
    pierceLeft: 0,
    lifeTicks: 1,
    age: 0,
    faction: 'player',
    hitMask: -1,
    behavior: 'straight',
    homeX: 0,
    homeY: 0,
    returning: false,
    ownerTick: 0,
    hitIds: new Set(),
  };
}

function createPickup(): PickupEntity {
  return {
    id: 0,
    alive: false,
    kind: 'xp',
    x: 0,
    y: 0,
    amount: 1,
    magnetized: false,
  };
}

function createParticle(): ParticleEntity {
  return {
    id: 0,
    alive: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    lifeTicks: 1,
    tint: 0xffffff,
  };
}

function createDamageLabel(): DamageLabelEntity {
  return {
    id: 0,
    alive: false,
    x: 0,
    y: 0,
    amount: 0,
    lifeTicks: 1,
    critical: false,
  };
}
