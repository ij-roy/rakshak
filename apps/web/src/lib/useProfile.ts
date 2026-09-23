'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadProfile, type ProfileLoad } from '@rakshak/storage';
import { createIndexedDbRepository } from './indexedDbStorage';

export function useProfile() {
  const [load, setLoad] = useState<ProfileLoad | null>(null);
  const refresh = useCallback(async () => {
    setLoad(await loadProfile(createIndexedDbRepository()));
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { load, refresh };
}
