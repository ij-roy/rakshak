import type { World } from './world/world.js';

/** FNV-1a 64-bit style checksum over authoritative gameplay state. */
export function computeChecksum(world: World): bigint {
  let hash = 0xcbf29ce484222325n;
  const mix = (v: number): void => {
    hash ^= BigInt(v >>> 0);
    hash = (hash * 0x100000001b3n) & 0xffffffffffffffffn;
  };

  mix(world.tick);
  mix(world.seed);
  mix(world.player.hp);
  mix(Math.floor(world.player.x * 1000));
  mix(Math.floor(world.player.y * 1000));
  mix(world.run.level);
  mix(world.run.xp);
  mix(world.run.kills);
  mix(world.run.outcome === 'ongoing' ? 0 : world.run.outcome === 'victory' ? 1 : 2);
  mix(world.enemies.activeCount);
  mix(world.projectiles.activeCount);
  mix(world.pickups.activeCount);
  mix(world.director.bossesSpawned);
  mix(world.weapons.length);
  for (const w of world.weapons) {
    mix(hashString(w.weaponId));
    mix(w.level);
    mix(w.evolved ? 1 : 0);
  }
  for (const p of world.passives) {
    mix(hashString(p.passiveId));
    mix(p.level);
  }

  world.enemies.forEachAlive((e) => {
    mix(e.id);
    mix(Math.floor(e.x * 100));
    mix(Math.floor(e.y * 100));
    mix(e.hp);
  });

  return hash;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
