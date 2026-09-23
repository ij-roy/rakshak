/** The sweep can wait when every live node was touched this frame. */
export function frameKeptEveryNode(touched: number, liveCount: number): boolean {
  return touched === liveCount;
}

/** Drops picture nodes the current frame did not touch, without scanning a map iterator. */
export function reclaimStale<T extends { gen: number }>(
  live: T[],
  frameGen: number,
  release: (node: T) => void,
): void {
  let index = 0;
  while (index < live.length) {
    const node = live[index]!;
    if (node.gen === frameGen) {
      index += 1;
      continue;
    }
    release(node);
    const last = live.pop();
    if (last && last !== node) live[index] = last;
  }
}
