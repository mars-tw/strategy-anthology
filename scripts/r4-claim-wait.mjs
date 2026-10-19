import assert from 'node:assert/strict';
// Old regression flows also wait for the new public arrival feedback.
// This advances elapsed time, without changing wallet or game state.
export async function awaitCrystalArrival(page){
 const flight=page.locator('.salvage-flight');if(!await flight.count())return;
 await page.clock.runFor(1350);
 const state=await flight.evaluate(e=>JSON.parse(e.dataset.salvage));
 assert.ok(state.arrived,'crystal actually arrives before continuing');
 assert.equal(await page.locator('#crystals').textContent(),String(state.money));
}
