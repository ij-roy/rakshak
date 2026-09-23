/** A paused watch can keep the picture it already drew. A new blend still has to draw. */
export function pictureUnchanged(
  previous: object,
  current: object,
  alpha: number,
  paintedPrevious: object | null,
  paintedCurrent: object | null,
  paintedAlpha: number,
): boolean {
  return previous === paintedPrevious && current === paintedCurrent && alpha === paintedAlpha;
}
