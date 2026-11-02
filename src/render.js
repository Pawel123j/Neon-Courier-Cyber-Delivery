import { WORLD, ROAD_X, ROAD_Y, BUILDINGS, objective, random } from './model.js';
const MINT = '#98f3c7', PINK = '#f58ea5';
const names = ['MORI / 02', 'STACK 09', 'NIGHT MARKET', 'ORBIT', 'KOI CLINIC', 'KAIRO', 'LOW FREQUENCY', 'ARCADE', 'METRO', 'TRANSIT / 04', 'WAREHOUSE', 'RADIO CLUB'];
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  // A cached procedural city: no external textures, fonts or image requests.
  const city = document.createElement('canvas'); city.width = WORLD.width; city.height = WORLD.height;
  const c = city.getContext('2d'), rng = random(307);
  c.fillStyle = '#162330'; c.fillRect(0, 0, WORLD.width, WORLD.height);
  c.strokeStyle = '#1e2e3b'; c.lineWidth = 1;
  for (let x = 0; x < WORLD.width; x += 25) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, WORLD.height); c.stroke(); }
  for (let y = 0; y < WORLD.height; y += 25) { c.beginPath(); c.moveTo(0, y); c.lineTo(WORLD.width, y); c.stroke(); }
  c.fillStyle = '#0c1721';
  for (const x of ROAD_X) c.fillRect(x - 48, 0, 96, WORLD.height);
  for (const y of ROAD_Y) c.fillRect(0, y - 48, WORLD.width, 96);
  c.strokeStyle = '#34434e'; c.lineWidth = 1; c.setLineDash([7, 13]);
  for (const x of ROAD_X) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, WORLD.height); c.stroke(); }
  for (const y of ROAD_Y) { c.beginPath(); c.moveTo(0, y); c.lineTo(WORLD.width, y); c.stroke(); }
  c.setLineDash([]);
  for (const x of ROAD_X) for (const y of ROAD_Y) {
    c.fillStyle = '#11202a'; c.fillRect(x - 48, y - 48, 96, 96);
    c.fillStyle = '#2a3a44';
    for (let n = -30; n < 30; n += 12) { c.fillRect(x + n, y - 45, 6, 10); c.fillRect(x + n, y + 35, 6, 10); }
    c.fillStyle = '#648c7f'; c.fillRect(x - 46, y - 48, 3, 3); c.fillRect(x + 43, y + 45, 3, 3);
  }
  BUILDINGS.forEach((b, index) => {
    c.fillStyle = '#050e17'; c.fillRect(b.x + 8, b.y + 10, b.width, b.height);
    c.fillStyle = ['#253c48','#263444','#2c3b43'][index % 3]; c.fillRect(b.x, b.y, b.width, b.height);
    c.strokeStyle = '#435460'; c.strokeRect(b.x + .5, b.y + .5, b.width - 1, b.height - 1);
    c.strokeStyle = '#334a57'; c.strokeRect(b.x + 8, b.y + 8, b.width - 16, b.height - 16);
    c.fillStyle = index % 3 ? '#779c9b' : PINK; c.fillRect(b.x + 12, b.y, 34, 2);
    for (let w = 0; w < 7; w++) { c.fillStyle = rng() > .65 ? '#90ac9a' : '#314857'; c.fillRect(b.x + 10 + w * 15, b.y + b.height - 8, 7, 3); }
    c.fillStyle = '#a8b7be'; c.font = '8px monospace'; c.textAlign = 'center'; c.fillText(names[index], b.x + b.width / 2, b.y + b.height / 2 + 6);
    c.fillStyle = '#152a33'; c.fillRect(b.x + b.width - 26, b.y + 12, 13, 12);
  });
  c.font = '8px monospace'; c.fillStyle = '#5f7586'; c.textAlign = 'left';
  c.fillText('SOUTH LOOP / 500', 430, 545); c.fillText('EAST ARTERY', 925, 745); c.fillText('NORTHLINE / 100', 425, 145);
  return game => {
    ctx.clearRect(0, 0, WORLD.width, WORLD.height); ctx.drawImage(city, 0, 0);
    const target = objective(game), pulse = 1 + Math.sin(game.elapsed * 4) * .1;
    if (game.phase !== 'won') {
      ctx.save(); ctx.strokeStyle = '#98f3c760'; ctx.lineWidth = 2; ctx.setLineDash([5, 9]);
      ctx.beginPath(); ctx.moveTo(game.player.x, game.player.y); ctx.lineTo(target.x, game.player.y); ctx.lineTo(target.x, target.y); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(target.x, target.y); ctx.strokeStyle = '#98f3c744'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 48 * pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowColor = MINT; ctx.shadowBlur = 20; ctx.fillStyle = MINT; ctx.rotate(Math.PI / 4); ctx.fillRect(-12, -12, 24, 24); ctx.shadowBlur = 0; ctx.fillStyle = '#193d31'; ctx.fillRect(-6, -6, 12, 12); ctx.restore();
      ctx.fillStyle = MINT; ctx.textAlign = 'center'; ctx.font = 'bold 10px monospace'; ctx.fillText(game.carrying ? 'DROP OFF' : 'PICK UP', target.x, target.y - 61);
    }
    for (const car of game.traffic) {
      ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.horizontal ? car.direction < 0 ? Math.PI : 0 : car.direction < 0 ? -Math.PI / 2 : Math.PI / 2);
      ctx.fillStyle = ['#b17e9b','#759eae','#bb9f7f'][car.color]; ctx.fillRect(-18, -9, 36, 18); ctx.fillStyle = '#1c2c38'; ctx.fillRect(-6, -7, 14, 14);
      ctx.fillStyle = '#e4efd4'; ctx.fillRect(15, -7, 3, 4); ctx.fillRect(15, 3, 3, 4); ctx.fillStyle = '#b8616f'; ctx.fillRect(-18, -7, 2, 4); ctx.fillRect(-18, 3, 2, 4); ctx.restore();
    }
    const p = game.player;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
    if (game.invincible > 0 && Math.floor(game.elapsed * 12) % 2) ctx.globalAlpha = .4;
    ctx.shadowColor = MINT; ctx.shadowBlur = 13; ctx.fillStyle = MINT;
    ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(-10, -10); ctx.lineTo(-6, 0); ctx.lineTo(-10, 10); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#ecfff5'; ctx.fillRect(-3, -3, 6, 6);
    if (game.carrying) { ctx.fillStyle = '#ffd391'; ctx.fillRect(-13, -5, 5, 10); } ctx.restore();
    ctx.font = '9px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#d8f4e6'; ctx.fillText('YOU', p.x, p.y + 27);
  };
}
