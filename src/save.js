import {validDecisionExtras} from './content-r8.js';
import { freshCampaign,CHAPTERS } from './campaign.js';
import {EXERCISES,exerciseFor} from './content-r1.js';
import {canPlace} from './engine.js';
export const SAVE_KEY='trine-frontier:campaign:v1';
export const BACKUP_KEY='trine-frontier:before-import:v1';
export const RECOVERY_KEY='trine-frontier:recovery:v1';
const integer=(v,max=1e7)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
export function validateSave(c){
 if(c?.salvageReceipts!==undefined&&(!Array.isArray(c.salvageReceipts)||c.salvageReceipts.length>2||new Set(c.salvageReceipts.map(r=>r?.source)).size!==c.salvageReceipts.length||c.salvageReceipts.some(r=>!r||!['ford','quarry'].includes(r.source)||!integer(r.before)||r.amount!==90||!integer(r.after)||r.before+r.amount!==r.after)))return false;
 if(!object(c)||c.version!==1||!integer(c.chapter,CHAPTERS.length)||!integer(c.crystals)||!integer(c.trinitySeals,3))return false;
 if(!Array.isArray(c.completed)||c.completed.length!==c.chapter||c.completed.some((id,i)=>id!==CHAPTERS[i].id))return false;
 if(!Array.isArray(c.unlocks)||!c.unlocks.includes('warrior')||new Set(c.unlocks).size!==c.unlocks.length||c.unlocks.some(t=>!['warrior','archer','mage'].includes(t)))return false;
 if(!Array.isArray(c.imports)||c.imports.length>2||new Set(c.imports).size!==c.imports.length||c.imports.some(k=>!['td','village'].includes(k)))return false;
 if(!Array.isArray(c.legacyArchive)||c.legacyArchive.length>2||c.legacyArchive.some(a=>!object(a)||!['td','village'].includes(a.source)||typeof a.raw!=='string'||a.raw.length>250000))return false;
 if(!object(c.settings)||typeof c.settings.sound!=='boolean'||typeof c.settings.reducedMotion!=='boolean')return false;
 if(c.settings.routeAid!==undefined&&typeof c.settings.routeAid!=='boolean')return false;
 if(c.decisionReplay!==undefined&&c.decisionReplay!==null&&(!c.decisionReplay.replay||!validateBattle(c.decisionReplay,c.decisionReplay.chapter)))return false;
 if(c.decisionRecords!==undefined&&(!Array.isArray(c.decisionRecords)||c.decisionRecords.length>8||c.decisionRecords.some(r=>!object(r)||!validDecisionExtras(r)||!integer(r.chapter,5)||!['upstream','gate','crystals','none'].includes(r.branch)||!['none','barricade','flood'].includes(r.terrain)||typeof r.replay!=='boolean'||!['won','lost'].includes(r.outcome)||!['none','cannon','frost','tesla'].includes(r.tower)||!/^t[0-9]+$|^none$/.test(r.towerId)||['spent','kills','hp','damage','hits','segment','wetCount','detourCount'].some(k=>!integer(r[k],1e7))||!Number.isFinite(r.waterDelay)||r.waterDelay<0||r.waterDelay>1e8)))return false;
 if(c.quarryLegacy!==undefined&&![null,'pending','upstream','gate','crystals'].includes(c.quarryLegacy))return false;
 if(c.salvageCredits!==undefined&&(!Array.isArray(c.salvageCredits)||c.salvageCredits.length>2||c.salvageCredits.some(p=>!['ford','quarry'].includes(p.source)||!integer(p.remaining,90))))return false;
 if(c.routePreviewSeen!==undefined&&typeof c.routePreviewSeen!=='boolean')return false;
 if(c.fordLegacy!==undefined&&![null,'pending','tower','crystals'].includes(c.fordLegacy))return false;
 if(c.exercises!==undefined){const e=c.exercises;if(!object(e)||!Array.isArray(e.completed)||new Set(e.completed).size!==e.completed.length||e.completed.some(id=>!EXERCISES.some(x=>x.id===id)))return false;
  if(e.battle!==null&&(!e.battle?.exercise||!validateBattle(e.battle,0,true)))return false;
 }
 if(c.battle?.exercise||c.battle?.replay)return false;
 if(c.battle!==null&&!validateBattle(c.battle,c.chapter))return false;return true;
}
function validateBattle(b,chapter,exercise=false){
 if(!object(b)||!integer(b.chapter,5)||!(b.chapter===chapter||b.chapter===chapter-1&&b.result==='won'))return false;
 if(!['planning','active'].includes(b.phase)||![null,'won','lost'].includes(b.result))return false;
 if(b.replay!==undefined&&(b.replay!==true||exercise||CHAPTERS[b.chapter].mode!=='defense'||!integer(b.budget)||!integer(b.seedBudget)||b.budget+b.spent!==b.seedBudget||b.earnings!==0||b.wave>CHAPTERS[b.chapter].waves))return false;
 if(b.decisionSeed!==undefined&&(!object(b.decisionSeed)||!integer(b.decisionSeed.baseCrystals)))return false;
 if(b.relayChoice!==undefined&&![null,'upstream','gate','crystals'].includes(b.relayChoice))return false;
 if(b.firstWaveDecision!==undefined&&(!object(b.firstWaveDecision)||b.firstWaveDecision.scope!=='chapter-first-wave'||!validDecisionExtras(b.firstWaveDecision)||b.firstWaveDecision.chapter!==b.chapter))return false;
 if(b.sampleRecorded!==undefined&&typeof b.sampleRecorded!=='boolean')return false;
 if(b.enemySpawned!==undefined&&!integer(b.enemySpawned))return false;
 if(b.firstLeak?.ordinal!==undefined&&(!integer(b.firstLeak.ordinal)||b.firstLeak.ordinal<1||!['miremaw','shieldBearer'].includes(b.firstLeak.type)))return false;
 if(b.firstLeak!==undefined&&(!object(b.firstLeak)||!/^u[0-9]+$/.test(b.firstLeak.id)||!Number.isFinite(b.firstLeak.hp)||b.firstLeak.hp<0||b.firstLeak.hp>1e7||!integer(b.firstLeak.segment,20)))return false;
 if(b.hitLog!==undefined&&(!Array.isArray(b.hitLog)||b.hitLog.length>12||b.hitLog.some(f=>!object(f)||f.targetOrdinal!==undefined&&(!integer(f.targetOrdinal)||f.targetOrdinal<1||!['miremaw','shieldBearer'].includes(f.targetType))||!/^t[0-9]+$/.test(f.towerId)||!/^u[0-9]+$/.test(f.targetId)||!['cannon','frost','tesla'].includes(f.color)||['baseDamage','bonusDamage','damage','actualDamage','hpBefore','hpAfter'].some(k=>!integer(f[k],10000))||!Number.isFinite(f.at)||f.at<0||!Number.isFinite(f.slowAfter)||f.slowAfter<0||f.slowAfter>5||![0,.1,.3].includes(f.bonus))))return false;
 if(b.terrainChoice!==undefined&&![null,'barricade','flood'].includes(b.terrainChoice))return false;
 if(b.terrainChoice&&(exercise||CHAPTERS[b.chapter].mode!=='defense'))return false;
 if(exercise){const e=exerciseFor(b);if(!e||b.chapter!==0||!integer(b.budget,e.budget)||b.budget+b.spent!==e.budget||b.earnings!==0||b.wave>1)return false;}
 for(const k of ['time','hp','keepHP','keepMaxHP','spawnClock','workerClock','raidClock','cooldown','construction'])if(typeof b[k]!=='number'||!Number.isFinite(b[k])||b[k]<0||b[k]>1e8)return false;
 for(const k of ['wave','spawnLeft','sequence','kills','spent','earnings'])if(!integer(b[k]))return false;
 if(b.hp>100||typeof b.trinity!=='boolean'||typeof b.barracks!=='boolean'||!['gather','keep'].includes(b.workerMode)||!point(b.armyTarget))return false;
 if(!Array.isArray(b.towers)||b.towers.length>250||b.towers.some(t=>!point(t)||!['cannon','frost','tesla'].includes(t.type)||!integer(t.level,3)||t.level<1||typeof t.id!=='string'||!Number.isFinite(t.clock)))return false;
 if(exercise&&b.towers.some(t=>!canPlace({...b,towers:b.towers.filter(a=>a!==t)},t.x,t.y)))return false;
 for(const key of ['units','enemies'])if(!Array.isArray(b[key])||b[key].length>100||b[key].some(a=>!point(a)||a.ordinal!==undefined&&(!integer(a.ordinal)||a.ordinal<1)||typeof a.id!=='string'||a.waterDelay!==undefined&&(!Number.isFinite(a.waterDelay)||a.waterDelay<0||a.waterDelay>1e8)||!['villager','warrior','archer','mage','shieldBearer','miremaw'].includes(a.type)||!['player','enemy'].includes(a.team)||!['idle','walk','attack','cast','death'].includes(a.state)||!Number.isFinite(a.hp)||a.hp<0||!Number.isFinite(a.maxHP)||a.maxHP<=0||a.hp>a.maxHP||['anim','attack','hurt','slow','route','cargo'].some(k=>!Number.isFinite(a[k])||a[k]<0||a[k]>1e8)))return false;
 if(b.decisionStats!==undefined){const s=b.decisionStats;if(!object(s))return false;if(['wetIds','detourIds'].some(k=>s[k]!==undefined&&(!Array.isArray(s[k])||s[k].length>10000||s[k].some(id=>typeof id!=='string'||!/^u[0-9]+$/.test(id)))))return false;if(!object(s)||['wetSeconds','waterDelay','detourSeconds'].some(k=>!Number.isFinite(s[k])||s[k]<0||s[k]>1e8)||!Array.isArray(s.spending)||s.spending.length>2000||s.spending.some(p=>!object(p)||!['ford','quarry'].includes(p.source)||!['火印塔','冰印塔','雷印塔','塔升級','戰前工事'].includes(p.label)||!integer(p.amount,90))||!object(s.towers)||Object.keys(s.towers).length>250)return false;for(const t of Object.values(s.towers))if(!object(t)||t.firstSegment!==undefined&&(!integer(t.firstSegment,20)||t.firstSegment<1)||!point(t)||!['cannon','frost','tesla'].includes(t.type)||['hits','damage','kills'].some(k=>!integer(t[k],1e8))||!Array.isArray(t.slowed)||t.slowed.some(id=>typeof id!=='string'||!/^u[0-9]+$/.test(id))||!object(t.segments)||Object.entries(t.segments).some(([k,n])=>!/^\d+$/.test(k)||!integer(n,1e8)))return false;}
 if(!Array.isArray(b.queue)||b.queue.length>5||b.queue.some(q=>!['warrior','archer','mage'].includes(q.type)||!Number.isFinite(q.left)||q.left<=0||q.left>3))return false;
 if(!Array.isArray(b.effects)||b.effects.length>500||b.effects.some(f=>!point(f)||!Number.isFinite(f.age)||f.age<0||f.age>5||!['shot','impact','spell'].includes(f.kind)||f.kind==='shot'&&(!integer(f.damage,10000)||f.damage<1||!point({x:f.tx,y:f.ty})||typeof f.targetId!=='string'||typeof f.hit!=='boolean'||!['cannon','frost','tesla'].includes(f.color)||!Number.isFinite(f.slow)||f.slow<0||f.slow>5)))return false;
 return true;
}
const point=p=>object(p)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=960&&p.y>=0&&p.y<=640;
export function loadSave(storage){
 try{const raw=storage.getItem(SAVE_KEY);if(!raw)return {campaign:freshCampaign(),error:null};const c=JSON.parse(raw);if(!validateSave(c))throw Error('存檔格式不符');return {campaign:upgradeSave(c),error:null};}
 catch{return {campaign:freshCampaign(),error:'讀不到有效存檔；原始內容仍保留，寫入前會先存為復原備份。'};}
}
function upgradeSave(c){c.fordLegacy??=c.chapter===2&&c.battle?.chapter===1&&c.battle.result==='won'?'pending':null;c.quarryLegacy??=c.chapter===4&&c.battle?.chapter===3&&c.battle.result==='won'?'pending':null;c.salvageCredits??=[];c.exercises??={completed:[],battle:null};return c;}
export function persist(storage,c,{backup=false}={}){
 try{if(!validateSave(c))throw Error('invalid');const previous=storage.getItem(SAVE_KEY);if(previous){let valid=false;try{valid=validateSave(JSON.parse(previous));}catch{}if(!valid)storage.setItem(RECOVERY_KEY,previous);if(backup)storage.setItem(BACKUP_KEY,previous);}storage.setItem(SAVE_KEY,JSON.stringify(c));return true;}catch{return false;}
}
export function exportSave(c){return JSON.stringify({kind:'trine-frontier-save',campaign:c},null,2);}
export function previewImport(text,current){
 if(typeof text!=='string'||!text.trim()||text.length>250000)throw Error('請貼上 250 KB 內的 JSON 或塔防 Base64 存檔碼。');
 let data;try{data=JSON.parse(text);}catch{try{const bytes=Uint8Array.from(atob(text.trim()),ch=>ch.charCodeAt(0));data=JSON.parse(new TextDecoder().decode(bytes));}catch{throw Error('無法辨識存檔。');}}
 if(data?.kind==='trine-frontier-save'){if(!validateSave(data.campaign))throw Error('整合存檔驗證失敗。');return {kind:'restore',campaign:upgradeSave(structuredClone(data.campaign)),summary:`恢復三相邊境：已完成 ${data.campaign.chapter} 章，結晶 ${data.campaign.crystals}。目前進度會先備份。`};}
 let source,reward=0,archer=false;
 const m=data?.kind==='td-save-v1'?data.meta:data;
 if(object(m)&&integer(m.bestWave,100000)&&integer(m.soulCrystal)){
  source='td';reward=Math.min(300,m.soulCrystal)+Math.min(20,m.bestWave)*5;archer=m.bestWave>0;
 }else{
  const records=data?.kind==='village-siege-campaign'?data.records:data;
  if(!object(records)||!Object.keys(records).length||Object.keys(records).some(k=>!['supply','ford','citadel'].includes(k)))throw Error('只接受塔防進度、村莊章節紀錄或三相邊境匯出檔；舊完整戰局請保留在原作。');
  let missing=false;for(const key of ['supply','ford','citadel']){const r=records[key];if(!r){missing=true;continue;}if(missing||!object(r)||!integer(r.stars,3)||r.stars<1||!integer(r.bestTicks))throw Error('村莊章節紀錄不連續或數值無效。');reward+=r.stars*20;archer=true;}source='village';
 }
 if(current.imports.includes(source))throw Error('這款原作已匯入過；不重複發放結晶。');
 const c=structuredClone(current);c.imports.push(source);c.legacyArchive.push({source,raw:text});c.crystals=Math.min(1e7,c.crystals+reward);if(archer&&!c.unlocks.includes('archer'))c.unlocks.push('archer');
 if(!validateSave(c))throw Error('合併後存檔驗證失敗。');
 return {kind:'legacy',campaign:c,summary:`${source==='td'?'無盡塔防':'村莊攻防'}：帶入 ${reward} 結晶${archer?'，解鎖弓手':''}。原始紀錄封存；新戰役仍從目前章節繼續。`};
}
