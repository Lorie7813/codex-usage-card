const {test}=require('node:test');
const {spawn}=require('node:child_process');
test('agent accepts graceful IPC shutdown on Windows without relying on SIGTERM',async()=>{
 const child=spawn(process.execPath,[require.resolve('./agent.cjs'),'--codex-bin',process.execPath,'--port','39999'],{stdio:['ignore','pipe','ignore','ipc'],windowsHide:true});
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{child.kill();reject(Error('Agent did not shut down gracefully'))},3000);
  child.once('error',reject);
  child.stdout.once('data',()=>setTimeout(()=>{if(child.connected)child.send({type:'shutdown'});},50));
  child.once('exit',code=>{clearTimeout(timer);code===0?resolve():reject(Error(`Exit ${code}`))});
 });
});
const assert=require('node:assert/strict');
const {launchArgs}=require('./windows.cjs');
const {formatRateLimits,unavailableValue,parseArgs}=require('./agent.cjs');
test('default active polling matches upstream at sixty seconds',()=>{
 const old=process.env.CODEX_BADGE_POLL_MS;delete process.env.CODEX_BADGE_POLL_MS;
 try{assert.equal(parseArgs([]).pollMs,60000);}finally{if(old===undefined)delete process.env.CODEX_BADGE_POLL_MS;else process.env.CODEX_BADGE_POLL_MS=old;}
});
const {readResetCredits}=require('./reset-credits.cjs');
test('reset cards preserve count and earliest expiry without exposing identities',async()=>{
 const result=await readResetCredits({load:()=>({tokens:{access_token:'fixture',account_id:'fixture'}}),fetch:async(url,options)=>{
  assert.equal(url,'https://chatgpt.com/backend-api/wham/rate-limit-reset-credits');
  assert.equal(options.redirect,'error');
  return {ok:true,json:async()=>({available_count:2,credits:[{status:'available',reset_type:'codex_rate_limits',expires_at:'2026-10-30T02:00:00Z'}]})};
 }});
 assert.equal(result.availableCount,2);assert.equal(result.credits[0].expiresAt,1793325600);
 assert.match(formatRateLimits({rateLimitResetCredits:result}).title,/重置卡：2 张可用/);
 assert.match(formatRateLimits({rateLimitResetCredits:result}).title,/最近到期/);
});
test('failed reset query is unavailable rather than zero cards',async()=>{
 const result=await readResetCredits({load:()=>{throw Error('no auth')}});
 assert.match(formatRateLimits({rateLimitResetCredits:result}).title,/重置卡：暂不可用/);
});
test('debug endpoint stays local and uses the upstream port',()=>{
  assert.deepEqual(launchArgs(),['--remote-debugging-address=127.0.0.1','--remote-debugging-port=39222']);
});
test('Plus rings show remaining allowance for each distinct window',()=>{
  const v=formatRateLimits({rateLimits:{planType:'plus',primary:{usedPercent:11,windowDurationMins:300},secondary:{usedPercent:8,windowDurationMins:10080}}});
  assert.deepEqual(v.rings.map(r=>r.percent),[89,92]);
  assert.equal(unavailableValue(v).percent,null);
});
