import { describe, expect, it } from 'vitest';
import { ACHIEVEMENT_IDS, ENEMY_IDS, EVOLUTION_IDS, GUARDIAN_IDS, MAP_IDS, WEAPON_IDS } from './ids.js';
import { grantsForRun, type RunReport } from './progress.js';

function report(partial: Partial<RunReport>): RunReport {
  return {
    mapId: 'gaon',
    guardianId: 'asha',
    survivalSeconds: 10,
    level: 2,
    kills: 3,
    won: false,
    revivesUsed: 0,
    oathsActive: 0,
    evolutions: [],
    weapons: [{ id: 'talwar_arc', level: 1 }],
    passives: [],
    enemiesSeen: [],
    bossesSeen: [],
    bossClearedLowHp: false,
    bellDefeatedClean: false,
    levelBeforeMinute6: 1,
    weaponCountAtMinute8: -1,
    ...partial,
  };
}

describe('run grants', () => {
  it('pays each published achievement from a matching report, once', () => {
    const cases: Record<(typeof ACHIEVEMENT_IDS)[number], RunReport> = {
      first_watch: report({ survivalSeconds: 180 }),
      dawn_held: report({ won: true, mapId: 'gaon' }),
      green_silence: report({ won: true, mapId: 'van' }),
      across_glasswind: report({ won: true, mapId: 'marusthal' }),
      rampart_restored: report({ won: true, mapId: 'durg' }),
      close_call: report({ won: true, bossClearedLowHp: true }),
      untouched_bell: report({ bellDefeatedClean: true }),
      no_second_breath: report({ won: true, revivesUsed: 0 }),
      crescent_found: report({ evolutions: ['crescent_guard'] }),
      monsoon_found: report({ evolutions: ['monsoon_volley'] }),
      horizon_found: report({ evolutions: ['returning_horizon'] }),
      earthwake_found: report({ evolutions: ['earthwake'] }),
      ember_found: report({ evolutions: ['sevenfold_ember'] }),
      lattice_found: report({ evolutions: ['storm_lattice'] }),
      full_satchel: report({
        weapons: WEAPON_IDS.slice(0, 6).map((id) => ({ id, level: 1 })),
        passives: ['whetstone', 'runners_anklet', 'guard_plate', 'oil_flask', 'hunters_cord', 'wide_sash'].map(
          (id) => ({ id: id as RunReport['passives'][number]['id'], level: 1 }),
        ),
      }),
      single_purpose: report({ weaponCountAtMinute8: 1, survivalSeconds: 480 }),
      crowdkeeper: report({ kills: 1000 }),
      swift_watch: report({ levelBeforeMinute6: 20 }),
      every_path: report({
        won: true,
        guardianId: 'nila',
        priorGuardianClearMask: (1 << (GUARDIAN_IDS.length - 1)) - 1,
      }),
      oathbound_i: report({ won: true, oathsActive: 1 }),
      oathbound_iii: report({ won: true, oathsActive: 3 }),
      field_notes: report({ enemiesSeen: [...ENEMY_IDS] }),
      master_of_arms: report({
        weapons: [{ id: 'neel_trail', level: 8 }],
        priorWeaponLevel8Mask: (1 << (WEAPON_IDS.length - 1)) - 1,
      }),
      rakshak: report({
        won: true,
        mapId: 'durg',
        priorMapClears: MAP_IDS.slice(0, 3),
        evolutions: [...EVOLUTION_IDS],
      }),
    };

    for (const id of ACHIEVEMENT_IDS) {
      const first = grantsForRun(cases[id], new Set());
      expect(first.achievements, id).toContain(id);
      expect(first.achievementMarks).toBeGreaterThan(0);
      const second = grantsForRun(cases[id], new Set(first.achievements));
      expect(second.achievements, `${id} twice`).not.toContain(id);
    }
  });

  it('unlocks Veer after eight minutes in Gaon and Van after a Gaon clear', () => {
    const veer = grantsForRun(report({ mapId: 'gaon', survivalSeconds: 480, won: false }), new Set());
    expect(veer.guardians).toContain('veer');
    const van = grantsForRun(report({ mapId: 'gaon', won: true }), new Set());
    expect(van.maps).toContain('van');
  });
});
