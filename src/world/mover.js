export class Mover {
  constructor(x = 0) {
    this.x=x; this.y=0; this.previousX=x; this.previousY=0;
    this.vx=0; this.vy=0; this.grounded=true; this.coyote=0.09; this.facing=1;
    this.state='idle'; this.age=0; this.stateTime=0; this.dodgeCooldown=0; this.onEvent=()=>{};
  }
  update(dt,input,bound=10) {
    this.previousX=this.x; this.previousY=this.y; this.age+=dt;
    this.stateTime+=dt; this.dodgeCooldown=Math.max(0,this.dodgeCooldown-dt);
    const guarding=input.is('block')&&this.grounded, crouching=input.is('down')&&this.grounded;
    let direction=Number(input.is('right'))-Number(input.is('left'));
    if(guarding||crouching)direction=0;
    if(this.state==='dodge'&&this.stateTime<.32) {
      this.vx=this.dodgeDirection*8;
    } else {
      this.vx += (direction*(this.speed||5.2)-this.vx)*Math.min(1,dt*18);
      if(this.grounded&&this.dodgeCooldown===0&&input.consume('dodge')) {
        this.setState('dodge');this.dodgeDirection=direction||-this.facing;this.dodgeCooldown=.8;this.onEvent('dodge');
      }
    }
    if (direction) this.facing=direction;
    this.coyote=this.grounded?0.09:Math.max(0,this.coyote-dt);
    if (this.coyote>0 && input.consume('jump')) { this.vy=8.6; this.grounded=false; this.coyote=0; }
    this.vy-=24*dt;
    this.x=Math.max(-bound,Math.min(bound,this.x+this.vx*dt));
    this.y+=this.vy*dt;
    if(this.y<=0) { this.y=0; this.vy=0; if(!this.grounded){this.setState('land');this.onEvent('land');} this.grounded=true; }
    if((this.state==='dodge'&&this.stateTime<.32)||(this.state==='land'&&this.stateTime<.12))return;
    this.setState(!this.grounded?(this.vy>0?'jump':'fall'):guarding?'block':crouching?'crouch':Math.abs(this.vx)>0.15?'run':'idle');
  }
  setState(next) { if(this.state===next)return;this.state=next;this.stateTime=0;this.onEvent('state:'+next); }
}
