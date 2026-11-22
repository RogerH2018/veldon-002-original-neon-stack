import test from 'node:test';
import assert from 'node:assert/strict';
import { BoardInput } from '../src/board-input.js';
import { NeonDuel } from '../src/duel-engine.js';

test('both players receive the same piece sequence and update independently', () => {
  const match = new NeonDuel();
  match.start(12345);
  const [first, second] = match.boards;
  const original = second.snapshot();
  first.hardDrop();
  assert.deepEqual(second.snapshot(), original);
  second.hardDrop();
  for (let i = 0; i < 14; i++) {
    assert.equal(first.current.type, second.current.type);
    first.spawn();
    second.spawn();
  }
});

test('a losing board ends the match and the winner stays frozen until a rematch', () => {
  const match = new NeonDuel();
  match.start(12345);
  const [first, second] = match.boards;
  first.end();
  assert.equal(match.update(16), true);
  assert.equal(match.winner, 2);
  assert.equal(match.mode, 'over');
  const winnerState = second.snapshot();
  match.update(1000, [false, true]);
  second.hardDrop();
  assert.deepEqual(second.snapshot(), winnerState);
  match.start(9876);
  assert.equal(match.mode, 'playing');
  assert.equal(match.winner, null);
  for (const board of match.boards) {
    assert.equal(board.score, 0);
    assert.ok(board.board.every(row => row.every(cell => cell === null)));
  }
});

test('two top-outs in the same update count as a draw', () => {
  const match = new NeonDuel();
  match.start(12345);
  for (const board of match.boards) board.end();
  assert.equal(match.update(0), true);
  assert.equal(match.winner, 0);
});

test('pause and resume apply to both boards', () => {
  const match = new NeonDuel();
  match.start(12345);
  assert.equal(match.pause(), true);
  match.update(900, [true, true]);
  assert.ok(match.boards.every(board => board.elapsed === 0));
  assert.equal(match.resume(), true);
  match.update(100, [true, false]);
  assert.ok(match.boards[0].current.y > match.boards[1].current.y);
});

test('holding inputs on one board does not affect the other board', () => {
  const match = new NeonDuel();
  match.start(12345);
  const [first, second] = match.boards.map(board => new BoardInput(board));
  first.press('KeyA', 'left');
  second.press('ArrowRight', 'right');
  first.press(7, 'down');
  assert.notEqual(first.game, second.game);
  assert.equal(first.update(50), true);
  assert.equal(second.update(50), false);
  const firstX = match.boards[0].current.x;
  const secondX = match.boards[1].current.x;
  first.clear();
  for (let i = 0; i < 5; i++) {
    first.update(50);
    second.update(50);
  }
  assert.equal(match.boards[0].current.x, firstX);
  assert.ok(match.boards[1].current.x > secondX);
});
