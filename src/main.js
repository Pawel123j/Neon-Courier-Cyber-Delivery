import { createGame, startGame, togglePause, step, interact, canInteract, CONTRACTS, MAX_INTEGRITY, readBest, saveBest } from './model.js';
import { createRenderer } from './render.js';
import { Synth } from './audio.js';
const $ = id => document.getElementById(id), canvas = $('game'), overlay = $('overlay'), synth = new Synth(), render = createRenderer(canvas);
const input = {}, keys = { ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',Shift:'boost' };
let game = createGame(), oldPhase = '', accumulator = 0, previous = 0;
let storage; try { storage = window.localStorage; } catch { storage = null; }
let best = readBest(storage);
function clearInput() { for (const key of Object.keys(input)) delete input[key]; }
function restart() { clearInput(); game = createGame(); startGame(game); accumulator = 0; update(); canvas.focus({ preventScroll: true }); }
function pause() { clearInput(); togglePause(game); update(); }
function act() { if (interact(game)) update(); }
function update() {
  const phaseChanged = oldPhase !== game.phase;
  $('timer').textContent = `${String(Math.floor(Math.ceil(game.remaining) / 60)).padStart(2,'0')}:${String(Math.ceil(game.remaining) % 60).padStart(2,'0')}`;
  $('score').textContent = String(game.score).padStart(4,'0');
  $('integrity').textContent = '● '.repeat(game.integrity).trim() + ' ○'.repeat(MAX_INTEGRITY-game.integrity);
  $('integrity').setAttribute('aria-label',`${game.integrity} integrity remaining`);
  $('energy').style.width = `${game.energy}%`; $('energy-number').textContent = `${Math.round(game.energy)}%`;
  $('energy').parentElement.setAttribute('aria-valuenow',String(Math.round(game.energy)));
  $('phase').textContent = { ready:'STANDBY',playing:'ON SHIFT',paused:'PAUSED',won:'COMPLETE',lost:'SHIFT OVER' }[game.phase];
  $('progress').textContent = `${game.delivered} / 3`;
  [...$('manifest').children].forEach((li,i)=>{li.className = i < game.delivered ? 'done' : i === game.delivered ? 'active' : '';li.lastElementChild.textContent = i < game.delivered ? '✓' : i === game.delivered ? '>' : '○';});
  const contract = CONTRACTS[Math.min(game.delivered,2)];
  $('objective-label').textContent = game.phase === 'won' ? 'ROUTE COMPLETE' : game.carrying ? 'NEXT UP / DROP OFF' : 'NEXT UP / PICKUP';
  $('objective').textContent = game.phase === 'won' ? 'Every package is home.' : game.carrying ? contract.client : contract.name;
  const near = canInteract(game);
  $('interact').disabled = !near; $('touch-interact').disabled = !near;
  $('interact').firstChild.textContent = game.carrying ? 'Deliver package ' : 'Pick up package ';
  $('proximity').textContent = near ? 'PRESS E / SPACE TO INTERACT' : 'FOLLOW THE SIGNAL';
  const message = game.messageTime > 0 ? game.message : game.carrying ? `Deliver to ${contract.client}. The diamond marks your destination.` : `Collect “${contract.name}” at the glowing diamond.`;
  if ($('message').textContent !== message) $('message').textContent = message;
  $('pause').disabled = !['playing','paused'].includes(game.phase); $('pause').textContent = game.phase === 'paused' ? 'Resume' : 'Pause';
  if (phaseChanged) {
    clearInput();
    if (game.phase === 'won') best = saveBest(storage, game.score);
    if (game.phase === 'playing') { if (overlay.open) overlay.close(); }
    else {
      const config = {
        ready: ['YOUR NIGHT STARTS HERE','Make the city<br><em>your shortcut.</em>','Collect and deliver three packages in 150 seconds. Follow the glowing diamond, stay clear of traffic, and keep your bike in one piece.','Start night shift >'],
        paused: ['TAKE A BREATHER','The city<br><em>can wait.</em>','Your clock is stopped. Resume when you’re ready, or start a fresh shift.','Resume shift >'],
        won: ['ALL THREE DELIVERED','You brought<br><em>the night home.</em>',`Shift score: ${game.score}. ${Math.ceil(game.remaining)} seconds to spare. Local best: ${best}.`,'Ride again >'],
        lost: ['SHIFT ENDED','Another night.<br><em>Another chance.</em>',`${game.reason} ${game.delivered} of 3 delivered. Score: ${game.score}.`,'Try again >'],
      }[game.phase];
      $('dialog-kicker').textContent=config[0]; $('dialog-title').innerHTML=config[1]; $('dialog-copy').textContent=config[2]; $('primary').textContent=config[3];
      $('dialog-instructions').hidden = game.phase !== 'ready'; $('dialog-restart').hidden = game.phase !== 'paused';
      if (!overlay.open) overlay.showModal(); $('primary').focus({preventScroll:true});
    }
    oldPhase = game.phase;
  }
  $('best').textContent = best ? String(best) : '—';
  while (game.events.length) synth.play(game.events.shift());
}
$('primary').addEventListener('click',()=>{if (game.phase==='ready') { startGame(game); update(); canvas.focus({preventScroll:true}); } else if(game.phase==='paused'){pause();canvas.focus({preventScroll:true});} else restart();});
$('pause').addEventListener('click',pause); $('restart').addEventListener('click',restart); $('dialog-restart').addEventListener('click',restart);
$('interact').addEventListener('click',act); $('touch-interact').addEventListener('click',act);
$('sound').addEventListener('click',async()=>{const enabled=await synth.toggle();$('sound').textContent=enabled?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(enabled));});
overlay.addEventListener('cancel',event=>{event.preventDefault();if(game.phase==='paused')pause();});
window.addEventListener('keydown',event=>{
  if (keys[event.key] && game.phase==='playing') { event.preventDefault(); input[keys[event.key]]=true; }
  if (event.repeat) return;
  if (['p','P','Escape'].includes(event.key) && ['playing','paused'].includes(game.phase)) { event.preventDefault();pause(); }
  if (['e','E',' '].includes(event.key) && game.phase==='playing' && !['BUTTON','INPUT'].includes(document.activeElement.tagName)) {event.preventDefault();act();}
});
window.addEventListener('keyup',event=>{if(keys[event.key]) delete input[keys[event.key]];});
for(const button of document.querySelectorAll('[data-control]')) {
  button.addEventListener('pointerdown',event=>{event.preventDefault();if(game.phase==='playing'){button.setPointerCapture(event.pointerId);input[button.dataset.control]=true;}});
  for(const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type,()=>{delete input[button.dataset.control];});
}
function backgroundPause(){clearInput();if(game.phase==='playing')pause();}
window.addEventListener('blur',backgroundPause);
document.addEventListener('visibilitychange',()=>{if(document.hidden)backgroundPause();});
function frame(time) {
  const dt = previous ? Math.min((time-previous)/1000,.1) : 0; previous=time;
  if(game.phase==='playing') { accumulator += dt; while(accumulator >= 1/60){step(game,input,1/60);accumulator-=1/60;} } else accumulator=0;
  update();render(game);requestAnimationFrame(frame);
}
update();render(game);requestAnimationFrame(frame);
