import { applyVolumeSettings, createWebProceduralAudio, type CueId } from '@rakshak/audio';
import type { SaveFileV1 } from '@rakshak/storage';

let port: ReturnType<typeof createWebProceduralAudio> | null = null;
let ambienceTimer = 0;

function audio() {
  if (!port) port = createWebProceduralAudio();
  return port;
}

export async function previewSettingsCue(settings: SaveFileV1['settings'], cue: CueId) {
  const next = audio();
  await next.unlock();
  applyVolumeSettings(next, settings);
  next.play(cue);
}

export async function previewNightTone(settings: SaveFileV1['settings']) {
  const next = audio();
  await next.unlock();
  applyVolumeSettings(next, settings);
  next.startAmbience();
  window.clearTimeout(ambienceTimer);
  ambienceTimer = window.setTimeout(() => next.stopAmbience(), 1400);
}
