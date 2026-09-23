/** The first pause or boss defeat in a step, in the order the events were written. */
export function firstCheckpoint(events: readonly { kind: string }[]): 'pause' | 'boss' | null {
  for (let i = 0; i < events.length; i++) {
    const kind = events[i]!.kind;
    if (kind === 'paused') return 'pause';
    if (kind === 'boss_defeated') return 'boss';
  }
  return null;
}
