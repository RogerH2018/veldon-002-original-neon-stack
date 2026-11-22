import './style.css';
import { NeonGame } from './engine.js';
import { Renderer, drawMini } from './render.js';
import { NeonAudio } from './audio.js';
import { copy } from './copy.js';

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
        <button id="language" class="icon-button language-button" type="button" data-label="languageSwitch"></button>
        <button id="sound" class="icon-button" type="button" aria-pressed="true">${icon('sound')}</button>
        <button id="pause" class="icon-button" type="button" data-title="pauseShortcut" disabled>${icon('pause')}</button>
        <button id="help" class="icon-button" type="button" data-label="help" data-title="help">${icon('help')}</button>
      </div></div>
    </header>

    <main class="game-layout">
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

    <div class="touch-controls" data-label="touchControls">
      <button data-action="hold" class="touch-small" data-label="hold">${icon('hold')}${label('hold')}</button>
      <button data-action="left" data-label="left">${icon('left')}</button>
      <button data-action="rotate" data-label="rotate">${icon('rotate')}${label('rotate')}</button>
      <button data-action="right" data-label="right">${icon('right')}</button>
      <button data-action="down" class="touch-small" data-label="softDrop">${icon('down')}${label('fast')}</button>
      <button data-action="drop" class="touch-drop" data-label="hardDrop">${icon('drop')}${label('drop')}</button>
    </div>
    <footer class="footer"><span><i class="live-dot"></i><b id="footer-status"></b></span><a id="library-link" href="https://www.veldongame.com/games/original/">Veldon Game</a></footer>
    <div id="notice" role="status"></div>
  </div>
  <dialog id="help-dialog" aria-labelledby="manual-title">
    <div class="help-top"><span>NEON STACK</span><button id="close-help" type="button" data-label="closeHelp">×</button></div>
    <h2 id="manual-title" data-text="manualTitle"></h2>
    <p data-text="goal"></p>
    <div class="manual-controls">
      ${[['← →','move'],['↑ / X','rotateCW'],['Z','rotateCCW'],['↓','softPoints'],['SPACE','hardPoints'],['C / SHIFT','holdRule'],['P / ESC','pauseResume']].map(([key,action])=>`<div><kbd>${key}</kbd>${label(action)}</div>`).join('')}
    </div>
    <p class="manual-tip" data-text="manualTip"></p>
    <div class="scoring">${[100,300,500,800].map((points,index)=>`<span><span data-clear-label="${index+1}"></span> <b>${points}</b></span>`).join('')}</div>
    <small data-text="scoring"></small>
    <button id="help-done" class="primary" type="button">${label('gotIt')} ${icon('right')}</button>
  </dialog>
`;

const audio=new NeonAudio();
let best=readBest(),renderer,feedbackTimer,hudCache='',previewCache='',noticeTimer,held={},horizontalTime=0,repeatTime=0,touchDown=false;
let lastClear,footerStatus='footerReady';
const game=new NeonGame((name,data={})=>{
  audio.effect(name,data);renderer?.event(name,data);
  if(['pause','over','start','resume'].includes(name)) {held={};touchDown=false;updateOverlay();}
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
renderer=new Renderer($('#board'),game);

function notifySaveFailure() {
  const notice=$('#notice');
  notice.textContent=words().saveFailed;
  notice.classList.add('visible');
  clearTimeout(noticeTimer);
  noticeTimer=setTimeout(()=>notice.classList.remove('visible'),5000);
}

function setFooter(key) {
  footerStatus=key;
  $('#footer-status').textContent=words()[key];
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
  updateSoundButton();
  updateOverlay();
  setFooter(footerStatus);
  renderClear();
}

function focusBoard() { $('#board').focus({preventScroll:true}); }
function restoreBoardAfterClick(event) {
  if(event.detail>0&&game.mode==='playing')focusBoard();
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
  if(game.mode==='playing')game.pause();
  else if(game.mode==='paused'){game.resume();focusBoard();}
}

function updateOverlay(){
  const strings=words();
  const overlay=$('#game-overlay');
  overlay.classList.toggle('hidden',game.mode==='playing');
  $('.board-shade').classList.toggle('visible',game.mode!=='playing');
  $('#pause').disabled=game.mode==='ready'||game.mode==='over';
  $('#pause').innerHTML=icon(game.mode==='paused'?'play':'pause');
  $('#pause').setAttribute('aria-label',game.mode==='paused'?strings.resume:strings.pause);
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
$('#help').addEventListener('click',()=>{if(game.mode==='playing')game.pause();$('#help-dialog').showModal();});
$('#close-help').addEventListener('click',()=>$('#help-dialog').close());
$('#help-done').addEventListener('click',()=>$('#help-dialog').close());
$('#help-dialog').addEventListener('click',e=>{if(e.target===$('#help-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});

function action(name){audio.unlock();if($('#help-dialog').open)return;if(name==='left')game.move(-1);if(name==='right')game.move(1);if(name==='rotate')game.rotate(1);if(name==='counter')game.rotate(-1);if(name==='drop')game.hardDrop();if(name==='hold')game.swap();}
const keyActions={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',KeyX:'rotate',KeyZ:'counter',Space:'drop',KeyC:'hold',ShiftLeft:'hold',ShiftRight:'hold'};
document.addEventListener('keydown',e=>{
  if($('#help-dialog').open||e.ctrlKey||e.metaKey||e.altKey)return;
  if((e.code==='Space'||e.code==='Enter')&&e.target.closest?.('button,a'))return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyP','Escape','KeyC','KeyZ','KeyX','ShiftLeft','ShiftRight','Enter'].includes(e.code))e.preventDefault();else return;
  if(e.repeat)return;
  audio.unlock();
  if(e.code==='Enter' && (game.mode==='ready'||game.mode==='over')){start();return;}
  if(e.code==='KeyP'||e.code==='Escape'){pauseToggle();return;}
  held[e.code]=true;
  if(e.code==='ArrowLeft'||e.code==='ArrowRight'){horizontalTime=0;repeatTime=0;}
  if(keyActions[e.code])action(keyActions[e.code]);
});
document.addEventListener('keyup',e=>{delete held[e.code];});
window.addEventListener('blur',()=>{held={};touchDown=false;game.pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){held={};touchDown=false;game.pause();}});

for(const button of document.querySelectorAll('[data-action]')) {
  button.addEventListener('pointerdown',e=>{
    e.preventDefault();button.setPointerCapture(e.pointerId);button.classList.add('pressed');
    const a=button.dataset.action;action(a);
    if(a==='down')touchDown=true;
    if(a==='left'||a==='right'){held[a]=true;horizontalTime=0;repeatTime=0;}
  });
  const release=()=>{button.classList.remove('pressed');if(button.dataset.action==='down')touchDown=false;delete held[button.dataset.action];};
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
let gesture=null;
$('#board').addEventListener('pointerdown',e=>{if(game.mode!=='playing')return;e.preventDefault();$('#board').setPointerCapture(e.pointerId);gesture={x:e.clientX,y:e.clientY,t:performance.now()};});
$('#board').addEventListener('pointerup',e=>{
  if(!gesture)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
  if(dy>38 && dy>Math.abs(dx)*1.2)action('drop');
  else if(Math.abs(dx)>20){const steps=Math.max(1,Math.round(Math.abs(dx)/($('#board').clientWidth/10)));for(let i=0;i<steps;i++)action(dx>0?'right':'left');}
  else if(Math.abs(dy)<20 && performance.now()-gesture.t<450)action('rotate');gesture=null;
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
  if(game.mode==='playing'){
    const left=held.ArrowLeft||held.left,right=held.ArrowRight||held.right;
    if(left!==right && (left||right)) {horizontalTime+=dt;if(horizontalTime>165){repeatTime+=dt;while(repeatTime>=48){game.move(left?-1:1);repeatTime-=48;}}} else {horizontalTime=0;repeatTime=0;}
    game.update(dt,held.ArrowDown||touchDown);
  }
  audio.playing=game.mode==='playing';audio.update();renderer.draw(dt);hud();requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
