import { ENEMY_BY_ID, ENEMIES } from './enemies.js';
import { EVOLUTIONS } from './evolutions.js';
import type { MapId } from './ids.js';
import { MAPS } from './maps.js';
import { PASSIVE_BY_ID, PASSIVES, type PassiveDef } from './passives.js';
import { describeMapChoice } from './selection.js';
import { evolutionSpecialLine, passiveBehaviorLine, weaponBehaviorLine } from './upgrade-copy.js';
import { WEAPON_BY_ID, WEAPONS } from './weapons.js';

export type CollectionCategory = 'weapons' | 'passives' | 'evolutions' | 'foes' | 'lore';

export interface DiscoveryView {
  readonly weapons: readonly string[];
  readonly passives: readonly string[];
  readonly evolutions: readonly string[];
  readonly enemies: readonly string[];
  readonly clears: Partial<Record<MapId, number>>;
}

export interface CollectionEntry {
  readonly id: string;
  readonly category: CollectionCategory;
  readonly known: boolean;
  readonly title: string;
  readonly mark: string;
  readonly detail: string;
  readonly stats: string;
  readonly recipe: string | null;
}

const ROLE: Record<string, string> = {
  pursuer: 'It chases you.',
  runner: 'It closes quickly.',
  armored: 'It soaks hits.',
  ranged: 'It fires from a distance.',
  burrower: 'It comes up from the ground.',
  leaper: 'It jumps in.',
  buffer: 'It strengthens nearby foes.',
  slow_field: 'It lays a slowing field.',
  shielded: 'A facing shield blocks hits.',
  swarm: 'It arrives in a group.',
  path_mirror: 'It copies your path.',
  death_patch: 'It leaves a patch when it falls.',
  charger: 'It charges in a line.',
  sentry: 'It holds one place and fires.',
  aura: 'It bolsters nearby foes.',
  bruiser: 'It hits hard up close.',
};

function has(ids: readonly string[], id: string): boolean {
  return ids.includes(id);
}

function passiveRank(def: PassiveDef): string {
  if (def.stat === 'armor') return `Each rank adds ${def.perLevel} armor, up to ${def.hardCap}.`;
  const percent = Math.round(def.perLevel * 100);
  if (def.stat === 'cooldown') {
    return `Each rank shortens the wait by ${percent}%, up to ${Math.round((def.hardCap ?? 0) * 100)}%.`;
  }
  return `Each rank adds +${percent}%.`;
}

function weaponRecipe(weaponId: string, discoveredEvolutions: readonly string[]): string | null {
  const weapon = WEAPON_BY_ID[weaponId as keyof typeof WEAPON_BY_ID];
  if (!weapon?.hasEvolution) return 'This weapon does not evolve.';
  const evolution = EVOLUTIONS.find((item) => item.baseWeapon === weapon.id);
  if (!evolution || !has(discoveredEvolutions, evolution.id)) {
    return 'This weapon can evolve. You have not discovered the pairing yet.';
  }
  const passive = PASSIVE_BY_ID[evolution.requiredPassive];
  return `${weapon.displayName} with ${passive.displayName} becomes ${evolution.displayName}. ${evolutionSpecialLine(evolution.special)}`;
}

export function collectionEntries(category: CollectionCategory, discovery: DiscoveryView): readonly CollectionEntry[] {
  if (category === 'weapons') {
    return WEAPONS.map((weapon) => {
      const known = has(discovery.weapons, weapon.id);
      const level = weapon.levels[0];
      return {
        id: weapon.id,
        category,
        known,
        title: known ? weapon.displayName : 'Unknown weapon',
        mark: known ? weapon.displayName.slice(0, 1) : '·',
        detail: known ? weaponBehaviorLine(weapon.id) : 'Its name stays hidden until a level-up offer includes it.',
        stats: known && level ? `Level 1 damage ${Math.round(level.damage)}. Cooldown ${level.cooldownTicks} ticks.` : '',
        recipe: known ? weaponRecipe(weapon.id, discovery.evolutions) : null,
      };
    });
  }
  if (category === 'passives') {
    return PASSIVES.map((passive) => {
      const known = has(discovery.passives, passive.id);
      return {
        id: passive.id,
        category,
        known,
        title: known ? passive.displayName : 'Unknown passive',
        mark: known ? passive.displayName.slice(0, 1) : '·',
        detail: known ? passiveBehaviorLine(passive.stat) : 'Its name stays hidden until a level-up offer includes it.',
        stats: known ? passiveRank(passive) : '',
        recipe: null,
      };
    });
  }
  if (category === 'evolutions') {
    return EVOLUTIONS.map((evolution) => {
      const known = has(discovery.evolutions, evolution.id);
      const weapon = WEAPON_BY_ID[evolution.baseWeapon];
      const passive = PASSIVE_BY_ID[evolution.requiredPassive];
      return {
        id: evolution.id,
        category,
        known,
        title: known ? evolution.displayName : 'Hidden pairing',
        mark: known ? evolution.displayName.slice(0, 1) : '·',
        detail: known ? evolutionSpecialLine(evolution.special) : 'A weapon and a passive combine after you find them.',
        stats: known ? `Damage ×${evolution.damageMult}. Area ×${evolution.areaMult}.` : '',
        recipe: known ? `${weapon.displayName} with ${passive.displayName} becomes ${evolution.displayName}.` : null,
      };
    });
  }
  if (category === 'foes') {
    return ENEMIES.map((enemy) => {
      const known = has(discovery.enemies, enemy.id);
      const full = ENEMY_BY_ID[enemy.id];
      return {
        id: enemy.id,
        category,
        known,
        title: known ? full.displayName : 'Unseen foe',
        mark: known ? full.displayName.slice(0, 1) : '·',
        detail: known ? (ROLE[full.role] ?? 'A foe on the field.') : 'Its name stays hidden until you meet it.',
        stats: known ? `${full.maxHp} health. Contact ${full.contactDamage}.` : '',
        recipe: null,
      };
    });
  }
  return MAPS.map((map) => {
    const known = (discovery.clears[map.id] ?? 0) > 0;
    const preview = describeMapChoice(map.id);
    return {
      id: map.id,
      category,
      known,
      title: known ? `${map.displayName} note` : map.displayName,
      mark: known ? map.displayName.slice(0, 1) : '·',
      detail: known ? `${preview.subtitle}. ${preview.hazard} ${preview.expectation}` : `Clear ${map.displayName} to record this note.`,
      stats: '',
      recipe: null,
    };
  });
}

export function collectionCount(category: CollectionCategory, discovery: DiscoveryView): { known: number; total: number } {
  const entries = collectionEntries(category, discovery);
  return { known: entries.filter((entry) => entry.known).length, total: entries.length };
}

export function collectionEntry(category: CollectionCategory, id: string, discovery: DiscoveryView): CollectionEntry | undefined {
  return collectionEntries(category, discovery).find((entry) => entry.id === id);
}
