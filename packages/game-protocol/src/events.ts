export type DomainEventKind =
  | 'player_damaged'
  | 'enemy_damaged'
  | 'enemy_killed'
  | 'xp_gained'
  | 'level_up'
  | 'level_offer'
  | 'upgrade_chosen'
  | 'weapon_fired'
  | 'boss_spawned'
  | 'boss_defeated'
  | 'elite_spawned'
  | 'pickup_collected'
  | 'evolution_unlocked'
  | 'run_ended'
  | 'paused'
  | 'resumed'
  | 'cue';

export interface DomainEventBase {
  readonly kind: DomainEventKind;
  readonly tick: number;
}

export interface PlayerDamagedEvent extends DomainEventBase {
  readonly kind: 'player_damaged';
  readonly amount: number;
  readonly sourceId: number;
  readonly remainingHp: number;
}

export interface EnemyDamagedEvent extends DomainEventBase {
  readonly kind: 'enemy_damaged';
  readonly entityId: number;
  readonly amount: number;
  readonly remainingHp: number;
  readonly critical: boolean;
}

export interface EnemyKilledEvent extends DomainEventBase {
  readonly kind: 'enemy_killed';
  readonly entityId: number;
  readonly enemyId: string;
  readonly xp: number;
}

export interface XpGainedEvent extends DomainEventBase {
  readonly kind: 'xp_gained';
  readonly amount: number;
  readonly total: number;
}

export interface LevelUpEvent extends DomainEventBase {
  readonly kind: 'level_up';
  readonly level: number;
}

export interface LevelOfferEvent extends DomainEventBase {
  readonly kind: 'level_offer';
  readonly choices: readonly LevelOfferChoice[];
  readonly rerollsRemaining: number;
}

export interface LevelOfferChoice {
  readonly contentId: string;
  readonly kind: 'weapon' | 'passive' | 'evolution';
  readonly currentLevel: number;
  readonly nextLevel: number;
}

export interface UpgradeChosenEvent extends DomainEventBase {
  readonly kind: 'upgrade_chosen';
  readonly contentId: string;
  readonly level: number;
}

export interface WeaponFiredEvent extends DomainEventBase {
  readonly kind: 'weapon_fired';
  readonly weaponId: string;
  readonly originX: number;
  readonly originY: number;
}

export interface BossSpawnedEvent extends DomainEventBase {
  readonly kind: 'boss_spawned';
  readonly bossId: string;
  readonly phase: 1 | 2 | 3;
}

export interface BossDefeatedEvent extends DomainEventBase {
  readonly kind: 'boss_defeated';
  readonly bossId: string;
  readonly phase: 1 | 2 | 3;
  readonly isFinal: boolean;
}

export interface EliteSpawnedEvent extends DomainEventBase {
  readonly kind: 'elite_spawned';
  readonly eliteId: string;
  readonly entityId: number;
}

export interface PickupCollectedEvent extends DomainEventBase {
  readonly kind: 'pickup_collected';
  readonly pickupKind: 'xp' | 'heal' | 'chest' | 'magnet';
  readonly amount: number;
}

export interface EvolutionUnlockedEvent extends DomainEventBase {
  readonly kind: 'evolution_unlocked';
  readonly evolutionId: string;
}

export interface RunEndedEvent extends DomainEventBase {
  readonly kind: 'run_ended';
  readonly outcome: 'victory' | 'defeat';
  readonly survivalTicks: number;
  readonly level: number;
  readonly kills: number;
}

export interface PausedEvent extends DomainEventBase {
  readonly kind: 'paused';
}

export interface ResumedEvent extends DomainEventBase {
  readonly kind: 'resumed';
}

export interface CueEvent extends DomainEventBase {
  readonly kind: 'cue';
  readonly cueId: string;
  readonly x: number;
  readonly y: number;
  readonly intensity: number;
}

export type DomainEvent =
  | PlayerDamagedEvent
  | EnemyDamagedEvent
  | EnemyKilledEvent
  | XpGainedEvent
  | LevelUpEvent
  | LevelOfferEvent
  | UpgradeChosenEvent
  | WeaponFiredEvent
  | BossSpawnedEvent
  | BossDefeatedEvent
  | EliteSpawnedEvent
  | PickupCollectedEvent
  | EvolutionUnlockedEvent
  | RunEndedEvent
  | PausedEvent
  | ResumedEvent
  | CueEvent;
