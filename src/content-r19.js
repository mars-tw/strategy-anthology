const attr=(value='')=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');

export function firstWaveScope(b,focusId){
 if(b?.firstWaveDecision)return '首波已結算';
 if(b?.wave===1&&b?.decisionStats?.towers?.[focusId])return '首波進行中';
 return null;
}

export function scopedImpactHTML(detail,b,selectedTower){
 const html=detail?.html||'',focusId=detail?.event?.towerId||selectedTower||'';
 const scope=firstWaveScope(b,focusId),key=`hit:${focusId||'waiting'}`;
 let next=html.replace('<details class="hit-details">',`<details class="hit-details" data-detail-key="${attr(key)}">`);
 next=next.replace('<summary>命中明細',`<summary><span class="metric-scope">最新一擊</span>命中明細`);
 if(scope){
  next=next.replace('同場首波留塔累計：',`${scope}・留塔累計：`);
  next=next.replace('<br>首波留塔 ',`<br>${scope}・留塔 `);
 }
 return next;
}

export function detailOpenKeys(root){
 return new Set([...root.querySelectorAll('details[data-detail-key][open]')].map(node=>node.dataset.detailKey));
}

export function restoreDetailOpen(root,keys){
 root.querySelectorAll('details[data-detail-key]').forEach(node=>{node.open=keys.has(node.dataset.detailKey);});
}

export function updateImpactPanel(panel,detail,b,selectedTower){
 const html=scopedImpactHTML(detail,b,selectedTower);
 if(panel.dataset.readout===html)return false;
 const template=panel.ownerDocument.createElement('template');template.innerHTML=html;
 const incoming=template.content.querySelector('details[data-detail-key]'),current=panel.querySelector('details[data-detail-key]');
 if(!incoming||!current||incoming.dataset.detailKey!==current.dataset.detailKey){
  const open=detailOpenKeys(panel);panel.replaceChildren(template.content);restoreDetailOpen(panel,open);panel.dataset.readout=html;return true;
 }
 const sync=(selector,keepNode=false)=>{const old=panel.querySelector(selector),next=template.content.querySelector(selector);if(!old&&!next)return;if(!old||!next){old?.remove();if(next)current.before(next);return;}if(keepNode){old.innerHTML=next.innerHTML;for(const name of next.getAttributeNames())old.setAttribute(name,next.getAttribute(name));}else old.replaceWith(next);};
 const oldWatch=panel.querySelector('[data-action="watch-hit"]'),nextWatch=template.content.querySelector('[data-action="watch-hit"]');
 if(oldWatch?.dataset.watchId===nextWatch?.dataset.watchId)sync('[data-action="watch-hit"]',true);else sync('[data-action="watch-hit"]');
 sync('.hit-summary');
 const summary=current.querySelector(':scope>summary'),nextSummary=incoming.querySelector(':scope>summary');if(summary&&nextSummary)summary.innerHTML=nextSummary.innerHTML;
 const body=current.querySelector('.impact-lines'),nextBody=incoming.querySelector('.impact-lines');if(body&&nextBody){const top=current.scrollTop;body.innerHTML=nextBody.innerHTML;current.scrollTop=top;}
 panel.dataset.readout=html;return true;
}

export function scopedGateLedgerHTML(b,ledgerHTML){
 if(!ledgerHTML)return '';
 const rows=Object.keys(b.gate?.delays||{}).length+(b.gate?.legacyDelay>0||b.gate?.delays===undefined&&b.gate?.delay>0?1:0);
 return `<details class="gate-ledger-details" data-detail-key="sluice-ledger"><summary><span class="metric-scope">本場一次</span>逐隻延遲明細 <b>${rows} 筆</b></summary>${ledgerHTML}</details>`;
}

export function updateGateLedger(control,b,ledgerHTML){
 const html=scopedGateLedgerHTML(b,ledgerHTML),current=control.querySelector('.gate-ledger-details');
 if(!html){current?.remove();delete control.dataset.ledger;return false;}
 if(control.dataset.ledger===html)return false;
 if(!current){control.insertAdjacentHTML('beforeend',html);control.dataset.ledger=html;return true;}
 const template=control.ownerDocument.createElement('template');template.innerHTML=html;const incoming=template.content.querySelector('.gate-ledger-details');
 const summary=current.querySelector(':scope>summary'),nextSummary=incoming?.querySelector(':scope>summary');if(summary&&nextSummary)summary.innerHTML=nextSummary.innerHTML;
 const ledger=current.querySelector(':scope>.gate-ledger'),nextLedger=incoming?.querySelector(':scope>.gate-ledger');if(ledger&&nextLedger){const top=ledger.scrollTop;ledger.innerHTML=nextLedger.innerHTML;for(const name of nextLedger.getAttributeNames())ledger.setAttribute(name,nextLedger.getAttribute(name));ledger.scrollTop=top;}
 control.dataset.ledger=html;return true;
}

export function scopedFullRunHTML(html){
 return html?html.replace('<p class="full-run-summary">','<p class="full-run-summary"><span class="metric-scope">全章</span>'):'';
}
