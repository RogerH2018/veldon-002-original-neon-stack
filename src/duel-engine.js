import { NeonGame } from './engine.js';

export class NeonDuel {
  constructor(emit = () => {}) {
    this.boards = [1, 2].map(player => new NeonGame((event, data) => emit(player, event, data)));
    this.mode = 'ready';
    this.winner = null;
  }

  start(seed = Date.now()) {
    this.mode = 'playing';
    this.winner = null;
    for (const board of this.boards) {
      board.setSeed(seed);
      board.start();
    }
  }

  pause() {
    if (this.mode !== 'playing') return false;
    this.mode = 'paused';
    for (const board of this.boards) board.pause();
    return true;
  }

  resume() {
    if (this.mode !== 'paused') return false;
    this.mode = 'playing';
    for (const board of this.boards) board.resume();
    return true;
  }

  update(dt, softDrops = []) {
    if (this.mode !== 'playing') return false;
    this.boards.forEach((board, index) => board.update(dt, softDrops[index]));
    const [first, second] = this.boards.map(board => board.mode === 'over');
    if (!first && !second) return false;
    this.winner = first && second ? 0 : first ? 2 : 1;
    this.mode = 'over';
    for (const board of this.boards) board.pause();
    return true;
  }
}
