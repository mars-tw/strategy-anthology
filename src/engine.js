import towerRules from '../vendor/tower-defense/src/rules.js';
import towerConfig from '../vendor/tower-defense/src/config.js';
import { COMBAT_UNITS, calculateDamage, COUNTER_MATRIX, quantizeFacing } from '../vendor/village-siege/combat.ts';
import { planFieldOrders } from '../vendor/village-siege/fieldOrders.ts';
import { CHAPTERS,TOWER_TYPES,UNIT_COST } from './campaign.js';
export const WORLD={width:960,height:640,cell:48};
export const ROUTE=[{x:32,y:192},{x:656,y:192},{x:656,y:480},{x:848,y:480}];
export const PADS=[{x:552,y:264},{x:600,y:264},{x:552,y:312}];
export function resonance(tower,towers){return towerRules.resonanceFor(tower,towers,{cellSize:48,towers:towerConfig.TOWERS});}
export function createBattle(chapter){
 const c=CHAPTERS[chapter];if(!c)throw Error('沒有這一章。');
 const b={chapter,time:0,phase:'planning',result:null,hp:100,keepHP:c.keepHP||0,keepMaxHP:c.keepHP||0,towers:[],units:[],enemies:[],effects:[],wave:0,spawnLeft:0,spawnClock:0,sequence:1,trinity:false,kills:0,barracks:false,construction:0,queue:[],workerClock:0,armyTarget:{x:720,y:220},workerMode:'gather',raidClock:0,cooldown:0,spent:0,earnings:0};
 if(c.mode==='siege'){b.phase='active';for(let i=0;i<3;i++)b.units.push(actor(b,'villager','player',140+i*32,485));}
 return b;
}
function actor(b,type,team,x,y){const d=COMBAT_UNITS[type];return {id:'u'+b.sequence++,type,team,x,y,terrain:CHAPTERS[b.chapter].terrain,hp:d?.maxHitPoints||65,maxHP:d?.maxHitPoints||65,state:'idle',anim:0,attack:0,targetId:null,hurt:0,slow:0,route:0,cargo:0};}
export function canPlace(b,x,y){
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<72||x>792||y<72||y>552)return false;
 if(b.towers.some(t=>Math.hypot(t.x-x,t.y-y)<40))return false;
 return !ROUTE.slice(1).some((p,i)=>{const a=ROUTE[i];return a.x===p.x?Math.abs(x-a.x)<32&&y>=Math.min(a.y,p.y)-24&&y<=Math.max(a.y,p.y)+24:Math.abs(y-a.y)<32&&x>=Math.min(a.x,p.x)-24&&x<=Math.max(a.x,p.x)+24;});
}
export function buildTower(c,b,type,x,y){
 if(CHAPTERS[b.chapter].mode!=='defense'||b.result||!TOWER_TYPES.includes(type)||!canPlace(b,x,y))return false;
 const cost=towerConfig.TOWERS[type].cost;if(c.crystals<cost)return false;
 c.crystals-=cost;b.spent+=cost;b.towers.push({id:'t'+b.sequence++,type,x,y,level:1,clock:0});
 b.trinity=b.towers.some(t=>resonance(t,b.towers).trinity);return true;
}
export function upgradeTower(c,b,id){const t=b.towers.find(t=>t.id===id);if(!t||b.result||t.level>=3||c.crystals<60)return false;c.crystals-=60;b.spent+=60;t.level++;return true;}
export function startWave(b){if(b.result||b.phase!=='planning'||CHAPTERS[b.chapter].mode!=='defense'||!b.towers.length)return false;b.wave++;b.spawnLeft=5+b.wave*2+b.chapter;b.spawnClock=0;b.phase='active';return true;}
export function construct(c,b){if(CHAPTERS[b.chapter].mode!=='siege'||b.barracks||b.construction||b.result||c.crystals<60)return false;c.crystals-=60;b.spent+=60;b.construction=5;return true;}
export function recruit(c,b,type){if(!b.barracks||b.result||!c.unlocks.includes(type)||!UNIT_COST[type]||c.crystals<UNIT_COST[type]||b.queue.length>=5||b.units.filter(u=>u.type!=='villager'&&u.hp>0).length+b.queue.length>=18)return false;c.crystals-=UNIT_COST[type];b.spent+=UNIT_COST[type];b.queue.push({type,left:3});return true;}
export function fieldView(b){return {phase:b.result?'finished':'playing',recipientPlayerId:'player',visibleEntityIds:['crystal'],entities:[...b.units.filter(u=>u.hp>0).map(u=>({id:u.id,kind:'unit',typeId:u.type,ownerId:'player',hitPoints:u.hp,position:{x:u.x/30,y:u.y/30},civilianActivity:u.type==='villager'?(b.workerMode==='gather'?'gathering':'idle'):undefined,cargo:{amount:u.cargo}})),{id:'crystal',kind:'resource',typeId:'wood',position:{x:8,y:14},resourceNode:{amount:999999},hitPoints:1}]};}
export function dualOrders(b,economy,army){
 if(b.result)return {ok:false,warnings:['戰局已結束。']};
 const plan=planFieldOrders(fieldView(b),{economy:economy==='gather'?'wood':'keep',army});
 if(economy==='rest'){b.workerMode='keep';plan.orders.push({lane:'economy',label:'工匠回村待命',command:{type:'stop'}});}
 for(const order of plan.orders){if(order.lane==='economy')b.workerMode=order.command.type==='gather'?'gather':'keep';else b.armyTarget=army==='home'?{x:140,y:485}:army==='ford'?{x:480,y:195}:{x:order.command.target.x*30,y:order.command.target.y*30};}
 return {ok:plan.orders.length>0,warnings:plan.warnings,lanes:plan.orders.map(o=>o.lane)};
}
export function march(b,x,y){if(b.result||!Number.isFinite(x)||!Number.isFinite(y)||CHAPTERS[b.chapter].terrain==='ford'&&x>450&&x<560&&Math.abs(y-195)>40&&Math.abs(y-425)>40)return false;b.armyTarget={x:Math.max(50,Math.min(900,x)),y:Math.max(64,Math.min(560,y))};return b.units.some(u=>u.type!=='villager'&&u.hp>0);}
export function cast(c,b,x,y){
 if(b.result||b.cooldown>0||c.crystals<20)return false;
 const targets=b.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-x,e.y-y)<110);if(!targets.length)return false;
 c.crystals-=20;b.spent+=20;b.cooldown=12;for(const e of targets)hurt(e,55);b.effects.push({x,y,age:0,kind:'spell'});return true;
}
function hurt(a,n){a.hp=Math.max(0,a.hp-n);if(a.hp===0){a.state='death';a.anim=0;}else{a.hurt=0.4;}}
function move(a,p,speed,dt){
 let diverted=false;
 if(a.terrain==='ford'&&((a.x<560&&p.x>560)||(a.x>450&&p.x<450))){
  const bridge=a.bridgeY??((a.y+p.y)/2<310?195:425);a.bridgeY=bridge;
  const fromLeft=p.x>560;
  if(Math.abs(a.y-bridge)>8&&(fromLeft?a.x<440:a.x>570))p={x:fromLeft?425:575,y:bridge};
  else p={x:fromLeft?575:425,y:bridge};diverted=true;
 }else a.bridgeY=null;
 const dx=p.x-a.x,dy=p.y-a.y,d=Math.hypot(dx,dy);
 if(d>4){a.x+=dx/d*Math.min(d,speed*dt);a.y+=dy/d*Math.min(d,speed*dt);a.facing=quantizeFacing(dx,dy,a.facing);a.state='walk';return false;}return !diverted;
}
function shot(b,x,y,target,damage,color,slow=0){b.effects.push({kind:'shot',x,y,tx:target.x,ty:target.y,targetId:target.id,damage,color,slow,age:0,hit:false});}
function advanceActor(a,dt){a.anim+=dt;if(a.hurt>0)a.hurt=Math.max(0,a.hurt-dt);if(a.slow>0)a.slow=Math.max(0,a.slow-dt);}
export function step(c,b,dt){
 if(b.result||b.phase!=='active'||!Number.isFinite(dt)||dt<=0)return;
 dt=Math.min(dt,0.05);b.time+=dt;b.cooldown=Math.max(0,b.cooldown-dt);
 for(const a of [...b.units,...b.enemies])advanceActor(a,dt);
 const chapter=CHAPTERS[b.chapter];
 if(chapter.mode==='defense'){
  b.spawnClock=Math.max(0,b.spawnClock-dt);
  if(b.spawnLeft>0&&b.spawnClock<=0){const e=actor(b,'miremaw','enemy',32,192);e.hp=e.maxHP=48+b.wave*10+b.chapter*9;b.enemies.push(e);b.spawnLeft--;b.spawnClock=1.15;}
  for(const e of b.enemies.filter(e=>e.hp>0))if(move(e,ROUTE[e.route+1],(e.slow>0?26:50)+b.chapter*2,dt)){e.route++;if(e.route>=ROUTE.length-1){e.hp=0;e.state='death';e.anim=0;b.hp=Math.max(0,b.hp-12);e.escaped=true;}}
  for(const t of b.towers){t.clock-=dt;const d=towerConfig.TOWERS[t.type];if(t.clock<=0){const target=b.enemies.find(e=>e.hp>0&&Math.hypot(e.x-t.x,e.y-t.y)<(d.range||140)+40);if(target){const damage=Math.round((d.damage||18)*(1+resonance(t,b.towers).bonus)*(1+(t.level-1)*0.5));shot(b,t.x,t.y,target,damage,t.type,t.type==='frost'?1.6:0);t.clock=t.type==='tesla'?0.7:t.type==='frost'?0.8:1.0;}}}
  if(b.hp<=0)b.result='lost';
  if(!b.result&&!b.spawnLeft&&b.enemies.every(e=>e.hp<=0)){if(b.wave>=chapter.waves)b.result='won';else b.phase='planning';}
 }else{
  if(b.construction>0){b.construction=Math.max(0,b.construction-dt);if(b.construction===0)b.barracks=true;}
  if(b.queue.length){b.queue[0].left-=dt;if(b.queue[0].left<=0){const q=b.queue.shift();b.units.push(actor(b,q.type,'player',170,410));}}
  for(const worker of b.units.filter(u=>u.type==='villager'&&u.hp>0)){
   if(b.workerMode!=='gather'&&!worker.cargo){if(move(worker,{x:140,y:485},66,dt))worker.state='idle';continue;}
   const target=worker.cargo?{x:140,y:485}:{x:280,y:455};
   if(move(worker,target,66,dt)){worker.state='cast';if(worker.cargo){c.crystals+=worker.cargo;b.earnings+=worker.cargo;worker.cargo=0;}else{worker.attack+=dt;if(worker.attack>=1.5){worker.attack=0;worker.cargo=10;}}}
  }
  b.raidClock+=dt;if(b.raidClock>=10&&b.enemies.filter(e=>e.hp>0).length<8){b.raidClock=0;const e=actor(b,'shieldBearer','enemy',785,205);b.enemies.push(e);}
  for(const a of b.units.filter(a=>a.hp>0&&a.type!=='villager')){
   const enemy=b.enemies.find(e=>e.hp>0&&Math.hypot(e.x-a.x,e.y-a.y)<210);
   const atKeep=Math.hypot(a.x-818,a.y-180)<COMBAT_UNITS[a.type].attackRange*18+80;
   if(enemy)fight(b,a,enemy,dt);
   else if(atKeep)fight(b,a,{id:'keep',x:818,y:180,hp:b.keepHP,type:'keep'},dt);
   else move(a,b.armyTarget,80,dt);
  }
  for(const e of b.enemies.filter(e=>e.hp>0)){
   const target=b.units.filter(u=>u.hp>0&&u.type!=='villager').sort((a,d)=>Math.hypot(a.x-e.x,a.y-e.y)-Math.hypot(d.x-e.x,d.y-e.y))[0];
   if(target&&Math.hypot(target.x-e.x,target.y-e.y)<250)fight(b,e,target,dt);
   else if(!move(e,{x:140,y:485},45,dt)){}else{e.attack+=dt;if(e.attack>=1){b.hp=Math.max(0,b.hp-5);e.attack=0;}}
  }
  if(b.hp<=0)b.result='lost';else if(b.keepHP<=0)b.result='won';
 }
 for(const fx of b.effects){fx.age+=dt;if(fx.kind==='shot'&&fx.age>=0.22&&!fx.hit){fx.hit=true;const a=b.enemies.find(e=>e.id===fx.targetId&&e.hp>0);if(a){hurt(a,fx.damage);a.slow=fx.slow;}}}
 b.effects=b.effects.filter(fx=>fx.age<0.55);
 for(const e of b.enemies)if(e.hp<=0&&!e.rewarded){e.rewarded=true;if(!e.escaped){c.crystals+=4;b.earnings+=4;b.kills++;}}
 b.enemies=b.enemies.filter(e=>e.hp>0||e.anim<0.8);b.units=b.units.filter(u=>u.hp>0||u.anim<0.8);
}
function fight(b,a,target,dt){
 const d=COMBAT_UNITS[a.type];const range=d.attackRange*18+20;
 if(Math.hypot(a.x-target.x,a.y-target.y)>range&&a.attack===0){move(a,target,80*d.moveSpeed,dt);return;}
 if(a.attack===0){a.state='attack';a.anim=0;a.targetId=target.id;}
 const before=a.attack;a.attack+=dt;a.state='attack';
 // Row 2 frame 2 is the active impact frame (four authored poses).
 if(before<0.20&&a.attack>=0.20){
  const victim=target.id==='keep'?target:[...b.units,...b.enemies].find(t=>t.id===a.targetId&&t.hp>0);
  if(victim&&Math.hypot(a.x-victim.x,a.y-victim.y)<=range+12){const damage=calculateDamage({baseDamage:d.baseDamage,armor:victim.type==='keep'?10:COMBAT_UNITS[victim.type]?.armor||0,counterMultiplier:COUNTER_MATRIX[a.type]?.[victim.type]||1});if(victim.id==='keep')b.keepHP=Math.max(0,b.keepHP-damage);else hurt(victim,damage);b.effects.push({kind:'impact',x:victim.x,y:victim.y,age:0});}
 }
 if(a.attack>=d.attackIntervalMs/1000){a.attack=0;a.state='idle';}
}
export function animationFrame(a){
 const state=a.hp<=0?'death':a.state==='attack'?'attack':a.hurt>0?'hurt':a.state;
 const row={idle:0,walk:1,attack:2,hurt:3,death:4,cast:5}[state]??0;
 const elapsed=state==='attack'?a.attack:state==='hurt'?0.4-a.hurt:a.anim;
 const frame=state==='death'?Math.min(3,Math.floor(elapsed*5)):state==='attack'?Math.min(3,Math.floor(elapsed*10)):Math.floor(elapsed*8)%4;
 return {row,frame,state};
}
