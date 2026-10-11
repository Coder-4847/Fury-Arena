const melee=(name,damage,range,startup,recovery,pose,durability)=>({name,kind:'melee',durability,move:{name,damage,range,startup,active:.14,recovery,pose,stun:.34,push:4,meter:5}});
const ranged=(name,damage,ammo,speed,recovery,extra={})=>({name,kind:'ranged',ammo,move:{name,damage,range:-100,startup:.2,active:.05,recovery,pose:'punch',stun:.2,push:2,meter:3,projectile:true,speed,...extra}});
export const WEAPONS={
  sword:{...melee('SWORD',14,2.1,.23,.34,'slash',9),color:'#d5e0e0'},
  staff:{...melee('STAFF',10,2.65,.25,.34,'thrust',12),color:'#d0b183'},
  hammer:{...melee('HAMMER',23,1.8,.43,.6,'slam',6),color:'#8e9d9c'},
  knife:{...melee('KNIFE',8,1.2,.08,.18,'punch',12),color:'#b8ccd4'},
  pistol:{...ranged('PISTOL',9,7,19,.4),color:'#7c8b8e'},
  shotgun:{...ranged('SHOTGUN',19,4,16,.8,{maxDistance:4.5}),color:'#b0936b'},
  bottle:{...ranged('BOTTLE',13,1,9,.5,{gravity:15}),color:'#62ba90'},
  grenade:{...ranged('GRENADE',23,1,7,.65,{gravity:14,explosive:true}),color:'#b2c276'},
};
