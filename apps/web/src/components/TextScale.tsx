'use client';

import { useEffect } from 'react';
import { useProfile } from '../lib/useProfile';

export function applyTextScale(scale: number) {
  const next = Math.min(1.5, Math.max(0.8, scale));
  document.documentElement.style.fontSize = `${Math.round(next * 100)}%`;
}

export function TextScale() {
  const { load } = useProfile();
  useEffect(() => {
    if (!load || load.status === 'blocked') return;
    applyTextScale(load.save.settings.uiScale);
  }, [load]);
  return null;
}
