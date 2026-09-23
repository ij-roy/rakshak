import { describe, expect, it } from 'vitest';
import { World } from '../world/world.js';
import { systemInput, systemMovement } from './input-movement.js';

describe('movement input', () => {
  it('updates one input record and still stops when the stick is released', () => {
    const world = new World();
    const held = world.input;
    systemInput(world, { moveX: 2, moveY: 0, pause: false, confirm: false, cancel: false });
    expect(world.input).toBe(held);
    expect(world.input.moveX).toBe(1);
    const before = world.player.x;
    systemMovement(world);
    expect(world.player.x).toBeGreaterThan(before);
    expect(world.player.vx).toBeGreaterThan(0);
    systemInput(world, { moveX: 0, moveY: 0, pause: false, confirm: false, cancel: false });
    systemMovement(world);
    expect(world.player.vx).toBe(0);
    expect(world.input).toBe(held);
  });
});
