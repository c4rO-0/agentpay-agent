#!/usr/bin/env node
// Bootstrap only: the installed User repository owns shared transport and recovery.
import {constants} from 'node:fs';
import {open,readFile} from 'node:fs/promises';
import {join,isAbsolute,dirname} from 'node:path';
import {homedir} from 'node:os';
import {pathToFileURL} from 'node:url';
try {
 const dataDir=process.env.AGENTPAY_USER_DATA_DIR||join(homedir(),'.local/share/agentpay/user');
 const file=join(dataDir,'runtime','connection.json');
 const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW);
 let connection;
 try{
  const stat=await handle.stat();
  if(!stat.isFile()||stat.uid!==process.getuid()||(stat.mode&0o077)||stat.size>16384)throw Error();
  connection=JSON.parse(await handle.readFile('utf8'));
 }finally{await handle.close();}
 if(connection.version!=='agentpay.runtime-connection.v1'||!isAbsolute(connection.clientModule||'')||!connection.clientModule.endsWith('/runtime-client.mjs'))throw Error();
 const {runSkill}=await import(pathToFileURL(join(dirname(connection.clientModule),'skill-client.mjs')).href);
 const manifest=JSON.parse(await readFile(new URL('../agentpay.json',import.meta.url),'utf8'));
 const args=process.argv.slice(2),[mode,min,max,...flags]=args;
 if(mode==='--invoke'&&(args.length<3||!/^\d+$/.test(min)||!/^\d+$/.test(max)))throw Error('INVALID_RANDOM_INPUT');
 process.exitCode=await runSkill({service:manifest.services.main,args:mode==='--invoke'?[mode,JSON.stringify({min:Number(min),max:Number(max)}),...flags]:args,validateRequest(request){
  if(!request||Object.keys(request).sort().join(',')!=='max,min'||!Number.isSafeInteger(request.min)||!Number.isSafeInteger(request.max)||request.min<0||request.max>1e9||request.min>request.max)throw Error('INVALID_RANDOM_INPUT');
  return request;
 }});
}catch{
 console.log(JSON.stringify({ok:false,error:{code:'LOCAL_SETUP_REQUIRED',message:'Run AgentPay setup to prepare the local Runtime client. Use AGENTPAY_USER_DATA_DIR for a non-default data directory.'}}));
 process.exitCode=1;
}
