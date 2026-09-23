const SLOTS = 1024;
const CAP = 300;

/** Uniform spatial hash for circle broadphase. Cells live in a fixed table. */
export class SpatialHash {
  readonly cellSize: number;
  private inv: number;
  private stamp = 1;
  private slotKey = new Int32Array(SLOTS);
  private slotGen = new Int32Array(SLOTS);
  private slotHead = new Int32Array(SLOTS);
  private next = new Int32Array(CAP);
  private indexes = new Int32Array(CAP);
  private count = 0;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.inv = 1 / cellSize;
  }

  clear(): void {
    this.count = 0;
    this.stamp += 1;
    if (this.stamp === 0x7fffffff) {
      this.slotGen.fill(0);
      this.stamp = 1;
    }
  }

  private key(cx: number, cy: number): number {
    return ((cx & 0xffff) << 16) | (cy & 0xffff);
  }

  private find(k: number, insert: boolean): number {
    let slot = (k >>> 0) & (SLOTS - 1);
    for (let n = 0; n < SLOTS; n++) {
      if (this.slotGen[slot] !== this.stamp) {
        if (!insert) return -1;
        this.slotGen[slot] = this.stamp;
        this.slotKey[slot] = k;
        this.slotHead[slot] = -1;
        return slot;
      }
      if (this.slotKey[slot] === k) return slot;
      slot = (slot + 1) & (SLOTS - 1);
    }
    return -1;
  }

  insert(entityIndex: number, x: number, y: number): void {
    if (this.count >= CAP) return;
    const slot = this.find(this.key(Math.floor(x * this.inv), Math.floor(y * this.inv)), true);
    if (slot < 0) return;
    const node = this.count++;
    this.next[node] = this.slotHead[slot]!;
    this.indexes[node] = entityIndex;
    this.slotHead[slot] = node;
  }

  /** Query neighbors in cells overlapping the circle. */
  query(x: number, y: number, radius: number, out: number[]): void {
    out.length = 0;
    const minCx = Math.floor((x - radius) * this.inv);
    const maxCx = Math.floor((x + radius) * this.inv);
    const minCy = Math.floor((y - radius) * this.inv);
    const maxCy = Math.floor((y + radius) * this.inv);
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const slot = this.find(this.key(cx, cy), false);
        if (slot < 0) continue;
        let node = this.slotHead[slot]!;
        while (node >= 0) {
          out.push(this.indexes[node]!);
          node = this.next[node]!;
        }
      }
    }
  }
}
