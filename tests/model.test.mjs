import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACTS, canInteract, createGame, interact, readBest, saveBest, startGame, step, togglePause } from '../src/model.js';

test('seeded shifts generate the same traffic and begin in a clean standby state', () => {
  const first = createGame(42);
  const second = createGame(42);
  assert.deepEqual(first.traffic, second.traffic);
  assert.equal(first.phase, 'ready');
  assert.equal(first.remaining, 150);
  assert.equal(first.delivered, 0);
  assert.equal(first.traffic.length, 9);
  assert.equal(first.integrity, 4);
});

test('the shift clock and movement remain frozen until the shift starts and while paused', () => {
  const game = createGame();
  step(game, { right: 1 }, .05);
  assert.equal(game.player.x, 100);
  assert.equal(game.remaining, 150);

  startGame(game);
  step(game, { right: 1 }, .05);
  assert.ok(game.player.x > 100);
  const x = game.player.x;
  const remaining = game.remaining;
  togglePause(game);
  step(game, { right: 1 }, .05);
  assert.equal(game.player.x, x);
  assert.equal(game.remaining, remaining);
});

test('pickup and delivery require the active objective and score the full route', () => {
  const game = createGame();
  startGame(game);
  assert.equal(interact(game), false);

  game.player = { ...CONTRACTS[0].pickup, angle: 0 };
  assert.equal(canInteract(game), true);
  assert.equal(interact(game), true);
  assert.equal(game.carrying, true);
  assert.equal(interact(game), false, 'a carried package cannot be dropped at its pickup point');

  game.player = { ...CONTRACTS[0].drop, angle: 0 };
  game.energy = 15;
  game.integrity = 2;
  assert.equal(interact(game), true);
  assert.equal(game.delivered, 1);
  assert.equal(game.carrying, false);
  assert.equal(game.energy, 100, 'a delivery restores the boost charge');
  assert.equal(game.integrity, 3, 'a delivery repairs one integrity point');
  assert.equal(game.score, 500 + Math.floor(game.remaining * 2));
});

test('the last delivery wins once and adds the integrity bonus', () => {
  const game = createGame();
  startGame(game);
  game.delivered = 2;
  game.carrying = true;
  game.integrity = 2;
  game.score = 1234;
  game.player = { ...CONTRACTS[2].drop, angle: 0 };
  assert.equal(interact(game), true);
  assert.equal(game.phase, 'won');
  assert.equal(game.delivered, 3);
  assert.equal(game.score, 1234 + 500 + Math.floor(game.remaining * 2) + 450);
  assert.equal(interact(game), false);
});

test('traffic costs one integrity per hit and grants a collision grace period', () => {
  const game = createGame();
  startGame(game);
  for (const car of game.traffic) { car.x = -500; car.y = -500; car.speed = 0; }
  Object.assign(game.traffic[0], { x: game.player.x, y: game.player.y, horizontal: true, speed: 0 });

  step(game, {}, .05);
  assert.equal(game.integrity, 3);
  assert.equal(game.collisions, 1);
  step(game, {}, .05);
  assert.equal(game.integrity, 3);
  assert.equal(game.collisions, 1);
});

test('time expires cleanly and ends the active shift', () => {
  const game = createGame();
  startGame(game);
  game.remaining = .03;
  step(game, {}, .05);
  assert.equal(game.phase, 'lost');
  assert.equal(game.remaining, 0);
  assert.match(game.reason, /city woke up/i);
});

test('best score storage tolerates missing, corrupt, private, and older records', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  assert.equal(readBest(storage), 0);
  assert.equal(saveBest(storage, 420), 420);
  assert.equal(saveBest(storage, 100), 420);
  values.set('neon-courier-best-v1', 'corrupt');
  assert.equal(readBest(storage), 0);
  assert.equal(saveBest({ getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } }, 95), 95);
  assert.equal(readBest(null), 0);
});
