'use client';

import { useEffect, useRef } from 'react';
import { createDefaultSave } from '@rakshak/storage';
import { previewSettingsCue } from '../lib/menu-audio';
import { useProfile } from '../lib/useProfile';

export function MenuSounds() {
  const { load } = useProfile();
  const settingsRef = useRef(createDefaultSave().settings);
  if (load && load.status !== 'blocked') settingsRef.current = load.save.settings;

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest('a,button');
      if (!control || control.closest('.play-canvas-host, .virtual-stick, .settings-slider')) return;
      const cue =
        control.classList.contains('primary') || control.classList.contains('home-play') ? 'ui_confirm' : 'ui_select';
      void previewSettingsCue(settingsRef.current, cue);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}
