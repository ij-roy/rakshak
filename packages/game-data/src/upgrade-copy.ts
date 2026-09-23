import { SIM_HZ } from '@rakshak/shared';
import { BALANCE } from './balance.js';
import { EVOLUTION_BY_ID, EVOLUTION_BY_WEAPON } from './evolutions.js';
import { PASSIVE_BY_ID, type PassiveStat } from './passives.js';
import { WEAPON_BY_ID, type WeaponLevelStats } from './weapons.js';

export interface UpgradeExplanation {
  title: string;
  badge: 'New' | 'Upgrade' | 'Evolution';
  mark: string;
  behavior: string;
  stats: string[];
  slot: string;
  evolution: string;
}

const WEAPON_BEHAVIOR: Record<string, string> = {
  talwar_arc: 'Cuts a close arc in front of you.',
  dhanush_volley: 'Looses a volley of arrows.',
  chakra_return: 'Throws a disc that returns.',
  gada_quake: 'Slams the ground in a shock around you.',
  ember_kund: 'Leaves a burning pool on the ground.',
  monsoon_spark: 'Chains lightning between nearby foes.',
  spear_burst: 'Fires a burst of spears.',
  neel_trail: 'Leaves a damaging trail as you move.',
};

export function passiveBehaviorLine(stat: string): string {
  return PASSIVE_BEHAVIOR[stat as keyof typeof PASSIVE_BEHAVIOR] ?? 'A passive bonus.';
}

export function evolutionSpecialLine(special: string): string {
  return SPECIAL[special] ?? 'The weapon changes.';
}

export function weaponBehaviorLine(contentId: string): string {
  const weapon = WEAPON_BY_ID[contentId as keyof typeof WEAPON_BY_ID];
  return WEAPON_BEHAVIOR[weapon?.behavior ?? ''] ?? 'A weapon attack.';
}

const WEAPON_MARK: Record<string, string> = {
  talwar_arc: 'Arc',
  dhanush_volley: 'Bow',
  chakra_return: 'Disc',
  gada_quake: 'Slam',
  ember_kund: 'Fire',
  monsoon_spark: 'Bolt',
  spear_burst: 'Spear',
  neel_trail: 'Trail',
};

const PASSIVE_BEHAVIOR: Record<PassiveStat, string> = {
  weaponDamage: 'Raises the damage of every weapon you carry.',
  moveSpeed: 'You move faster.',
  armor: 'Each hit loses this much damage after other armor.',
  duration: 'Weapon effects last longer.',
  projectileSpeed: 'Projectiles travel faster.',
  area: 'Attacks and zones cover more ground.',
  pickupRadius: 'You collect drops from farther away.',
  cooldown: 'Weapons attack more often.',
};

const PASSIVE_MARK: Record<PassiveStat, string> = {
  weaponDamage: 'Dmg',
  moveSpeed: 'Run',
  armor: 'Arm',
  duration: 'Time',
  projectileSpeed: 'Spd',
  area: 'Area',
  pickupRadius: 'Bell',
  cooldown: 'Rate',
};

const SPECIAL: Record<string, string> = {
  full_circle_deflect: 'The arc becomes a full guarding circle.',
  piercing_fan: 'The volley becomes a piercing fan.',
  dual_orbit: 'A second disc orbits with the first.',
  shock_rings: 'The slam throws extra shock rings.',
  migrating_zones: 'The fire pools drift across the field.',
  reconnect_chains: 'The lightning reconnects as foes move.',
};

export function describeLevelChoice(input: {
  kind: 'weapon' | 'passive' | 'evolution';
  contentId: string;
  currentLevel: number;
  nextLevel: number;
  weaponCount: number;
  passiveCount: number;
  discoveredEvolutions: readonly string[];
}): UpgradeExplanation {
  if (input.kind === 'passive') return describePassive(input);
  if (input.kind === 'evolution') return describeEvolution(input.contentId);
  return describeWeapon(input);
}

function describeWeapon(input: {
  contentId: string;
  currentLevel: number;
  nextLevel: number;
  weaponCount: number;
  discoveredEvolutions: readonly string[];
}): UpgradeExplanation {
  const weapon = WEAPON_BY_ID[input.contentId as keyof typeof WEAPON_BY_ID];
  const title = weapon?.displayName ?? input.contentId;
  const isNew = input.currentLevel <= 0;
  const after = weapon?.levels[Math.max(0, input.nextLevel - 1)];
  const before = isNew ? null : weapon?.levels[Math.max(0, input.currentLevel - 1)];
  const pairing = weapon ? EVOLUTION_BY_WEAPON[weapon.id] : undefined;
  let evolution = 'This weapon does not evolve.';
  if (pairing) {
    const known = input.discoveredEvolutions.includes(pairing.id);
    evolution = known
      ? `With ${PASSIVE_BY_ID[pairing.requiredPassive].displayName}, this becomes ${pairing.displayName}.`
      : 'This weapon can evolve. You have not discovered the pairing yet.';
  }
  return {
    title,
    badge: isNew ? 'New' : 'Upgrade',
    mark: WEAPON_MARK[weapon?.behavior ?? ''] ?? 'Wpn',
    behavior: WEAPON_BEHAVIOR[weapon?.behavior ?? ''] ?? 'A weapon attack.',
    stats: after ? weaponStatLines(before ?? null, after) : [],
    slot: isNew
      ? `Takes a weapon slot (${Math.min(BALANCE.maxWeaponSlots, input.weaponCount + 1)}/${BALANCE.maxWeaponSlots}).`
      : 'Stays in its weapon slot.',
    evolution,
  };
}

function describePassive(input: {
  contentId: string;
  currentLevel: number;
  nextLevel: number;
  passiveCount: number;
}): UpgradeExplanation {
  const passive = PASSIVE_BY_ID[input.contentId as keyof typeof PASSIVE_BY_ID];
  const isNew = input.currentLevel <= 0;
  const stat = passive?.stat ?? 'weaponDamage';
  const perLevel = passive?.perLevel ?? 0;
  const before = bonus(stat, perLevel, input.currentLevel, passive?.hardCap);
  const after = bonus(stat, perLevel, input.nextLevel, passive?.hardCap);
  const label = passiveLabel(stat);
  const unit = stat === 'armor' ? '' : '%';
  const line =
    isNew
      ? `${label} +${formatBonus(after, stat)}${unit}${capNote(passive?.hardCap, stat)}`
      : `${label} ${formatBonus(before, stat)}${unit} → ${formatBonus(after, stat)}${unit}${capNote(passive?.hardCap, stat)}`;
  return {
    title: passive?.displayName ?? input.contentId,
    badge: isNew ? 'New' : 'Upgrade',
    mark: PASSIVE_MARK[stat],
    behavior: PASSIVE_BEHAVIOR[stat],
    stats: [line],
    slot: isNew
      ? `Takes a passive slot (${Math.min(BALANCE.maxPassiveSlots, input.passiveCount + 1)}/${BALANCE.maxPassiveSlots}).`
      : 'Stays in its passive slot.',
    evolution: 'Passives do not evolve. Some complete a weapon evolution.',
  };
}

function describeEvolution(contentId: string): UpgradeExplanation {
  const evolution = EVOLUTION_BY_ID[contentId as keyof typeof EVOLUTION_BY_ID];
  if (!evolution) {
    return {
      title: contentId,
      badge: 'Evolution',
      mark: 'Evo',
      behavior: 'Evolves a weapon you already hold.',
      stats: [],
      slot: 'Replaces that weapon in its slot.',
      evolution: 'The pairing is already in your build.',
    };
  }
  const passive = PASSIVE_BY_ID[evolution.requiredPassive].displayName;
  const stats = [`Damage ×${evolution.damageMult}`, `Area ×${evolution.areaMult}`];
  if (evolution.countBonus > 0) stats.push(`+${evolution.countBonus} extra hits`);
  return {
    title: evolution.displayName,
    badge: 'Evolution',
    mark: 'Evo',
    behavior: SPECIAL[evolution.special] ?? 'The weapon changes form.',
    stats,
    slot: 'Replaces the base weapon in its slot.',
    evolution: `Requires ${passive}, already in this build.`,
  };
}

function weaponStatLines(before: WeaponLevelStats | null, after: WeaponLevelStats): string[] {
  const fields: Array<[string, number, number, string]> = [
    ['Damage', before?.damage ?? after.damage, after.damage, ''],
    ['Cooldown', (before?.cooldownTicks ?? after.cooldownTicks) / SIM_HZ, after.cooldownTicks / SIM_HZ, 's'],
    ['Count', before?.count ?? after.count, after.count, ''],
    ['Area', before?.area ?? after.area, after.area, ''],
    ['Duration', (before?.durationTicks ?? after.durationTicks) / SIM_HZ, after.durationTicks / SIM_HZ, 's'],
  ];
  if (!before) {
    return fields
      .filter(([, , value]) => value > 0.05)
      .map(([label, , value, unit]) => `${label} ${num(value)}${unit}`);
  }
  return fields
    .filter(([, from, to]) => Math.abs(to - from) >= 0.05)
    .map(([label, from, to, unit]) => `${label} ${num(from)}${unit} → ${num(to)}${unit}`);
}

function bonus(stat: PassiveStat, perLevel: number, level: number, cap?: number): number {
  const raw = stat === 'armor' ? perLevel * level : perLevel * level * 100;
  if (cap == null) return raw;
  const capped = stat === 'armor' ? cap : cap * 100;
  return Math.min(raw, capped);
}

function formatBonus(value: number, stat: PassiveStat): string {
  return stat === 'armor' ? num(value) : String(Math.round(value));
}

function capNote(cap: number | undefined, stat: PassiveStat): string {
  if (cap == null) return '';
  return stat === 'armor' ? ` (cap ${cap})` : ` (cap ${Math.round(cap * 100)}%)`;
}

function passiveLabel(stat: PassiveStat): string {
  switch (stat) {
    case 'weaponDamage':
      return 'Weapon damage';
    case 'moveSpeed':
      return 'Move speed';
    case 'armor':
      return 'Armor';
    case 'duration':
      return 'Duration';
    case 'projectileSpeed':
      return 'Projectile speed';
    case 'area':
      return 'Area';
    case 'pickupRadius':
      return 'Pickup radius';
    case 'cooldown':
      return 'Attack rate';
  }
}

function num(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
