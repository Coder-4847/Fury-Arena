export class AudioSystem {
  constructor(){this.volume=.55;this.musicVolume=.25;this.context=null;this.beat=0;this.nextBeat=0;}
  unlock(){
    if(!this.context){this.context=new (window.AudioContext||window.webkitAudioContext)();this.master=this.context.createGain();this.master.connect(this.context.destination);this.master.gain.value=this.volume;}
    if(this.context.state==='suspended')this.context.resume().catch(()=>{});
  }
  tone(frequency,duration=.1,type='sine',gain=.1,slide=0){
    if(!this.context||this.context.state!=='running')return;
    const ctx=this.context,osc=ctx.createOscillator(),env=ctx.createGain(),now=ctx.currentTime;
    osc.type=type;osc.frequency.setValueAtTime(frequency,now);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(20,slide),now+duration);
    env.gain.setValueAtTime(.001,now);env.gain.exponentialRampToValueAtTime(Math.max(.001,gain),now+.005);env.gain.exponentialRampToValueAtTime(.001,now+duration);
    osc.connect(env);env.connect(this.master);osc.start(now);osc.stop(now+duration+.01);
    osc.onended=()=>{osc.disconnect();env.disconnect();};
  }
  play(name){
    if(name==='hit'){this.tone(130,.13,'triangle',.35,35);this.tone(900,.055,'sawtooth',.1,160);}
    if(name==='heavy'){this.tone(90,.24,'triangle',.45,24);this.tone(1100,.08,'sawtooth',.14,60);}
    if(name==='block')this.tone(700,.08,'triangle',.18,250);
    if(name==='swing')this.tone(400,.08,'triangle',.045,120);
    if(name==='menu')this.tone(520,.07,'sine',.12,700);
    if(name==='special'){this.tone(180,.35,'sawtooth',.08,850);this.tone(70,.25,'sine',.2);}
    if(name==='ko'){this.tone(140,.6,'triangle',.3,35);this.tone(440,.8,'sine',.12,110);}
    if(name==='pickup')this.tone(660,.18,'sine',.14,1100);
  }
  update(dt,active){
    if(!active||!this.context||this.musicVolume===0)return;
    this.nextBeat-=dt;if(this.nextBeat>0)return;this.nextBeat+=.27;
    const bass=[55,55,65.41,55,73.42,65.41,49,49][Math.floor(this.beat/4)%8];
    if(this.beat%2===0)this.tone(bass,.24,'triangle',this.musicVolume*.18);
    if(this.beat%4===0)this.tone(90,.12,'sine',this.musicVolume*.3,30);
    if(this.beat%4===2)this.tone(1800,.03,'triangle',this.musicVolume*.045,800);
    this.beat++;
  }
  setVolume(value){this.volume=value;if(this.master)this.master.gain.setTargetAtTime(value,this.context.currentTime,.05);}
}
