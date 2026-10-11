const move=(name,damage,startup,active,recovery,range,pose,extra={})=>({name,damage,startup,active,recovery,range,pose,stun:.24,push:2.8,meter:8,...extra});
export const MOVES={
  light:move('Straight',6,.1,.09,.19,1.15,'punch',{chain:'cross',cancel:.24}),
  cross:move('Cross',8,.12,.1,.22,1.25,'punch',{chain:'finisher',cancel:.29}),
  finisher:move('Breaker',12,.17,.1,.3,1.35,'uppercut',{push:5,stun:.4}),
  heavy:move('Hammer fist',16,.28,.12,.38,1.4,'punch',{push:6,stun:.48,knockdown:true}),
  kick:move('Side kick',11,.18,.12,.3,1.75,'kick',{push:4}),
  air:move('Diving heel',10,.12,.15,.26,1.5,'kick',{height:.9,push:4}),
  grab:move('Shoulder throw',14,.2,.12,.48,.9,'uppercut',{unblockable:true,knockdown:true,push:7}),
  kade1:move('Meteor drive',24,.3,.18,.5,2.15,'punch',{cost:50,push:8,stun:.55,knockdown:true,lunge:5}),
  kade2:move('Rising sun',20,.22,.2,.5,1.55,'uppercut',{cost:40,push:4,launch:7,height:2}),
  nyx1:move('Phantom wheel',22,.24,.23,.48,2.25,'spin',{cost:50,push:7,stun:.5,knockdown:true,lunge:4}),
  nyx2:move('Moon arc',19,.18,.2,.44,1.8,'kick',{cost:40,push:5,launch:6,height:1.7}),
};
export const duration=move=>move.startup+move.active+move.recovery;
