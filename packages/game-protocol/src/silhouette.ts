export type SilhouetteShape =
  | 'shield'
  | 'chevron'
  | 'dart'
  | 'block'
  | 'spit'
  | 'diamond'
  | 'crest'
  | 'bolt'
  | 'gem'
  | 'cross'
  | 'coffer'
  | 'loop'
  | 'mote';

export interface SilhouetteMark {
  points: number[];
  mode: 'fill' | 'stroke';
}

const ENEMY_ROLE: Record<string, SilhouetteShape> = {
  chhaya_drifter: 'chevron',
  echo_stalker: 'chevron',
  swarm_fragment: 'chevron',
  chhaya_runner: 'dart',
  dust_leaper: 'dart',
  sand_roller: 'dart',
  husk_guard: 'block',
  shield_shell: 'block',
  night_maw: 'block',
  fort_sentry: 'block',
  thorn_spitter: 'spit',
  lantern_wisp: 'spit',
  root_binder: 'spit',
  banner_husk: 'spit',
  ember_husk: 'spit',
  burrow_mite: 'spit',
};

const TINT: Record<SilhouetteShape, number> = {
  shield: 0x9fd4de,
  chevron: 0x6b2a18,
  dart: 0x8a3418,
  block: 0x4a1c12,
  spit: 0xa34432,
  diamond: 0xd46a32,
  crest: 0x3d1520,
  bolt: 0xf0d48a,
  gem: 0xffe08a,
  cross: 0xd7f5e4,
  coffer: 0xd4b483,
  loop: 0x8fd0c4,
  mote: 0xe5d2a6,
};

export function silhouetteFor(kind: string, contentId: string): SilhouetteShape {
  if (kind === 'player') return 'shield';
  if (kind === 'elite') return 'diamond';
  if (kind === 'boss') return 'crest';
  if (kind === 'projectile') return 'bolt';
  if (kind === 'particle' || kind === 'damage_label') return 'mote';
  if (kind === 'pickup') {
    if (contentId === 'heal') return 'cross';
    if (contentId === 'chest') return 'coffer';
    if (contentId === 'magnet') return 'loop';
    return 'gem';
  }
  if (kind === 'enemy') return ENEMY_ROLE[contentId] ?? 'chevron';
  return 'mote';
}

export function silhouetteTint(shape: SilhouetteShape): number {
  return TINT[shape];
}

/** White snapshot tints used to erase category color. Treat them as unset. */
export function resolveSpriteTint(shape: SilhouetteShape, tint: number): number {
  if (!tint || tint === 0xffffff) return silhouetteTint(shape);
  return tint;
}

export function relativeLuminance(hex: number): number {
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = channel((hex >> 16) & 255);
  const g = channel((hex >> 8) & 255);
  const b = channel(hex & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const SHAPE_INDEX: Record<SilhouetteShape, number> = {
  shield: 1,
  chevron: 2,
  dart: 3,
  block: 4,
  spit: 5,
  diamond: 6,
  crest: 7,
  bolt: 8,
  gem: 9,
  cross: 10,
  coffer: 11,
  loop: 12,
  mote: 13,
};

const markCache = new Map<number, SilhouetteMark[]>();

export function silhouetteMarks(shape: SilhouetteShape, radius: number): SilhouetteMark[] {
  const r = Math.round(Math.max(2, radius) * 2) / 2;
  const key = SHAPE_INDEX[shape] * 100_000 + Math.round(r * 2);
  const cached = markCache.get(key);
  if (cached) return cached;
  const marks = buildSilhouetteMarks(shape, r);
  markCache.set(key, marks);
  return marks;
}

function buildSilhouetteMarks(shape: SilhouetteShape, r: number): SilhouetteMark[] {
  switch (shape) {
    case 'shield':
      return [
        fill([r, 0, -r * 0.45, -r * 0.72, -r * 0.15, 0, -r * 0.45, r * 0.72]),
        stroke(regular(8, r + 3)),
      ];
    case 'chevron':
      return [fill([r, 0, -r, -r * 0.72, -r * 0.35, 0, -r, r * 0.72])];
    case 'dart':
      return [fill([r * 1.15, 0, -r * 0.8, -r * 0.28, -r * 0.8, r * 0.28])];
    case 'block':
      return [fill([-r * 0.8, -r * 0.8, r * 0.8, -r * 0.8, r * 0.8, r * 0.8, -r * 0.8, r * 0.8])];
    case 'spit':
      return [
        fill([r, 0, -r * 0.2, -r * 0.55, -r * 0.2, r * 0.55]),
        fill([-r * 0.95, -r * 0.22, -r * 0.45, -r * 0.22, -r * 0.45, r * 0.22, -r * 0.95, r * 0.22]),
      ];
    case 'diamond':
      return [fill([0, -r, r, 0, 0, r, -r, 0]), fill([-r * 0.7, -r * 0.12, r * 0.7, -r * 0.12, r * 0.7, r * 0.12, -r * 0.7, r * 0.12]), stroke(regular(8, r + 2))];
    case 'crest':
      return [fill(regular(6, r, Math.PI / 6)), fill([-r * 0.18, -r * 0.62, r * 0.18, -r * 0.62, r * 0.18, r * 0.62, -r * 0.18, r * 0.62]), stroke(regular(8, r + 4))];
    case 'bolt':
      return [fill([r * 1.4, -r * 0.28, r * 1.4, r * 0.28, -r * 0.2, r * 0.28, -r * 0.2, -r * 0.28])];
    case 'gem':
      return [fill(star(r))];
    case 'cross':
      return [
        fill([-r * 0.28, -r, r * 0.28, -r, r * 0.28, r, -r * 0.28, r]),
        fill([-r, -r * 0.28, r, -r * 0.28, r, r * 0.28, -r, r * 0.28]),
      ];
    case 'coffer':
      return [
        fill([-r, -r * 0.45, r, -r * 0.45, r, r * 0.7, -r, r * 0.7]),
        fill([-r * 0.72, -r * 0.95, r * 0.72, -r * 0.95, r * 0.72, -r * 0.4, -r * 0.72, -r * 0.4]),
      ];
    case 'loop':
      return [stroke(regular(8, r)), stroke(regular(8, r * 0.45))];
    case 'mote':
      return [fill(regular(8, r * 0.55))];
  }
}

function fill(points: number[]): SilhouetteMark {
  return { points, mode: 'fill' };
}

function stroke(points: number[]): SilhouetteMark {
  return { points, mode: 'stroke' };
}

function regular(sides: number, radius: number, rotation = 0): number[] {
  const points: number[] = [];
  for (let i = 0; i < sides; i += 1) {
    const angle = rotation + (i / sides) * Math.PI * 2;
    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  return points;
}

function star(radius: number): number[] {
  const points: number[] = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = -Math.PI / 2 + (i / 8) * Math.PI * 2;
    const arm = i % 2 === 0 ? radius : radius * 0.38;
    points.push(Math.cos(angle) * arm, Math.sin(angle) * arm);
  }
  return points;
}
