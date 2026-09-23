import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseRunCheckpoint, type RunCheckpointV1 } from '@rakshak/game-core';

const KEY = 'run.checkpoint';

export async function writeRunCheckpoint(checkpoint: RunCheckpointV1): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(checkpoint));
}

export async function readRunCheckpoint(): Promise<RunCheckpointV1 | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return parseRunCheckpoint(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export async function clearRunCheckpoint(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
