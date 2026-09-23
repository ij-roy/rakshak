import type { TelegraphInstance } from '@rakshak/game-protocol';

export interface TelegraphStamp {
  painted: boolean;
  kind: TelegraphInstance['kind'];
  x: number;
  y: number;
  radius: number;
  angle: number;
  sweep: number;
  progress: number;
  hostile: boolean;
}

export function blankTelegraphStamp(): TelegraphStamp {
  return {
    painted: false,
    kind: 'circle',
    x: 0,
    y: 0,
    radius: 0,
    angle: 0,
    sweep: 0,
    progress: 0,
    hostile: false,
  };
}

export function sameTelegraph(stamp: TelegraphStamp, tel: TelegraphInstance): boolean {
  return (
    stamp.painted &&
    stamp.kind === tel.kind &&
    stamp.x === tel.x &&
    stamp.y === tel.y &&
    stamp.radius === tel.radius &&
    stamp.angle === tel.angle &&
    stamp.sweep === tel.sweep &&
    stamp.progress === tel.progress &&
    stamp.hostile === tel.hostile
  );
}

export function rememberTelegraph(stamp: TelegraphStamp, tel: TelegraphInstance): void {
  stamp.painted = true;
  stamp.kind = tel.kind;
  stamp.x = tel.x;
  stamp.y = tel.y;
  stamp.radius = tel.radius;
  stamp.angle = tel.angle;
  stamp.sweep = tel.sweep;
  stamp.progress = tel.progress;
  stamp.hostile = tel.hostile;
}
