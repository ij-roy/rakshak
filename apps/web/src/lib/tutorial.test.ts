import { describe, expect, it } from 'vitest';
import { tutorialSteps } from '@rakshak/game-ui';

describe('first-run tutorial', () => {
  it('states movement, automatic attacks, experience, upgrades, and the win condition', () => {
    const text = tutorialSteps.map((step) => `${step.title} ${step.body}`).join(' ').toLowerCase();
    expect(text).toContain('wasd');
    expect(text).toContain('stick');
    expect(text).toContain('on its own');
    expect(text).toContain('experience');
    expect(text).toContain('three choices');
    expect(text).toContain('12:00');
    expect(text).toContain('defeat that boss');
    expect(tutorialSteps.length).toBeGreaterThan(1);
  });
});
