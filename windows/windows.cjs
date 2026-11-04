'use strict';
const fs=require('node:fs'),path=require('node:path');
const {spawn,execFileSync}=require('node:child_process');
const {resolveCodexBin,isMainWindow}=require('./agent.cjs');
const port=39222,stopFile=path.join(__dirname,'stop.flag');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const launchArgs=()=>['--remote-debugging-address=127.0.0.1',`--remote-debugging-port=${port}`];
function powershell(code){return execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',code],{encoding:'utf8',windowsHide:true}).trim();}
function discover(){
  const root=powershell("(Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1).InstallLocation");
  if(!root)throw Error('Installed OpenAI.Codex package not found.');
  const app=path.join(root,'app','ChatGPT.exe');
  if(!fs.existsSync(app))throw Error('Codex executable not found.');
  return {app,cli:resolveCodexBin(undefined,app)};
}
function appOpen(){return powershell("@(Get-Process ChatGPT -ErrorAction SilentlyContinue | Where-Object { $_.Path -like '*OpenAI.Codex_*' }).Count")!=='0';}
async function pages(){
  const res=await fetch(`http://127.0.0.1:${port}/json/list`,{signal:AbortSignal.timeout(2000)});
  if(!res.ok)throw Error('Local debugging endpoint unavailable.');
  return (await res.json()).filter(p=>p.type==='page'&&isMainWindow(p));
}
async function evaluate(target,expression){
  const u=new URL(target.webSocketDebuggerUrl);
  if(u.hostname!=='127.0.0.1'||u.port!==String(port)||u.protocol!=='ws:')throw Error('Unexpected debugging address.');
  return new Promise((resolve,reject)=>{
    const ws=new WebSocket(u),timer=setTimeout(()=>finish(Error('CDP timeout')),4000);
    function finish(error,value){clearTimeout(timer);ws.close();error?reject(error):resolve(value);}
    ws.addEventListener('open',()=>ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,returnByValue:true}})));
    ws.addEventListener('error',()=>finish(Error('CDP connection failed')));
    ws.addEventListener('message',event=>{const v=JSON.parse(event.data);if(v.id===1)finish(v.error||v.result?.exceptionDetails,v.result?.result?.value);});
  });
}
async function status(){
  const results=[];
  for(const p of await pages())results.push(await evaluate(p,'window.__codexUsageBadge?.status() ?? null'));
  return results;
}
async function monitor(attach=false){
  const {app,cli}=discover();
  if(!attach&&appOpen())throw Error('Save your work and fully quit Codex, then run Start again. No processes were stopped.');
  if(attach){if(!(await pages()).length)throw Error('No compatible Codex window');}
  else try{await pages();throw Error('Port 39222 is already in use.');}catch(e){if(e.message.includes('already in use'))throw e;}
  fs.rmSync(stopFile,{force:true});
  if(!attach){
  const desktop=spawn(app,launchArgs(),{detached:true,stdio:'ignore',windowsHide:false});
  desktop.on('error',e=>console.error(e.message));desktop.unref();
  }
  let ready=false;
  for(let i=0;i<30;i++){if(fs.existsSync(stopFile))return;try{if((await pages()).length){ready=true;break;}}catch{}await sleep(1000);}
  if(!ready)throw Error('Codex did not expose a compatible main window within 30 seconds.');
  const agent=spawn(process.execPath,[path.join(__dirname,'agent.cjs'),'--app',app,'--codex-bin',cli],{stdio:['ignore','inherit','inherit','ipc'],windowsHide:true});
  let failed=false;agent.on('error',()=>{failed=true;});agent.on('exit',()=>{failed=true;});
  try{
    while(!fs.existsSync(stopFile)&&!failed){
      try{const s=await status();fs.writeFileSync(path.join(__dirname,'status.json'),JSON.stringify({checkedAt:new Date().toISOString(),windows:s},null,2));if(!s.length)break;}catch{break;}
      await sleep(5000);
    }
  }finally{
    await new Promise(resolve=>{
      if(agent.exitCode!==null||agent.signalCode!==null)return resolve();
      const timer=setTimeout(()=>{agent.kill();resolve();},3000);
      agent.once('exit',()=>{clearTimeout(timer);resolve();});
      if(agent.connected)agent.send({type:'shutdown'},()=>{});else agent.kill();
    });
    try{for(const p of await pages())await evaluate(p,'window.__codexUsageBadge?.destroy()');}catch{}
  }
}
async function main(){
  const cmd=process.argv[2]||'start';
  if(cmd==='doctor'){console.log(JSON.stringify({...discover(),appOpen:appOpen(),node:process.version},null,2));return;}
  if(cmd==='status'){console.log(JSON.stringify(await status(),null,2));return;}
  if(cmd==='stop'){fs.writeFileSync(stopFile,'stop');console.log('Stop requested. Rings and agent will stop within 5 seconds; Codex stays open.');return;}
  if(cmd==='monitor')return monitor();
  if(cmd==='monitor-attached')return monitor(true);
  if(cmd==='attach'){
    if(!(await pages()).length)throw Error('No compatible Codex window');
    const log=fs.openSync(path.join(__dirname,'windows.log'),'a');
    const child=spawn(process.execPath,[__filename,'monitor-attached'],{detached:true,stdio:['ignore',log,log],windowsHide:true});
    child.unref();fs.closeSync(log);return;
  }
  if(cmd!=='start')throw Error('Use start, stop, status or doctor.');
  discover();
  if(appOpen())throw Error('Save your work and fully quit Codex, then double-click Start again.');
  const log=fs.openSync(path.join(__dirname,'windows.log'),'a');
  const child=spawn(process.execPath,[__filename,'monitor'],{detached:true,stdio:['ignore',log,log],windowsHide:true});
  child.on('error',e=>console.error(e.message));child.unref();fs.closeSync(log);
  console.log('Launcher started. Check windows.log and status.json for results.');
}
module.exports={launchArgs};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
