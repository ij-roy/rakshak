import { useCallback, useEffect, useState } from 'react';
import { loadProfile, type ProfileLoad } from '@rakshak/storage';
import { createAsyncStorageRepository } from '../lib/asyncStoragePort';

export function useMobileProfile() {
  const [load, setLoad] = useState<ProfileLoad | null>(null);
  const refresh = useCallback(async () => {
    setLoad(await loadProfile(createAsyncStorageRepository()));
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { load, refresh };
}
