import {
  ACHIEVEMENT_BY_ID,
  GUARDIAN_BY_ID,
  MAP_BY_ID,
  MAPS,
  PASSIVE_BY_ID,
  WEAPON_BY_ID,
  type MapId,
  type RunReport,
} from '@rakshak/game-data';
import { evaluateRun } from './settle-run.js';
import { markParts } from './run-result.js';
import type { SaveFileV1 } from './schema.js';

export interface RunOutcomeSummary {
  title: string;
  flavor: string;
  timeMarks: number;
  killMarks: number;
  victoryMarks: number;
  achievementMarks: number;
  totalMarks: number;
  markLines: string[];
  unlocks: string[];
  build: string[];
  recordLine: string;
  damageLine: string;
  nextStep: 'retry' | 'next-map';
  nextMapId: MapId | null;
  nextMapName: string | null;
}

function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

/** What the results screen shows. The mark total matches the currency settleRun adds. */
export function describeRunOutcome(save: SaveFileV1, report: RunReport): RunOutcomeSummary {
  const { grant, marks } = evaluateRun(save, report);
  const parts = markParts(report);
  const achievementNames = grant.achievements.map((id) => ACHIEVEMENT_BY_ID[id].displayName);
  const markLines = [
    `${parts.time} for surviving ${clock(report.survivalSeconds)}`,
    `${parts.kills} for ${report.kills} fallen`,
  ];
  if (report.won) markLines.push(`${parts.victory} for holding until dawn`);
  if (grant.achievementMarks > 0) {
    markLines.push(`${grant.achievementMarks} from ${achievementNames.join(', ')}`);
  }

  const newMaps = grant.maps.filter((id) => !save.unlocks.maps.includes(id));
  const newGuardians = grant.guardians.filter((id) => !save.unlocks.characters.includes(id));
  const unlocks = [
    ...newMaps.map((id) => MAP_BY_ID[id].displayName),
    ...newGuardians.map((id) => GUARDIAN_BY_ID[id].displayName),
    ...achievementNames,
  ];

  const build = [
    ...report.weapons.map((weapon) => `${WEAPON_BY_ID[weapon.id].displayName} ${weapon.level}`),
    ...report.passives.map((passive) => `${PASSIVE_BY_ID[passive.id].displayName} ${passive.level}`),
  ];

  const previous = save.records[report.mapId]?.bestTimeSeconds ?? null;
  const recordLine = !report.won
    ? previous == null
      ? 'No clear on this map yet.'
      : `Best clear remains ${clock(previous)}.`
    : previous == null || report.survivalSeconds < previous
      ? `New best clear: ${clock(report.survivalSeconds)}.`
      : `Best clear remains ${clock(previous)}.`;

  const next = MAPS.find((map) => map.unlockAfter === report.mapId);
  const nextUnlocked = Boolean(next && (newMaps.includes(next.id) || save.unlocks.maps.includes(next.id)));
  const offerNext = Boolean(report.won && next && nextUnlocked);

  return {
    title: report.won ? 'Dawn reached the beacon.' : 'The night held.',
    flavor: report.won
      ? offerNext
        ? `${MAP_BY_ID[report.mapId].displayName} is clear. ${next?.displayName} is open.`
        : `${MAP_BY_ID[report.mapId].displayName} is clear.`
      : 'You fell before dawn. Marks from this watch still count.',
    timeMarks: parts.time,
    killMarks: parts.kills,
    victoryMarks: parts.victory,
    achievementMarks: grant.achievementMarks,
    totalMarks: marks,
    markLines,
    unlocks,
    build,
    recordLine,
    damageLine: `Damage taken ${Math.round(report.damageTaken ?? 0)}.`,
    nextStep: offerNext ? 'next-map' : 'retry',
    nextMapId: offerNext && next ? next.id : null,
    nextMapName: offerNext && next ? next.displayName : null,
  };
}
