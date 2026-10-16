export const VERSION = '0.1.0';
export const CHAPTERS = Object.freeze([
 {id:'pine-watch',name:'松林初火',place:'松林村',terrain:'pine',mode:'defense',waves:2,story:'灰旗軍切斷了渡口。村長把三枚塔印交給你：先守住松林，才有機會把人帶回家。',goal:'用火、冰、雷守住兩波。三塔相鄰，傷害各加 30%。'},
 {id:'ford-assault',name:'奪回渡口',place:'河谷渡口',terrain:'ford',mode:'siege',keepHP:420,story:'塔陣凝成的結晶已送到軍營。調度工匠補給，率軍攻下渡口；明天，這裡就是新的防線。',goal:'建立兵營、訓練部隊，調度補給與軍隊攻下灰旗據點。'},
 {id:'ford-watch',name:'河岸烽火',place:'河谷渡口',terrain:'ford',mode:'defense',waves:3,story:'昨天渡河的路，今天成了敵軍的進路。把剛收復的渡口守住，村民才能通行。',goal:'在收復的渡口重建三相防線，守住三波反撲。'},
 {id:'quarry-assault',name:'石脊進軍',place:'石脊採石場',terrain:'quarry',mode:'siege',keepHP:650,story:'灰旗軍以石脊供應高地城牆。守住渡口得到的結晶，正好支援這次反攻。',goal:'工匠持續運回結晶，帶領混編部隊攻佔採石場。'},
 {id:'quarry-watch',name:'不退之地',place:'石脊採石場',terrain:'quarry',mode:'defense',waves:4,story:'石脊已收復，灰旗軍卻沿著礦道回來了。這次守下的每一寸土地，都是高地決戰的後路。',goal:'礦道敵軍較強，升級塔陣並守住四波。'},
 {id:'citadel-assault',name:'邊境破曉',place:'高地要塞',terrain:'citadel',mode:'siege',keepHP:900,story:'松林、渡口、石脊的信使都到了。把一路守下的結晶送上前線，拆下高地最後一面灰旗。',goal:'調度全軍攻下高地，讓三處聚落重新相連。'},
]);
export const TOWER_TYPES=['cannon','frost','tesla'];
export const TOWER_LABELS={cannon:'火印塔',frost:'冰印塔',tesla:'雷印塔'};
export const COLORS={cannon:'#ed9c68',frost:'#a1d9ef',tesla:'#eed17f'};
export const UNIT_COST={warrior:35,archer:50,mage:65};
export const UNIT_LABEL={warrior:'衛士',archer:'弓手',mage:'三相術士'};
export function freshCampaign(){return {version:1,chapter:0,crystals:360,completed:[],unlocks:['warrior'],trinitySeals:0,imports:[],legacyArchive:[],settings:{sound:true,reducedMotion:false},battle:null};}
export function completeChapter(campaign,battle){
 if(battle.result!=='won'||battle.chapter!==campaign.chapter||campaign.completed.includes(CHAPTERS[battle.chapter].id))return false;
 const chapter=CHAPTERS[battle.chapter];
 campaign.completed.push(chapter.id);campaign.crystals+=chapter.mode==='defense'?80:360;
 if(chapter.mode==='defense'){
  if(!campaign.unlocks.includes('archer'))campaign.unlocks.push('archer');
  if(battle.trinity){campaign.trinitySeals++;campaign.crystals+=40;if(!campaign.unlocks.includes('mage'))campaign.unlocks.push('mage');}
 }
 campaign.chapter++;return true;
}
