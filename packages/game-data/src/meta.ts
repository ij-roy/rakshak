import type { MetaTrackId } from './ids.js';
import { META_TRACK_IDS } from './ids.js';

export interface MetaRankDef {
  readonly rank: number;
  readonly cost: number;
  readonly effect: number;
}

export interface MetaTrackDef {
  readonly id: MetaTrackId;
  readonly displayName: string;
  readonly stat: 'maxHp' | 'armor' | 'moveSpeed' | 'damage' | 'cooldown' | 'luck';
  readonly ranks: readonly MetaRankDef[];
}

const RANK_COSTS = [20, 35, 55, 80, 120] as const;
const RANK_EFFECTS = [0.03, 0.03, 0.04, 0.05, 0.05] as const;

function ranks(): readonly MetaRankDef[] {
  return RANK_COSTS.map((cost, i) => ({
    rank: i + 1,
    cost,
    effect: RANK_EFFECTS[i]!,
  }));
}

export const META_TRACKS: readonly MetaTrackDef[] = [
  { id: 'vitality', displayName: 'Vitality', stat: 'maxHp', ranks: ranks() },
  { id: 'guard', displayName: 'Guard', stat: 'armor', ranks: ranks() },
  { id: 'footwork', displayName: 'Footwork', stat: 'moveSpeed', ranks: ranks() },
  { id: 'force', displayName: 'Force', stat: 'damage', ranks: ranks() },
  { id: 'focus', displayName: 'Focus', stat: 'cooldown', ranks: ranks() },
  { id: 'fortune', displayName: 'Fortune', stat: 'luck', ranks: ranks() },
] as const;

export const META_TRACK_BY_ID: Readonly<Record<MetaTrackId, MetaTrackDef>> = Object.fromEntries(
  META_TRACKS.map((t) => [t.id, t]),
) as Readonly<Record<MetaTrackId, MetaTrackDef>>;

export function metaBonus(
  trackId: MetaTrackId,
  purchasedRanks: number,
): number {
  const track = META_TRACK_BY_ID[trackId];
  let sum = 0;
  for (let i = 0; i < purchasedRanks && i < track.ranks.length; i++) {
    sum += track.ranks[i]!.effect;
  }
  return sum;
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function effectLine(stat: MetaTrackDef['stat'], effect: number): string {
  if (stat === 'maxHp') return `${percent(effect)} maximum health`;
  if (stat === 'armor') return `${(effect * 4).toFixed(2)} armor`;
  if (stat === 'moveSpeed') return `${percent(effect)} move speed`;
  if (stat === 'damage') return `${percent(effect)} damage`;
  if (stat === 'cooldown') return `${percent(effect)} shorter cooldown`;
  return `${effect.toFixed(2)} luck`;
}

export interface MetaOfferCopy {
  readonly currentText: string;
  readonly nextText: string;
  readonly affordable: boolean;
  readonly capped: boolean;
  readonly cost: number | null;
}

/** Exact current bonus, next delta, cost, and the balance after a purchase. */
export function describeMetaOffer(trackId: MetaTrackId, rank: number, currency: number): MetaOfferCopy {
  const track = META_TRACK_BY_ID[trackId];
  const current = metaBonus(trackId, rank);
  const currentText = current === 0 ? 'No bonus yet.' : `Current bonus ${effectLine(track.stat, current)}.`;
  if (rank >= track.ranks.length) {
    return { currentText, nextText: 'Capped.', affordable: false, capped: true, cost: null };
  }
  const next = track.ranks[rank]!;
  const affordable = currency >= next.cost;
  const nextText = affordable
    ? `Next rank +${effectLine(track.stat, next.effect)} for ${next.cost} marks. Balance afterward: ${currency - next.cost}.`
    : `Next rank +${effectLine(track.stat, next.effect)} costs ${next.cost} marks. You have ${currency}.`;
  return { currentText, nextText, affordable, capped: false, cost: next.cost };
}

export function metaSpent(upgrades: Readonly<Partial<Record<MetaTrackId, number>>>): number {
  let spent = 0;
  for (const track of META_TRACKS) {
    const rank = upgrades[track.id] ?? 0;
    for (let i = 0; i < rank && i < track.ranks.length; i += 1) spent += track.ranks[i]!.cost;
  }
  return spent;
}

export function totalMetaPower(upgrades: Readonly<Partial<Record<MetaTrackId, number>>>): number {
  let sum = 0;
  for (const id of META_TRACK_IDS) {
    sum += metaBonus(id, upgrades[id] ?? 0);
  }
  return sum;
}
