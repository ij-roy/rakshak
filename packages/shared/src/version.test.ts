import { describe, expect, it } from 'vitest';
import {
  ANDROID_VERSION_CODE,
  APPLICATION_ID,
  CONTENT_VERSION,
  GAME_VERSION,
  SCHEMA_VERSION,
  SIM_HZ,
} from './version.js';

describe('version constants', () => {
  it('matches Master Spec product identity', () => {
    expect(GAME_VERSION).toBe('1.0.0');
    expect(CONTENT_VERSION).toBe('1.0.0');
    expect(SCHEMA_VERSION).toBe(1);
    expect(ANDROID_VERSION_CODE).toBe(1);
    expect(APPLICATION_ID).toBe('roy.ij.rakshak');
    expect(SIM_HZ).toBe(30);
  });
});
