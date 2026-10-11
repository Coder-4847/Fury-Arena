export class FighterAI {
  constructor(random=Math.random){this.random=random;this.next=0;this.held=new Set();this.buffer=new Map();this.time=0;}
  is(action){return this.held.has(action);}
  consume(action){const until=this.buffer.get(action);this.buffer.delete(action);return until>this.time;}
  update(dt,me,enemy,world,weapons,difficulty=1,behavior='attack'){
    this.time+=dt;this.next-=dt;
    if(behavior!=='attack'){this.held.clear();this.buffer.clear();if(behavior==='block')this.held.add('block');return this;}
    if(this.next>0)return this;
    this.next=[.34,.22,.13][Math.min(2,difficulty)]+this.random()*.1;this.held.clear();
    const distance=Math.abs(me.x-enemy.x),ranged=me.weapon?.definition.kind==='ranged';
    let target=enemy.x,desired=ranged?4:me.weapon?.definition.move.range?me.weapon.definition.move.range*.65:1;
    const drop=weapons.drops.filter(d=>d.delay<=0).sort((a,b)=>Math.abs(a.x-me.x)-Math.abs(b.x-me.x))[0];
    if(!me.weapon&&drop&&Math.abs(drop.x-me.x)<4.5&&distance>1.7){target=drop.x;desired=.7;if(Math.abs(target-me.x)<1.5)this.buffer.set('use',this.time+.2);}
    if(Math.abs(target-me.x)>desired)this.held.add(target<me.x?'left':'right');
    if(ranged&&distance<2)this.held.add(enemy.x>me.x?'left':'right');
    if(enemy.attack&&distance<2.4&&this.random()<[.22,.48,.72][difficulty]){
      this.held.clear();if(enemy.attack.move.unblockable)this.buffer.set('dodge',this.time+.18);else this.held.add('block');
    }
    const prop=world.objects.find(o=>o.active&&o.cooldown<=0&&Math.abs(o.x-me.x)<1.1);
    if(prop&&prop.type!=='breakable'&&this.random()<.32)this.buffer.set('grab',this.time+.18);
    const barrier=prop?.type==='breakable';
    if((distance<(ranged?12:me.weapon?.definition.move.range||1.7)||barrier)&&this.random()<[.48,.7,.88][difficulty]){
      const choices=enemy.blocking?['grab','heavy','kick']:['light','light','kick','heavy'];
      const move=me.meter>=50&&this.random()<.35?'special':choices[Math.floor(this.random()*choices.length)];this.buffer.set(move,this.time+.2);
    }
    if(enemy.y>me.y+.4&&distance<3.5){this.held.add('up');this.buffer.set('jump',this.time+.15);}
    if(world.hazards.some(h=>Math.abs(h.x-me.x)<h.width&&world.time%h.period>h.period-h.active-1))this.buffer.set('jump',this.time+.2);
    return this;
  }
}
