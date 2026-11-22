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
    const [first, second] = this.boards;
    if (first.mode !== 'over' || second.mode !== 'over') return false;
    this.winner = first.score === second.score ? 0 : first.score > second.score ? 1 : 2;
    this.mode = 'over';
    return true;
  }
}
