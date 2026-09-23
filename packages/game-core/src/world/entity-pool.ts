/** Dense pooled slots with stable entity IDs. */
export class EntityPool<T extends { id: number; alive: boolean }> {
  readonly capacity: number;
  readonly items: T[];
  private free: number[] = [];
  private live: number[] = [];
  private liveAt: number[];
  private nextId = 1;
  activeCount = 0;

  constructor(capacity: number, factory: (index: number) => T) {
    this.capacity = capacity;
    this.items = new Array(capacity);
    this.liveAt = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.items[i] = factory(i);
      this.liveAt[i] = -1;
      this.free.push(i);
    }
  }

  /** Slot indexes that are alive. Valid until the next take or release. */
  liveIndexes(): readonly number[] {
    return this.live;
  }

  private activate(slot: number): void {
    this.liveAt[slot] = this.live.length;
    this.live.push(slot);
  }

  private deactivate(slot: number): void {
    const pos = this.liveAt[slot] ?? -1;
    if (pos < 0) return;
    const last = this.live.pop();
    if (last !== undefined && last !== slot) {
      this.live[pos] = last;
      this.liveAt[last] = pos;
    }
    this.liveAt[slot] = -1;
  }

  /** Claims a free slot without a per-call callback. The caller fills the record. */
  take(): T | null {
    const slot = this.free.pop();
    if (slot === undefined) return null;
    const item = this.items[slot]!;
    item.id = this.nextId++;
    item.alive = true;
    this.activeCount++;
    this.activate(slot);
    return item;
  }

  acquire(init: (item: T) => void): T | null {
    const item = this.take();
    if (!item) return null;
    init(item);
    return item;
  }

  release(item: T): void {
    if (!item.alive) return;
    item.alive = false;
    this.activeCount--;
    // Find slot by reference (pools are small enough; hot path uses index when known).
    const idx = this.items.indexOf(item);
    if (idx >= 0) {
      this.deactivate(idx);
      this.free.push(idx);
    }
  }

  releaseAt(index: number): void {
    const item = this.items[index];
    if (!item || !item.alive) return;
    item.alive = false;
    this.activeCount--;
    this.deactivate(index);
    this.free.push(index);
  }

  clear(): void {
    this.free.length = 0;
    this.live.length = 0;
    this.activeCount = 0;
    for (let i = 0; i < this.capacity; i++) {
      const item = this.items[i]!;
      item.alive = false;
      this.liveAt[i] = -1;
      this.free.push(i);
    }
  }

  peekNextId(): number {
    return this.nextId;
  }

  /** Replace living entities for checkpoint resume. `copies` must already be alive-shaped. */
  replaceAlive(nextId: number, copies: T[]): void {
    this.clear();
    this.nextId = Math.max(1, nextId);
    for (const copy of copies) {
      const slot = this.free.pop();
      if (slot === undefined) return;
      const item = this.items[slot]!;
      Object.assign(item, copy);
      item.alive = true;
      this.activeCount++;
      this.activate(slot);
    }
  }

  forEachAlive(fn: (item: T, index: number) => void): void {
    for (let i = 0; i < this.capacity; i++) {
      const item = this.items[i]!;
      if (item.alive) fn(item, i);
    }
  }
}
