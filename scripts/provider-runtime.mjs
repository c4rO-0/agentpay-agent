#!/usr/bin/env node
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolveProviderRuntimeEnvironment} from '../src/provider-runtime-environment.mjs';
try {
 const action=process.argv[2];if(process.argv.length!==3||!['prepare','start'].includes(action))throw new Error('Usage: provider-runtime.mjs prepare|start');
 const {env,bindingPresent}=await resolveProviderRuntimeEnvironment(process.env,{prepare:action==='prepare'});
 if(action==='prepare')console.log(JSON.stringify({ok:true,skillId:env.AGENT_NATIVE_SKILL_ID,offerId:env.AGENT_NATIVE_OFFER_ID,profileHash:env.AGENT_NATIVE_PROFILE_HASH,bindingPresent,remoteWrites:false}));
 else {
  const child=spawn(process.execPath,[fileURLToPath(new URL('../src/index.mjs',import.meta.url))],{env:{PATH:process.env.PATH||'',HOME:process.env.HOME||'',LANG:process.env.LANG||'C.UTF-8',...env},stdio:'inherit'});
  process.on('SIGTERM',()=>child.kill('SIGTERM'));process.on('SIGINT',()=>child.kill('SIGINT'));
  child.on('error',()=>{console.error('Provider runtime could not start');process.exitCode=1;});
  child.on('exit',(code,signal)=>{process.exitCode=code??(signal?1:0);});
 }
}catch(error){console.error(JSON.stringify({ok:false,error:{message:error.message}}));process.exitCode=1;}
