import assert from 'node:assert/strict';
// Historical checks retain all assertions and now walk the required first-wave preview.
export async function acknowledgeRoutePreview(p){
 if(!await p.locator('dialog.terrain[open]').count())return;
 assert.ok(await p.locator('#terrainWorld').isVisible(),'mandatory first-wave route map visible');
 const before=await p.evaluate(()=>JSON.parse(localStorage.getItem('trine-frontier:campaign:v1')));
 assert.equal(before.battle.wave,0);assert.equal(before.routePreviewSeen,true);
 await p.locator('dialog[open] [data-action=close]').click();
 const after=await p.evaluate(()=>JSON.parse(localStorage.getItem('trine-frontier:campaign:v1')));
 assert.equal(after.crystals,before.crystals,'mandatory preview cancels free');
 await p.locator('[data-action=wave]').click();
}
