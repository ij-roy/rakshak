export interface EdgeMarker {
  x: number;
  y: number;
  angle: number;
}

/** Screen-space pointer when a world point sits outside the play view. */
export function edgeMarker(
  worldX: number,
  worldY: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  zoom: number,
  margin = 28,
  out?: EdgeMarker,
): EdgeMarker | null {
  if (viewW <= margin * 2 || viewH <= margin * 2) return null;
  const sx = viewW / 2 + (worldX - camX) * zoom;
  const sy = viewH / 2 + (worldY - camY) * zoom;
  if (sx >= margin && sx <= viewW - margin && sy >= margin && sy <= viewH - margin) return null;
  const dx = sx - viewW / 2;
  const dy = sy - viewH / 2;
  const halfW = viewW / 2 - margin;
  const halfH = viewH / 2 - margin;
  const scale = Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH, 0.001);
  const marker = out ?? { x: 0, y: 0, angle: 0 };
  marker.x = viewW / 2 + dx / scale;
  marker.y = viewH / 2 + dy / scale;
  marker.angle = Math.atan2(dy, dx);
  return marker;
}

/** Each telegraph kind paints a different footprint. */
export function telegraphFootprint(kind: 'circle' | 'arc' | 'line' | 'ring'): 'disk' | 'wedge' | 'lane' | 'ring' {
  switch (kind) {
    case 'circle':
      return 'disk';
    case 'arc':
      return 'wedge';
    case 'line':
      return 'lane';
    case 'ring':
      return 'ring';
  }
}
