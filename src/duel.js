import './duel.css';
import { BoardInput, bindTouchControls } from './board-input.js';
import { NeonDuel } from './duel-engine.js';
import { Renderer, drawMini } from './render.js';

const keyboard = [
  [
    ['A / D', 'duelMove', { KeyA: 'left', KeyD: 'right' }],
    ['W', 'duelClockwise', { KeyW: 'rotate' }],
    ['Q', 'duelCounterClockwise', { KeyQ: 'counter' }],
    ['S', 'softDrop', { KeyS: 'down' }],
    ['F', 'hardDrop', { KeyF: 'drop' }],
    ['E', 'hold', { KeyE: 'hold' }],
  ],
  [
    ['← / →', 'duelMove', { ArrowLeft: 'left', ArrowRight: 'right' }],
    ['↑', 'duelClockwise', { ArrowUp: 'rotate' }],
    ['/', 'duelCounterClockwise', { Slash: 'counter', NumpadDivide: 'counter' }],
    ['↓', 'softDrop', { ArrowDown: 'down' }],
    ['Enter', 'hardDrop', { Enter: 'drop', NumpadEnter: 'drop', Space: 'drop' }],
    ['', 'hold', { ShiftRight: 'hold', Numpad0: 'hold' }],
  ],
];

const touchButtons = [
  ['left', 'left'],
  ['rotate', 'rotate'],
  ['right', 'right'],
  ['hold', 'hold'],
  ['down', 'softDrop'],
  ['drop', 'hardDrop'],
];

function playerMarkup(index, icon) {
  return `
    <section class="duel-player" data-player="${index + 1}" aria-labelledby="duel-player-${index + 1}">
      <header class="duel-player-header">
        <h3 id="duel-player-${index + 1}"></h3>
        <strong class="duel-result" hidden></strong>
      </header>
      <div class="duel-field">
        <div class="duel-board-frame"><canvas class="duel-board" width="300" height="600"></canvas></div>
        <dl class="duel-stats">
          <div><dt data-duel-text="duelScore"></dt><dd data-stat="score">000000</dd></div>
          <div><dt data-duel-text="lines"></dt><dd data-stat="lines">0</dd></div>
          <div><dt data-duel-text="level"></dt><dd data-stat="level">1</dd></div>
          <div class="duel-preview"><dt data-duel-text="next"></dt><dd><canvas data-preview="next" width="120" height="64" aria-hidden="true"></canvas></dd></div>
          <div class="duel-preview"><dt data-duel-text="hold"></dt><dd><canvas data-preview="hold" width="120" height="64" aria-hidden="true"></canvas></dd></div>
        </dl>
      </div>
      <div class="duel-touch">
        ${touchButtons.map(([action, label]) => `<button type="button" data-action="${action}" data-duel-label="${label}">${icon(action)}</button>`).join('')}
      </div>
      <dl class="duel-keys">
        ${keyboard[index].map(([key, label]) => `<div><dt><kbd${key ? '' : ' data-duel-text="rightShift"'}>${key}</kbd></dt><dd data-duel-text="${label}"></dd></div>`).join('')}
      </dl>
    </section>`;
}

export function createDuel(root, audio, icon, onModeChange) {
  root.innerHTML = `
    <div class="duel-header">
      <div>
        <h2 id="duel-title"></h2>
        <p id="duel-status" role="status"></p>
      </div>
      <button class="primary" id="duel-action" type="button"></button>
    </div>
    <div class="duel-players">${keyboard.map((_, index) => playerMarkup(index, icon)).join('')}</div>`;

  const title = root.querySelector('#duel-title');
  const status = root.querySelector('#duel-status');
  const actionButton = root.querySelector('#duel-action');
  const match = new NeonDuel((player, name, data) => {
    views[player - 1].renderer.event(name, data);
    if (name !== 'start' && name !== 'resume' && name !== 'over') audio.effect(name, data);
  });
  const views = match.boards.map((board, index) => {
    const panel = root.querySelector(`[data-player="${index + 1}"]`);
    const canvas = panel.querySelector('.duel-board');
    const input = new BoardInput(board);
    const touch = panel.querySelector('.duel-touch');
    bindTouchControls(touch, input, () => match.mode === 'playing' && board.mode === 'playing', () => audio.unlock());
    return {
      panel,
      canvas,
      title: panel.querySelector('h3'),
      result: panel.querySelector('.duel-result'),
      touch,
      input,
      renderer: new Renderer(canvas, board),
      score: panel.querySelector('[data-stat="score"]'),
      lines: panel.querySelector('[data-stat="lines"]'),
      level: panel.querySelector('[data-stat="level"]'),
      next: panel.querySelector('[data-preview="next"]'),
      hold: panel.querySelector('[data-preview="hold"]'),
      previewKey: '',
    };
  });
  const bindings = new Map();
  keyboard.forEach((keys, index) => {
    keys.forEach(([, , actions]) => {
      for (const [code, action] of Object.entries(actions)) bindings.set(code, { input: views[index].input, action });
    });
  });

  let strings;

  function focus() {
    root.focus({ preventScroll: true });
  }

  function renderState() {
    root.dataset.phase = match.mode;
    const actionText = { ready: strings.duelStart, paused: strings.resume, over: strings.duelReplay };
    const messages = {
      ready: strings.duelReady,
      playing: strings.duelPlaying,
      paused: strings.paused,
      over: match.winner ? strings.duelWinner(match.winner) : strings.duelTie,
    };
    status.textContent = messages[match.mode];
    actionButton.hidden = match.mode === 'playing';
    actionButton.textContent = actionText[match.mode] ?? '';
    views.forEach((view, index) => {
      const result = match.mode === 'over' ? (match.winner === 0 ? 'tie' : match.winner === index + 1 ? 'won' : 'lost') : '';
      view.panel.dataset.result = result;
      view.result.hidden = !result;
      view.result.textContent = { tie: strings.duelTie, won: strings.duelWon, lost: strings.duelLost }[result] ?? '';
      for (const button of view.touch.querySelectorAll('button')) {
        button.disabled = match.mode !== 'playing';
        if (button.disabled) button.classList.remove('pressed');
      }
    });
  }

  function changeRound() {
    for (const view of views) view.input.clear();
    renderState();
    onModeChange();
  }

  function beginOrResume() {
    if (match.mode === 'playing') return;
    audio.unlock();
    if (match.resume()) audio.effect('resume');
    else {
      match.start();
      audio.effect('start');
    }
    changeRound();
    focus();
  }

  function pause() {
    if (match.pause()) changeRound();
  }

  actionButton.addEventListener('click', beginOrResume);

  return {
    get mode() { return match.mode; },
    focus,
    pause,
    togglePause() {
      if (match.mode === 'playing') pause();
      else if (match.mode === 'paused') beginOrResume();
    },
    setLanguage(copy) {
      strings = copy;
      title.textContent = strings.duelTitle;
      for (const node of root.querySelectorAll('[data-duel-text]')) node.textContent = strings[node.dataset.duelText];
      views.forEach((view, index) => {
        const player = strings.duelPlayer(index + 1);
        view.title.textContent = player;
        view.canvas.setAttribute('aria-label', `${player} · ${strings.board}`);
        view.touch.setAttribute('aria-label', `${player} · ${strings.touchControls}`);
        for (const button of view.touch.querySelectorAll('button')) {
          const action = strings[button.dataset.duelLabel];
          button.setAttribute('aria-label', `${player} · ${action}`);
          button.title = action;
        }
      });
      renderState();
    },
    keyDown(event) {
      if (event.code === 'KeyP' || event.code === 'Escape') {
        event.preventDefault();
        if (!event.repeat) this.togglePause();
        return;
      }
      if (event.code === 'Enter' && match.mode !== 'playing') {
        event.preventDefault();
        if (!event.repeat) beginOrResume();
        return;
      }
      const binding = bindings.get(event.code);
      if (!binding) return;
      event.preventDefault();
      if (event.repeat || match.mode !== 'playing') return;
      audio.unlock();
      binding.input.press(event.code, binding.action);
    },
    keyUp(code) {
      bindings.get(code)?.input.release(code);
    },
    tick(dt) {
      if (match.mode === 'playing' && match.update(dt, views.map(view => view.input.update(dt)))) {
        audio.effect('over');
        changeRound();
      }
      views.forEach((view, index) => {
        const board = match.boards[index];
        view.renderer.draw(dt);
        const score = String(board.score).padStart(6, '0');
        if (view.score.textContent !== score) view.score.textContent = score;
        if (view.lines.textContent !== String(board.lines)) view.lines.textContent = board.lines;
        if (view.level.textContent !== String(board.level)) view.level.textContent = board.level;
        const next = board.queue[0] ?? 'T';
        const previewKey = [next, board.hold, board.canHold].join('|');
        if (previewKey !== view.previewKey) {
          view.previewKey = previewKey;
          drawMini(view.next, next);
          drawMini(view.hold, board.hold, !board.canHold);
        }
      });
    },
  };
}
