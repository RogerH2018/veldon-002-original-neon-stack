export class NeonAudio {
  constructor() {this.enabled=true;this.playing=false;this.ctx=null;this.next=0;this.beat=0;}
  unlock() {
    if(!this.ctx) {const Audio=window.AudioContext||window.webkitAudioContext; if(Audio)this.ctx=new Audio();}
    if(this.ctx?.state==='suspended')this.ctx.resume().catch(()=>{});
  }
  tone(freq,duration=.07,type='sine',volume=.04,delay=0) {
    if(!this.enabled || !this.ctx)return;
    const t=this.ctx.currentTime+delay, osc=this.ctx.createOscillator(), gain=this.ctx.createGain();
    osc.type=type; osc.frequency.value=freq; gain.gain.setValueAtTime(.0001,t);
    gain.gain.exponentialRampToValueAtTime(volume,t+.008); gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    osc.connect(gain).connect(this.ctx.destination); osc.start(t); osc.stop(t+duration+.01);
  }
  effect(name,data={}) {
    if(name==='move')this.tone(180,.025,'triangle',.02);
    if(name==='rotate') {this.tone(420,.055,'sine',.04);this.tone(650,.06,'sine',.025,.025);}
    if(name==='hold')this.tone(320,.12,'triangle',.045);
    if(name==='drop') {this.tone(85,.18,'triangle',.10);this.tone(55,.20,'sine',.08,.025);}
    if(name==='lock')this.tone(120,.06,'triangle',.035);
    if(name==='clear') [440,554,659,880].slice(0,Math.min(4,data.count+1)).forEach((f,i)=>this.tone(f,.22,'triangle',.055,i*.055));
    if(name==='start'||name==='resume')[220,330,440].forEach((f,i)=>this.tone(f,.15,'sine',.04,i*.07));
    if(name==='over')[330,247,165,82].forEach((f,i)=>this.tone(f,.25,'triangle',.05,i*.13));
  }
  update() {
    if(!this.ctx || !this.enabled || !this.playing)return;
    const t=this.ctx.currentTime;
    if(t<this.next)return;
    this.next=t+.19;
    const notes=[164.81,246.94,329.63,246.94,196,293.66,392,293.66,146.83,220,293.66,220,130.81,196,261.63,196];
    this.tone(notes[this.beat%16],.22,'sine',.012);
    if(this.beat%4===0)this.tone(notes[this.beat%16]/2,.38,'triangle',.021);
    this.beat++;
  }
}
