import { parseRunCheckpoint, type RunCheckpointV1 } from '@rakshak/game-core';

const KEY = 'rakshak.run.checkpoint';

export function writeRunCheckpointSync(checkpoint: RunCheckpointV1): void {
  localStorage.setItem(KEY, JSON.stringify(checkpoint));
}

export function readRunCheckpointSync(): RunCheckpointV1 | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return parseRunCheckpoint(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function clearRunCheckpointSync(): void {
  localStorage.removeItem(KEY);
}

export const RUN_RESUME_FLAG = 'rakshak.run.resume';
export const RUN_FRESH_FLAG = 'rakshak.run.fresh';
