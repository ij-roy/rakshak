import { Application, Container, Graphics, GraphicsContext, Rectangle, Sprite, Texture } from 'pixi.js';
import type { FieldMark, RenderSnapshot, SpriteInstance, TelegraphInstance } from '@rakshak/game-protocol';
import { lerp } from '@rakshak/shared';
import { boundProximity, combatViewZoom, edgeMarker, silhouetteMarks, telegraphFootprint, type EdgeMarker, type SilhouetteShape } from '@rakshak/game-protocol';
import { fieldCacheStamp } from './field-cache';
import { blankTelegraphStamp, rememberTelegraph, sameTelegraph, type TelegraphStamp } from './telegraph-stamp';
import { createFrameQuality, stepFrameQuality, type FrameQuality } from './frame-quality';
import { createMountEpoch, ensureResizeCancel } from './mount-epoch';
import { pictureUnchanged } from './picture-reuse';
import { renderNodeId } from './render-key';
import { frameKeptEveryNode, reclaimStale } from './live-nodes';
import { cachedPaint, type PaintResult } from './paint-cache';
import { admitSprite, needsEdgePass, noteEdgeSprite, offscreenPicture, recallSlot } from './sprite-admit';
import { releaseSharedContexts, takeSharedContext } from './shared-context';
import { writeLerpedPose, type SpritePose } from './sprite-pose';

export interface Viewport {
  width: number;
  height: number;
  dpr: number;
}

export interface RendererPort {
  mount(host: HTMLElement): Promise<void>;
  render(previous: RenderSnapshot, current: RenderSnapshot, alpha: number): void;
  resize(viewport: Viewport): void;
  setReducedEffects(value: boolean): void;
  dispose(): void;
}

const NIGHT_BG = 0x0b0c14;
const OUTLINE = 0xf4efe4;
const THREAT_OUTLINE = 0xc28a2c;
const posed: SpritePose = { x: 0, y: 0, facing: 0, radius: 0, alpha: 1 };
const paintOut: PaintResult = { shape: 'mote', tint: 0 };
const edgeOut: EdgeMarker = { x: 0, y: 0, angle: 0 };

interface ShapeNode {
  gfx: Graphics;
  owned: GraphicsContext;
  contextKey?: string;
  key: number;
  digits?: Sprite[];
  paintKind?: string;
  paintContent?: string;
  paintShape?: SilhouetteShape;
  paintRadius?: number;
  paintTint?: number;
  sourceTint?: number;
  gen: number;
  hasSim: boolean;
  stamp: TelegraphStamp;
  simX: number;
  simY: number;
  simFacing: number;
  simRadius: number;
  simAlpha: number;
}

function showOwned(node: ShapeNode): Graphics {
  if (node.contextKey !== undefined) {
    node.gfx.context = node.owned;
    node.contextKey = undefined;
  }
  node.owned.clear();
  return node.gfx;
}

function showShared(node: ShapeNode, key: string, draw: (context: GraphicsContext) => void): void {
  if (node.contextKey === key) return;
  node.gfx.context = takeSharedContext(key, draw);
  node.contextKey = key;
}

/** PixiJS 8 adapter — distinct silhouettes from RenderSnapshot sprites (no art files). */
function paintCue(
  node: ShapeNode,
  kind: string,
  contentId: string,
  shape: SilhouetteShape,
  radius: number,
  color: number,
): void {
  if (kind === 'damage_label') {
    showOwned(node);
    paintDigits(node, contentId);
    return;
  }
  if (node.digits) {
    for (const glyph of node.digits) glyph.visible = false;
  }
  if (contentId === 'heal') {
    const key = `heal:${Math.round(radius * 2)}`;
    showShared(node, key, (context) => {
      context.rect(-2, -radius, 4, radius * 2).fill({ color: 0x5f9d62 });
      context.rect(-radius, -2, radius * 2, 4).fill({ color: 0x5f9d62 });
    });
    return;
  }
  if (contentId === 'hurt') {
    const key = `hurt:${Math.round(radius * 2)}`;
    showShared(node, key, (context) => {
      context.moveTo(0, 0).lineTo(radius, 0).stroke({ width: 4, color: 0xd65332, alpha: 0.95 });
    });
    return;
  }
  if (contentId === 'spark') {
    showShared(node, `spark:${color}`, (context) => {
      context.circle(0, 0, 3).fill({ color, alpha: 0.85 });
    });
    return;
  }
  paintSilhouette(node, shape, radius, color);
}

function paintSilhouette(node: ShapeNode, shape: SilhouetteShape, radius: number, color: number): void {
  const outline = shape === 'shield' ? OUTLINE : THREAT_OUTLINE;
  const key = `${shape}:${Math.round(radius * 2)}:${color}:${outline}`;
  showShared(node, key, (context) => {
    for (const mark of silhouetteMarks(shape, radius)) {
      if (mark.mode === 'stroke') {
        context.poly(mark.points, true).stroke({ width: 2, color: outline, alpha: 0.95 });
      } else {
        context.poly(mark.points, true).fill({ color });
      }
    }
  });
}
function paintField(g: Graphics, snap: RenderSnapshot, viewW: number, viewH: number, zoom: number): void {
  g.clear();
  const halfW = snap.mapWidth * 0.5;
  const halfH = snap.mapHeight * 0.5;
  if (halfW <= 0 || halfH <= 0) return;
  const pad = 160;
  const left = Math.max(-halfW, snap.camera.x - viewW / (2 * zoom) - pad);
  const right = Math.min(halfW, snap.camera.x + viewW / (2 * zoom) + pad);
  const top = Math.max(-halfH, snap.camera.y - viewH / (2 * zoom) - pad);
  const bottom = Math.min(halfH, snap.camera.y + viewH / (2 * zoom) + pad);
  const step = 96;
  for (let x = Math.floor(left / step) * step; x <= right; x += step) {
    g.moveTo(x, top).lineTo(x, bottom);
  }
  for (let y = Math.floor(top / step) * step; y <= bottom; y += step) {
    g.moveTo(left, y).lineTo(right, y);
  }
  g.stroke({ width: 1, color: 0x343a73, alpha: 0.45 });
  const pressure = boundProximity(snap.camera.x, snap.camera.y, snap.mapWidth, snap.mapHeight);
  g.rect(-halfW, -halfH, snap.mapWidth, snap.mapHeight).stroke({
    width: 3 + pressure * 6,
    color: pressure > 0.15 ? 0xd65332 : 0xc28a2c,
    alpha: 0.45 + pressure * 0.5,
  });
  for (const mark of snap.field) paintMark(g, mark);
}

function drawEdgeArrow(g: Graphics, x: number, y: number, angle: number): void {
  const tip = 10;
  const wing = 6;
  const ax = Math.cos(angle);
  const ay = Math.sin(angle);
  const px = -ay;
  const py = ax;
  g.moveTo(x + ax * tip, y + ay * tip)
    .lineTo(x - ax * 4 + px * wing, y - ay * 4 + py * wing)
    .lineTo(x - ax * 4 - px * wing, y - ay * 4 - py * wing)
    .closePath()
    .fill({ color: 0xd65332, alpha: 0.9 });
}

function paintMark(g: Graphics, mark: FieldMark): void {
  if (mark.kind === 'landmark') {
    g.rect(mark.x - mark.w * 0.5, mark.y - mark.h * 0.5, mark.w, mark.h).stroke({
      width: 2,
      color: 0x8a8790,
      alpha: 0.8,
    });
    return;
  }
  const live = mark.active >= 1;
  const alpha = mark.kind === 'wall' ? 0.85 : 0.25 + mark.active * 0.6;
  const color = mark.kind === 'slow' ? 0x5f9d62 : mark.kind === 'wind' ? 0x58a6b3 : mark.kind === 'gate' ? 0xd65332 : 0xc28a2c;
  if (mark.kind === 'slow') {
    g.circle(mark.x, mark.y, mark.w * 0.5).stroke({ width: live ? 3 : 1.5, color, alpha });
    if (live) g.circle(mark.x, mark.y, mark.w * 0.5).fill({ color, alpha: 0.12 });
    return;
  }
  g.rect(mark.x - mark.w * 0.5, mark.y - mark.h * 0.5, mark.w, mark.h).stroke({
    width: live ? 3 : 1.5,
    color,
    alpha,
  });
  if (live && mark.kind !== 'wind') {
    g.rect(mark.x - mark.w * 0.5, mark.y - mark.h * 0.5, mark.w, mark.h).fill({ color, alpha: 0.14 });
  }
}

function paintTelegraph(node: ShapeNode, tel: TelegraphInstance): void {
  const g = showOwned(node);
  g.position.set(tel.x, tel.y);
  g.rotation = 0;
  const color = tel.hostile ? 0xd65332 : 0x58a6b3;
  const alpha = 0.28 + tel.progress * 0.55;
  const mode = telegraphFootprint(tel.kind);
  if (mode === 'disk') {
    g.circle(0, 0, tel.radius).fill({ color, alpha: alpha * 0.45 });
    g.circle(0, 0, tel.radius).stroke({ width: 2, color, alpha });
    return;
  }
  if (mode === 'ring') {
    g.circle(0, 0, Math.max(6, tel.radius)).stroke({ width: 3 + tel.progress * 3, color, alpha });
    return;
  }
  if (mode === 'lane') {
    g.rotation = tel.angle;
    const half = Math.max(4, tel.sweep * 0.5);
    g.rect(0, -half, tel.radius, half * 2).fill({ color, alpha: 0.28 });
    g.rect(0, -half, Math.max(4, tel.radius * tel.progress), half * 2).fill({ color, alpha: 0.62 });
    return;
  }
  const start = tel.angle - tel.sweep / 2;
  const steps = 14;
  arcScratch.length = 0;
  arcScratch.push(0, 0);
  for (let i = 0; i <= steps; i++) {
    const angle = start + tel.sweep * (i / steps);
    arcScratch.push(Math.cos(angle) * tel.radius, Math.sin(angle) * tel.radius);
  }
  g.poly(arcScratch, true).fill({ color, alpha: 0.34 });
  g.poly(arcScratch, true).stroke({ width: 2, color, alpha });
}

const arcScratch: number[] = [];
const digitPool: Sprite[] = [];
let digitFrames: Texture[] | null = null;

/** One shared digit strip, so a damage number never builds a font layout during a fight. */
function ensureDigitFrames(): Texture[] {
  if (digitFrames) return digitFrames;
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 24;
  const ctx = canvas.getContext('2d');
  const frames: Texture[] = [];
  if (!ctx) {
    digitFrames = frames;
    return frames;
  }
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#e5d2a6';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 10; i++) ctx.fillText(String(i), i * 16 + 8, 12);
  const sheet = Texture.from(canvas);
  for (let i = 0; i < 10; i++) {
    frames.push(new Texture({ source: sheet.source, frame: new Rectangle(i * 16, 0, 16, 24) }));
  }
  digitFrames = frames;
  return frames;
}

function paintDigits(node: ShapeNode, contentId: string): void {
  const frames = ensureDigitFrames();
  if (!node.digits) node.digits = [];
  const g = node.gfx;
  while (node.digits.length > contentId.length) {
    const extra = node.digits.pop();
    if (!extra) break;
    extra.visible = false;
    g.removeChild(extra);
    digitPool.push(extra);
  }
  for (let i = 0; i < contentId.length; i++) {
    const code = contentId.charCodeAt(i) - 48;
    let glyph = node.digits[i];
    if (!glyph) {
      glyph = digitPool.pop() ?? new Sprite(frames[0] ?? Texture.EMPTY);
      glyph.anchor.set(0.5, 1);
      g.addChild(glyph);
      node.digits.push(glyph);
    }
    const frame = code >= 0 && code <= 9 ? frames[code] : undefined;
    if (frame) glyph.texture = frame;
    glyph.position.set((i - (contentId.length - 1) / 2) * 11, 0);
    glyph.visible = frame !== undefined;
  }
}

function destroyApplication(application: Application): void {
  const target = application as Application & { _cancelResize?: (() => void) | null };
  ensureResizeCancel(target);
  try {
    application.destroy(true, { children: true });
  } catch (err) {
    console.error(err);
    application.canvas?.remove();
  }
}

export function createPixiRenderer(): RendererPort {
  let app: Application | null = null;
  let world: Container | null = null;
  let edges: Graphics | null = null;
  let ground: Graphics | null = null;
  const nodes = new Map<number, ShapeNode>();
  const live: ShapeNode[] = [];
  const marked = new Set<number>();
  const edgeIndex: number[] = [];
  const slotNodes: Array<ShapeNode | undefined> = [];
  let frameGen = 0;
  const spare: ShapeNode[] = [];
  let hostEl: HTMLElement | null = null;
  let reducedEffects = false;
  let lastFrame = 0;
  let lastDuration = 0;
  let fieldStamp = 0;
  let fieldReady = false;
  let appliedQuality: FrameQuality = 'full';
  let pictureDirty = true;
  let paintedPrev: RenderSnapshot | null = null;
  let paintedCur: RenderSnapshot | null = null;
  let paintedAlpha = -1;
  let edgesDrawn = false;
  const qualityState = createFrameQuality();
  const epoch = createMountEpoch();

  function presentationLean(): boolean {
    return reducedEffects || qualityState.quality === 'lean';
  }

  function applyResolution(): boolean {
    if (!app) return false;
    // Stay at 1× so a high device pixel ratio never rebuilds the framebuffer mid-watch.
    const next = 1;
    if (app.renderer.resolution === next) return false;
    app.renderer.resolution = next;
    return true;
  }

  function makeNode(): ShapeNode {
    const owned = new GraphicsContext();
    const gfx = new Graphics({ context: owned });
    gfx.visible = false;
    return {
      gfx,
      owned,
      key: 0,
      gen: 0,
      hasSim: false,
      simX: 0,
      simY: 0,
      simFacing: 0,
      simRadius: 0,
      simAlpha: 1,
      stamp: blankTelegraphStamp(),
    };
  }

  function poseSprite(node: ShapeNode, cur: SpriteInstance, alpha: number) {
    const prevX = node.hasSim ? node.simX : cur.x;
    const prevY = node.hasSim ? node.simY : cur.y;
    const prevFacing = node.hasSim ? node.simFacing : cur.facing;
    const prevRadius = node.hasSim ? node.simRadius : cur.radius;
    const prevAlpha = node.hasSim ? node.simAlpha : cur.alpha;
    node.simX = cur.x;
    node.simY = cur.y;
    node.simFacing = cur.facing;
    node.simRadius = cur.radius;
    node.simAlpha = cur.alpha;
    node.hasSim = true;
    return writeLerpedPose(
      posed,
      prevX,
      prevY,
      prevFacing,
      prevRadius,
      prevAlpha,
      cur.x,
      cur.y,
      cur.facing,
      cur.radius,
      cur.alpha,
      alpha,
    );
  }

  function ensureNode(id: number, found: ShapeNode | undefined): ShapeNode {
    if (found) return found;
    const node = spare.pop() ?? makeNode();
    node.key = id;
    if (!node.gfx.parent) world!.addChild(node.gfx);
    node.gfx.visible = true;
    nodes.set(id, node);
    live.push(node);
    return node;
  }

  function releaseNode(node: ShapeNode): void {
    node.gfx.visible = false;
    showOwned(node);
    if (node.digits) {
      for (const glyph of node.digits) glyph.visible = false;
    }
    node.paintKind = undefined;
    node.paintContent = undefined;
    node.paintShape = undefined;
    node.paintRadius = undefined;
    node.paintTint = undefined;
    node.sourceTint = undefined;
    node.hasSim = false;
    node.stamp.painted = false;
    if (node.gfx.parent) node.gfx.parent.removeChild(node.gfx);
    spare.push(node);
  }

  function lookupNode(id: number): ShapeNode | undefined {
    return nodes.get(id);
  }

  function dropStale(node: ShapeNode): void {
    const id = node.key;
    node.key = 0;
    releaseNode(node);
    nodes.delete(id);
  }

  return {
    async mount(host: HTMLElement) {
      const token = epoch.begin();
      hostEl = host;
      const application = new Application();
      const width = Math.max(1, host.clientWidth || host.getBoundingClientRect().width || 1280);
      const height = Math.max(1, host.clientHeight || host.getBoundingClientRect().height || 720);
      await application.init({
        background: NIGHT_BG,
        width,
        height,
        antialias: true,
        autoDensity: true,
        resolution: 1,
      });
      if (!epoch.isCurrent(token)) {
        destroyApplication(application);
        return;
      }
      host.querySelectorAll('canvas').forEach((canvas) => canvas.remove());
      app = application;
      application.canvas.setAttribute('aria-label', 'Night watch field');
      application.canvas.setAttribute('role', 'img');
      host.appendChild(application.canvas);
      world = new Container();
      ground = new Graphics();
      edges = new Graphics();
      world.addChild(ground);
      application.stage.addChild(world);
      application.stage.addChild(edges);
      application.ticker.stop();
      const frames = ensureDigitFrames();
      if (frames[0]) {
        while (digitPool.length < 80) digitPool.push(new Sprite(frames[0]));
      }
      for (let i = 0; i < 160; i++) spare.push(makeNode());
      const warm = spare[0];
      if (warm) {
        world.addChild(warm.gfx);
        warm.gfx.visible = true;
        warm.gfx.poly([-8, -6, 10, 0, -8, 6], true).fill({ color: 0xe5d2a6 });
        warm.gfx.circle(0, 0, 6).stroke({ width: 2, color: 0xf4efe4 });
        application.render();
        warm.gfx.clear();
        warm.gfx.visible = false;
        world.removeChild(warm.gfx);
      } else {
        application.render();
      }
    },
    setReducedEffects(value: boolean) {
      reducedEffects = value;
      pictureDirty = true;
      if (applyResolution() && app) app.renderer.resize(app.screen.width, app.screen.height);
    },
    render(previous: RenderSnapshot, current: RenderSnapshot, alpha: number) {
      if (!app || !world) return;
      const now = performance.now();
      if (!pictureDirty && pictureUnchanged(previous, current, alpha, paintedPrev, paintedCur, paintedAlpha)) {
        lastFrame = now;
        return;
      }
      if (lastFrame > 0) {
        lastDuration = now - lastFrame;
        const quality = stepFrameQuality(qualityState, lastDuration);
        if (quality !== appliedQuality) {
          appliedQuality = quality;
          if (applyResolution()) app.renderer.resize(app.screen.width, app.screen.height);
        }
      }
      lastFrame = now;
      const lean = presentationLean();
      const camX = lerp(previous.camera.x, current.camera.x, alpha);
      const camY = lerp(previous.camera.y, current.camera.y, alpha);
      const vw = app.screen.width;
      const vh = app.screen.height;
      const cameraZoom = lerp(previous.camera.zoom || 1, current.camera.zoom || 1, alpha) || 1;
      const zoom = combatViewZoom(vw, vh, cameraZoom);
      world.position.set(vw / 2 - camX * zoom, vh / 2 - camY * zoom);
      world.scale.set(zoom);
      if (ground) {
        const stamp = fieldCacheStamp(current, vw, vh, zoom);
        if (!fieldReady || stamp !== fieldStamp) {
          paintField(ground, current, vw, vh, zoom);
          fieldStamp = stamp;
          fieldReady = true;
        }
        if (world.getChildAt(0) !== ground) world.setChildIndex(ground, 0);
      }

      frameGen += 1;
      const halfViewW = vw / (2 * zoom) + 80;
      const halfViewH = vh / (2 * zoom) + 80;
      let createdThisFrame = 0;
      let detachedThisFrame = 0;
      let keptNodes = 0;
      const createBudget = lastDuration === 0 ? 48 : lastDuration > 18.5 ? 16 : lastDuration > 12 ? 24 : 32;
      const sprites = current.sprites;
      edgeIndex.length = 0;
      for (let i = 0; i < sprites.length; i++) {
        const cur = sprites[i]!;
        noteEdgeSprite(cur.kind, i, edgeIndex);
        const key = renderNodeId(cur.kind, cur.entityId);
        if ((lean || lastDuration > 18.5) && (cur.kind === 'particle' || cur.kind === 'damage_label')) {
          const hidden = recallSlot(slotNodes, i, key, lookupNode);
          if (hidden) {
            hidden.gen = frameGen;
            keptNodes += 1;
            hidden.gfx.visible = false;
            poseSprite(hidden, cur, alpha);
            if (hidden.gfx.parent && detachedThisFrame < 24) {
              hidden.gfx.parent.removeChild(hidden.gfx);
              detachedThisFrame += 1;
            }
          }
          continue;
        }
        if (Math.abs(cur.x - camX) > halfViewW || Math.abs(cur.y - camY) > halfViewH) {
          const existing = recallSlot(slotNodes, i, key, lookupNode);
          if (existing) {
            existing.gen = frameGen;
            keptNodes += 1;
            existing.gfx.visible = false;
            existing.hasSim = false;
            if (offscreenPicture(existing.gfx.parent !== null, detachedThisFrame) === 'detach') {
              existing.gfx.parent!.removeChild(existing.gfx);
              detachedThisFrame += 1;
            }
          }
          continue;
        }
        const urgent = cur.kind === 'player' || cur.kind === 'boss' || cur.kind === 'elite';
        const found = recallSlot(slotNodes, i, key, lookupNode);
        const admit = admitSprite(urgent, found !== undefined, createdThisFrame, createBudget);
        if (admit === 'skip') continue;
        if (admit === 'create') createdThisFrame += 1;
        const node = ensureNode(key, found);
        slotNodes[i] = node;
        if (!node.gfx.parent) world.addChild(node.gfx);
        node.gen = frameGen;
        keptNodes += 1;
        const pose = poseSprite(node, cur, alpha);
        const paint = cachedPaint(node, cur.kind, cur.contentId, cur.tint, paintOut);
        const g = node.gfx;
        g.visible = true;
        const bob = cur.kind === 'pickup' ? Math.sin((current.tick + cur.entityId) * 0.2) * 2.5 : 0;
        g.position.set(pose.x, pose.y + bob);
        g.rotation = cur.kind === 'damage_label' ? 0 : pose.facing;
        g.alpha = pose.alpha;
        const radius = pose.radius;
        const radiusBucket = Math.round(radius * 2);
        if (
          node.paintKind !== cur.kind ||
          node.paintContent !== cur.contentId ||
          node.paintShape !== paint.shape ||
          node.paintRadius !== radiusBucket ||
          node.paintTint !== paint.tint
        ) {
          paintCue(node, cur.kind, cur.contentId, paint.shape, radius, paint.tint);
          node.paintKind = cur.kind;
          node.paintContent = cur.contentId;
          node.paintShape = paint.shape;
          node.paintRadius = radiusBucket;
          node.paintTint = paint.tint;
          node.sourceTint = cur.tint;
        }
      }
      if (slotNodes.length > sprites.length) slotNodes.length = sprites.length;

      for (let i = 0; i < current.telegraphs.length; i++) {
        const tel = current.telegraphs[i]!;
        const key = renderNodeId('telegraph', tel.id);
        if (Math.abs(tel.x - camX) > halfViewW || Math.abs(tel.y - camY) > halfViewH) {
          const existing = nodes.get(key);
          if (existing) {
            existing.gen = frameGen;
            keptNodes += 1;
            existing.gfx.visible = false;
          }
          continue;
        }
        const found = nodes.get(key);
        const node = ensureNode(key, found);
        if (!node.gfx.parent) world.addChild(node.gfx);
        node.gen = frameGen;
        keptNodes += 1;
        node.gfx.visible = true;
        node.gfx.alpha = 1;
        if (!sameTelegraph(node.stamp, tel)) {
          paintTelegraph(node, tel);
          rememberTelegraph(node.stamp, tel);
        }
      }

      if (edges) {
        let hostileMarks = 0;
        for (let i = 0; i < current.telegraphs.length; i++) {
          if (current.telegraphs[i]!.hostile) hostileMarks += 1;
        }
        if (needsEdgePass(edgeIndex.length, hostileMarks)) {
          edges.clear();
          marked.clear();
          for (let i = 0; i < current.telegraphs.length; i++) {
            const tel = current.telegraphs[i]!;
            if (!tel.hostile) continue;
            const marker = edgeMarker(tel.x, tel.y, camX, camY, vw, vh, zoom, 28, edgeOut);
            if (!marker) continue;
            const key = (Math.round(marker.x) + 100000) * 100000 + Math.round(marker.y) + 100000;
            if (marked.has(key)) continue;
            marked.add(key);
            drawEdgeArrow(edges, marker.x, marker.y, marker.angle);
          }
          for (let e = 0; e < edgeIndex.length; e++) {
            const sprite = sprites[edgeIndex[e]!]!;
            const marker = edgeMarker(sprite.x, sprite.y, camX, camY, vw, vh, zoom, 28, edgeOut);
            if (!marker) continue;
            const key = (Math.round(marker.x) + 100000) * 100000 + Math.round(marker.y) + 100000;
            if (marked.has(key)) continue;
            marked.add(key);
            drawEdgeArrow(edges, marker.x, marker.y, marker.angle);
          }
          edgesDrawn = true;
        } else if (edgesDrawn) {
          edges.clear();
          marked.clear();
          edgesDrawn = false;
        }
      }

      if (!frameKeptEveryNode(keptNodes, live.length)) reclaimStale(live, frameGen, dropStale);
      app.render();
      paintedPrev = previous;
      paintedCur = current;
      paintedAlpha = alpha;
      pictureDirty = false;
    },
    resize(viewport: Viewport) {
      if (!app || !hostEl) return;
      pictureDirty = true;
      applyResolution();
      app.renderer.resize(viewport.width, viewport.height);
    },
    dispose() {
      for (let i = 0; i < live.length; i++) showOwned(live[i]!);
      for (let i = 0; i < spare.length; i++) showOwned(spare[i]!);
      epoch.cancel();
      nodes.clear();
      live.length = 0;
      spare.length = 0;
      slotNodes.length = 0;
      const application = app;
      app = null;
      world = null;
      ground = null;
      edges = null;
      hostEl = null;
      if (application) destroyApplication(application);
      releaseSharedContexts();
    },
  };
}
