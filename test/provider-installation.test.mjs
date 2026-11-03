import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createServer} from 'node:net';
import {createProviderInstallation} from '../src/provider-installation.mjs';
import {encodeConfig} from '../src/provider-private-files.mjs';
import {saveProviderBinding} from '../src/provider-binding-state.mjs';
import {checkInstallation} from '../src/provider-installation-config.mjs';
const ok=result=>new Response(JSON.stringify({ok:true,result}));
const screen=answers=>({text:[],write(s){this.text.push(s);},heading(s){this.text.push(s);},async ask(){assert.ok(answers.length,'unexpected prompt');return answers.shift();}});
async function setup(){
 const dir=await mkdtemp(join(tmpdir(),'provider-install-test-')),path=join(dir,'installation.env');
 await writeFile(join(dir,'storage.env'),encodeConfig({AGENT_PROVIDER_DB_HOST:'127.0.0.1',AGENT_PROVIDER_DB_PORT:'3306',AGENT_PROVIDER_DB_NAME:'own_execution',AGENT_PROVIDER_DB_USER:'own_user',AGENT_PROVIDER_DB_PASSWORD:'DB_SECRET'}),{mode:0o600});
 await writeFile(path,encodeConfig({SERVICE_ID:'random',PORT:'6584'}),{mode:0o600});
 const connectionPath=join(dir,'connection.env');
 const connection={MARKET_BASE_URL:'https://market.example',SETTLEMENT_BASE_URL:'https://settlement.example',MARKET_EMAIL:'provider@example.com',
 MARKET_SESSION_TOKEN_FILE:join(dir,'session'),AGENT_PROD_SERVICE_ID:'random',AGENT_MCP_ENDPOINT:'https://provider.example/services/random/mcp/invoke',
 AGENT_PROVIDER_CONTROL_URL:'http://127.0.0.1:6584',AGENT_PROVIDER_BINDING_STATE_FILE:join(dir,'binding.json'),AGENT_PROVIDER_BINDING_CREDENTIAL_FILE:join(dir,'credential'),AGENT_NATIVE_NETWORK:'eip155:31337',AGENT_NATIVE_ASSET:`0x${'1'.repeat(40)}`};
 await writeFile(connectionPath,encodeConfig(connection),{mode:0o600});
 await writeFile(connection.MARKET_SESSION_TOKEN_FILE,'SESSION_SECRET',{mode:0o600});
 await writeFile(connection.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,'CONTROL_SECRET',{mode:0o600});
 await writeFile(`${connectionPath}.deployment.json`,JSON.stringify({version:1,mode:'private-anvil',marketUrl:connection.MARKET_BASE_URL,settlementUrl:connection.SETTLEMENT_BASE_URL,
 network:connection.AGENT_NATIVE_NETWORK,assetAddress:connection.AGENT_NATIVE_ASSET,tokenDecimals:6,tokenSymbol:'rUSDC',rehearsal:{serviceId:'random',port:6584,payoutAddress:`0x${'2'.repeat(40)}`}}),{mode:0o600});
 let live=null,qualified=false,offline=false,dbDown=false,failLoad=false;const requests=[];const starts=[];
 const fetchImpl=async(input,init={})=>{
  const url=new URL(input);requests.push(url.pathname);
  if(url.pathname==='/health')return live?ok({serviceId:'random',nativeProvider:{enabled:true,route:'/services/random/agentpay/invoke',skillId:live.AGENT_NATIVE_SKILL_ID,profileHash:live.AGENT_NATIVE_PROFILE_HASH,admissionState:live.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE}}):new Response('{}',{status:503});
  if(url.pathname==='/internal/agentpay/provider-binding/status')return ok({endpointPath:'/services/random/mcp',credentialLoaded:true,paidCredentialMatches:live?.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE==='admitted'});
  if(offline)throw new Error('API unavailable');
  if(url.pathname==='/developers/me/provider-binding')return ok({binding:{providerId:'provider:market:account',credentialId:'cred',endpointUrl:'https://provider.example/services/random/mcp',status:'pending'},credential:{credentialId:'cred',credentialStatus:'active'}});
  if(url.pathname.endsWith('/credentials/me'))return ok({providerId:'provider:market:account',credentialId:'cred',endpointUrl:'https://provider.example/services/random/mcp',credentialStatus:'active'});
  if(url.pathname.endsWith('/services/read'))return ok({registered:qualified,profile:qualified?{version:'agentpay.service-profile.v1',providerId:'provider:market:account',serviceId:'random',mcpEndpoint:connection.AGENT_MCP_ENDPOINT,paymentEndpoint:'https://provider.example/services/random/agentpay/invoke',seller:`0x${'2'.repeat(40)}`,network:connection.AGENT_NATIVE_NETWORK,asset:connection.AGENT_NATIVE_ASSET}:null,serviceStatus:{qualification:{qualificationStatus:qualified?'qualified':'not_qualified'},quote:{quoteStatus:'fresh'}}});
  if(url.pathname==='/agentpay/purchase-readiness')return ok({commercialReady:qualified,blockers:[]});
  throw new Error(`unexpected ${url.pathname}`);
 };
 const manager={logFile:join(dir,'process.log'),async ensure(env,{ready}){starts.push({...env});if(failLoad)throw new Error('runtime reload failed');live={...env};assert.equal(await ready(),true);},async stop(){}};
 const databaseCheck=async()=>dbDown?{ok:false,code:'ER_BAD_DB_ERROR',message:'Provision your own execution database'}:{ok:true};
 const ops=await createProviderInstallation(path,{fetchImpl,manager,databaseCheck});
 return {dir,path,connectionPath,connection,ops,starts,requests,setQualified(){qualified=true;},offline(){offline=true;},dbDown(){dbDown=true;},failLoad(){failLoad=true;},recover(){failLoad=false;},async binding(){await saveProviderBinding(connection.AGENT_PROVIDER_BINDING_STATE_FILE,{status:'verified',providerId:'provider:market:account',credentialId:'cred',endpointUrl:'https://provider.example/services/random/mcp'});},cleanup:()=>rm(dir,{recursive:true,force:true})};
}
const answers=()=>['','0.6','0.1',''];
test('reference application config owns SQL/prices, starts pre-admission and preserves identity after B1',async()=>{
 const f=await setup();try{
  const before=await readFile(f.connectionPath,'utf8'),ui=screen(answers());const first=await f.ops.configure(f.connectionPath,ui);
  assert.equal(first.env.AGENT_NATIVE_BASE_AMOUNT,'600000');assert.equal(first.env.AGENT_NATIVE_UNIT_PRICE,'100000');assert.equal(first.bindingPresent,false);
  assert.equal(first.env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE,'pre_admission');assert.doesNotMatch(ui.text.join('\n'),/DB_SECRET|CONTROL_SECRET/);
  assert.deepEqual(f.requests.filter(p=>p.startsWith('/agentpay/')),[]);
  await f.binding();const second=await f.ops.configure(f.connectionPath,screen([]));
  assert.equal(second.env.AGENT_NATIVE_SKILL_ID,first.env.AGENT_NATIVE_SKILL_ID);assert.notEqual(second.env.AGENT_NATIVE_PROFILE_HASH,first.env.AGENT_NATIVE_PROFILE_HASH);assert.notEqual(second.env.AGENT_NATIVE_OFFER_ID,first.env.AGENT_NATIVE_OFFER_ID);
  assert.equal(await readFile(f.connectionPath,'utf8'),before);assert.equal(second.env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE,'pre_admission');
 }finally{await f.cleanup();}
});
test('application reload SQL failure asks no database questions and attempts no platform write',async()=>{
 const f=await setup();try{
  f.dbDown();const ui=screen(answers());await assert.rejects(f.ops.configure(f.connectionPath,ui),/ER_BAD_DB_ERROR/);
  assert.equal(f.starts.length,0);assert.deepEqual(f.requests,[]);assert.doesNotMatch(ui.text.join('\n'),/Your MySQL|database password|database login/);
 }finally{await f.cleanup();}
});
test('unknown platform state and lost existing identity never enable or replace paid service',async()=>{
 const f=await setup();try{
  await f.ops.configure(f.connectionPath,screen(answers()));await f.binding();f.offline();
  await assert.rejects(f.ops.configure(f.connectionPath,screen([])),/API unavailable/);assert.equal(f.starts.length,1);
  await rm(join(f.dir,'service.json'));await assert.rejects(f.ops.configure(f.connectionPath,screen([])),/identity is missing/);assert.equal(f.starts.length,1);
 }finally{await f.cleanup();}
});
test('reload failure keeps application config, connection progress and retryable service identity',async()=>{
 const f=await setup();try{
  f.failLoad();await assert.rejects(f.ops.configure(f.connectionPath,screen(answers())),/reload failed/);
  const state=JSON.parse(await readFile(join(f.dir,'service.json'),'utf8'));f.recover();const result=await f.ops.configure(f.connectionPath,screen([]));
  assert.equal(result.env.AGENT_NATIVE_SKILL_ID,state.skillId);assert.equal(result.env.AGENT_NATIVE_OFFER_ID,state.offerId);
 }finally{await f.cleanup();}
});

test('only qualified registered fresh service enables local paid admission; repeated config keeps identity and price',async()=>{
 const f=await setup();try{
  await f.ops.configure(f.connectionPath,screen(answers()));await f.binding();const before=await f.ops.configure(f.connectionPath,screen([]));
  f.setQualified();const after=await f.ops.configure(f.connectionPath,screen([]));
  assert.equal(after.env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE,'admitted');
  assert.equal(after.env.AGENT_NATIVE_SKILL_ID,before.env.AGENT_NATIVE_SKILL_ID);assert.equal(after.env.AGENT_NATIVE_OFFER_ID,before.env.AGENT_NATIVE_OFFER_ID);
  assert.equal(after.env.AGENT_NATIVE_BASE_AMOUNT,before.env.AGENT_NATIVE_BASE_AMOUNT);
  await f.ops.configure(f.connectionPath,screen([]));assert.equal(f.starts.at(-1).AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE,'admitted');
 }finally{await f.cleanup();}
});
test('qualified Registry with failed application reload is explicit and retries without new identity',async()=>{
 const f=await setup();try{
  await f.ops.configure(f.connectionPath,screen(answers()));await f.binding();await f.ops.configure(f.connectionPath,screen([]));
  f.setQualified();f.failLoad();const ui=screen([]);await assert.rejects(f.ops.configure(f.connectionPath,ui),/reload failed/);
  assert.match(ui.text.join('\n'),/Registry qualification is confirmed, but Provider local preparation failed/);
  const state=JSON.parse(await readFile(join(f.dir,'service.json'),'utf8'));f.recover();const after=await f.ops.configure(f.connectionPath,screen([]));
  assert.equal(after.env.AGENT_NATIVE_SKILL_ID,state.skillId);assert.equal(after.env.AGENT_NATIVE_OFFER_ID,state.offerId);assert.equal(after.env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE,'admitted');
 }finally{await f.cleanup();}
});
test('installation config cannot carry platform/SQL/paid settings',()=>{
 assert.deepEqual(checkInstallation({SERVICE_ID:'random',PORT:'6584'}),{SERVICE_ID:'random',PORT:'6584'});
 for(const extra of [{AGENT_PROVIDER_DB_NAME:'sql'},{MARKET_BASE_URL:'https://market.example'},{PORT:'0'},{SERVICE_ID:'random/path'}])assert.throws(()=>checkInstallation({SERVICE_ID:'random',PORT:'6584',...extra}));
});
test('connection cannot prepare missing application storage or treat running stub as installed',async()=>{
 const f=await setup();try{
  await rm(join(f.dir,'storage.env'));await assert.rejects(f.ops.configure(f.connectionPath,screen([])),/installation is incomplete/);
  await assert.rejects(f.ops.startLocal(),/installation is incomplete/);assert.equal(f.starts.length,0);assert.deepEqual(f.requests,[]);
 }finally{await f.cleanup();}
});

test('pre-admission reload accepts only confirmed matching pending credential path; keeps identity and storage',async()=>{
 const f=await setup();try{
  const before=await f.ops.configure(f.connectionPath,screen(answers()));
  const replacement=join(f.dir,'replacement');await writeFile(replacement,'NEW_SECRET',{mode:0o600});
  await writeFile(f.connectionPath,encodeConfig({...f.connection,AGENT_PROVIDER_BINDING_CREDENTIAL_FILE:replacement}),{mode:0o600});
  assert.deepEqual(await f.ops.configure(f.connectionPath,screen(['q'])),{cancelled:true});assert.equal(f.starts.length,1);
  const after=await f.ops.configure(f.connectionPath,screen(['confirm']));
  assert.equal(after.env.AGENT_PROVIDER_CREDENTIAL_FILE,replacement);
  for(const key of ['AGENT_NATIVE_SKILL_ID','AGENT_NATIVE_OFFER_ID','AGENT_PROVIDER_DB_NAME','AGENT_NATIVE_BASE_AMOUNT'])assert.equal(after.env[key],before.env[key]);
  await writeFile(f.connectionPath,encodeConfig({...f.connection,MARKET_EMAIL:'other@example.com'}),{mode:0o600});
  await assert.rejects(f.ops.configure(f.connectionPath,screen([])),/Runtime connection changed/);
 }finally{await f.cleanup();}
});
