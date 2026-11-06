import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import mysql from 'mysql2/promise';
import {hashServiceProfile} from '@agentpay/types';
import {providerServiceUrls,providerBaseForEndpoint} from '../src/provider-service-urls.mjs';
import {createProviderBindingRuntime} from '../src/provider-binding-runtime.mjs';
import {createNativeProviderRuntime} from '../src/native-provider-runtime.mjs';
import {checkProviderConnectionConfig} from '../src/provider-connection-config.mjs';
import {serviceReference} from '../src/service-reference.mjs';
import {randomNativeApplication} from '../src/services/random-native.mjs';

const publicBase='https://platform.example/provider',serviceId='random',b32=n=>'0x'+n.repeat(64);
test('public/local endpoints agree on service identity without changing the listener',()=>{
 const urls=providerServiceUrls(publicBase,serviceId);
 assert.equal(urls.localMcpPath,'/services/random/mcp');
 assert.equal(urls.publicMcpPath,'/provider/services/random/mcp');
 assert.equal(urls.paymentEndpoint,'https://platform.example/provider/services/random/agentpay/invoke');
 assert.equal(providerBaseForEndpoint(urls.mcpEndpoint,serviceId),publicBase);
 const profile={version:'agentpay.service-profile.v1',providerId:'provider:test',serviceId,mcpEndpoint:urls.mcpEndpoint,paymentEndpoint:urls.paymentEndpoint,seller:'0x'+'1'.repeat(40),network:'eip155:31337',asset:'0x'+'2'.repeat(40)};
 const other=providerServiceUrls('https://platform.example',serviceId);
 assert.notEqual(hashServiceProfile(profile),hashServiceProfile({...profile,mcpEndpoint:other.mcpEndpoint,paymentEndpoint:other.paymentEndpoint}));
 const env={MARKET_BASE_URL:'https://platform.example/market',SETTLEMENT_BASE_URL:'https://platform.example/settlement',MARKET_EMAIL:'test@example.invalid',MARKET_SESSION_TOKEN_FILE:'/private/session',AGENT_PROD_SERVICE_ID:serviceId,AGENT_MCP_ENDPOINT:urls.mcpEndpoint,AGENT_PROVIDER_CONTROL_URL:'http://127.0.0.1:6571',AGENT_PROVIDER_BINDING_STATE_FILE:'/private/binding',AGENT_PROVIDER_BINDING_CREDENTIAL_FILE:'/private/credential',AGENT_NATIVE_NETWORK:profile.network,AGENT_NATIVE_ASSET:profile.asset};
 assert.equal(checkProviderConnectionConfig(env).AGENT_MCP_ENDPOINT,urls.mcpEndpoint);
 assert.throws(()=>checkProviderConnectionConfig({...env,AGENT_PROVIDER_CONTROL_URL:publicBase}));
 const skill=serviceReference({skillId:b32('3'),profileHash:hashServiceProfile(profile),profile});
 assert.equal(skill.profile.paymentEndpoint,urls.paymentEndpoint);
 assert.throws(()=>serviceReference({...skill,profile:{...profile,paymentEndpoint:urls.paymentEndpoint+'?key=secret'}}));
});
test('endpoint proof matches the public prefix but is served on the rewritten local path',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-prefix-proof-'));try{
 const credentialFile=join(dir,'credential');await writeFile(credentialFile,'test-credential',{mode:0o600});
 const urls=providerServiceUrls(publicBase,serviceId),id='provider_challenge_'+'a'.repeat(32);let wrongPrefix=false;
 const runtime=await createProviderBindingRuntime({endpointPath:urls.localMcpPath,publicEndpointPath:urls.publicMcpPath,settlementBaseUrl:'https://platform.example/settlement',credentialFile,
 fetchImpl:async(url,options)=>{assert.equal(url,'https://platform.example/settlement/agentpay/provider/bindings/challenges/authorize');assert.equal(options.headers.authorization,'Bearer test-credential');return Response.json({ok:true,result:{challengeResponse:'proof-response',expiresAtMs:Date.now()+60000,challengeUrl:'https://platform.example'+(wrongPrefix?urls.localMcpPath:urls.publicMcpPath)+'/.well-known/agentpay/provider-binding/'+id}});}});
 async function request(method,path){let status,body,text;const res={setHeader(){},writeHead(code){status=code;},end(value){text=value;}};const handled=await runtime.handle({method,headers:{authorization:'Bearer test-credential'}},res,new URL(path,'http://127.0.0.1'),{readJson:async()=>({challengeId:id}),json(_res,code,value){status=code;body=value;}});return {status,body,text,handled};}
 assert.equal((await request('POST','/internal/agentpay/provider-binding/authorize')).status,200);
 assert.equal((await request('GET',urls.localMcpPath+'/.well-known/agentpay/provider-binding/'+id)).text,'proof-response');
 assert.equal((await request('GET','/internal/agentpay/provider-binding/status')).body.result.endpointPath,urls.publicMcpPath);
 assert.equal((await request('GET',urls.publicMcpPath+'/.well-known/agentpay/provider-binding/'+id)).handled,false,'public prefix is removed by nginx, not a second app route');
 wrongPrefix=true;assert.equal((await request('POST','/internal/agentpay/provider-binding/authorize')).body.error.code,'BINDING_ENDPOINT_MISMATCH');
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('native pre-admission uses public quote/health paths while local handlers retain no-prefix routes',async t=>{
 const env={AGENTPAY_NATIVE_PROVIDER_ENABLED:'true',AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE:'pre_admission',AGENT_NATIVE_NETWORK:'eip155:31337',AGENT_PROVIDER_DB_USER:'fixture',AGENT_PROVIDER_DB_NAME:'fixture',AGENT_NATIVE_ASSET:'0x'+'2'.repeat(40),AGENT_NATIVE_SKILL_ID:b32('3'),AGENT_NATIVE_PROFILE_HASH:b32('4'),AGENT_NATIVE_SELLER:'0x'+'1'.repeat(40),AGENT_NATIVE_OFFER_ID:b32('5'),AGENT_NATIVE_QUOTE_TTL_SECONDS:'600'};
 const prior={...process.env};Object.assign(process.env,env);delete process.env.AGENT_NATIVE_VALID_UNTIL;
 t.after(()=>{for(const key of Object.keys(env))prior[key]===undefined?delete process.env[key]:process.env[key]=prior[key];if(prior.AGENT_NATIVE_VALID_UNTIL!==undefined)process.env.AGENT_NATIVE_VALID_UNTIL=prior.AGENT_NATIVE_VALID_UNTIL;});
 const statements=[];t.mock.method(mysql,'createPool',()=>({query:async sql=>{statements.push(sql);return [[],[]];},end:async()=>{}}));
 const runtime=await createNativeProviderRuntime({application:randomNativeApplication,serviceId,settlementBaseUrl:'https://platform.example/settlement',publicBaseUrl:publicBase});t.after(()=>runtime.close());
 const urls=providerServiceUrls(publicBase,serviceId);assert.equal(runtime.health.route,urls.publicPaymentPath);
 async function invoke(headers){let status,body;await runtime.handle({method:'POST',headers},{},new URL(urls.localPaymentPath,'http://127.0.0.1'),{json(_res,code,value){status=code;body=value;}});return {status,body};}
 const quote=await invoke({});assert.equal(quote.status,402);assert.equal(quote.body.resource.url,urls.paymentEndpoint);
 assert.equal((await invoke({authorization:'Bearer invented-payment'})).status,403);
 assert.equal(statements.some(sql=>sql.includes('INSERT INTO agentpay_provider_executions')),false,'unpaid requests did not execute a service');
});
test('changing a public prefix cannot overwrite an existing local service identity',async()=>{
 const {prepareProviderServiceState}=await import('../src/provider-service-state.mjs');
 const {readFile}=await import('node:fs/promises');
 const dir=await mkdtemp(join(tmpdir(),'provider-prefix-identity-'));try{
  const file=join(dir,'service.json');
  const env={AGENT_PROD_SERVICE_ID:serviceId,AGENT_MCP_ENDPOINT:'https://platform.example/services/random/mcp/invoke',AGENT_NATIVE_PROFILE_HASH:b32('1'),AGENT_NATIVE_ASSET:'0x'+'2'.repeat(40),AGENT_NATIVE_SELLER:'0x'+'3'.repeat(40),AGENT_NATIVE_NETWORK:'eip155:31337',AGENT_NATIVE_BASE_AMOUNT:'0',AGENT_NATIVE_UNIT_PRICE:'1',AGENT_NATIVE_MAX_USAGE_UNITS:'1'};
  await prepareProviderServiceState(file,env);const before=await readFile(file,'utf8');
  await assert.rejects(prepareProviderServiceState(file,{...env,AGENT_MCP_ENDPOINT:providerServiceUrls(publicBase,serviceId).mcpEndpoint}),/another endpoint/);
  assert.equal(await readFile(file,'utf8'),before);
 }finally{await rm(dir,{recursive:true,force:true});}
});
