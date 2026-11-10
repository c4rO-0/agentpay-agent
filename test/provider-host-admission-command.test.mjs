import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {parseEnv} from 'node:util';
import {hashServiceProfile} from '@c4roa0/agentpay-protocol';
import {encodeConfig} from '../src/provider-private-files.mjs';
import {saveProviderBinding} from '../src/provider-binding-state.mjs';
import {resolveProviderRuntimeEnvironment} from '../src/provider-runtime-environment.mjs';

test('official host configure denies blocked service, preserves identity and enables only after public checks',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-admit-cli-'));let ready=false,wrong=false,profile,prepared;
 const server=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://fixture');const ok=result=>{res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,result}));};
  if(url.pathname.endsWith('/credentials/me'))return ok({providerId:profile.providerId,credentialId:wrong?'wrong':'credential',endpointUrl:profile.mcpEndpoint.replace(/\/invoke$/,''),credentialStatus:'active'});
  if(url.pathname.endsWith('/agentpay/invoke')){res.writeHead(402,{'content-type':'application/json'});return res.end(JSON.stringify({version:'agentpay.service-payment-required.v1',resource:{url:profile.paymentEndpoint,method:'POST'},requirement:{skillId:prepared.env.AGENT_NATIVE_SKILL_ID,profileHash:hashServiceProfile(profile),seller:profile.seller,asset:profile.asset,network:profile.network}}));}
  if(url.pathname.endsWith('/services/read'))return ok({registered:true,profile,serviceStatus:{qualification:{qualificationStatus:'qualified'},quote:{quoteStatus:'fresh'}}});
  if(url.pathname.endsWith('/purchase-readiness'))return ok({commercialReady:ready,blockers:ready?[]:['SERVICE_RESTRICTED']});
  if(url.pathname==='/health')return ok({serviceId:'example',nativeProvider:{enabled:true,admissionState:'pre_admission',route:'/services/example/agentpay/invoke'}});
  if(url.pathname.endsWith('/display'))return ok({name:'Example'});
  res.writeHead(404);res.end();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`,cfg=join(dir,'host.env');
 async function run(){
  const child=spawn(process.execPath,[fileURLToPath(new URL('../scripts/provider-host.mjs',import.meta.url)),cfg,'configure'],{stdio:['ignore','pipe','pipe']});let output='';
  child.stdout.on('data',c=>output+=c);child.stderr.on('data',c=>output+=c);
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve);});
  assert.equal(output.includes('fixture-secret-token'),false);return {code,body:JSON.parse(output)};
 }
 try{
  const env={MARKET_BASE_URL:base,SETTLEMENT_BASE_URL:base,AGENT_PROD_SERVICE_ID:'example',AGENT_PROD_KIND:'random',AGENT_PROD_HOST:'127.0.0.1',AGENT_PROD_PORT:String(server.address().port),AGENT_PUBLIC_BASE_URL:base,AGENTPAY_NATIVE_PROVIDER_ENABLED:'true',AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE:'pre_admission',MARKET_SESSION_TOKEN_FILE:join(dir,'session'),AGENT_PROVIDER_BINDING_STATE_FILE:join(dir,'binding'),AGENT_PROVIDER_BINDING_CREDENTIAL_FILE:join(dir,'token'),AGENT_PROVIDER_CREDENTIAL_FILE:join(dir,'token'),AGENT_PROVIDER_SERVICE_STATE_FILE:join(dir,'service'),AGENT_NATIVE_NETWORK:'eip155:31337',AGENT_NATIVE_ASSET:'0x'+'1'.repeat(40),AGENT_NATIVE_SELLER:'0x'+'2'.repeat(40),AGENT_NATIVE_BASE_AMOUNT:'1',AGENT_NATIVE_UNIT_PRICE:'1',AGENT_NATIVE_MAX_USAGE_UNITS:'1',AGENT_NATIVE_QUOTE_TTL_SECONDS:'600',AGENT_PROVIDER_DB_HOST:'127.0.0.1',AGENT_PROVIDER_DB_PORT:'3306',AGENT_PROVIDER_DB_USER:'fixture',AGENT_PROVIDER_DB_NAME:'fixture'};
  profile={version:'agentpay.service-profile.v1',providerId:'provider:fixture',serviceId:'example',mcpEndpoint:base+'/services/example/mcp/invoke',paymentEndpoint:base+'/services/example/agentpay/invoke',seller:env.AGENT_NATIVE_SELLER,asset:env.AGENT_NATIVE_ASSET,network:env.AGENT_NATIVE_NETWORK};
  await writeFile(env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,'fixture-secret-token',{mode:0o600});
  await saveProviderBinding(env.AGENT_PROVIDER_BINDING_STATE_FILE,{providerId:profile.providerId,credentialId:'credential',endpointUrl:profile.mcpEndpoint.replace(/\/invoke$/,''),status:'verified'});
  prepared=await resolveProviderRuntimeEnvironment(env,{prepare:true});
  await writeFile(cfg,encodeConfig(env),{mode:0o600});const original=await readFile(cfg,'utf8'),identity=await readFile(env.AGENT_PROVIDER_SERVICE_STATE_FILE,'utf8');
  assert.equal((await run()).code,1);assert.equal(await readFile(cfg,'utf8'),original);
  ready=true;wrong=true;assert.equal((await run()).code,1);assert.equal(await readFile(cfg,'utf8'),original);
  wrong=false;const enabled=await run();assert.equal(enabled.code,0);assert.equal(enabled.body.changed,true);
  assert.deepEqual(parseEnv(await readFile(cfg,'utf8')),{...env,AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE:'admitted'});
  assert.equal(await readFile(env.AGENT_PROVIDER_SERVICE_STATE_FILE,'utf8'),identity);
  const again=await run();assert.equal(again.code,0);assert.equal(again.body.changed,false);
 }finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
});
