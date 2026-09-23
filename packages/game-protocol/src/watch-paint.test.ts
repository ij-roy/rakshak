import { describe, expect, it } from 'vitest';
import { createEmptyRenderSnapshot } from './snapshot.js';
import { paintWatch, takeShapeLookups, type WatchBrush } from './watch-paint.js';

function sprite(partial: {
  entityId: number;
  kind: 'player' | 'enemy' | 'boss' | 'damage_label' | 'pickup';
  contentId: string;
  x: number;
  y: number;
}) {
  return {
    entityId: partial.entityId,
    kind: partial.kind,
    contentId: partial.contentId,
    x: partial.x,
    y: partial.y,
    vx: 0,
    vy: 0,
    radius: 14,
    facing: 0,
    tint: 0xffffff,
    alpha: 1,
    frame: 0,
    hp: 10,
    maxHp: 10,
  };
}

describe('watch picture', () => {
  it('draws the border, the player, a warning, and an off-screen boss in one pass', () => {
    const snap = createEmptyRenderSnapshot();
    snap.mapWidth = 2400;
    snap.mapHeight = 2400;
    snap.sprites.push(
      sprite({ entityId: 1, kind: 'player', contentId: 'asha', x: 0, y: 0 }),
      sprite({ entityId: 2, kind: 'damage_label', contentId: '12', x: 20, y: -10 }),
      sprite({ entityId: 3, kind: 'boss', contentId: 'bell_warden', x: 4000, y: 0 }),
    );
    snap.field.push({ id: 1, kind: 'slow', x: 40, y: 0, w: 80, h: 80, dir: 0, active: 1 });
    snap.telegraphs.push({
      id: 4,
      kind: 'line',
      x: 80,
      y: 0,
      radius: 120,
      angle: 0,
      sweep: 18,
      progress: 0.4,
      hostile: true,
    });
    const calls: string[] = [];
    const brush: WatchBrush = {
      circle(_x, _y, _radius, color) {
        calls.push(`circle:${color}`);
      },
      polygon(_points, color, _opacity, strokeWidth) {
        calls.push(`poly:${color}:${strokeWidth > 0 ? 'stroke' : 'fill'}`);
      },
      polyline() {},
      text(value) {
        calls.push(`text:${value}`);
      },
    };
    paintWatch(snap, 900, 506, brush);
    expect(calls).toContain('poly:#c28a2c:stroke');
    expect(calls).toContain('circle:#5f9d62');
    expect(calls).toContain('poly:#f4efe4:stroke');
    expect(calls).toContain('text:12');
    expect(calls).toContain('poly:#d65332:fill');
  });

  it('skips an enemy outside the view and still marks an off-screen boss', () => {
    const snap = createEmptyRenderSnapshot();
    snap.sprites.push(
      sprite({ entityId: 1, kind: 'enemy', contentId: 'chhaya_drifter', x: 2000, y: 0 }),
      sprite({ entityId: 2, kind: 'boss', contentId: 'bell_warden', x: 4000, y: 0 }),
    );
    const calls: string[] = [];
    paintWatch(snap, 900, 506, {
      circle() {},
      polygon(_points, color) {
        calls.push(color);
      },
      polyline() {},
      text() {
        calls.push('text');
      },
    });
    expect(calls).toEqual(['#d65332']);
  });

  it('draws a cached silhouette instead of rebuilding the outline', () => {
    const snap = createEmptyRenderSnapshot();
    snap.sprites.push(sprite({ entityId: 1, kind: 'player', contentId: 'asha', x: 0, y: 0 }));
    let polygons = 0;
    const seen: ArrayLike<number>[] = [];
    const brush: WatchBrush = {
      circle() {},
      polygon() {
        polygons += 1;
      },
      polyline() {},
      text() {},
      silhouette(points) {
        seen.push(points);
      },
    };
    paintWatch(snap, 900, 506, brush);
    takeShapeLookups();
    paintWatch(snap, 900, 506, brush);
    expect(takeShapeLookups()).toBe(0);
    expect(polygons).toBe(0);
    expect(seen.length).toBeGreaterThanOrEqual(2);
    expect(seen[0]).toBe(seen[seen.length / 2]);
  });

  it('paints a full stress crowd inside the simulation floor', () => {
    const snap = createEmptyRenderSnapshot();
    snap.mapWidth = 2400;
    snap.mapHeight = 2400;
    for (let i = 0; i < 300; i++) {
      snap.sprites.push(
        sprite({
          entityId: i + 1,
          kind: 'enemy',
          contentId: 'chhaya_drifter',
          x: Math.cos(i) * 400,
          y: Math.sin(i) * 400,
        }),
      );
    }
    for (let i = 0; i < 40; i++) {
      snap.sprites.push(sprite({ entityId: 1000 + i, kind: 'damage_label', contentId: '4', x: i * 8, y: 12 }));
    }
    snap.sprites.push(sprite({ entityId: 2, kind: 'boss', contentId: 'bell_warden', x: 4000, y: 0 }));
    for (let i = 0; i < 24; i++) {
      snap.telegraphs.push({
        id: i,
        kind: i % 2 === 0 ? 'line' : 'arc',
        x: i * 20,
        y: 30,
        radius: 80,
        angle: i,
        sweep: 0.8,
        progress: 0.5,
        hostile: true,
      });
    }
    const brush: WatchBrush = {
      circle() {},
      polygon() {},
      polyline() {},
      text() {},
    };
    const samples: number[] = [];
    for (let i = 0; i < 30; i++) {
      const started = performance.now();
      paintWatch(snap, 900, 506, brush);
      samples.push(performance.now() - started);
    }
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.floor(samples.length * 0.95)] ?? 0;
    expect(p95).toBeLessThanOrEqual(8);
  });

  it('omits sparks and damage numbers when decorative detail is off', () => {
    const snap = createEmptyRenderSnapshot();
    snap.sprites.push(
      sprite({ entityId: 1, kind: 'player', contentId: 'asha', x: 0, y: 0 }),
      {
        ...sprite({ entityId: 2, kind: 'enemy', contentId: 'spark', x: 12, y: 0 }),
        kind: 'particle',
        contentId: 'spark',
      },
      sprite({ entityId: 3, kind: 'damage_label', contentId: '9', x: 16, y: 0 }),
    );
    const calls: string[] = [];
    paintWatch(
      snap,
      900,
      506,
      {
        circle(_x, _y, _radius, color) {
          calls.push(`circle:${color}`);
        },
        polygon(_points, color) {
          calls.push(`poly:${color}`);
        },
        polyline() {},
        text(value) {
          calls.push(`text:${value}`);
        },
      },
      false,
    );
    expect(calls.some((call) => call.startsWith('circle:'))).toBe(false);
    expect(calls.some((call) => call.startsWith('text:'))).toBe(false);
    expect(calls.some((call) => call.includes('#f4efe4'))).toBe(true);
  });
});
