import { clamp, normalizeInto } from '@rakshak/shared';
import type { InputSnapshot } from '@rakshak/game-protocol';
import { effectiveMoveSpeed } from '../combat/stats.js';
import { applyPlayerField } from './field.js';
import type { World } from '../world/world.js';
import { SIM_HZ } from '@rakshak/shared';

export function systemInput(world: World, input: InputSnapshot): void {
  const prevPause = world.input.pause;
  world.input.moveX = clamp(input.moveX, -1, 1);
  world.input.moveY = clamp(input.moveY, -1, 1);
  world.input.pause = input.pause;
  world.input.confirm = input.confirm;
  world.input.cancel = input.cancel;

  if (world.input.pause && !prevPause && world.run.outcome === 'ongoing') {
    if (world.offer.awaitingChoice) {
      // Level-up already freezes simulation; ignore toggle.
    } else {
      world.run.paused = !world.run.paused;
      world.pushEvent({
        kind: world.run.paused ? 'paused' : 'resumed',
        tick: world.tick,
      });
    }
  }

  if (world.offer.awaitingChoice && world.input.confirm) {
    // confirm handled in offers system via choice index encoded as moveX bands? Use cancel=reroll, confirm selects first.
    // Selection: moveX maps to choice index when confirm edge — handled in offers.
  }
}

const moveDir = { x: 0, y: 0 };

export function systemMovement(world: World): void {
  if (world.run.paused || world.offer.awaitingChoice || world.run.outcome !== 'ongoing') {
    world.player.vx = 0;
    world.player.vy = 0;
    return;
  }
  normalizeInto(world.input.moveX, world.input.moveY, moveDir);
  const speed = effectiveMoveSpeed(world.player, world.tick) / SIM_HZ;
  world.player.vx = moveDir.x * speed;
  world.player.vy = moveDir.y * speed;
  world.player.x += world.player.vx;
  world.player.y += world.player.vy;

  const halfW = world.mapWidth * 0.5 - world.player.radius;
  const halfH = world.mapHeight * 0.5 - world.player.radius;
  world.player.x = clamp(world.player.x, -halfW, halfW);
  world.player.y = clamp(world.player.y, -halfH, halfH);
  applyPlayerField(world);

  if (moveDir.x !== 0 || moveDir.y !== 0) {
    world.player.facing = Math.atan2(moveDir.y, moveDir.x);
  }
}
