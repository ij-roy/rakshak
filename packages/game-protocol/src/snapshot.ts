export type EntityKind =
  | 'player'
  | 'enemy'
  | 'projectile'
  | 'pickup'
  | 'particle'
  | 'damage_label'
  | 'boss'
  | 'elite';

export interface SpriteInstance {
  entityId: number;
  kind: EntityKind;
  contentId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  facing: number;
  tint: number;
  alpha: number;
  frame: number;
  hp: number;
  maxHp: number;
}

export interface TelegraphInstance {
  id: number;
  kind: 'circle' | 'arc' | 'line' | 'ring';
  x: number;
  y: number;
  radius: number;
  angle: number;
  sweep: number;
  progress: number;
  hostile: boolean;
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  xp: number;
  xpToNext: number;
  level: number;
  tick: number;
  survivalSeconds: number;
  kills: number;
  guardianMarks: number;
  paused: boolean;
  awaitingLevelChoice: boolean;
  rerollsRemaining: number;
  bossHp: number;
  bossMaxHp: number;
  bossId: string | null;
  runOutcome: 'ongoing' | 'victory' | 'defeat';
  weaponSlots: readonly SlotHud[];
  passiveSlots: readonly SlotHud[];
  levelChoices: readonly LevelChoiceHud[];
}

export interface SlotHud {
  contentId: string;
  level: number;
  evolved: boolean;
}

export interface LevelChoiceHud {
  contentId: string;
  kind: 'weapon' | 'passive' | 'evolution';
  currentLevel: number;
  nextLevel: number;
}

/** A HUD copy that stays stable after the next snapshot reuses its records. */
export function copyHud(hud: HudSnapshot): HudSnapshot {
  return {
    ...hud,
    weaponSlots: hud.weaponSlots.map((slot) => ({
      contentId: slot.contentId,
      level: slot.level,
      evolved: slot.evolved,
    })),
    passiveSlots: hud.passiveSlots.map((slot) => ({
      contentId: slot.contentId,
      level: slot.level,
      evolved: slot.evolved,
    })),
    levelChoices: hud.levelChoices.map((choice) => ({
      contentId: choice.contentId,
      kind: choice.kind,
      currentLevel: choice.currentLevel,
      nextLevel: choice.nextLevel,
    })),
  };
}

export interface CameraSnapshot {
  x: number;
  y: number;
  zoom: number;
}

/** Ground mark. `active` is 1 when the mechanic is on, and a fraction during a warning. */
export interface FieldMark {
  id: number;
  kind: 'landmark' | 'wall' | 'slow' | 'wind' | 'gate';
  x: number;
  y: number;
  w: number;
  h: number;
  dir: number;
  active: number;
}

/** 0 in open ground, 1 when the player is against the arena edge. */
export function boundProximity(x: number, y: number, mapWidth: number, mapHeight: number): number {
  if (mapWidth <= 0 || mapHeight <= 0) return 0;
  const near = Math.min(mapWidth * 0.5 - Math.abs(x), mapHeight * 0.5 - Math.abs(y));
  if (near >= 140) return 0;
  return 1 - Math.max(0, near) / 140;
}

/** Immutable render contract produced by game-core each tick. */
export interface RenderSnapshot {
  tick: number;
  camera: CameraSnapshot;
  sprites: readonly SpriteInstance[];
  telegraphs: readonly TelegraphInstance[];
  field: readonly FieldMark[];
  hud: HudSnapshot;
  mapId: string;
  mapWidth: number;
  mapHeight: number;
  seed: number;
}

/** Caller-owned buffer filled by `GameRuntime.snapshot(out)`. */
export interface MutableRenderSnapshot {
  tick: number;
  camera: CameraSnapshot;
  sprites: SpriteInstance[];
  telegraphs: TelegraphInstance[];
  field: FieldMark[];
  hud: HudSnapshot;
  mapId: string;
  mapWidth: number;
  mapHeight: number;
  seed: number;
}

export function createEmptyRenderSnapshot(): MutableRenderSnapshot {
  return {
    tick: 0,
    camera: { x: 0, y: 0, zoom: 1 },
    sprites: [],
    telegraphs: [],
    field: [],
    hud: {
      hp: 0,
      maxHp: 0,
      xp: 0,
      xpToNext: 0,
      level: 1,
      tick: 0,
      survivalSeconds: 0,
      kills: 0,
      guardianMarks: 0,
      paused: false,
      awaitingLevelChoice: false,
      rerollsRemaining: 1,
      bossHp: 0,
      bossMaxHp: 0,
      bossId: null,
      runOutcome: 'ongoing',
      weaponSlots: [],
      passiveSlots: [],
      levelChoices: [],
    },
    mapId: '',
    mapWidth: 0,
    mapHeight: 0,
    seed: 0,
  };
}
