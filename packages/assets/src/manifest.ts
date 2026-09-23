import type { AssetManifest, AssetRecord } from './types.js';

const ORIGINAL_LICENSE = {
  status: 'approved' as const,
  creator: 'RAKSHAK original procedural',
  license: 'All Rights Reserved / project original',
  sourceUrl: 'procedural://rakshak/original',
  attribution: 'RAKSHAK — original procedural asset',
  reviewer: 'implementation-bootstrap',
};

function proc(
  id: string,
  kind: AssetRecord['kind'],
  path: string,
  preloadGroup: AssetRecord['preloadGroup'],
  size?: { width: number; height: number },
): AssetRecord {
  return {
    id,
    kind,
    path,
    preloadGroup,
    contentHash: `proc-${id}`,
    ...(size ?? {}),
    license: ORIGINAL_LICENSE,
  };
}

/** Approved original procedural sprites owned by the project (D008). */
export const APPROVED_PROCEDURAL_ASSETS: readonly AssetRecord[] = [
  proc('guardian_asha', 'procedural', 'procedural/guardians/asha.json', 'gameplay', { width: 16, height: 16 }),
  proc('guardian_veer', 'procedural', 'procedural/guardians/veer.json', 'gameplay', { width: 16, height: 16 }),
  proc('guardian_tara', 'procedural', 'procedural/guardians/tara.json', 'gameplay', { width: 16, height: 16 }),
  proc('guardian_nila', 'procedural', 'procedural/guardians/nila.json', 'gameplay', { width: 16, height: 16 }),
  proc('weapon_talwar_arc', 'procedural', 'procedural/weapons/talwar_arc.json', 'gameplay', { width: 16, height: 16 }),
  proc('weapon_dhanush_volley', 'procedural', 'procedural/weapons/dhanush_volley.json', 'gameplay', { width: 16, height: 16 }),
  proc('weapon_chakra_return', 'procedural', 'procedural/weapons/chakra_return.json', 'gameplay', { width: 16, height: 16 }),
  proc('weapon_gada_quake', 'procedural', 'procedural/weapons/gada_quake.json', 'gameplay', { width: 16, height: 16 }),
  proc('weapon_ember_kund', 'procedural', 'procedural/weapons/ember_kund.json', 'gameplay', { width: 16, height: 16 }),
  proc('weapon_monsoon_spark', 'procedural', 'procedural/weapons/monsoon_spark.json', 'gameplay', { width: 16, height: 16 }),
  proc('weapon_spear_burst', 'procedural', 'procedural/weapons/spear_burst.json', 'gameplay', { width: 16, height: 16 }),
  proc('weapon_neel_trail', 'procedural', 'procedural/weapons/neel_trail.json', 'gameplay', { width: 16, height: 16 }),
  proc('enemy_chhaya_drifter', 'procedural', 'procedural/enemies/chhaya_drifter.json', 'gameplay', { width: 16, height: 16 }),
  proc('boss_bell_warden', 'procedural', 'procedural/bosses/bell_warden.json', 'gameplay', { width: 32, height: 32 }),
  proc('map_gaon_tiles', 'procedural', 'procedural/maps/gaon_tiles.json', 'map', { width: 16, height: 16 }),
  proc('ui_xp_pip', 'procedural', 'procedural/ui/xp_pip.json', 'ui', { width: 8, height: 8 }),
  proc('ui_health_bar', 'procedural', 'procedural/ui/health_bar.json', 'ui', { width: 64, height: 8 }),
  proc('fx_hit_spark', 'procedural', 'procedural/fx/hit_spark.json', 'gameplay', { width: 8, height: 8 }),
  proc('audio_hit_light', 'procedural', 'procedural/audio/hit_light.json', 'audio'),
  proc('audio_level_up', 'procedural', 'procedural/audio/level_up.json', 'audio'),
  proc('audio_boss_motif', 'procedural', 'procedural/audio/boss_motif.json', 'audio'),
  proc('font_hud_bitmap', 'procedural', 'procedural/fonts/hud_bitmap.json', 'boot'),
];

export const ASSET_MANIFEST: AssetManifest = {
  version: '1.0.0',
  generatedAt: '2026-09-23T00:00:00.000Z',
  assets: APPROVED_PROCEDURAL_ASSETS,
};
