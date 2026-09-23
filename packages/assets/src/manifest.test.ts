import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST, APPROVED_PROCEDURAL_ASSETS } from './manifest.js';
import { assertAllApproved } from './types.js';

describe('asset manifest', () => {
  it('contains only approved procedural originals', () => {
    expect(APPROVED_PROCEDURAL_ASSETS.length).toBeGreaterThan(10);
    expect(() => assertAllApproved(ASSET_MANIFEST)).not.toThrow();
    for (const a of ASSET_MANIFEST.assets) {
      expect(a.license.status).toBe('approved');
      expect(a.license.creator).toBe('RAKSHAK original procedural');
      expect(a.license.license).toContain('All Rights Reserved');
    }
  });
});
