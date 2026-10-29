'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
async function readResetCredits(deps={}){
 try{
  const auth=(deps.load||(()=>JSON.parse(fs.readFileSync(path.join(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'),'auth.json'),'utf8'))))();
  const {access_token,account_id}=auth.tokens||{};
  if(!access_token||!account_id)throw Error('Missing login');
  const res=await (deps.fetch||fetch)('https://chatgpt.com/backend-api/wham/rate-limit-reset-credits',{
   headers:{Authorization:`Bearer ${access_token}`,'ChatGPT-Account-ID':account_id},
   redirect:'error',signal:AbortSignal.timeout(8000)
  });
  if(!res.ok)throw Error('Unavailable');
  const data=await res.json();
  if(!Number.isInteger(data.available_count)||data.available_count<0)throw Error('Unknown count');
  const credits=(Array.isArray(data.credits)?data.credits:[]).map(c=>({status:c.status,resetType:c.reset_type==='codex_rate_limits'?'codexRateLimits':c.reset_type,
   expiresAt:typeof c.expires_at==='number'?c.expires_at:Date.parse(c.expires_at)/1000}));
  return {availableCount:data.available_count,credits};
 }catch{return {unavailable:true};}
}
module.exports={readResetCredits};
