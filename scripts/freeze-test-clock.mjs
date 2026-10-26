import assert from 'node:assert/strict';

// Reload creates a fresh document whose clock resumes wall time. Pause it on
// the home screen before resuming play, so screenshots cannot advance combat.
// The one-second seek only processes home-screen frames; saved play is intact.
export async function freezeReloadedClock(page){
 await page.locator('[data-action=begin]').waitFor();
 assert.ok(await page.locator('.shell.home').count(),'Clock is frozen before resuming gameplay');
 const key='trine-frontier:campaign:v1',before=await page.evaluate(k=>localStorage.getItem(k),key);
 await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+1000)));
 const time=await page.evaluate(()=>performance.now());
 await new Promise(resolve=>setTimeout(resolve,80));
 assert.equal(await page.evaluate(()=>performance.now()),time,'Reloaded virtual clock must stay frozen during real waits');
 assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),before,'Freezing the home screen must not change saved gameplay');
}
