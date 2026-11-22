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

test('the remaining player can overtake a frozen final score and win', () => {
  const match = new NeonDuel();
  match.start(12345);
  const [first, second] = match.boards;
  first.score = 20;
  first.end();
  assert.equal(match.update(16), false);
  assert.equal(match.mode, 'playing');
  assert.equal(match.winner, null);
  const firstFinalState = first.snapshot();

  second.hardDrop();
  assert.ok(second.score > first.score);
  assert.equal(match.update(16, [true, false]), false);
  first.hardDrop();
  assert.deepEqual(first.snapshot(), firstFinalState);

  second.end();
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

test('the first player to finish wins if the other player stays behind', () => {
  const match = new NeonDuel();
  match.start(12345);
  const [first, second] = match.boards;
  first.score = 1000;
  first.end();
  assert.equal(match.update(16), false);
  assert.equal(match.pause(), true);
  match.update(1000, [true, true]);
  assert.equal(second.score, 0);
  assert.equal(match.resume(), true);
  assert.equal(first.mode, 'over');
  assert.equal(second.mode, 'playing');
  second.hardDrop();
  assert.ok(second.score > 0 && second.score < first.score);
  second.end();
  assert.equal(match.update(16), true);
  assert.equal(match.winner, 1);
});

test('equal final scores count as a draw regardless of when each board finished', () => {
  const match = new NeonDuel();
  match.start(12345);
  for (const board of match.boards) board.score = 500;
  match.boards[1].end();
  assert.equal(match.update(16), false);
  match.boards[0].end();
  assert.equal(match.update(0), true);
  assert.equal(match.winner, 0);
});

test('different scores decide the winner when both boards finish in the same update', () => {
  const match = new NeonDuel();
  match.start(12345);
  match.boards[0].score = 37;
  match.boards[1].score = 36;
  for (const board of match.boards) board.end();
  assert.equal(match.update(0), true);
  assert.equal(match.winner, 1);
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
