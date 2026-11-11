export const WORLD = Object.freeze({ width: 1200, height: 800 });
export const ROAD_X = [100, 350, 600, 850, 1100];
export const ROAD_Y = [100, 300, 500, 700];
export const ROAD_HALF = 48;
export const MAX_INTEGRITY = 4;
export const CONTRACTS = [
  { name: 'Midnight medicine', client: 'Koi Clinic', pickup: { x: 350, y: 500 }, drop: { x: 850, y: 300 } },
  { name: 'An analog secret', client: 'Archive 09', pickup: { x: 1100, y: 300 }, drop: { x: 600, y: 100 } },
  { name: 'Last light', client: 'Rooftop Radio', pickup: { x: 350, y: 100 }, drop: { x: 100, y: 700 } },
];
export const BUILDINGS = ROAD_X.slice(0, -1).flatMap((x, col) =>
  ROAD_Y.slice(0, -1).map((y, row) => ({
    x: x + 62, y: y + 62, width: 126, height: 76, col, row,
  })));

export function random(seed) {
  let value = seed >>> 0;
  return () => { value += 0x6D2B79F5; let t = value; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function createGame(seed = 7107) {
  const rng = random(seed);
  const traffic = [
    ...ROAD_Y.map((road, i) => {
      const direction = i % 2 ? 1 : -1;
      return { x: rng() * WORLD.width, y: road + direction * 21, horizontal: true, direction, speed: 34 + rng() * 28, color: i % 3 };
    }),
    ...ROAD_X.map((road, i) => {
      const direction = i % 2 ? -1 : 1;
      return { x: road + direction * 21, y: rng() * WORLD.height, horizontal: false, direction, speed: 34 + rng() * 28, color: i % 3 };
    }),
  ];
  return {
    seed, phase: 'ready', elapsed: 0, remaining: 150, player: { x: 100, y: 500, angle: 0 },
    integrity: MAX_INTEGRITY, energy: 100, invincible: 0, score: 0, delivered: 0, carrying: false,
    traffic, events: [], message: 'Three deliveries. One night. Make it count.', messageTime: 4,
    reason: '', collisions: 0,
  };
}

export function startGame(game) { if (game.phase === 'ready') game.phase = 'playing'; }
export function togglePause(game) {
  if (game.phase === 'playing') game.phase = 'paused';
  else if (game.phase === 'paused') game.phase = 'playing';
}
export function objective(game) {
  const contract = CONTRACTS[Math.min(game.delivered, CONTRACTS.length - 1)];
  return game.carrying ? contract.drop : contract.pickup;
}
export function canInteract(game) {
  const target = objective(game);
  return game.phase === 'playing' && Math.hypot(game.player.x - target.x, game.player.y - target.y) <= 59;
}
function announce(game, message, event) {
  game.message = message; game.messageTime = 3.5; game.events.push(event);
}
export function interact(game) {
  if (!canInteract(game)) return false;
  if (!game.carrying) {
    game.carrying = true;
    announce(game, 'Package secured. Follow the mint route to the drop.', 'pickup');
  } else {
    game.carrying = false; game.delivered += 1;
    game.score += 500 + Math.floor(game.remaining * 2);
    game.energy = 100;
    game.integrity = Math.min(MAX_INTEGRITY, game.integrity + 1);
    announce(game, 'Delivered. Nice work, courier.', 'delivery');
    if (game.delivered === CONTRACTS.length) {
      game.phase = 'won'; game.reason = 'Every package found its way home.';
      game.score += game.integrity * 150;
    }
  }
  return true;
}

function blocked(x, y) {
  return BUILDINGS.some(b => x > b.x - 10 && x < b.x + b.width + 10 && y > b.y - 10 && y < b.y + b.height + 10);
}
export function step(game, input = {}, dt = 1 / 60) {
  if (game.phase !== 'playing') return;
  dt = Math.min(Math.max(dt, 0), .05);
  game.elapsed += dt; game.remaining = Math.max(0, game.remaining - dt);
  game.invincible = Math.max(0, game.invincible - dt);
  game.messageTime = Math.max(0, game.messageTime - dt);
  if (game.remaining <= 0) { game.phase = 'lost'; game.reason = 'The city woke up before your route was done.'; return; }
  let dx = Number(input.right || 0) - Number(input.left || 0);
  let dy = Number(input.down || 0) - Number(input.up || 0);
  const length = Math.hypot(dx, dy);
  const boost = input.boost && game.energy > 0 && length > 0;
  game.energy = Math.max(0, Math.min(100, game.energy + (boost ? -34 : 19) * dt));
  if (length > 0) {
    dx /= length; dy /= length;
    const speed = boost ? 285 : 175;
    const x = Math.max(18, Math.min(WORLD.width - 18, game.player.x + dx * speed * dt));
    const y = Math.max(18, Math.min(WORLD.height - 18, game.player.y + dy * speed * dt));
    if (!blocked(x, game.player.y)) game.player.x = x;
    if (!blocked(game.player.x, y)) game.player.y = y;
    game.player.angle = Math.atan2(dy, dx);
  }
  for (const car of game.traffic) {
    const axis = car.horizontal ? 'x' : 'y';
    const size = car.horizontal ? WORLD.width : WORLD.height;
    car[axis] += car.direction * car.speed * dt;
    if (car[axis] < -30) car[axis] = size + 30;
    if (car[axis] > size + 30) car[axis] = -30;
    if (game.invincible <= 0 && Math.abs(car.x - game.player.x) < (car.horizontal ? 29 : 21) && Math.abs(car.y - game.player.y) < (car.horizontal ? 21 : 29)) {
      game.integrity -= 1; game.collisions += 1; game.invincible = 2.2;
      announce(game, 'Traffic hit! Keep clear of the moving headlights.', 'hit');
      if (game.integrity <= 0) { game.phase = 'lost'; game.reason = 'Your bike needs a repair. The city will wait.'; return; }
    }
  }
}

export function readBest(storage) {
  try { const n = Number(storage.getItem('neon-courier-best-v1')); return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0; } catch { return 0; }
}
export function saveBest(storage, score) {
  const best = Math.max(readBest(storage), Number.isFinite(score) && score > 0 ? Math.floor(score) : 0);
  try { storage.setItem('neon-courier-best-v1', String(best)); } catch { /* Private browsing and full storage must not stop play. */ }
  return best;
}
