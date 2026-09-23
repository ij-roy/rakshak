import {
  BALANCE,
  BOSS_BY_MAP,
  ELITE_BY_ID,
  ENEMY_BY_ID,
  MAP_BY_ID,
  budgetPerSecond,
  enemyDamageMultiplier,
  enemyHealthMultiplier,
  type EnemyId,
  type EliteId,
} from '@rakshak/game-data';
import { SIM_HZ } from '@rakshak/shared';
import type { NamedRngStreams } from '../rng/streams.js';
import type { EnemyEntity, World } from '../world/world.js';

export function systemSpawn(world: World, rng: NamedRngStreams): void {
  if (world.run.paused || world.offer.awaitingChoice || world.run.outcome !== 'ongoing') return;
  if (world.director.spawnFreeze) return;

  const t = world.tick / SIM_HZ;
  const budgetThisTick = budgetPerSecond(t) / SIM_HZ;
  world.director.budgetCarry += budgetThisTick;

  const map = MAP_BY_ID[world.mapId];
  const hpMult = enemyHealthMultiplier(t);
  const dmgMult = enemyDamageMultiplier(t);

  // Elite windows
  const eliteMinutes = BALANCE.eliteSpawnMinutes;
  if (world.director.eliteIndex < eliteMinutes.length) {
    const minute = eliteMinutes[world.director.eliteIndex]!;
    if (t >= minute * 60) {
      const eliteId = rng.spawn.pick(map.elitePool);
      spawnElite(world, eliteId, hpMult, dmgMult, rng);
      world.director.eliteIndex++;
    }
  }

  let safety = 8;
  while (world.director.budgetCarry >= 0.45 && safety-- > 0 && world.enemies.activeCount < BALANCE.maxEnemies) {
    const enemyId = pickEnemy(map.enemyPool, rng);
    const cost = ENEMY_BY_ID[enemyId].threatCost;
    if (cost > world.director.budgetCarry + 0.01 && world.director.budgetCarry < 1.5) break;
    spawnEnemy(world, enemyId, hpMult, dmgMult, rng);
    world.director.budgetCarry -= cost;
  }
}

function pickEnemy(pool: readonly EnemyId[], rng: NamedRngStreams): EnemyId {
  // Weight swarm cheaper to fill.
  if (rng.spawn.nextFloat() < 0.18 && pool.includes('swarm_fragment')) {
    return 'swarm_fragment';
  }
  return rng.spawn.pick(pool);
}

const spawnAt = { x: 0, y: 0 };

function spawnPoint(world: World, rng: NamedRngStreams): { x: number; y: number } {
  const angle = rng.spawn.nextFloat() * Math.PI * 2;
  const dist = 320 + rng.spawn.nextFloat() * 180;
  spawnAt.x = world.player.x + Math.cos(angle) * dist;
  spawnAt.y = world.player.y + Math.sin(angle) * dist;
  return spawnAt;
}

function placeEnemy(
  world: World,
  contentId: EnemyEntity['contentId'],
  kind: EnemyEntity['kind'],
  x: number,
  y: number,
  radius: number,
  maxHp: number,
  contactDamage: number,
  armor: number,
  knockbackResist: number,
  xp: number,
  threatCost: number,
  invulnUntil: number,
  aiCooldown: number,
  phase: number,
  isFinalBoss: boolean,
): EnemyEntity | null {
  const enemy = world.enemies.take();
  if (!enemy) return null;
  enemy.contentId = contentId;
  enemy.kind = kind;
  enemy.x = x;
  enemy.y = y;
  enemy.vx = 0;
  enemy.vy = 0;
  enemy.radius = radius;
  enemy.maxHp = maxHp;
  enemy.hp = maxHp;
  enemy.contactDamage = contactDamage;
  enemy.armor = armor;
  enemy.knockbackResist = knockbackResist;
  enemy.xp = xp;
  enemy.threatCost = threatCost;
  enemy.invulnUntil = invulnUntil;
  enemy.aiCooldown = aiCooldown;
  enemy.phase = phase;
  enemy.isFinalBoss = isFinalBoss;
  enemy.attackPhase = 0;
  enemy.attackTimer = 0;
  enemy.aimX = x;
  enemy.aimY = y;
  return enemy;
}

export function spawnEnemy(
  world: World,
  enemyId: EnemyId,
  hpMult: number,
  dmgMult: number,
  rng: NamedRngStreams,
): void {
  const def = ENEMY_BY_ID[enemyId];
  const pos = spawnPoint(world, rng);
  const x = pos.x;
  const y = pos.y;
  placeEnemy(
    world,
    enemyId,
    'enemy',
    x,
    y,
    def.radius,
    Math.round(def.maxHp * hpMult),
    Math.round(def.contactDamage * dmgMult),
    def.armor,
    def.knockbackResist,
    def.xp,
    def.threatCost,
    0,
    0,
    0,
    false,
  );
}

function spawnElite(
  world: World,
  eliteId: EliteId,
  hpMult: number,
  dmgMult: number,
  rng: NamedRngStreams,
): void {
  const def = ELITE_BY_ID[eliteId];
  const pos = spawnPoint(world, rng);
  const x = pos.x;
  const y = pos.y;
  const acquired = placeEnemy(
    world,
    eliteId,
    'elite',
    x,
    y,
    def.radius,
    Math.round(def.maxHp * hpMult),
    Math.round(def.contactDamage * dmgMult),
    def.armor,
    def.knockbackResist,
    def.xp,
    def.threatCost,
    0,
    30,
    0,
    false,
  );
  if (acquired) {
    world.pushEvent({
      kind: 'elite_spawned',
      tick: world.tick,
      eliteId,
      entityId: acquired.id,
    });
  }
}

export function spawnBoss(world: World, phaseIndex: 0 | 1 | 2): void {
  const boss = BOSS_BY_MAP[world.mapId];
  const scale = phaseIndex === 2 ? 1 : BALANCE.lieutenantHpScale[phaseIndex]!;
  const isFinal = phaseIndex === 2;
  const acquired = placeEnemy(
    world,
    boss.id,
    'boss',
    world.player.x + 220,
    world.player.y,
    boss.radius,
    Math.round(boss.maxHp * scale),
    boss.contactDamage,
    boss.armor,
    boss.knockbackResist,
    boss.xp,
    50,
    world.tick + 30,
    0,
    phaseIndex + 1,
    isFinal,
  );
  if (isFinal) {
    world.director.spawnFreeze = true;
    world.run.finalBossAlive = true;
  }
  if (acquired) {
    if (boss.id === 'bell_warden') world.run.bellAlive = true;
    world.pushEvent({
      kind: 'boss_spawned',
      tick: world.tick,
      bossId: boss.id,
      phase: (phaseIndex + 1) as 1 | 2 | 3,
    });
  }
}
