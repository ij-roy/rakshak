import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SaveRepository } from '@rakshak/storage';

/** AsyncStorage SaveRepository — unencrypted; suitable for offline local saves. */
export function createAsyncStorageRepository(): SaveRepository {
  return {
    async read(slot) {
      return AsyncStorage.getItem(slot);
    },
    async write(slot, payload) {
      await AsyncStorage.setItem(slot, payload);
    },
    async remove(slot) {
      await AsyncStorage.removeItem(slot);
    },
  };
}
