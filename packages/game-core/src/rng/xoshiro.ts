/**
 * xoshiro128** PRNG — public-domain algorithm by Blackman & Vigna.
 * Uses unsigned 32-bit arithmetic stable across JS engines.
 * Reference: https://prng.di.unimi.it/ (public domain / CC0).
 */
export class Xoshiro128StarStar {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(seed: number) {
    // SplitMix32 seeding from a single 32-bit seed.
    let z = seed >>> 0;
    const next = (): number => {
      z = (z + 0x9e3779b9) >>> 0;
      let t = z;
      t = Math.imul(t ^ (t >>> 16), 0x85ebca6b);
      t = Math.imul(t ^ (t >>> 13), 0xc2b2ae35);
      return (t ^ (t >>> 16)) >>> 0;
    };
    this.s0 = next();
    this.s1 = next();
    this.s2 = next();
    this.s3 = next();
    // Avoid all-zero state.
    if ((this.s0 | this.s1 | this.s2 | this.s3) === 0) {
      this.s0 = 0x9e3779b9;
      this.s1 = 0x6c078965;
      this.s2 = 0x61c88647;
      this.s3 = 0x517cc1b7;
    }
  }

  /** Next uint32. */
  nextU32(): number {
    const result = Math.imul(rotl(Math.imul(this.s1, 5), 7), 9) >>> 0;
    const t = this.s1 << 9;
    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    this.s2 ^= t;
    this.s3 = rotl(this.s3, 11);
    return result;
  }

  /** Float in [0, 1). */
  nextFloat(): number {
    return (this.nextU32() >>> 0) / 0x100000000;
  }

  /** Inclusive integer range [min, max]. */
  nextInt(min: number, max: number): number {
    if (max <= min) return min;
    const span = (max - min + 1) >>> 0;
    return min + (this.nextU32() % span);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Xoshiro128StarStar.pick: empty array');
    }
    return items[this.nextInt(0, items.length - 1)]!;
  }

  getState(): readonly [number, number, number, number] {
    return [this.s0, this.s1, this.s2, this.s3];
  }

  setState(state: readonly [number, number, number, number]): void {
    this.s0 = state[0] >>> 0;
    this.s1 = state[1] >>> 0;
    this.s2 = state[2] >>> 0;
    this.s3 = state[3] >>> 0;
  }
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}
