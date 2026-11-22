import './style.css';
import { NeonGame } from './engine.js';
import { Renderer, drawMini } from './render.js';
import { NeonAudio } from './audio.js';
import { BoardInput, bindTouchControls } from './board-input.js';
import { copy } from './copy.js';
import { createDuel } from './duel.js';

const icons={
  play:'<path d="m9 5 11 7-11 7Z"/>',
  pause:'<path d="M8 5v14M16 5v14"/>',
  sound:'<path d="m11 4-6 5H2v6h3l6 5V4ZM16 8a6 6 0 0 1 0 8M19 4a11 11 0 0 1 0 16"/>',
  mute:'<path d="m11 4-6 5H2v6h3l6 5V4ZM17 9l6 6M23 9l-6 6"/>',
  help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.7.3-.7 1-.7 1.6M12 16v.1"/>',
  left:'<path d="M19 12H5m6-6-6 6 6 6"/>',
  right:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  down:'<path d="M12 4v16m-6-6 6 6 6-6"/>',
  drop:'<path d="M12 3v13m-5-5 5 5 5-5M4 21h16"/>',
  rotate:'<path d="M20 7v5h-5M20 12a8 8 0 1 0-2 6"/>',
  hold:'<path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/>',
  restart:'<path d="M4 5v6h6M4 11a8 8 0 1 1 2 7"/>',
  trophy:'<path d="M7 3h10v5a5 5 0 0 1-10 0V3ZM7 5H3v2a4 4 0 0 0 4 4m10-6h4v2a4 4 0 0 1-4 4M12 13v6m-5 2h10"/>',
};
const icon=(name)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||''}</svg>`;
const $=s=>document.querySelector(s);

const languageKey='veldon-language';
const scoreKey='neon-stack.best';
const urlLanguage=new URLSearchParams(location.search).get('lang');
let language=urlLanguage==='en'||urlLanguage==='zh'?urlLanguage:readStorage(languageKey)==='en'?'en':'zh';
const words=()=>copy[language];
const label=key=>`<span data-text="${key}">${words()[key]}</span>`;

function readStorage(key) {
  try { return localStorage.getItem(key); }
  catch { return null; }
}

function readBest() {
  const score=Number(readStorage(scoreKey));
  return Number.isSafeInteger(score)&&score>0?score:0;
}

$('#app').innerHTML=`
  <div class="city-bg" aria-hidden="true"></div><div class="ambient" aria-hidden="true"></div>
  <div class="shell">
    <header class="topbar">
      <div class="brand"><div class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div><h1>NEON<span>STACK</span></h1><div class="brand-sub" data-text="subtitle"></div></div></div>
      <div class="top-actions"><span class="connection"><i></i>${label('online')}</span><div class="icon-buttons">
        <button id="mode" class="icon-button mode-button" type="button"><b aria-hidden="true"></b><span></span></button>
        <button id="language" class="icon-button language-button" type="button" data-label="languageSwitch"></button>
        <button id="sound" class="icon-button" type="button" aria-pressed="true">${icon('sound')}</button>
        <button id="pause" class="icon-button" type="button" data-title="pauseShortcut" disabled>${icon('pause')}</button>
        <button id="help" class="icon-button" type="button" data-label="help" data-title="help">${icon('help')}</button>
      </div></div>
    </header>

    <main id="solo" class="game-layout">
      <aside class="stats-side">
        <div class="section-cap desktop-only">${label('session')}<b>///</b></div>
        <section class="score-section"><div class="label" data-text="score"></div><div id="score" class="score-number">000000</div><div class="best"><span>${icon('trophy')} ${label('best')}</span><strong id="best">000000</strong></div></section>
        <div class="stat-pair"><section><div class="label" data-text="level"></div><div class="stat-number cyan" id="level">01</div></section><section><div class="label" data-text="lines"></div><div class="stat-number" id="lines">000</div></section></div>
        <section class="level-progress desktop-only"><div class="progress-label">${label('nextLevel')}<span id="progress-label">0 / 10</span></div><div class="progress-track"><i id="progress"></i></div></section>
        <section class="hold-panel desktop-hold"><div class="section-cap">${label('hold')}<kbd>C</kbd></div><button class="hold-box" id="hold-button" type="button" data-title="holdHint" data-label="hold"><canvas id="hold-canvas" data-label="holdPreview"></canvas><span class="hold-empty" data-text="emptyHold"></span><i class="corner tl"></i><i class="corner br"></i></button></section>
        <div class="mode-note desktop-only"><div class="mode-symbol">∞</div><div><strong data-text="endless"></strong></div></div>
      </aside>

      <section class="playfield" data-label="board">
        <div class="well-caption"><span><i></i><b id="state-label"></b></span><span>10 × 20</span></div>
        <div class="board-frame"><div class="board-inner"><canvas id="board" width="300" height="600" tabindex="-1" data-label="board"></canvas><div class="board-shade"></div>
          <div id="game-overlay" class="game-overlay"></div><div id="clear-feedback" class="clear-feedback" aria-live="polite"></div>
        </div><i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i><div class="edge-meter" aria-hidden="true"></div></div>
        <div class="well-footer" aria-hidden="true"><span class="signal-bars"><i></i><i></i><i></i><i></i><i></i></span></div>
      </section>

      <aside class="next-side">
        <section class="next-panel"><div class="section-cap">${label('next')}</div><div class="next-list">${[0,1,2].map(n=>`<div class="next-piece"><span>0${n+1}</span><canvas id="next-${n}"></canvas></div>`).join('')}</div></section>
        <section class="hold-panel mobile-hold"><div class="section-cap">${label('hold')}</div><button id="mobile-hold-button" type="button" class="hold-box" data-label="hold"><canvas id="mobile-hold-canvas" data-label="holdPreview"></canvas></button></section>
        <section class="controls-guide desktop-only"><div class="section-cap">${label('controls')}</div><div><span><kbd>←</kbd><kbd>→</kbd></span>${label('move')}</div><div><span><kbd>↑</kbd></span>${label('rotate')}</div><div><span><kbd>↓</kbd></span>${label('softDrop')}</div><div><span><kbd class="wide-key">SPACE</kbd></span>${label('hardDrop')}</div><div><span><kbd>C</kbd></span>${label('hold')}</div><div><span><kbd>P</kbd></span>${label('pause')}</div></section>
      </aside>
    </main>

    <div id="solo-touch" class="touch-controls" data-label="touchControls">
      <button data-action="hold" class="touch-small" data-label="hold">${icon('hold')}${label('hold')}</button>
      <button data-action="left" data-label="left">${icon('left')}</button>
      <button data-action="rotate" data-label="rotate">${icon('rotate')}${label('rotate')}</button>
      <button data-action="right" data-label="right">${icon('right')}</button>
      <button data-action="down" class="touch-small" data-label="softDrop">${icon('down')}${label('fast')}</button>
      <button data-action="drop" class="touch-drop" data-label="hardDrop">${icon('drop')}${label('drop')}</button>
    </div>
    <main id="duel" class="duel" aria-labelledby="duel-title" tabindex="-1" hidden></main>
    <footer class="footer"><span><i class="live-dot"></i><b id="footer-status"></b></span><a id="library-link" href="https://www.veldongame.com/games/original/">Veldon Game</a></footer>
    <div id="notice" role="status"></div>
  </div>
  <dialog id="help-dialog" aria-labelledby="manual-title">
    <div class="help-top"><span>NEON STACK</span><button id="close-help" type="button" data-label="closeHelp">×</button></div>
    <h2 id="manual-title" data-text="manualTitle"></h2>
    <p data-text="goal"></p>
    <div class="manual-controls" id="solo-manual">
      ${[['← →','move'],['↑ / X','rotateCW'],['Z','rotateCCW'],['↓','softPoints'],['SPACE','hardPoints'],['C / SHIFT','holdRule'],['P / ESC','pauseResume']].map(([key,action])=>`<div><kbd>${key}</kbd>${label(action)}</div>`).join('')}
    </div>
    <p class="manual-tip" id="manual-tip"></p>
    <div class="scoring">${[100,300,500,800].map((points,index)=>`<span><span data-clear-label="${index+1}"></span> <b>${points}</b></span>`).join('')}</div>
    <small data-text="scoring"></small>
    <button id="help-done" class="primary" type="button">${label('gotIt')} ${icon('right')}</button>
  </dialog>
`;

const audio=new NeonAudio();
let best=readBest(),renderer,feedbackTimer,hudCache='',previewCache='',noticeTimer;
let lastClear,footerStatus='footerReady',gesture=null,inDuel=false;
const game=new NeonGame((name,data={})=>{
  audio.effect(name,data);renderer?.event(name,data);
  if(['pause','over','start','resume'].includes(name)) {
    soloInput.clear();gesture=null;updateOverlay();
  }
  if(name==='clear') {
    lastClear=data;
    renderClear();
    $('#clear-feedback').classList.remove('show');void $('#clear-feedback').offsetWidth;$('#clear-feedback').classList.add('show');
    clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>$('#clear-feedback').classList.remove('show'),1300);
  }
  if(name==='over') {
    best=Math.max(best,readBest());
    const newBest=game.score>best;
    if(newBest) {
      best=game.score;
      try { localStorage.setItem(scoreKey,String(best)); }
      catch { notifySaveFailure(); }
    }
    setFooter(newBest?'footerRecord':'footerOver');
  }
});
const soloInput=new BoardInput(game);
renderer=new Renderer($('#board'),game);
const duel=createDuel($('#duel'),audio,icon,updatePauseButton);

function notifySaveFailure() {
  const notice=$('#notice');
  notice.textContent=words().saveFailed;
  notice.classList.add('visible');
  clearTimeout(noticeTimer);
  noticeTimer=setTimeout(()=>notice.classList.remove('visible'),5000);
}

function setFooter(key) {
  footerStatus=key;
  $('#footer-status').textContent=inDuel?words().duelTitle:words()[key];
}

function renderClear() {
  if(!lastClear)return;
  const { count, points, combo, levelUp }=lastClear;
  const strings=words();
  $('#clear-feedback').innerHTML=`<strong>${strings.clearLabels[count]}</strong><span>+${points}${combo>0?` · ${strings.combo} ×${combo+1}`:''}</span>${levelUp?`<small>${strings.levelUp}</small>`:''}`;
}

function updateSoundButton() {
  const button=$('#sound');
  const action=audio.enabled?words().soundOff:words().soundOn;
  button.innerHTML=icon(audio.enabled?'sound':'mute');
  button.setAttribute('aria-label',action);
  button.setAttribute('aria-pressed',String(audio.enabled));
  button.title=action;
}

function applyLanguage() {
  const strings=words();
  document.documentElement.lang=language==='en'?'en':'zh-CN';
  document.title=strings.title;
  $('meta[name="description"]').content=strings.description;
  for(const element of document.querySelectorAll('[data-text]'))element.textContent=strings[element.dataset.text];
  for(const element of document.querySelectorAll('[data-label]'))element.setAttribute('aria-label',strings[element.dataset.label]);
  for(const element of document.querySelectorAll('[data-title]'))element.title=strings[element.dataset.title];
  for(const element of document.querySelectorAll('[data-clear-label]'))element.textContent=strings.clearLabels[Number(element.dataset.clearLabel)];
  for(let i=0;i<3;i++)$('#next-'+i).setAttribute('aria-label',strings.preview(i+1));
  const languageButton=$('#language');
  languageButton.textContent=language==='en'?'中文':'EN';
  languageButton.lang=language==='en'?'zh-CN':'en';
  languageButton.title=strings.languageSwitch;
  $('#library-link').href='https://www.veldongame.com/games/original/?lang='+language;
  if($('#notice').classList.contains('visible'))$('#notice').textContent=strings.saveFailed;
  duel.setLanguage(strings);
  updateModeButton();
  updateSoundButton();
  updateOverlay();
  setFooter(footerStatus);
  renderClear();
}

function updateModeButton() {
  const strings=words();
  const button=$('#mode');
  const label=inDuel?strings.soloMode:strings.duelMode;
  button.querySelector('b').textContent=inDuel?'1P':'2P';
  button.querySelector('span').textContent=label;
  button.setAttribute('aria-label',label);
  button.setAttribute('aria-controls',inDuel?'solo':'duel');
  button.title=label;
  $('#solo-manual').hidden=inDuel;
  $('#manual-tip').textContent=inDuel?strings.duelTip:strings.manualTip;
}

function focusBoard() {
  if (inDuel) duel.focus();
  else $('#board').focus({preventScroll:true});
}

function restoreBoardAfterClick(event) {
  if(event.detail>0&&(inDuel?duel.mode:game.mode)==='playing')focusBoard();
}

function switchMode() {
  if(inDuel)duel.pause();
  else game.pause();
  inDuel=!inDuel;
  $('#solo').hidden=inDuel;
  $('#solo-touch').hidden=inDuel;
  $('#duel').hidden=!inDuel;
  updateModeButton();
  updatePauseButton();
  setFooter(footerStatus);
  focusBoard();
}

function start() {
  audio.unlock();
  clearTimeout(feedbackTimer);
  lastClear=undefined;
  $('#clear-feedback').classList.remove('show');
  game.start();
  setFooter('footerPlaying');
  focusBoard();
}

function pauseToggle() {
  audio.unlock();
  if($('#help-dialog').open)return;
  if(inDuel){duel.togglePause();return;}
  if(game.mode==='playing')game.pause();
  else if(game.mode==='paused'){game.resume();focusBoard();}
}

function updatePauseButton() {
  const mode=inDuel?duel.mode:game.mode;
  const button=$('#pause');
  button.disabled=mode==='ready'||mode==='over';
  button.innerHTML=icon(mode==='paused'?'play':'pause');
  button.setAttribute('aria-label',mode==='paused'?words().resume:words().pause);
}

function updateOverlay(){
  const strings=words();
  const overlay=$('#game-overlay');
  overlay.classList.toggle('hidden',game.mode==='playing');
  $('.board-shade').classList.toggle('visible',game.mode!=='playing');
  updatePauseButton();
  $('#state-label').textContent=strings[game.mode];
  $('.playfield').dataset.mode=game.mode;
  if(game.mode==='playing'){overlay.innerHTML='';return;}
  if(game.mode==='ready')overlay.innerHTML=`<div class="overlay-symbol">${icon('play')}</div><h2>${strings.readyTitle}<span>${strings.readyWorld}</span></h2><p>${strings.readyHint}</p><button class="primary" id="start" type="button">${strings.start} ${icon('right')}</button><small>${strings.enterStart}</small>`;
  if(game.mode==='paused')overlay.innerHTML=`<div class="overlay-symbol">${icon('pause')}</div><h2>${strings.paused}</h2><p>${strings.pausedHint}</p><button class="primary" id="resume" type="button">${strings.resume} ${icon('play')}</button><button class="text-button" id="restart" type="button">${strings.restart}</button>`;
  if(game.mode==='over')overlay.innerHTML=`<div class="overlay-symbol pink">${icon('restart')}</div><h2>${strings.over}</h2><div class="result-score">${game.score.toLocaleString(document.documentElement.lang)}<span>${strings.yourScore}</span></div><p>${strings.results(game.lines,game.level)}</p><button class="primary" id="restart" type="button">${strings.retry} ${icon('right')}</button><small>${strings.enterRetry}</small>`;
  $('#start')?.addEventListener('click',start);
  $('#resume')?.addEventListener('click',pauseToggle);
  $('#restart')?.addEventListener('click',start);
}
applyLanguage();

$('#mode').addEventListener('click',switchMode);
$('#language').addEventListener('click',event=>{
  language=language==='en'?'zh':'en';
  const nextUrl=new URL(location.href);
  nextUrl.searchParams.set('lang',language);
  history.replaceState(null,'',nextUrl);
  try { localStorage.setItem(languageKey,language); }
  catch { /* The URL still carries the selected language. */ }
  applyLanguage();
  restoreBoardAfterClick(event);
});
$('#sound').addEventListener('click',event=>{
  audio.unlock();
  audio.enabled=!audio.enabled;
  updateSoundButton();
  if(audio.enabled)audio.effect('rotate');
  restoreBoardAfterClick(event);
});
$('#pause').addEventListener('click',pauseToggle);
for(const selector of ['#hold-button','#mobile-hold-button']) {
  $(selector).addEventListener('click',event=>{audio.unlock();game.swap();restoreBoardAfterClick(event);});
}
$('#help').addEventListener('click',()=>{
  if(inDuel)duel.pause();
  else game.pause();
  $('#help-dialog').showModal();
});
$('#close-help').addEventListener('click',()=>$('#help-dialog').close());
$('#help-done').addEventListener('click',()=>$('#help-dialog').close());
$('#help-dialog').addEventListener('click',e=>{if(e.target===$('#help-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});

const keyActions={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',ArrowDown:'down',KeyX:'rotate',KeyZ:'counter',Space:'drop',KeyC:'hold',ShiftLeft:'hold',ShiftRight:'hold'};
document.addEventListener('keydown',e=>{
  if($('#help-dialog').open||e.ctrlKey||e.metaKey||e.altKey)return;
  if((e.code==='Space'||e.code==='Enter')&&e.target.closest?.('button,a'))return;
  if(inDuel){duel.keyDown(e);return;}
  const action=keyActions[e.code];
  if(!action&&e.code!=='Enter'&&e.code!=='KeyP'&&e.code!=='Escape')return;
  e.preventDefault();
  if(e.repeat)return;
  audio.unlock();
  if(e.code==='Enter' && (game.mode==='ready'||game.mode==='over')){start();return;}
  if(e.code==='KeyP'||e.code==='Escape'){pauseToggle();return;}
  if(action&&game.mode==='playing')soloInput.press(e.code,action);
});
document.addEventListener('keyup',e=>{
  soloInput.release(e.code);
  duel.keyUp(e.code);
});
function pauseForBlur() {
  soloInput.clear();
  gesture=null;
  game.pause();
  duel.pause();
}
window.addEventListener('blur',pauseForBlur);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseForBlur();});

bindTouchControls($('#solo-touch'),soloInput,()=>!inDuel&&game.mode==='playing',()=>audio.unlock());
$('#board').addEventListener('pointerdown',e=>{if(game.mode!=='playing')return;e.preventDefault();$('#board').setPointerCapture(e.pointerId);gesture={x:e.clientX,y:e.clientY,t:performance.now()};});
$('#board').addEventListener('pointerup',e=>{
  if(!gesture)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  audio.unlock();
  if(dy>38 && dy>Math.abs(dx)*1.2)soloInput.trigger('drop');
  else if(Math.abs(dx)>20){const steps=Math.max(1,Math.round(Math.abs(dx)/($('#board').clientWidth/10)));for(let i=0;i<steps;i++)soloInput.trigger(dx>0?'right':'left');}
  else if(Math.abs(dy)<20 && performance.now()-gesture.t<450)soloInput.trigger('rotate');gesture=null;
});
$('#board').addEventListener('pointercancel',()=>gesture=null);

function hud(){
  const key=[game.score,game.level,game.lines,best,game.hold,game.canHold,game.mode,!!game.active()].join('|');
  if(key!==hudCache){hudCache=key;$('#score').textContent=String(game.score).padStart(6,'0');$('#best').textContent=String(Math.max(best,game.score)).padStart(6,'0');$('#level').textContent=String(game.level).padStart(2,'0');$('#lines').textContent=String(game.lines).padStart(3,'0');$('#progress').style.width=(game.lines%10)*10+'%';$('#progress-label').textContent=`${game.lines%10} / 10`;$('.hold-empty').hidden=!!game.hold;$('#hold-button').disabled=!game.active()||!game.canHold;$('#mobile-hold-button').disabled=!game.active()||!game.canHold;}
  const preview=[game.hold,game.canHold,...game.queue.slice(0,3)].join('|');
  if(preview!==previewCache){previewCache=preview;drawMini($('#hold-canvas'),game.hold,!game.canHold);drawMini($('#mobile-hold-canvas'),game.hold,!game.canHold);for(let i=0;i<3;i++)drawMini($('#next-'+i),game.queue[i]||['T','I','L'][i]);}
}
let last=performance.now();
function tick(now){
  const dt=Math.min(50,now-last);last=now;
  if(inDuel)duel.tick(dt);
  else {
    if(game.mode==='playing')game.update(dt,soloInput.update(dt));
    renderer.draw(dt);
    hud();
  }
  audio.playing=(inDuel?duel.mode:game.mode)==='playing';
  audio.update();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
