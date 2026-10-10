export class Mover {
  constructor(x = 0) {
    this.x=x; this.y=0; this.previousX=x; this.previousY=0;
    this.vx=0; this.vy=0; this.grounded=true; this.coyote=0.09; this.facing=1;
    this.state='idle'; this.age=0;
  }
  update(dt,input,bound=10) {
    this.previousX=this.x; this.previousY=this.y; this.age+=dt;
    const direction=Number(input.is('right'))-Number(input.is('left'));
    this.vx += (direction*5.2-this.vx)*Math.min(1,dt*18);
    if (direction) this.facing=direction;
    this.coyote=this.grounded?0.09:Math.max(0,this.coyote-dt);
    if (this.coyote>0 && input.consume('jump')) { this.vy=8.6; this.grounded=false; this.coyote=0; }
    this.vy-=24*dt;
    this.x=Math.max(-bound,Math.min(bound,this.x+this.vx*dt));
    this.y+=this.vy*dt;
    if(this.y<=0) { this.y=0; this.vy=0; this.grounded=true; }
    this.state=!this.grounded?(this.vy>0?'jump':'fall'):Math.abs(this.vx)>0.15?'run':'idle';
  }
}
