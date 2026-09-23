import { describe, expect, it } from 'vitest';
import { describeGuardianChoice, describeMapChoice, describeWatchSummary } from './selection.js';

describe('selection previews', () => {
  it('separates the two starting guardians by weapon and stats', () => {
    const asha = describeGuardianChoice('asha');
    const veer = describeGuardianChoice('veer');
    expect(asha.weaponName).toBe('Talwar Arc');
    expect(asha.weaponBehavior).toContain('close arc');
    expect(asha.stats).toContain('100 health');
    expect(asha.stats).toContain('+10% armor');
    expect(veer.weaponName).toBe('Dhanush Volley');
    expect(veer.stats).toContain('85 health');
    expect(veer.stats).toContain('−5% armor');
    expect(asha.stats).not.toBe(veer.stats);
  });

  it('separates Gaon from Van by hazard and threats', () => {
    const gaon = describeMapChoice('gaon');
    const van = describeMapChoice('van', { attempts: 2, clears: 1, bestTimeSeconds: 754 });
    expect(gaon.hazard).toContain('Low walls');
    expect(gaon.intensity).toBe('Opening');
    expect(gaon.expectation).toContain('The Bell-Warden at 12:00');
    expect(gaon.best).toBe('No watch recorded.');
    expect(van.hazard).toContain('Roots slow');
    expect(van.intensity).toBe('Rising');
    expect(van.threats).not.toBe(gaon.threats);
    expect(van.best).toBe('2 attempts. 1 clear. Best time 12:34.');
  });

  it('summarizes the watch a player is about to start', () => {
    const summary = describeWatchSummary('asha', 'gaon');
    expect(summary).toContain('Asha with Talwar Arc on Gaon');
    expect(summary).toContain('Opening watch');
    expect(summary).toContain('Low walls');
    expect(summary).toContain('No watch recorded.');
  });
});