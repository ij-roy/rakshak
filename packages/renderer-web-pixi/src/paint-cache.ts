import { resolveSpriteTint, silhouetteFor, type SilhouetteShape } from '@rakshak/game-protocol';

export interface PaintCache {
  paintKind?: string;
  paintContent?: string;
  paintShape?: SilhouetteShape;
  paintTint?: number;
  sourceTint?: number;
}

export interface PaintResult {
  shape: SilhouetteShape;
  tint: number;
}

/** Reuses a silhouette once kind, content, and tint are unchanged. Writes into `out`. */
export function cachedPaint(node: PaintCache, kind: string, contentId: string, tint: number, out: PaintResult): PaintResult {
  if (
    node.paintKind === kind &&
    node.paintContent === contentId &&
    node.sourceTint === tint &&
    node.paintShape !== undefined &&
    node.paintTint !== undefined
  ) {
    out.shape = node.paintShape;
    out.tint = node.paintTint;
    return out;
  }
  out.shape = silhouetteFor(kind, contentId);
  out.tint = resolveSpriteTint(out.shape, tint);
  return out;
}
