import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {resolveProviderRuntimeEnvironment} from '../src/provider-runtime-environment.mjs';
import {saveProviderBinding} from '../src/provider-binding-state.mjs';
const fixture=dir=>({MARKET_BASE_URL:'http://127.0.0.1:6583',SETTLEMENT_BASE_URL:'http://127.0.0.1:6572',AGENT_PROD_SERVICE_ID:'random',AGENT_PROD_KIND:'random',AGENT_PROD_HOST:'127.0.0.1',AGENT_PROD_PORT:'6571',AGENT_PUBLIC_BASE_URL:'http://127.0.0.1:6571',AGENTPAY_NATIVE_PROVIDER_ENABLED:'true',AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE:'pre_admission',MARKET_SESSION_TOKEN_FILE:join(dir,'session.token'),AGENT_PROVIDER_BINDING_STATE_FILE:join(dir,'binding.json'),AGENT_PROVIDER_BINDING_CREDENTIAL_FILE:join(dir,'control.token'),AGENT_PROVIDER_CREDENTIAL_FILE:join(dir,'paid.token'),AGENT_PROVIDER_SERVICE_STATE_FILE:join(dir,'service.json'),AGENT_NATIVE_NETWORK:'eip155:31337',AGENT_NATIVE_ASSET:'0x'+'1'.repeat(40),AGENT_NATIVE_SELLER:'0x'+'2'.repeat(40),AGENT_NATIVE_BASE_AMOUNT:'600000',AGENT_NATIVE_UNIT_PRICE:'100000',AGENT_NATIVE_MAX_USAGE_UNITS:'1',AGENT_NATIVE_QUOTE_TTL_SECONDS:'600',AGENT_PROVIDER_DB_HOST:'127.0.0.1',AGENT_PROVIDER_DB_PORT:'6474',AGENT_PROVIDER_DB_USER:'provider',AGENT_PROVIDER_DB_NAME:'agentpay_rehearsal_provider',AGENT_PROVIDER_DB_PASSWORD:'provider-db-fixture'});
test('managed preparation creates stable identities and excludes platform secrets/preloads',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-runtime-'));t.after(()=>rm(dir,{recursive:true,force:true}));const config=fixture(dir);
 await assert.rejects(resolveProviderRuntimeEnvironment(config),/missing/);
 const first=await resolveProviderRuntimeEnvironment({...config,SETTLEMENT_DB_PASSWORD:'platform-fixture',NODE_OPTIONS:'--bad',AGENTPAY_REHEARSAL_SKILL_ID:'old'},{prepare:true});
 assert.equal(first.bindingPresent,false);assert.match(first.env.AGENT_NATIVE_SKILL_ID,/^0x[0-9a-f]{64}$/);
 for(const key of ['SETTLEMENT_DB_PASSWORD','NODE_OPTIONS','AGENTPAY_REHEARSAL_SKILL_ID'])assert.equal(first.env[key],undefined);
 assert.equal(first.env.AGENT_PROVIDER_DB_PASSWORD,'provider-db-fixture');
 assert.deepEqual(await resolveProviderRuntimeEnvironment(config),first);
 assert.deepEqual(await resolveProviderRuntimeEnvironment(config,{prepare:true}),first);
});
test('new binding requires explicit reprepare; profile/offer change while skill identity is retained',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-runtime-'));t.after(()=>rm(dir,{recursive:true,force:true}));const config=fixture(dir);
 const first=await resolveProviderRuntimeEnvironment(config,{prepare:true});
 await saveProviderBinding(config.AGENT_PROVIDER_BINDING_STATE_FILE,{providerId:'provider:fresh',credentialId:'credential-fresh',endpointUrl:'http://127.0.0.1:6571/services/random/mcp',status:'verified'});
 await assert.rejects(resolveProviderRuntimeEnvironment(config),/declaration changed/);
 const second=await resolveProviderRuntimeEnvironment(config,{prepare:true});
 assert.equal(second.bindingPresent,true);assert.equal(second.env.AGENT_NATIVE_SKILL_ID,first.env.AGENT_NATIVE_SKILL_ID);
 assert.notEqual(second.env.AGENT_NATIVE_PROFILE_HASH,first.env.AGENT_NATIVE_PROFILE_HASH);assert.notEqual(second.env.AGENT_NATIVE_OFFER_ID,first.env.AGENT_NATIVE_OFFER_ID);
 assert.deepEqual(await resolveProviderRuntimeEnvironment(config),second);
});
test('admitted managed startup requires binding and matching private credential copies',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-runtime-'));t.after(()=>rm(dir,{recursive:true,force:true}));const config={...fixture(dir),AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE:'admitted'};
 await resolveProviderRuntimeEnvironment(config,{prepare:true});await assert.rejects(resolveProviderRuntimeEnvironment(config),/saved B1 binding/);
 await saveProviderBinding(config.AGENT_PROVIDER_BINDING_STATE_FILE,{providerId:'provider:fresh',credentialId:'credential-fresh',endpointUrl:'http://127.0.0.1:6571/services/random/mcp',status:'verified'});
 await resolveProviderRuntimeEnvironment(config,{prepare:true});
 await writeFile(config.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,'fixture-control',{mode:0o600});await writeFile(config.AGENT_PROVIDER_CREDENTIAL_FILE,'fixture-wrong',{mode:0o600});
 await assert.rejects(resolveProviderRuntimeEnvironment(config),/differs/);
 await writeFile(config.AGENT_PROVIDER_CREDENTIAL_FILE,'fixture-control',{mode:0o600});assert.equal((await resolveProviderRuntimeEnvironment(config)).bindingPresent,true);
});
