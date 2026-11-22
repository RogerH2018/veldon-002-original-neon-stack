const actions = {
  left: game => game.move(-1),
  right: game => game.move(1),
  rotate: game => game.rotate(1),
  counter: game => game.rotate(-1),
  drop: game => game.hardDrop(),
  hold: game => game.swap(),
};

export class BoardInput {
  constructor(game) {
    this.game = game;
    this.held = new Map();
    this.clear();
  }

  trigger(action) {
    actions[action]?.(this.game);
  }

  press(source, action) {
    if (this.held.has(source)) return;
    this.held.set(source, action);
    if (action === 'left' || action === 'right') {
      this.horizontalTime = 0;
      this.repeatTime = 0;
    }
    this.trigger(action);
  }

  release(source) {
    this.held.delete(source);
  }

  clear() {
    this.held.clear();
    this.horizontalTime = 0;
    this.repeatTime = 0;
  }

  update(dt) {
    const held = new Set(this.held.values());
    const left = held.has('left');
    const right = held.has('right');
    if (left === right) {
      this.horizontalTime = 0;
      this.repeatTime = 0;
    } else {
      this.horizontalTime += dt;
      if (this.horizontalTime > 165) {
        this.repeatTime += dt;
        while (this.repeatTime >= 48) {
          this.game.move(left ? -1 : 1);
          this.repeatTime -= 48;
        }
      }
    }
    return held.has('down');
  }
}

export function bindTouchControls(root, input, canPlay, unlockAudio) {
  for (const button of root.querySelectorAll('[data-action]')) {
    const pointers = new Set();
    button.addEventListener('pointerdown', event => {
      if (!canPlay() || event.button !== 0) return;
      event.preventDefault();
      pointers.add(event.pointerId);
      button.setPointerCapture(event.pointerId);
      button.classList.add('pressed');
      unlockAudio();
      input.press(event.pointerId, button.dataset.action);
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(name, event => {
        pointers.delete(event.pointerId);
        if (!pointers.size) button.classList.remove('pressed');
        input.release(event.pointerId);
      });
    }
    button.addEventListener('click', event => {
      if (event.detail !== 0 || !canPlay()) return;
      unlockAudio();
      const action = button.dataset.action;
      if (action === 'down') input.game.down(true);
      else input.trigger(action);
    });
  }
}
