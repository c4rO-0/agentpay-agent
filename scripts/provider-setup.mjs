#!/usr/bin/env node
import {providerBaseForEndpoint} from '../src/provider-service-urls.mjs';
// Connect an already running service. Never inspect its database or own its process.
import { resolve, join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { terminal } from '../src/provider-terminal.mjs';
import { privateDirectory, privateText, savePrivate, encodeConfig } from '../src/provider-private-files.mjs';
import { loadProviderDeployment } from '../src/provider-deployment.mjs';
import { loadInstallation } from '../src/provider-installation-config.mjs';
import { checkProviderConnectionConfig, loadProviderConnectionConfig } from '../src/provider-connection-config.mjs';
import { assertInstallationConnection } from '../src/provider-reference-handoff.mjs';
import { createProviderOnboarding, runProviderGuide, renderProviderStatus } from '../src/provider-onboarding.mjs';
const ui=terminal();
async function createConfig(directory, source, installationPath) {
  const dir=resolve(directory), repository=fileURLToPath(new URL('..',import.meta.url));
  if(!relative(repository,dir).startsWith('../')) throw new Error('Use a private directory outside the Agent repository');
  await mkdir(dir,{recursive:true,mode:0o700}); await privateDirectory(dir);
  const path=join(dir,'connection.env');
  const installed=installationPath?await loadInstallation(resolve(installationPath)):null;
  if(await privateText(path,true)!==null) {
    const connection=await loadProviderConnectionConfig(path);
    if(installed){
      const text=await privateText(`${path}.reference.json`,true);
      assertInstallationConnection({installationPath:resolve(installationPath),installation:installed,
        reference:text===null?null:JSON.parse(text),connection});
    }
    if(source){
      const deployment=await loadProviderDeployment(source);
      if(connection.MARKET_BASE_URL!==deployment.marketUrl||connection.SETTLEMENT_BASE_URL!==deployment.settlementUrl||
         connection.AGENT_NATIVE_NETWORK!==deployment.network||connection.AGENT_NATIVE_ASSET.toLowerCase()!==deployment.assetAddress.toLowerCase())
        throw new Error('This connection uses a different platform. Use a separate connection directory; the existing connection was kept.');
    }
    return path;
  }
  ui.heading('Connect your service to AgentPay');
  ui.write('Your service should already be installed and running. This guide handles account binding and service registration.');
  source ||= await ui.ask("Enter the public platform config file/HTTPS URL, or 'q' to quit");
  if(source==='q') throw new Error('Connection setup cancelled');
  const deployment=await loadProviderDeployment(source);
  ui.write(`Platform settings supplied automatically: ${deployment.network}, ${deployment.tokenSymbol}.`);
  if(deployment.mode==='private-anvil') ui.write('Private same-host Anvil rehearsal. No real funds.');
  const draftPath=`${path}.draft.json`, prior=await privateText(draftPath,true);
  const draft=prior===null?{version:1,deployment,fields:{}}:JSON.parse(prior);
  const fields=['MARKET_EMAIL','AGENT_PROD_SERVICE_ID','AGENT_MCP_ENDPOINT','AGENT_PROVIDER_CONTROL_URL'];
  if(draft.version!==1||JSON.stringify(draft.deployment)!==JSON.stringify(deployment)||!draft.fields||
    Object.entries(draft.fields).some(([key,value])=>!fields.includes(key)||typeof value!=='string')) throw new Error('Invalid or mismatched connection draft; restore the original public config.');
  const env={MARKET_BASE_URL:deployment.marketUrl,SETTLEMENT_BASE_URL:deployment.settlementUrl,
    AGENT_NATIVE_NETWORK:deployment.network,AGENT_NATIVE_ASSET:deployment.assetAddress,
    MARKET_SESSION_TOKEN_FILE:join(dir,'market-session.token'),AGENT_PROVIDER_BINDING_STATE_FILE:join(dir,'binding.json'),AGENT_PROVIDER_BINDING_CREDENTIAL_FILE:join(dir,'provider.token')};
  async function field(key,prompt,fallback='') {
    fallback=draft.fields[key]||fallback;
    while(true){
      const answer=await ui.ask(`${prompt}${fallback?` (Enter keeps '${fallback}')`:''}; 'q' quits`);
      if(answer==='q') throw new Error('Connection setup cancelled; non-secret answers are saved');
      const value=answer||fallback;
      if(!value||/[\r\n\0]/.test(value)){ui.write('Enter the requested value.');continue;}
      if(key==='AGENT_PROD_SERVICE_ID'&&!/^[A-Za-z0-9._-]{1,120}$/.test(value)){ui.write('Use letters, numbers, dots, underscores or hyphens.');continue;}
      if(key.endsWith('URL')||key==='AGENT_MCP_ENDPOINT'){
        try{const url=new URL(value);if(url.username||url.password||url.search||url.hash||!['http:','https:'].includes(url.protocol))throw new Error();if(key==='AGENT_MCP_ENDPOINT')providerBaseForEndpoint(value,env.AGENT_PROD_SERVICE_ID);if(key==='AGENT_PROVIDER_CONTROL_URL'&&(!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.pathname!=='/'))throw new Error();}
        catch{ui.write('Enter a clean HTTP(S) address from your service configuration.');continue;}
      }
      env[key]=value; draft.fields[key]=value;
      await savePrivate(draftPath,JSON.stringify(draft)+'\n');return;
    }
  }
  ui.heading('Account and existing service');
  ui.write(deployment.registrationUrl?`Need an account? Register at ${deployment.registrationUrl}`:`Need an account? Contact ${deployment.supportContact||'the Market operator who supplied this public configuration'}.`);
  await field('MARKET_EMAIL','Your existing Market account email');
  if(installed){env.AGENT_PROD_SERVICE_ID=installed.SERVICE_ID;ui.write(`Service name read from your installation: ${installed.SERVICE_ID}`);}
  else await field('AGENT_PROD_SERVICE_ID','Service name from your running server',deployment.rehearsal?.serviceId||'');
  const localOrigin=installed?`http://127.0.0.1:${installed.PORT}`:deployment.rehearsal?`http://127.0.0.1:${deployment.rehearsal.port}`:'';
  const defaultOrigin=deployment.mode==='private-anvil'?localOrigin:'';
  ui.write('Use the endpoint of the service you already run. This step does not allocate a port or install a server.');
  ui.write('Use the public service address reached by Agents and Settlement, including its path prefix. Local control stays on this computer.');
  await field('AGENT_MCP_ENDPOINT','Service MCP invoke URL',defaultOrigin?`${defaultOrigin}/services/${encodeURIComponent(env.AGENT_PROD_SERVICE_ID)}/mcp/invoke`:'');
  if(installed) env.AGENT_PROVIDER_CONTROL_URL=localOrigin;
  else await field('AGENT_PROVIDER_CONTROL_URL','Your server control origin on this machine',localOrigin);
  checkProviderConnectionConfig(env);
  ui.heading('Save AgentPay connection');
  ui.write(`Service: ${env.AGENT_PROD_SERVICE_ID}\nEndpoint: ${env.AGENT_MCP_ENDPOINT}\nConnection file: ${path}`);
  if(await ui.ask("Type 'save' to continue, or 'q' to quit")!=='save') throw new Error('Connection setup cancelled');
  await savePrivate(`${path}.deployment.json`,JSON.stringify(deployment,null,2)+'\n');
  if(installed) await savePrivate(`${path}.reference.json`,JSON.stringify({version:1,installationPath:resolve(installationPath)})+'\n');
  await savePrivate(path,encodeConfig(env),{create:true}); await rm(draftPath,{force:true}); return path;
}
let lock;
try {
  const args=process.argv.slice(2);let source,installationPath;
  const i=args.indexOf('--deployment');if(i!==-1){source=args[i+1];if(!source)throw new Error('--deployment requires a public file/URL');args.splice(i,2);}
  const j=args.indexOf('--installation');if(j!==-1){installationPath=args[j+1];if(!installationPath)throw new Error('--installation requires your installation.env path');args.splice(j,2);}
  if(!args.length||args.length>2||(args[0]==='--new'&&args.length!==2)||(args[0]!=='--new'&&args[1]&&args[1]!=='--status')) throw new Error('Usage: provider-setup.mjs CONNECTION_CONFIG [--status] | --new PRIVATE_DIRECTORY [--deployment PUBLIC_CONFIG] [--installation INSTALL_CONFIG]');
  if(installationPath&&args[0]!=='--new') throw new Error('--installation is only used when creating a new connection');
  if(source&&args[0]!=='--new') throw new Error('--deployment is only used when creating a new connection');
  const path=args[0]==='--new'?await createConfig(args[1],source,installationPath):resolve(args[0]);
  const ops=await createProviderOnboarding(path);
  if(args[1]==='--status'){const state=await ops.inspect();renderProviderStatus(ui,state);process.exitCode=state.complete?0:2;}
  else{
    await privateDirectory(dirname(path));lock=`${path}.guide.lock`;
    try{await writeFile(lock,String(process.pid)+'\n',{flag:'wx',mode:0o600});}
    catch(error){lock=null;throw new Error('Connection guide is already active, or its lock needs owner inspection.');}
    await runProviderGuide(ops,ui);
  }
}catch(error){ui.write(`AgentPay connection paused: ${error.message}`);process.exitCode=1;}
finally{if(lock)await rm(lock,{force:true});}
