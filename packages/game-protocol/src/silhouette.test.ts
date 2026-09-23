import { describe, expect, it } from 'vitest';
import {
  relativeLuminance,
  resolveSpriteTint,
  silhouetteFor,
  silhouetteMarks,
  silhouetteTint,
} from './silhouette';

function signature(kind: string, contentId: string): string {
  const shape = silhouetteFor(kind, contentId);
  return `${shape}:${JSON.stringify(silhouetteMarks(shape, 12).map((mark) => [mark.mode, mark.points.length]))}`;
}

describe('combat silhouettes', () => {
  it('gives the player, threats and rewards different shapes that survive grayscale', () => {
    const identities = [
      signature('player', 'asha'),
      signature('enemy', 'chhaya_drifter'),
      signature('enemy', 'chhaya_runner'),
      signature('enemy', 'husk_guard'),
      signature('enemy', 'thorn_spitter'),
      signature('elite', 'chhaya_drifter'),
      signature('boss', 'bell_warden'),
      signature('pickup', 'xp'),
      signature('pickup', 'heal'),
      signature('pickup', 'chest'),
      signature('pickup', 'magnet'),
      signature('projectile', 'talwar_arc'),
    ];
    expect(new Set(identities).size).toBe(identities.length);

    const player = silhouetteTint(silhouetteFor('player', 'asha'));
    const threat = silhouetteTint(silhouetteFor('enemy', 'chhaya_drifter'));
    expect(relativeLuminance(player) - relativeLuminance(threat)).toBeGreaterThan(0.25);
    expect(resolveSpriteTint(silhouetteFor('player', 'asha'), 0xffffff)).toBe(player);
    expect(resolveSpriteTint(silhouetteFor('enemy', 'chhaya_drifter'), 0xffffff)).not.toBe(0xffffff);
  });

  it('reuses one outline for the same shape and size', () => {
    const first = silhouetteMarks('shield', 14);
    const second = silhouetteMarks('shield', 14.2);
    expect(second).toBe(first);
    expect(first[0]?.points.length).toBeGreaterThan(0);
  });
});
