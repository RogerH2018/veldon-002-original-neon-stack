import { SHAPES, COLORS } from './engine.js';

export function block(ctx,x,y,size,type,ghost=false,alpha=1) {
  const color=COLORS[type]; if(!color)return;
  ctx.save(); ctx.globalAlpha=alpha;
  const pad=1.4, w=size-pad*2;
  if(ghost) {
    ctx.fillStyle=color+'0c'; ctx.fillRect(x+pad,y+pad,w,w);
    ctx.strokeStyle=color+'65'; ctx.lineWidth=1; ctx.setLineDash([3,3]);
    ctx.strokeRect(x+pad+.5,y+pad+.5,w-1,w-1);
  } else {
    ctx.shadowColor=color; ctx.shadowBlur=9;
    const g=ctx.createLinearGradient(x,y,x+size,y+size);
    g.addColorStop(0,color+'8c'); g.addColorStop(.45,color+'36'); g.addColorStop(1,color+'20');
    ctx.fillStyle=g; ctx.fillRect(x+pad,y+pad,w,w);
    ctx.shadowBlur=0; ctx.lineWidth=1.3; ctx.strokeStyle=color+'e0'; ctx.strokeRect(x+pad+.5,y+pad+.5,w-1,w-1);
    ctx.fillStyle=color+'38';ctx.fillRect(x+pad+3,y+pad+3,w-6,2);
    ctx.strokeStyle='#ffffff65'; ctx.lineWidth=.7;
    ctx.beginPath();ctx.moveTo(x+pad+1,y+pad+7);ctx.lineTo(x+pad+1,y+pad+1);ctx.lineTo(x+pad+7,y+pad+1);ctx.stroke();
    ctx.fillStyle=color+'85';ctx.fillRect(x+size-7,y+size-7,2,2);
  }
  ctx.restore();
}
export function drawMini(canvas,type,dim=false) {
  const dpr=Math.min(window.devicePixelRatio||1,2), width=120,height=64;
  if(canvas.width!==width*dpr){canvas.width=width*dpr;canvas.height=height*dpr;}
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,width,height);
  if(!type) {
    ctx.strokeStyle='#335360';ctx.lineWidth=1;ctx.setLineDash([3,4]);ctx.strokeRect(48.5,20.5,23,23);return;
  }
  const m=SHAPES[type]; const cells=[];
  m.forEach((r,y)=>r.forEach((v,x)=>{if(v)cells.push([x,y]);}));
  const minX=Math.min(...cells.map(p=>p[0])),maxX=Math.max(...cells.map(p=>p[0])),minY=Math.min(...cells.map(p=>p[1])),maxY=Math.max(...cells.map(p=>p[1]));
  const s=23,ox=(width-(maxX-minX+1)*s)/2,oy=(height-(maxY-minY+1)*s)/2;
  cells.forEach(([x,y])=>block(ctx,ox+(x-minX)*s,oy+(y-minY)*s,s,type,false,dim?.4:1));
}
const demo=[
  [null,null,null,null,null,null,null,null,null,'J'],
  [null,'T',null,null,null,null,null,null,null,'J'],
  ['T','T','T',null,null,null,'S','S','J','J'],
  ['L','L','L',null,'Z','Z','S','O','O','I'],
  ['L','J','J','J','T','Z','Z','O','O','I'],
];
export class Renderer {
  constructor(canvas,game) {this.canvas=canvas;this.game=game;this.ctx=canvas.getContext('2d');this.particles=[];this.trails=[];this.shake=0;this.flash=0;this.time=0;this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;}
  event(name,data={}) {
    if(name==='start'){this.particles=[];this.trails=[];}
    if(name==='drop' && !this.reduced) {this.shake=4; this.trails.push({x:data.piece.x,y:data.piece.y,matrix:data.piece.matrix,type:data.piece.type,life:1});}
    if(name==='clear') {
      this.flash=1;
      if(!this.reduced) for(const row of data.rows)for(let i=0;i<45;i++)this.particles.push({x:Math.random()*300,y:row*30+15,vx:(Math.random()-.5)*260,vy:(Math.random()-.5)*180,life:1,color:i%2?'#44efff':'#fc62b8',size:Math.random()*3+1});
    }
  }
  draw(dt) {
    this.time+=dt;
    const dpr=Math.min(window.devicePixelRatio||1,2),c=this.canvas,ctx=this.ctx;
    if(c.width!==300*dpr){c.width=300*dpr;c.height=600*dpr;}
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,300,600);
    const bg=ctx.createLinearGradient(0,0,300,600); bg.addColorStop(0,'#091320');bg.addColorStop(1,'#070c19');ctx.fillStyle=bg;ctx.fillRect(0,0,300,600);
    ctx.save();
    if(this.shake>.1){ctx.translate((Math.random()-.5)*this.shake,(Math.random()-.5)*this.shake);this.shake*=.82;}
    ctx.lineWidth=.65;ctx.strokeStyle='#6ba5bc15';
    ctx.beginPath();for(let x=0;x<=10;x++){ctx.moveTo(x*30,0);ctx.lineTo(x*30,600);}for(let y=0;y<=20;y++){ctx.moveTo(0,y*30);ctx.lineTo(300,y*30);}ctx.stroke();
    // A faint center guide makes left/right placement legible without obscuring the well.
    ctx.strokeStyle='#6ba5bc12';ctx.setLineDash([2,5]);ctx.beginPath();ctx.moveTo(150,0);ctx.lineTo(150,600);ctx.stroke();ctx.setLineDash([]);
    const game=this.game;
    const board=game.mode==='ready'?Array.from({length:20},(_,y)=>y<15?Array(10).fill(null):demo[y-15]):game.board;
    board.forEach((r,y)=>r.forEach((type,x)=>{if(type)block(ctx,x*30,y*30,30,type,false,game.mode==='ready'?.7:1);}));
    if(game.current && game.mode!=='ready' && !game.clearRows.length) {
      const p=game.current,ghost=game.ghostY();
      p.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v && ghost>p.y)block(ctx,(p.x+x)*30,(ghost+y)*30,30,p.type,true);}));
      p.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v)block(ctx,(p.x+x)*30,(p.y+y)*30,30,p.type);}));
      if(game.grounded() && game.mode==='playing') {
        ctx.fillStyle=COLORS[p.type]+'18';
        p.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v)ctx.fillRect((p.x+x)*30+2,(p.y+y)*30+2,26,26);}));
      }
    }
    if(game.clearRows.length) {
      const progress=game.clearTime/270;
      for(const row of game.clearRows) {
        ctx.fillStyle=`rgba(140,249,255,${.7*(1-progress)})`;ctx.fillRect(0,row*30,300,30);
        ctx.fillStyle='#fff';ctx.globalAlpha=1-progress;ctx.fillRect(0,row*30+14,300,2);ctx.globalAlpha=1;
      }
    }
    this.trails=this.trails.filter(t=>t.life>0);
    for(const t of this.trails){t.life-=dt/210;ctx.fillStyle=COLORS[t.type]+'14';t.matrix.forEach((r,y)=>r.forEach((v,x)=>{if(v){ctx.globalAlpha=Math.max(0,t.life);ctx.fillRect((t.x+x)*30+3,Math.max(0,(t.y+y)*30-130),24,130);}}));ctx.globalAlpha=1;}
    this.particles=this.particles.filter(p=>p.life>0);
    for(const p of this.particles){p.life-=dt/650;p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.vy+=100*dt/1000;ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size*2,p.size);}
    ctx.globalAlpha=1;
    // Subtle moving monitor scan, disabled for reduced motion.
    if(!this.reduced){const y=(this.time*.015)%670-70;const g=ctx.createLinearGradient(0,y,0,y+60);g.addColorStop(0,'#52e5ff00');g.addColorStop(1,'#52e5ff04');ctx.fillStyle=g;ctx.fillRect(0,y,300,60);}
    ctx.restore();
  }
}
