import './style.css';
import { NeonGame } from './engine.js';
import { Renderer, drawMini } from './render.js';
import { NeonAudio } from './audio.js';
import { init } from './ohmygame/client.js';

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

$('#app').innerHTML=`
  <div class="city-bg" aria-hidden="true"></div><div class="ambient" aria-hidden="true"></div>
  <div class="shell">
    <header class="topbar">
      <div class="brand"><div class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div><h1>NEON<span>STACK</span></h1><div class="brand-sub">霓虹堆栈 <b>/</b> CYBERPUNK BLOCK PUZZLE</div></div></div>
      <div class="top-actions"><span class="connection"><i></i>SYSTEM ONLINE</span><div class="icon-buttons">
        <button id="sound" class="icon-button" aria-label="关闭声音" title="声音开关" aria-pressed="true">${icon('sound')}</button>
        <button id="pause" class="icon-button" aria-label="暂停游戏" title="暂停 / 继续 · P" disabled>${icon('pause')}</button>
        <button id="help" class="icon-button" aria-label="操作说明" title="操作说明">${icon('help')}</button>
      </div></div>
    </header>

    <main class="game-layout">
      <aside class="stats-side">
        <div class="section-cap desktop-only"><span>01 / SESSION</span><b>///</b></div>
        <section class="score-section"><div class="label">当前得分 <span>SCORE</span></div><div id="score" class="score-number">000000</div><div class="best"><span>${icon('trophy')} 最高纪录</span><strong id="best">000000</strong></div></section>
        <div class="stat-pair"><section><div class="label">等级 <span>LEVEL</span></div><div class="stat-number cyan" id="level">01</div></section><section><div class="label">消除行 <span>LINES</span></div><div class="stat-number" id="lines">000</div></section></div>
        <section class="level-progress desktop-only"><div class="progress-label"><span>下一等级</span><span id="progress-label">0 / 10</span></div><div class="progress-track"><i id="progress"></i></div></section>
        <section class="hold-panel desktop-hold"><div class="section-cap"><span>暂存 <small>HOLD</small></span><kbd>C</kbd></div><button class="hold-box" id="hold-button" title="暂存 / 交换方块 · C" aria-label="暂存方块"><canvas id="hold-canvas" aria-label="暂存方块预览"></canvas><span class="hold-empty">等待暂存</span><i class="corner tl"></i><i class="corner br"></i></button></section>
        <div class="mode-note desktop-only"><div class="mode-symbol">∞</div><div><strong>无尽模式</strong><span>ENDLESS RUN</span></div></div>
      </aside>

      <section class="playfield" aria-label="俄罗斯方块棋盘">
        <div class="well-caption"><span><i></i><b id="state-label">等待接入</b></span><span>10 × 20</span></div>
        <div class="board-frame"><div class="board-inner"><canvas id="board" width="300" height="600" aria-label="俄罗斯方块游戏区域"></canvas><div class="board-shade"></div>
          <div id="game-overlay" class="game-overlay"></div><div id="clear-feedback" class="clear-feedback" aria-live="polite"></div>
        </div><i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i><div class="edge-meter" aria-hidden="true"></div></div>
        <div class="well-footer"><span>DROP INTO THE FUTURE</span><span class="signal-bars"><i></i><i></i><i></i><i></i><i></i></span></div>
      </section>

      <aside class="next-side">
        <section class="next-panel"><div class="section-cap"><span>下一个 <small>NEXT</small></span><b>03</b></div><div class="next-list">${[0,1,2].map((n)=>`<div class="next-piece"><span>0${n+1}</span><canvas id="next-${n}" aria-label="第${n+1}个后续方块"></canvas></div>`).join('')}</div></section>
        <section class="hold-panel mobile-hold"><div class="section-cap"><span>暂存</span><kbd>C</kbd></div><button id="mobile-hold-button" class="hold-box" aria-label="暂存或交换方块"><canvas id="mobile-hold-canvas"></canvas></button></section>
        <section class="controls-guide desktop-only"><div class="section-cap"><span>操作 <small>CONTROLS</small></span></div><div><span><kbd>←</kbd><kbd>→</kbd></span><span>左右移动</span></div><div><span><kbd>↑</kbd></span><span>旋转方块</span></div><div><span><kbd>↓</kbd></span><span>加速下落</span></div><div><span><kbd class="wide-key">SPACE</kbd></span><span>直接落下</span></div><div><span><kbd>C</kbd></span><span>暂存方块</span></div><div><span><kbd>P</kbd></span><span>暂停游戏</span></div></section>
        <div class="side-note desktop-only"><i></i>保持节奏，突破极限。<span>STAY IN THE FLOW.</span></div>
      </aside>
    </main>

    <div class="touch-controls" aria-label="触屏操作">
      <button data-action="hold" class="touch-small" aria-label="暂存">${icon('hold')}<span>暂存</span></button>
      <button data-action="left" aria-label="向左">${icon('left')}</button>
      <button data-action="rotate" aria-label="旋转">${icon('rotate')}<span>旋转</span></button>
      <button data-action="right" aria-label="向右">${icon('right')}</button>
      <button data-action="down" class="touch-small" aria-label="加速下落">${icon('down')}<span>加速</span></button>
      <button data-action="drop" class="touch-drop" aria-label="直接落下">${icon('drop')}<span>落下</span></button>
    </div>
    <footer class="footer"><span><i class="live-dot"></i><b id="footer-status">连接就绪，等待你的下一步。</b></span><span class="footer-right">NIGHT CITY <b> / </b> ARCADE DIVISION <em>© 2077</em></span></footer>
    <div id="notice" role="status"></div>
  </div>
  <dialog id="help-dialog"><div class="help-top"><span>NEON STACK / MANUAL</span><button id="close-help" aria-label="关闭操作说明">×</button></div><h2>连接你的节奏。</h2><p>填满一整行即可消除。每消除 10 行提升一级，堆到顶部则挑战结束。</p><div class="manual-controls"><div><kbd>← →</kbd><span>左右移动</span></div><div><kbd>↑ / X</kbd><span>顺时针旋转</span></div><div><kbd>Z</kbd><span>逆时针旋转</span></div><div><kbd>↓</kbd><span>加速下落 · 每格 +1</span></div><div><kbd>SPACE</kbd><span>直接落下 · 每格 +2</span></div><div><kbd>C / SHIFT</kbd><span>暂存 / 交换，每块一次</span></div><div><kbd>P / ESC</kbd><span>暂停 / 继续</span></div></div><p class="manual-tip">虚线方块表示落点。手机可使用底部按钮，或在棋盘上左右滑动移动、轻点旋转、下滑直接落下。</p><div class="scoring"><span>单行 <b>100</b></span><span>双行 <b>300</b></span><span>三行 <b>500</b></span><span>四行 <b>800</b></span></div><small>消行得分 × 当前等级，连续消行还有额外奖励。</small><button id="help-done" class="primary">了解，接入游戏 ${icon('right')}</button></dialog>
`;

const audio=new NeonAudio();
let best=0,sdk=null,renderer,feedbackTimer,hudCache='',previewCache='',noticeTimer,held={},horizontalTime=0,repeatTime=0,touchDown=false;
const game=new NeonGame((name,data={})=>{
  audio.effect(name,data);renderer?.event(name,data);
  if(['pause','over','start','resume'].includes(name)) {held={};touchDown=false;updateOverlay();}
  if(name==='clear') {
    const names=['','SINGLE','DOUBLE','TRIPLE','NEON CLEAR'];
    $('#clear-feedback').innerHTML=`<strong>${names[data.count]}</strong><span>+${data.points}${data.combo>0?` · 连击 ×${data.combo+1}`:''}</span>${data.levelUp?'<small>LEVEL UP / 等级提升</small>':''}`;
    $('#clear-feedback').classList.remove('show');void $('#clear-feedback').offsetWidth;$('#clear-feedback').classList.add('show');
    clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>$('#clear-feedback').classList.remove('show'),1300);
  }
  if(name==='over') {const newBest=game.score>best;best=Math.max(best,game.score);saveRecord();$('#footer-status').textContent=newBest?'新纪录已达成。下一次，还能更高。':'信号中断，再来一次。';}
});
renderer=new Renderer($('#board'),game);

function notify(message) {$('#notice').textContent=message;$('#notice').classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('#notice').classList.remove('visible'),5000);}
async function saveRecord() {
  if(!sdk)return;
  try {await sdk.storage.set('neon-stack-record',{best});}
  catch(error){notify(`纪录保存失败：${error.message}`);}
}
init({allowLocalhost:true}).then(async client=>{
  sdk=client;
  try{const saved=await sdk.storage.get('neon-stack-record');if(Number.isFinite(saved?.best))best=Math.max(best,saved.best);}
  catch(error){notify(`纪录读取失败：${error.message}`);}
}).catch(error=>notify(`纪录服务暂不可用：${error.message}`));

function start(){audio.unlock();clearTimeout(feedbackTimer);$('#clear-feedback').classList.remove('show');game.start();$('#footer-status').textContent='连接已建立。保持节奏，突破纪录。';}
function pauseToggle(){audio.unlock();if($('#help-dialog').open)return;if(game.mode==='playing')game.pause();else if(game.mode==='paused')game.resume();}
function updateOverlay(){
  const overlay=$('#game-overlay');
  overlay.classList.toggle('hidden',game.mode==='playing');
  $('.board-shade').classList.toggle('visible',game.mode!=='playing');
  $('#pause').disabled=game.mode==='ready'||game.mode==='over';
  $('#pause').innerHTML=icon(game.mode==='paused'?'play':'pause');
  $('#pause').setAttribute('aria-label',game.mode==='paused'?'继续游戏':'暂停游戏');
  $('#state-label').textContent=({ready:'等待接入',playing:'信号在线',paused:'信号挂起',over:'连接中断'})[game.mode];
  $('.playfield').dataset.mode=game.mode;
  if(game.mode==='playing'){overlay.innerHTML='';return;}
  if(game.mode==='ready')overlay.innerHTML=`<div class="overlay-symbol">${icon('play')}</div><span class="eyebrow">READY TO DROP</span><h2>准备接入<span>霓虹世界</span></h2><p>堆叠 · 消行 · 突破纪录</p><button class="primary" id="start">开始游戏 ${icon('right')}</button><small>按 ENTER 开始</small>`;
  if(game.mode==='paused')overlay.innerHTML=`<div class="overlay-symbol">${icon('pause')}</div><span class="eyebrow">SIGNAL PAUSED</span><h2>暂停片刻</h2><p>城市依旧在等你。</p><button class="primary" id="resume">继续游戏 ${icon('play')}</button><button class="text-button" id="restart">重新开始</button>`;
  if(game.mode==='over')overlay.innerHTML=`<div class="overlay-symbol pink">${icon('restart')}</div><span class="eyebrow pink">CONNECTION LOST</span><h2>挑战结束</h2><div class="result-score">${game.score.toLocaleString()}<span>本次得分</span></div><p>消除 ${game.lines} 行 <b>/</b> 到达等级 ${game.level}</p><button class="primary" id="restart">再次挑战 ${icon('right')}</button><small>按 ENTER 重新开始</small>`;
  $('#start')?.addEventListener('click',start);$('#resume')?.addEventListener('click',()=>game.resume());$('#restart')?.addEventListener('click',start);
}
updateOverlay();

$('#sound').addEventListener('click',()=>{audio.unlock();audio.enabled=!audio.enabled;$('#sound').innerHTML=icon(audio.enabled?'sound':'mute');$('#sound').setAttribute('aria-label',audio.enabled?'关闭声音':'开启声音');$('#sound').setAttribute('aria-pressed',String(audio.enabled));if(audio.enabled)audio.effect('rotate');});
$('#pause').addEventListener('click',pauseToggle);
$('#hold-button').addEventListener('click',()=>{audio.unlock();game.swap();});
$('#mobile-hold-button').addEventListener('click',()=>{audio.unlock();game.swap();});
$('#help').addEventListener('click',()=>{if(game.mode==='playing')game.pause();$('#help-dialog').showModal();});
$('#close-help').addEventListener('click',()=>$('#help-dialog').close());
$('#help-done').addEventListener('click',()=>$('#help-dialog').close());
$('#help-dialog').addEventListener('click',e=>{if(e.target===$('#help-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});

function action(name){audio.unlock();if($('#help-dialog').open)return;if(name==='left')game.move(-1);if(name==='right')game.move(1);if(name==='rotate')game.rotate(1);if(name==='counter')game.rotate(-1);if(name==='drop')game.hardDrop();if(name==='hold')game.swap();}
const keyActions={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',KeyX:'rotate',KeyZ:'counter',Space:'drop',KeyC:'hold',ShiftLeft:'hold',ShiftRight:'hold'};
document.addEventListener('keydown',e=>{
  if($('#help-dialog').open)return;
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
// Read-only state plus deterministic time/seed hooks let playtests inspect canvas gameplay.
if(new URLSearchParams(location.search).has('ohmygamePlaytest')) globalThis.__OHMYGAME_PLAYTEST__={snapshot:()=>({...game.snapshot(),best,sound:audio.enabled}),reset:()=>start(),setSeed:seed=>game.setSeed(seed),step:milliseconds=>{for(let t=0;t<milliseconds;t+=16)game.update(Math.min(16,milliseconds-t));hud();renderer.draw(0);return game.snapshot();}};
