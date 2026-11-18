import test from 'node:test';
import assert from 'node:assert/strict';
import { NeonGame, SHAPES, rotateMatrix } from '../src/engine.js';

const setup=()=>{const g=new NeonGame();g.setSeed(12345);g.start();return g;};
test('each seven-piece bag contains every shape exactly once',()=>{
  const g=setup(),pieces=[];for(let i=0;i<14;i++){pieces.push(g.current.type);g.spawn();}
  assert.equal(new Set(pieces.slice(0,7)).size,7);assert.equal(new Set(pieces.slice(7,14)).size,7);
});
test('hard drop locks at the ghost location and awards distance points',()=>{
  const g=setup();g.spawn('O');assert.equal(g.ghostY(),18);g.hardDrop();
  assert.equal(g.score,36);assert.equal(g.board[19][4],'O');assert.equal(g.board[18][5],'O');
  assert.ok(g.valid());
});
test('collision boundaries and wall rotation preserve valid placement',()=>{
  const g=setup();g.spawn('T');for(let i=0;i<12;i++)g.move(-1);
  assert.equal(g.current.x,0);assert.equal(g.move(-1),false);
  assert.equal(g.rotate(),true);assert.ok(g.valid());
  g.current.y=g.ghostY();for(let i=0;i<4;i++){g.rotate();assert.ok(g.valid());}
});
test('four-line clear scores at the current level, upgrades and collapses rows',()=>{
  const g=setup();g.lines=9;
  for(let y=16;y<20;y++)g.board[y]=Array.from({length:10},(_,x)=>x===4?null:'T');
  g.current={type:'I',matrix:rotateMatrix(SHAPES.I),x:2,y:16};g.lock();
  assert.equal(g.score,800);assert.equal(g.lines,13);assert.equal(g.level,2);assert.equal(g.clearRows.length,4);
  g.update(270);assert.equal(g.clearRows.length,0);assert.equal(g.board.length,20);assert.ok(g.board.every(r=>r.every(v=>v===null)));assert.ok(g.current);
});
test('consecutive clears award combo points and an empty lock breaks the combo',()=>{
  const g=setup();const clear=()=>{g.board[19]=Array.from({length:10},(_,x)=>x>=4&&x<8?null:'J');g.current={type:'I',matrix:SHAPES.I,x:4,y:18};g.lock();g.update(270);};
  clear();assert.equal(g.score,100);clear();assert.equal(g.score,250);
  g.hardDrop();assert.equal(g.combo,-1);
});
test('hold only swaps once per piece and resets for the next piece',()=>{
  const g=setup(),first=g.current.type;assert.equal(g.swap(),true);assert.equal(g.hold,first);
  assert.equal(g.swap(),false);g.hardDrop();assert.equal(g.canHold,true);assert.equal(g.swap(),true);assert.equal(g.current.type,first);
});
test('pause freezes gravity and blocks movement, resume restores both',()=>{
  const g=setup(),p={...g.current};g.pause();g.update(10000);g.move(1);
  assert.deepEqual(g.current,p);assert.equal(g.elapsed,0);g.resume();g.update(850);assert.equal(g.current.y,1);
});
test('spawn obstruction ends the run and restart clears all session state',()=>{
  const g=setup();g.board[0].fill('Z');g.spawn('O');assert.equal(g.mode,'over');
  g.start();assert.equal(g.mode,'playing');assert.equal(g.score,0);assert.ok(g.board.every(r=>r.every(v=>v===null)));assert.equal(g.hold,null);
});
test('grounded piece observes lock delay before spawning its successor',()=>{
  const g=setup();g.spawn('O');g.current.y=18;g.update(300);assert.equal(g.current.type,'O');assert.equal(g.board[19][4],null);
  g.update(150);assert.equal(g.board[19][4],'O');
});
