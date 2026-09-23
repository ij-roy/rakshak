import {
  BALANCE,
  EVOLUTION_BY_WEAPON,
  GUARDIAN_BY_ID,
  PASSIVE_BY_ID,
  type GuardianId,
  type MetaTrackId,
  metaBonus,
} from '@rakshak/game-data';
import type { PassiveSlot, PlayerState, WeaponSlot, World } from '../world/world.js';

export function initPlayerFromGuardian(
  world: World,
  guardianId: GuardianId,
  meta: Partial<Record<MetaTrackId, number>> = {},
): void {
  const g = GUARDIAN_BY_ID[guardianId];
  world.guardianId = guardianId;
  const p = world.player;
  const hpBonus = 1 + metaBonus('vitality', meta.vitality ?? 0);
  const armorBonus = metaBonus('guard', meta.guard ?? 0) * 4;
  const speedBonus = 1 + metaBonus('footwork', meta.footwork ?? 0);
  const dmgBonus = 1 + metaBonus('force', meta.force ?? 0);
  const cdBonus = 1 - Math.min(BALANCE.cooldownReductionCap, metaBonus('focus', meta.focus ?? 0));
  const luckBonus = metaBonus('fortune', meta.fortune ?? 0);

  p.maxHp = Math.round(g.maxHp * hpBonus);
  p.hp = p.maxHp;
  p.moveSpeed = g.moveSpeed * speedBonus;
  p.armorPct = g.armorPct;
  p.armorFlat = Math.min(BALANCE.armorFlatCap, armorBonus);
  p.pickupRadius = g.pickupRadius;
  p.damageMult = dmgBonus;
  p.areaMult = g.areaMult;
  p.cooldownMult = g.cooldownMult * cdBonus;
  p.luck = luckBonus;
  p.durationMult = 1;
  p.projectileSpeedMult = 1;
  p.x = 0;
  p.y = 0;
  p.invulnUntil = 0;
  p.ashaHitCounter = 0;
  p.ashaSpeedUntil = 0;

  world.weapons = [
    {
      weaponId: g.startWeapon,
      level: 1,
      cooldown: 0,
      evolved: false,
      evolutionId: null,
    },
  ];
  world.passives = [];
}

export function recomputeDerivedStats(world: World): void {
  const g = GUARDIAN_BY_ID[world.guardianId];
  const p = world.player;
  let damage = 1;
  let move = 1;
  let armorFlat = p.armorFlat;
  let duration = 1;
  let projSpeed = 1;
  let area = g.areaMult;
  let pickup = g.pickupRadius;
  let cooldown = g.cooldownMult;

  for (const slot of world.passives) {
    const def = PASSIVE_BY_ID[slot.passiveId];
    const v = def.perLevel * slot.level;
    switch (def.stat) {
      case 'weaponDamage':
        damage += v;
        break;
      case 'moveSpeed':
        move += v;
        break;
      case 'armor':
        armorFlat = Math.min(def.hardCap ?? BALANCE.armorFlatCap, armorFlat + v);
        break;
      case 'duration':
        duration += v;
        break;
      case 'projectileSpeed':
        projSpeed += v;
        break;
      case 'area':
        area *= 1 + v;
        break;
      case 'pickupRadius':
        pickup *= 1 + v;
        break;
      case 'cooldown':
        cooldown *= 1 - Math.min(def.hardCap ?? BALANCE.cooldownReductionCap, v);
        break;
    }
  }

  p.damageMult = damage;
  p.moveSpeed = g.moveSpeed * move;
  p.armorFlat = armorFlat;
  p.durationMult = duration;
  p.projectileSpeedMult = projSpeed;
  p.areaMult = area;
  p.pickupRadius = pickup;
  p.cooldownMult = cooldown;
}

export function tryMarkEvolution(world: World, weapon: WeaponSlot): boolean {
  if (weapon.evolved || weapon.level < 8) return false;
  const evo = EVOLUTION_BY_WEAPON[weapon.weaponId];
  if (!evo) return false;
  const hasPassive = world.passives.some((p) => p.passiveId === evo.requiredPassive);
  if (!hasPassive) return false;
  if (!world.offer.chestEvolutionReady) return false;
  weapon.evolved = true;
  weapon.evolutionId = evo.id;
  world.offer.chestEvolutionReady = false;
  world.pushEvent({
    kind: 'evolution_unlocked',
    tick: world.tick,
    evolutionId: evo.id,
  });
  return true;
}

export function getWeaponSlot(world: World, weaponId: string): WeaponSlot | undefined {
  return world.weapons.find((w) => w.weaponId === weaponId);
}

export function getPassiveSlot(world: World, passiveId: string): PassiveSlot | undefined {
  return world.passives.find((p) => p.passiveId === passiveId);
}

export function effectiveMoveSpeed(player: PlayerState, tick: number): number {
  let speed = player.moveSpeed;
  if (tick < player.ashaSpeedUntil) speed *= 1.15;
  return speed;
}
