export function resolveAttack(attacker,defender,onImpact,attack=attacker.attack){
  if(!attack)return false;
  const move=attack.move;
  if(attack.time<move.startup||attack.time>move.startup+move.active||attack.hitTargets.has(defender.team)||defender.health<=0||defender.invulnerable>0)return false;
  const dx=(defender.x-attacker.x)*attacker.facing;
  if(dx<-.2||dx>move.range+.3||Math.abs(defender.y-attacker.y)>(move.height||1.25))return false;
  if(move.unblockable&&(!defender.grounded||!attacker.grounded))return false;
  const blocked=defender.blocking&&!move.unblockable&&defender.facing===-attacker.facing;
  attack.hitTargets.add(defender.team);attack.connected=true;
  const damage=blocked?Math.max(1,Math.floor(move.damage*.13)):Math.round(move.damage*attacker.definition.power);
  defender.health=Math.max(0,defender.health-damage);defender.stun=blocked?.12:move.stun;
  defender.vx=attacker.facing*move.push*(blocked?.25:1);defender.attack=null;
  if(!blocked){
    defender.vy=move.launch||0;defender.downTime=move.knockdown?.85:0;
    attacker.combo++;attacker.comboTime=1.1;
  }
  attacker.meter=Math.min(100,attacker.meter+(blocked?3:move.meter));
  defender.meter=Math.min(100,defender.meter+(blocked?3:damage*.65));
  onImpact?.({attacker,defender,move,blocked,damage});return true;
}
// Snapshot both attacks so strikes on the same simulation tick can trade fairly.
export function resolveCombat(a,b,onImpact){
  const first=a.attack,second=b.attack;
  resolveAttack(a,b,onImpact,first);resolveAttack(b,a,onImpact,second);
}
export function separateFighters(a,b,bound){
  if(Math.abs(a.y-b.y)>1.65||a.invulnerable>0||b.invulnerable>0)return;
  const gap=b.x-a.x,overlap=.68-Math.abs(gap);
  if(overlap<=0)return;const side=gap>=0?1:-1;
  a.x=Math.max(-bound,Math.min(bound,a.x-overlap*.5*side));b.x=Math.max(-bound,Math.min(bound,b.x+overlap*.5*side));
}
