export const SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
};
export const COLORS = { I:'#32e6f4', O:'#ffd05a', T:'#bd77ff', S:'#5ae6a6', Z:'#ff4f8b', J:'#558fff', L:'#ff9d54' };
export const rotateMatrix = (m, d=1) => m.map((row,y)=>row.map((_,x)=>d===1?m[m.length-1-x][y]:m[x][m.length-1-y]));
const empty = () => Array.from({length:20},()=>Array(10).fill(null));

export class NeonGame {
  constructor(emit=()=>{}) {
    this.emit=emit; this.randomSeed=Date.now()>>>0; this.mode='ready';
    this.board=empty(); this.queue=[]; this.current=null; this.hold=null;
    this.score=0; this.lines=0; this.level=1; this.combo=-1; this.elapsed=0;
    this.clearRows=[]; this.clearTime=0; this.lockTime=0; this.lockResets=0; this.gravity=0;
  }
  setSeed(seed) { this.randomSeed=(seed>>>0)||1; }
  random() { let x=this.randomSeed; x^=x<<13; x^=x>>>17; x^=x<<5; this.randomSeed=x>>>0; return this.randomSeed/4294967296; }
  fillQueue() {
    while(this.queue.length<7) {
      const bag=Object.keys(SHAPES);
      for(let i=bag.length-1;i>0;i--) {const j=Math.floor(this.random()*(i+1)); [bag[i],bag[j]]=[bag[j],bag[i]];}
      this.queue.push(...bag);
    }
  }
  start() {
    this.board=empty(); this.queue=[]; this.hold=null; this.score=0; this.lines=0;
    this.level=1; this.combo=-1; this.elapsed=0; this.clearRows=[]; this.clearTime=0;
    this.mode='playing'; this.fillQueue(); this.spawn(); this.emit('start');
  }
  spawn(type) {
    this.fillQueue(); type=type||this.queue.shift(); this.fillQueue();
    const matrix=SHAPES[type].map(r=>[...r]);
    this.current={type,matrix,x:Math.floor((10-matrix.length)/2),y:0};
    this.canHold=true; this.gravity=0; this.lockTime=0; this.lockResets=0;
    if(!this.valid()) this.end();
  }
  valid(p=this.current) {
    return !!p && p.matrix.every((r,y)=>r.every((v,x)=>!v || (p.x+x>=0 && p.x+x<10 && p.y+y<20 && (p.y+y<0 || !this.board[p.y+y][p.x+x]))));
  }
  grounded() { return !this.valid({...this.current,y:this.current.y+1}); }
  ghostY() { if(!this.current)return 0; let y=this.current.y; while(this.valid({...this.current,y:y+1})) y++; return y; }
  resetLock() { if(this.lockResets<15) {this.lockTime=0; this.lockResets++;} }
  move(dx) {
    if(!this.active()) return false;
    const p={...this.current,x:this.current.x+dx};
    if(!this.valid(p))return false;
    const ground=this.grounded(); this.current=p; if(ground)this.resetLock(); this.emit('move'); return true;
  }
  rotate(d=1) {
    if(!this.active() || this.current.type==='O') return false;
    const matrix=rotateMatrix(this.current.matrix,d), ground=this.grounded();
    // Horizontal wall kicks followed by floor kicks keep rotations forgiving at boundaries.
    const kicks=[[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1],[-1,-1],[1,-1],[0,-2]];
    for(const [dx,dy] of kicks) {
      const p={...this.current,matrix,x:this.current.x+dx,y:this.current.y+dy};
      if(this.valid(p)) {this.current=p; if(ground)this.resetLock(); this.emit('rotate'); return true;}
    }
    return false;
  }
  down(soft=false) {
    if(!this.active())return false;
    const p={...this.current,y:this.current.y+1};
    if(this.valid(p)) {this.current=p; if(soft)this.score++; this.lockTime=0; return true;}
    return false;
  }
  hardDrop() {
    if(!this.active())return;
    const y=this.ghostY(), distance=y-this.current.y;
    this.score+=distance*2; this.current.y=y; this.emit('drop',{piece:this.current,distance}); this.lock();
  }
  swap() {
    if(!this.active() || !this.canHold)return false;
    const type=this.current.type, held=this.hold;
    this.hold=type; this.spawn(held); this.canHold=false; this.emit('hold'); return true;
  }
  active() {return this.mode==='playing' && this.current && !this.clearRows.length;}
  lock() {
    const p=this.current;
    let above=false;
    p.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v){if(p.y+y<0)above=true;else this.board[p.y+y][p.x+x]=p.type;}}));
    this.emit('lock',{piece:p});
    if(above) {this.end();return;}
    this.clearRows=this.board.map((r,y)=>r.every(Boolean)?y:-1).filter(y=>y>=0);
    if(this.clearRows.length) {
      this.current=null; this.clearTime=0;
      const n=this.clearRows.length; this.combo++;
      const points=([0,100,300,500,800][n]+Math.max(0,this.combo)*50)*this.level;
      this.score+=points; this.lines+=n;
      const previousLevel=this.level; this.level=1+Math.floor(this.lines/10);
      this.emit('clear',{rows:[...this.clearRows],count:n,points,combo:this.combo,levelUp:this.level>previousLevel});
    } else {this.combo=-1; this.spawn();}
  }
  update(dt,soft=false) {
    if(this.mode!=='playing')return;
    this.elapsed+=dt;
    if(this.clearRows.length) {
      this.clearTime+=dt;
      if(this.clearTime>=270) {
        this.board=this.board.filter((_,y)=>!this.clearRows.includes(y));
        while(this.board.length<20)this.board.unshift(Array(10).fill(null));
        this.clearRows=[]; this.spawn();
      }
      return;
    }
    if(!this.current)return;
    this.gravity+=dt;
    const interval=soft?32:Math.max(65,850*Math.pow(.79,this.level-1));
    while(this.gravity>=interval) {this.gravity-=interval; if(!this.down(soft)){this.gravity=0;break;}}
    if(this.grounded()) {this.lockTime+=dt; if(this.lockTime>=450)this.lock();} else this.lockTime=0;
  }
  pause() {if(this.mode==='playing') {this.mode='paused';this.emit('pause');}}
  resume() {if(this.mode==='paused') {this.mode='playing';this.emit('resume');}}
  end() {this.mode='over'; this.emit('over',{score:this.score,lines:this.lines,level:this.level});}
  snapshot() {
    return {mode:this.mode,score:this.score,lines:this.lines,level:this.level,hold:this.hold,canHold:this.canHold,
      next:this.queue.slice(0,3),current:this.current?{type:this.current.type,x:this.current.x,y:this.current.y,matrix:this.current.matrix}:null,
      ghostY:this.ghostY(),board:this.board.map(r=>[...r]),clearRows:[...this.clearRows],elapsed:Math.round(this.elapsed)};
  }
}
