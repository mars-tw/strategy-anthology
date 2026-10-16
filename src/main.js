import {VERSION,CHAPTERS,freshCampaign,completeChapter,TOWER_TYPES,TOWER_LABELS,UNIT_LABEL,UNIT_COST,COLORS} from './campaign.js';
import {createBattle,buildTower,upgradeTower,startWave,construct,recruit,dualOrders,march,cast,step,PADS} from './engine.js';
import {loadSave,persist,previewImport,exportSave,BACKUP_KEY,RECOVERY_KEY} from './save.js';
import {createRenderer,loadArt} from './render.js';
import './version.js';
const app=document.querySelector('#app');let storage;try{storage=localStorage;}catch{storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};}
const loaded=loadSave(storage);let campaign=loaded.campaign,battle=campaign.battle,home=true,paused=false,pending=null,skill=false,selectedTower=null,dirty=false,importPlan=null,saveText='',saveStatus=loaded.error||'本機進度已就緒',dialog=null,last=0,saveClock=0,lastHUD='',renderWorld;
let art;
try{art=await loadArt();}catch{app.innerHTML='<main class="load-error"><h1>戰場素材未載入</h1><p>首次請連網完整載入，再下載離線版。進度不受影響。</p><button onclick="location.reload()">重新載入</button></main>';throw Error('art unavailable');}
function save(){campaign.battle=battle;const ok=persist(storage,campaign);dirty=!ok;saveStatus=ok?'已儲存於本機':'儲存失敗：請釋出空間後重試，或先匯出備份。';updateHUD();return ok;}
function tone(kind='tap'){if(!campaign.settings.sound)return;try{const Audio=window.AudioContext||window.webkitAudioContext;const ctx=tone.ctx||(tone.ctx=new Audio());ctx.resume().catch(()=>{});const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(kind==='win'?660:kind==='cast'?330:440,ctx.currentTime);gain.gain.setValueAtTime(.055,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.13);osc.connect(gain).connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.15);}catch{}}
const btn=(action,label,cls='',attrs='')=>`<button data-action="${action}" class="${cls}" ${attrs}>${label}</button>`;
function chapterStrip(){return `<nav class="journey" aria-label="戰役進度">${CHAPTERS.map((c,i)=>`<span class="${i<campaign.chapter?'done':i===campaign.chapter?'current':''}"><i>${i<campaign.chapter?'✓':i+1}</i>${c.place}${c.mode==='defense'?'守':'攻'}</span>`).join('<b>›</b>')}</nav>`;}
function mount(){
 const chapter=CHAPTERS[battle?.chapter??Math.min(campaign.chapter,5)];
 app.innerHTML=`<main class="shell ${home?'home':'battle'}"><header><div class="brand"><span class="sigil">△</span><div><h1>三相邊境</h1><small>TRINE FRONTIER</small></div></div><div class="wallet"><span>共用結晶</span><strong id="crystals">${campaign.crystals}</strong></div><div class="top-controls">${btn('chronicle',home?'戰役':'戰報')}${btn('pause',home?'設定':'暫停')}</div></header>${chapterStrip()}
 <section class="mission"><div><span class="eyebrow">${home?'松林守望軍 · 六章戰役':`第 ${battle.chapter+1} 章 · ${chapter.mode==='defense'?'守城':'攻城'}`}</span><h2>${home?'把守住的家，連成回家的路。':chapter.name}</h2></div><p id="objective">${home?'火冰雷守村 → 結晶育兵 → 奪回土地 → 原地築防':chapter.goal}</p></section>
 <div class="play-layout"><section class="battlefield" aria-label="戰場"><canvas id="world" width="960" height="640" aria-label="可點選的戰場：守城選塔位，攻城下行軍令"></canvas><div class="map-label">${chapter.place}<span>${home?'邊境來信':chapter.mode==='defense'?'防線部署':'前線軍令'}</span></div><div class="field-status" id="fieldStatus"></div><div class="story-panel ${home?'':'hidden'}"><span class="eyebrow">第一封來信</span><h2>渡口失守。<br>松林不能再退。</h2><p>${campaign.chapter>=6?'六章戰役已完成。三處聚落重新相連，信使終於能回家。':CHAPTERS[Math.min(campaign.chapter,5)].story}</p></div></section>
 <aside class="command" id="command">${home?homeControls():battleControls()}</aside></div><footer><span id="saveStatus">${saveStatus}</span><span id="offline">離線資源準備中</span><span>v${VERSION} · MIT</span></footer></main><dialog id="modal"></dialog>`;
 renderWorld=createRenderer(document.querySelector('#world'),art);lastHUD='';bindCanvas();updateHUD();draw();
}
function homeControls(){return `<div class="dispatch"><span class="eyebrow">${campaign.chapter>=6?'戰役終章':'目前任務'}</span><h2>${campaign.chapter>=6?'邊境破曉':CHAPTERS[campaign.chapter].name}</h2><p>你的結晶、兵種與土地<br>沿著同一條戰線成長。</p><div class="trine"><span style="--element:${COLORS.cannon}">火</span><span style="--element:${COLORS.frost}">冰</span><span style="--element:${COLORS.tesla}">雷</span></div>${btn('begin',campaign.chapter>=6?'閱讀終戰記事':battle?'繼續目前戰局':campaign.chapter===0?'接下塔印，守住松林':'前往下一章','primary')}${btn('saves','存檔與原作匯入')}<p class="fine">免費、單人、可離線。<br>原作進度可選擇帶入，原始紀錄會保留。</p></div>`;}
function battleControls(){
 const ch=CHAPTERS[battle.chapter];if(battle.result)return resultControls();
 if(ch.mode==='defense')return `<div class="command-head"><h3>三相防線</h3><span id="waveLabel"></span></div><p class="hint">選塔後可點地圖調整；確認才扣結晶。三塔彼此相鄰，各加 30%。</p><div class="cards">${TOWER_TYPES.map((t,i)=>btn('tower-'+t,`<em style="color:${COLORS[t]}">${['火','冰','雷'][i]}</em>${TOWER_LABELS[t]}<small>${[100,70,130][i]} 結晶</small>`,'tower-card')).join('')}</div><div class="placement" id="placement">${btn('suggest','建議塔位')}${btn('confirm','確認建造','accent')}${btn('cancel','取消')}</div><div class="command-row">${btn('wave','開始下一波','primary')}${btn('skill','共鳴震擊 · 20')}</div><p id="hint" class="feedback" role="status">先配置三塔，再開始第一波。點已有塔可升級。</p>`;
 return `<div class="command-head"><h3>前線軍令</h3><span id="queueLabel"></span></div><p class="hint">工匠搬回同一種結晶。訓練部隊後，點戰場行軍或開啟雙線軍令。</p><div class="cards">${['warrior','archer','mage'].map(t=>btn('unit-'+t,`${UNIT_LABEL[t]}<small>${UNIT_COST[t]} 結晶${campaign.unlocks.includes(t)?'':' · 未解鎖'}</small>`,'unit-card',campaign.unlocks.includes(t)?'':'disabled')).join('')}</div><div class="command-row">${btn('construct',battle.barracks?'兵營已就緒':'建立兵營 · 60','accent',battle.barracks?'disabled':'')}${btn('orders','雙線軍令','primary')}</div><div class="command-row">${btn('attack','全軍攻向據點')}${btn('skill','共鳴震擊 · 20')}</div><p id="hint" class="feedback" role="status">${campaign.unlocks.includes('mage')?'松林三才陣已解鎖術士。':'守城排出三才陣，可解鎖術士。'}</p>`;
}
function resultControls(){const won=battle.result==='won';return `<div class="dispatch result"><span class="eyebrow">${won?'戰線推進':'防線失守'}</span><h2>${won?'這片土地，守下了。':'重整，再來。'}</h2><p>${won?CHAPTERS[battle.chapter].mode==='defense'?`結晶已送往軍營。${battle.trinity?'三才印記解鎖術士。':'弓手已加入軍營。'}`:'收復補給 +360 結晶。這片土地將成為下一章防線。':'重新部署會退還本章耗用，收回本章收益。'}</p><div class="report"><span>擊退敵軍 <b>${battle.kills}</b></span><span>防線耐久 <b>${Math.ceil(battle.hp)}</b></span><span>戰局用時 <b>${Math.round(battle.time)} 秒</b></span></div>${btn(won?'next':'retry',won?campaign.chapter>=6?'閱讀終戰記事':'接續下一章':'重新部署','primary')}${btn('chronicle','返回戰報')}</div>`;}
function feedback(text){const p=document.querySelector('#hint');if(p)p.textContent=text;}
function updateHUD(){
 const key=JSON.stringify([campaign.crystals,battle?.hp,battle?.keepHP,battle?.phase,battle?.wave,battle?.spawnLeft,battle?.queue.length,Math.ceil(battle?.construction||0),battle?.cooldown>0?Math.ceil(battle.cooldown):0,saveStatus]);if(key===lastHUD)return;lastHUD=key;
 const wallet=document.querySelector('#crystals');if(wallet)wallet.textContent=campaign.crystals;
 const st=document.querySelector('#saveStatus');if(st)st.textContent=saveStatus;
 const fs=document.querySelector('#fieldStatus');if(fs)fs.textContent=home?'':`${paused?'已暫停 · ':''}防線 ${Math.ceil(battle.hp)}/100${CHAPTERS[battle.chapter].mode==='defense'?` · 第 ${battle.wave}/${CHAPTERS[battle.chapter].waves} 波`:` · 敵據點 ${Math.ceil(battle.keepHP)}/${battle.keepMaxHP}`}`;
 const wave=document.querySelector('#waveLabel');if(wave)wave.textContent=battle.phase==='planning'?'準備中':'交戰中';
 const start=document.querySelector('[data-action="wave"]');if(start)start.disabled=battle.phase!=='planning'||!battle.towers.length;
 const queue=document.querySelector('#queueLabel');if(queue)queue.textContent=battle.construction?`施工 ${Math.ceil(battle.construction)} 秒`:battle.queue.length?`訓練中 ${battle.queue.length}`:'補給運轉中';
 const build=document.querySelector('[data-action="construct"]');if(build){build.disabled=battle.barracks||battle.construction>0;build.textContent=battle.barracks?'兵營已就緒':battle.construction?'兵營施工中':'建立兵營 · 60';}
 document.querySelectorAll('[data-action^="unit-"]').forEach(el=>el.disabled=!battle?.barracks||!campaign.unlocks.includes(el.dataset.action.slice(5))||battle.queue.length>=5||campaign.crystals<UNIT_COST[el.dataset.action.slice(5)]);
 const sk=document.querySelector('[data-action="skill"]');if(sk){sk.disabled=battle.cooldown>0||campaign.crystals<20;sk.textContent=skill?'取消震擊':battle.cooldown>0?`冷卻 ${Math.ceil(battle.cooldown)} 秒`:'共鳴震擊 · 20';}
 document.querySelector('#offline')?.replaceChildren(document.createTextNode(navigator.serviceWorker?.controller?'離線可玩':'離線資源準備中'));
}
function openModal(kind){paused=true;pending=null;skill=false;save();dialog=kind;let body;
 if(kind==='orders')body=`<span class="eyebrow">雙線軍令 · 時間已暫停</span><h2>補給與行軍，一起下令。</h2><label>工匠線<select id="economy"><option value="gather">採集結晶</option><option value="rest">回村待命（先送回補給）</option><option value="keep">維持原令</option></select></label><label>軍隊線<select id="army"><option value="scout">偵察前沿</option><option value="ford">集結渡口</option><option value="home">返回村莊</option><option value="keep">維持原令</option></select></label><p>滿載返程的工匠會保留工作。確認後兩線一起執行，取消保留原令。</p><div class="modal-actions">${btn('apply-orders','執行兩線軍令','primary')}${btn('close','取消')}</div>`;
 else if(kind==='saves')body=`<span class="eyebrow">同一份戰役進度</span><h2>存檔與原作匯入</h2><p class="fine">塔防可貼 Base64 存檔碼；村莊可貼章節 JSON（supply／ford／citadel）。原作中途戰局無法直接接續，會封存原文。確認後才寫入。</p><label>存檔內容<textarea id="saveCode" aria-label="存檔內容" spellcheck="false"></textarea></label><p id="importSummary" class="feedback" role="status">${saveStatus}</p><div class="save-actions">${btn('export','匯出備份')}${btn('preview','預覽匯入')}${btn('commit-import','確認匯入','accent','disabled')}${btn('retry-save','重試儲存')}${btn('backup','讀取匯入前備份')}${btn('recovery','讀取損壞原檔')}</div><div class="modal-actions">${btn('close','返回戰役','primary')}</div>`;
 else if(kind==='ending')body=`<span class="eyebrow">邊境記事 · 六章完</span><h2>信使終於不用繞路。</h2><p>松林的火還亮著，渡口的船又開了。採石場送來的石料，這次拿來修村民回家的路。</p><p>你先守住一個家，再把它和另外兩個家連起來。三相守望軍，就在這條路上成立。</p><p>本機已保留 ${campaign.completed.length} 章與 ${campaign.trinitySeals} 枚三才印記。</p><div class="modal-actions">${btn('close','返回戰報','primary')}${btn('saves','匯出旅程')}</div>`;
 else body=`<span class="eyebrow">松林守望軍 · 戰局已暫停</span><h2>喘口氣，再下令。</h2><p>結晶由守城、補給與攻城共用。守城組成三才陣可解鎖術士；攻下的土地會成為下一章地圖。</p><div class="settings-row">${btn('sound',campaign.settings.sound?'音效：開啟':'音效：關閉')}${btn('motion',campaign.settings.reducedMotion?'減少動態：開啟':'減少動態：關閉')}</div><p class="fine">音效由本機合成；無廣告、無帳號。關頁前請確認已儲存。鍵盤 Esc 暫停，Enter 確認塔位。</p><div class="modal-actions">${btn('close',home?'返回':'繼續戰局','primary')}${btn('saves','存檔／匯入')}${btn('chronicle','返回戰報')}</div>`;
 const modal=document.querySelector('#modal');modal.className=kind;modal.innerHTML=body;if(!modal.open)modal.showModal();if(kind==='saves')document.querySelector('#saveCode').value=saveText;lastHUD='';updateHUD();
}
function closeModal(){document.querySelector('#modal').close();dialog=null;paused=false;importPlan=null;lastHUD='';updateHUD();}
function begin(){if(campaign.chapter>=6){openModal('ending');return;}if(!battle||battle.result){battle=createBattle(campaign.chapter);}home=false;paused=false;save();mount();}
function next(){if(campaign.chapter>=6){home=true;mount();openModal('ending');return;}battle=createBattle(campaign.chapter);home=false;paused=false;save();mount();}
function pickTower(type){pending={type,...PADS[TOWER_TYPES.indexOf(type)]};selectedTower=null;skill=false;feedback(`${TOWER_LABELS[type]}位置已預覽。點地圖可調整，按確認才付款。`);}
app.addEventListener('click',e=>{
 const el=e.target.closest('button[data-action]');if(!el||el.disabled)return;const a=el.dataset.action;
 if(a==='begin')begin();else if(a==='next')next();
 else if(a==='pause')openModal('pause');else if(a==='saves'){saveText='';importPlan=null;openModal('saves');}
 else if(a==='chronicle'){if(dialog)document.querySelector('#modal').close();dialog=null;paused=false;pending=null;skill=false;home=true;save();mount();}
 else if(a==='close')closeModal();
 else if(a==='sound'||a==='motion'){const k=a==='sound'?'sound':'reducedMotion';campaign.settings[k]=!campaign.settings[k];save();openModal('pause');}
 else if(a.startsWith('tower-'))pickTower(a.slice(6));
 else if(a==='suggest'){if(pending){pending={type:pending.type,...PADS[TOWER_TYPES.indexOf(pending.type)]};feedback('已移到三才陣建議位，按確認建造。');}else feedback('先選一座火、冰或雷印塔。');}
 else if(a==='cancel'){pending=null;skill=false;selectedTower=null;feedback('已取消，沒有扣結晶。');}
 else if(a==='confirm'){
  if(selectedTower){feedback(upgradeTower(campaign,battle,selectedTower)?'升級完成，傷害提高。':'需要 60 結晶，最多升至三級。');selectedTower=null;save();}
  else if(pending){if(buildTower(campaign,battle,pending.type,pending.x,pending.y)){feedback(battle.trinity?'三才成陣！每座塔傷害 +30%，守城成功後解鎖術士。':'建造完成。把不同元素排在相鄰格位。');pending=null;save();tone();}else feedback('無法建造：請避開路徑、其他塔，並確認結晶足夠。');}
 }
 else if(a==='wave'){if(startWave(battle)){feedback('敵軍正沿路逼近。可補塔、暫停或施放震擊。');save();}}
 else if(a==='construct'){feedback(construct(campaign,battle)?'工匠開始建兵營，五秒後可訓練。':'需要 60 結晶，且不能重複建造。');save();}
 else if(a.startsWith('unit-')){const type=a.slice(5);feedback(recruit(campaign,battle,type)?`${UNIT_LABEL[type]}加入訓練佇列。`:'兵營、結晶或隊伍名額不足。');save();}
 else if(a==='orders')openModal('orders');
 else if(a==='apply-orders'){const economy=document.querySelector('#economy').value;const result=dualOrders(battle,economy,document.querySelector('#army').value);closeModal();feedback(result.ok?`已下令：${result.lanes.includes('economy')?(economy==='rest'?'工匠回村待命':'工匠採集'):''}${result.lanes.includes('army')?'、軍隊行軍':''}。${result.warnings.join('')}`:result.warnings.join('')||'兩線維持原令。');save();}
 else if(a==='attack'){feedback(march(battle,818,180)?'全軍向灰旗據點前進，途中會反擊敵軍。':'先訓練至少一名士兵。');save();}
 else if(a==='skill'){skill=!skill;pending=null;feedback(skill?'點選戰場敵群；沒有命中不扣結晶。':'已取消震擊。');lastHUD='';updateHUD();}
 else if(a==='retry'){campaign.crystals=Math.max(0,campaign.crystals+battle.spent-battle.earnings);battle=createBattle(campaign.chapter);save();mount();}
 else if(a==='export'){saveText=exportSave(campaign);document.querySelector('#saveCode').value=saveText;download(saveText);document.querySelector('#importSummary').textContent='已產生 JSON 備份，也可手動複製上方內容。';}
 else if(a==='preview'){try{saveText=document.querySelector('#saveCode').value;importPlan=previewImport(saveText,campaign);document.querySelector('#importSummary').textContent=importPlan.summary;document.querySelector('[data-action="commit-import"]').disabled=false;}catch(err){importPlan=null;document.querySelector('[data-action="commit-import"]').disabled=true;document.querySelector('#importSummary').textContent=err.message;}}
 else if(a==='commit-import'&&importPlan){if(persist(storage,importPlan.campaign,{backup:true})){campaign=importPlan.campaign;battle=campaign.battle;home=true;dialog=null;paused=false;saveText='';importPlan=null;saveStatus='匯入完成；原進度已備份。';mount();}else document.querySelector('#importSummary').textContent='寫入失敗，沒有套用匯入內容。請先匯出並釋出空間。';}
 else if(a==='retry-save'){save();document.querySelector('#importSummary').textContent=saveStatus;}
 else if(a==='backup'||a==='recovery'){try{const raw=storage.getItem(a==='backup'?BACKUP_KEY:RECOVERY_KEY);document.querySelector('#saveCode').value=raw?(a==='backup'?JSON.stringify({kind:'trine-frontier-save',campaign:JSON.parse(raw)},null,2):raw):'尚無備份。';document.querySelector('#importSummary').textContent='已讀出備份內容；尚未套用。';}catch{document.querySelector('#importSummary').textContent='無法讀取備份。';}}
 if(a!=='sound')tone();draw();
});
app.addEventListener('input',e=>{if(e.target.id==='saveCode'){importPlan=null;document.querySelector('[data-action="commit-import"]').disabled=true;}});
app.addEventListener('cancel',e=>{e.preventDefault();closeModal();},true);
function download(text){const blob=new Blob([text],{type:'application/json'});const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download='trine-frontier-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function bindCanvas(){const canvas=document.querySelector('#world');let press=null;
 canvas.addEventListener('pointerdown',e=>{if(home||paused)return;if(press){press=null;pending=null;skill=false;return;}press={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointercancel',()=>{press=null;pending=null;skill=false;feedback('操作已取消，沒有扣結晶。');});
 canvas.addEventListener('pointerup',e=>{if(!press||press.id!==e.pointerId||home||paused||battle.result)return;const p=press;press=null;if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>18)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*960,y=(e.clientY-r.top)/r.height*640;
  if(skill){feedback(cast(campaign,battle,x,y)?'震擊命中。':'範圍內沒有敵軍，未扣結晶。');skill=false;save();}
  else if(pending){pending.x=Math.floor(x/48)*48+24;pending.y=Math.floor(y/48)*48+24;feedback('已調整塔位，按確認才付款。');}
  else if(CHAPTERS[battle.chapter].mode==='siege'){feedback(march(battle,x,y)?'軍隊正向標記位置前進。':'無法行軍：先訓練士兵，並選擇陸地或渡橋。');save();}
  else{const t=battle.towers.find(t=>Math.hypot(t.x-x,t.y-y)<40);if(t){selectedTower=t.id;feedback(`${TOWER_LABELS[t.type]}：目前 ${t.level} 級。按確認花 60 結晶升級，取消保留原狀。`);}}
  draw();
 });
}
function draw(){renderWorld?.(campaign,home?null:battle,pending,skill);}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();if(dialog)closeModal();else if(pending||skill){pending=null;skill=false;}else openModal('pause');}if(e.key==='Enter'&&!dialog&&pending)document.querySelector('[data-action="confirm"]')?.click();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){paused=true;pending=null;skill=false;save();if(!home)openModal('pause');}});
window.addEventListener('pagehide',save);
window.addEventListener('resize',()=>{pending=null;skill=false;});
function frame(now){const dt=Math.min(.05,(now-last)/1000||0);last=now;if(!home&&!paused&&battle&&!battle.result){step(campaign,battle,dt);saveClock+=dt;if(battle.result){pending=null;skill=false;selectedTower=null;if(battle.result==='won'){completeChapter(campaign,battle);tone('win');}save();document.querySelector('#command').innerHTML=battleControls();}else if(saveClock>=3){saveClock=0;save();}updateHUD();}draw();requestAnimationFrame(frame);}
mount();requestAnimationFrame(frame);
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{lastHUD='';updateHUD();}).catch(()=>{document.querySelector('#offline').textContent='離線下載失敗；請連網重試';});navigator.serviceWorker.addEventListener('controllerchange',()=>{lastHUD='';updateHUD();});}
