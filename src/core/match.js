export class MatchState {
  constructor(mode){this.mode=mode;this.scores=[0,0];this.round=1;this.winner=-1;this.done=false;this.nextHealth=[100,100];}
  finish(health){
    this.winner=health[0]===health[1]?-1:health[0]>health[1]?0:1;
    if(this.mode.id==='training'){this.nextHealth=[100,100];return;}
    if(this.winner>=0)this.scores[this.winner]++;
    this.done=this.mode.id==='survival'?this.winner===1||this.scores[0]>=this.mode.wins:this.scores.some(score=>score>=this.mode.wins);
    this.nextHealth=[100,100];
    if(this.mode.id==='survival'&&this.winner===0)this.nextHealth[0]=Math.min(100,health[0]+25);
    if(this.mode.id==='stock'&&this.winner>=0)this.nextHealth[this.winner]=Math.max(1,health[this.winner]);
  }
  advance(){this.round++;}
}
