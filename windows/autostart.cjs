'use strict';
const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const manager=path.join(__dirname,'windows.cjs');
const log=text=>fs.appendFileSync(path.join(__dirname,'autostart.log'),`${new Date().toISOString()} ${text}\n`);
const run=cmd=>spawnSync(process.execPath,[manager,cmd],{encoding:'utf8',windowsHide:true,timeout:20000});
try{
 const state=run('status');
 let command='start';
 if(state.status===0){
  const windows=JSON.parse(state.stdout);
  if(windows.some(w=>w?.placed)){log('Already running; skipped duplicate startup.');process.exit(0);}
  command='attach';
 }
 const result=run(command);
 log(`${command}: ${(result.stdout||result.stderr||result.error?.message||'').trim()}`);
 process.exitCode=result.status??1;
}catch(e){log(`ERROR: ${e.message}`);process.exitCode=1;}
