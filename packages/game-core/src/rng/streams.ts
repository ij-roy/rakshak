import { Xoshiro128StarStar } from './xoshiro.js';

export type RngStreamName = 'spawn' | 'upgrade' | 'loot' | 'cosmetic';

const STREAM_SALTS: Record<RngStreamName, number> = {
  spawn: 0x51aa_f0e1,
  upgrade: 0x62bb_1a72,
  loot: 0x73cc_2b83,
  cosmetic: 0x84dd_3c94,
};

export class NamedRngStreams {
  readonly spawn: Xoshiro128StarStar;
  readonly upgrade: Xoshiro128StarStar;
  readonly loot: Xoshiro128StarStar;
  readonly cosmetic: Xoshiro128StarStar;

  constructor(seed: number) {
    const s = seed >>> 0;
    this.spawn = new Xoshiro128StarStar((s ^ STREAM_SALTS.spawn) >>> 0);
    this.upgrade = new Xoshiro128StarStar((s ^ STREAM_SALTS.upgrade) >>> 0);
    this.loot = new Xoshiro128StarStar((s ^ STREAM_SALTS.loot) >>> 0);
    this.cosmetic = new Xoshiro128StarStar((s ^ STREAM_SALTS.cosmetic) >>> 0);
  }

  stream(name: RngStreamName): Xoshiro128StarStar {
    return this[name];
  }
}
