/** Whether a picture mark may be added on this frame. */
export function admitSprite(urgent: boolean, exists: boolean, created: number, budget: number): 'skip' | 'reuse' | 'create' {
  if (exists) return 'reuse';
  if (!urgent && created >= budget) return 'skip';
  return 'create';
}

/** Off-screen arrows are only for bosses and elites. Ordinary bodies stay unmarked. */
export function wantsEdgeMarker(kind: string): boolean {
  return kind === 'boss' || kind === 'elite';
}

export function noteEdgeSprite(kind: string, index: number, out: number[]): void {
  if (wantsEdgeMarker(kind)) out.push(index);
}

/** Hidden marks leave the picture a few at a time so one frame does not detach the whole crowd. */
export function offscreenPicture(hasParent: boolean, detached: number, budget = 24): 'hide' | 'detach' {
  if (hasParent && detached < budget) return 'detach';
  return 'hide';
}

/** Edge arrows are rebuilt only when a boss, an elite, or a hostile warning can sit outside the view. */
export function needsEdgePass(edgeCount: number, hostileTelegraphs: number): boolean {
  return edgeCount > 0 || hostileTelegraphs > 0;
}

/** A mark that stayed in the same picture slot is reused without hashing the crowd. */
export function recallSlot<T extends { key: number }>(
  slots: Array<T | undefined>,
  index: number,
  key: number,
  lookup: (key: number) => T | undefined,
): T | undefined {
  const slotted = slots[index];
  if (slotted && slotted.key === key) return slotted;
  const found = lookup(key);
  slots[index] = found;
  return found;
}
