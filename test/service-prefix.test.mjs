import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {serviceBase,serviceUrl,providerBase} from '../src/service-url.mjs';
import {providerServiceUrls} from '../src/provider-service-urls.mjs';
import {createMarketSession} from '../src/provider-market-session.mjs';
import {createProviderBindingClient} from '../src/provider-binding-client.mjs';
import {validateProviderDeployment} from '../src/provider-deployment.mjs';
import {checkProviderConnectionConfig} from '../src/provider-connection-config.mjs';

test('deployment and connection retain service prefixes while control stays local',()=>{
 const deployment=validateProviderDeployment({version:1,mode:'private-anvil',marketUrl:'https://platform.test/market/',settlementUrl:'https://platform.test/settlement/',network:'eip155:31337',assetAddress:'0x'+'1'.repeat(40),tokenDecimals:6,tokenSymbol:'rUSDC'});
 assert.equal(deployment.marketUrl,'https://platform.test/market');assert.equal(deployment.settlementUrl,'https://platform.test/settlement');
 const env={MARKET_BASE_URL:deployment.marketUrl,SETTLEMENT_BASE_URL:deployment.settlementUrl,MARKET_EMAIL:'p@test.invalid',MARKET_SESSION_TOKEN_FILE:'/private/session',AGENT_PROD_SERVICE_ID:'random',AGENT_MCP_ENDPOINT:'https://provider.test/services/random/mcp/invoke',AGENT_PROVIDER_CONTROL_URL:'http://127.0.0.1:6571',AGENT_PROVIDER_BINDING_STATE_FILE:'/private/binding',AGENT_PROVIDER_BINDING_CREDENTIAL_FILE:'/private/token',AGENT_NATIVE_NETWORK:deployment.network,AGENT_NATIVE_ASSET:deployment.assetAddress};
 assert.equal(checkProviderConnectionConfig(env).SETTLEMENT_BASE_URL,deployment.settlementUrl);
 assert.throws(()=>checkProviderConnectionConfig({...env,AGENT_PROVIDER_CONTROL_URL:'https://platform.test/provider'}));
 assert.throws(()=>checkProviderConnectionConfig({...env,AGENT_PROVIDER_CONTROL_URL:'http://127.0.0.1:18080/provider'}));
 for(const bad of ['https://u:p@platform.test/market','http://remote.test/market','https://platform.test/market/../internal','https://platform.test/market%2finternal'])assert.throws(()=>serviceBase(bad));
 assert.equal(serviceUrl(deployment.marketUrl,'/developers/me').href,'https://platform.test/market/developers/me');
});
test('real account and binding clients preserve prefixed paths and bearer credentials',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-prefix-'));try{
 const session=join(dir,'session'),credentialFile=join(dir,'credential'),bindingStateFile=join(dir,'binding');
 const calls=[];const response=result=>Response.json({ok:true,result});
 const fetchImpl=async(url,init)=>{
  calls.push([String(url),init.headers.authorization]);
  assert.equal(init.redirect,'error');
  switch(new URL(url).pathname){
   case '/market/developers/login':return response({sessionToken:'session-test',developer:{id:'owner',email:'p@test.invalid'}});
   case '/market/developers/me':return response({developer:{id:'owner',email:'p@test.invalid'}});
   case '/market/developers/me/provider-binding':return response({binding:null,credential:null});
   case '/settlement/agentpay/provider/bindings/credentials/me':return response({providerId:'provider:test',credentialId:'credential-test',credentialStatus:'active'});
   default:throw Error('Prefix lost: '+String(url));
  }
 };
 const market=createMarketSession({env:{MARKET_BASE_URL:'https://platform.test/market',MARKET_SESSION_TOKEN_FILE:session,MARKET_EMAIL:'p@test.invalid'},fetchImpl});
 await market.login('test-password');assert.equal((await market.inspect()).state,'valid');
 await writeFile(credentialFile,'credential-test',{mode:0o600});
 const binding=createProviderBindingClient({marketBaseUrl:'https://platform.test/market',settlementBaseUrl:'https://platform.test/settlement',mcpEndpoint:'https://provider.test/services/random/mcp/invoke',sessionToken:'session-test',credentialFile,bindingStateFile,providerControlUrl:'http://127.0.0.1:6571',fetchImpl});
 await binding.status();
 assert.ok(calls.some(([url,auth])=>url==='https://platform.test/market/developers/me'&&auth==='Bearer session-test'));
 assert.ok(calls.some(([url,auth])=>url==='https://platform.test/settlement/agentpay/provider/bindings/credentials/me'&&auth==='Bearer credential-test'));
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('public HTTP Provider transport does not relax platform credentials or local control',()=>{
 for(const id of ['echo','document-render']){
  const urls=providerServiceUrls('http://provider.example/region',id);
  assert.equal(urls.mcpEndpoint,`http://provider.example/region/services/${id}/mcp/invoke`);
  assert.equal(urls.paymentEndpoint,`http://provider.example/region/services/${id}/agentpay/invoke`);
 }
 for(const bad of ['ftp://provider.example','http://u:p@provider.example','http://provider.example/?token=x','http://provider.example/#x','http://provider.example/a/../b'])assert.throws(()=>providerBase(bad));
 assert.throws(()=>serviceBase('http://provider.example/market'),/HTTPS/);
 assert.throws(()=>serviceUrl('http://provider.example/settlement','/agentpay/provider/bindings/credentials/me'),/HTTPS/);
 assert.throws(()=>validateProviderDeployment({version:1,mode:'private-anvil',marketUrl:'http://provider.example/market',settlementUrl:'https://platform.example/settlement',network:'eip155:31337',assetAddress:'0x'+'1'.repeat(40),tokenDecimals:6,tokenSymbol:'rUSDC'}),/HTTPS/);
});
