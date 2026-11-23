import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {encodeConfig} from '../src/provider-private-files.mjs';
import {saveProviderBinding} from '../src/provider-binding-state.mjs';

test('managed declaration preparation reuses identity and refuses an unverified binding',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-managed-'));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 const endpoint='https://platform.example/provider/services/random/mcp/invoke';
 const env={MARKET_BASE_URL:'https://platform.example/market',MARKET_EMAIL:'fixture@example.com',
 MARKET_SESSION_TOKEN_FILE:join(dir,'session'),SETTLEMENT_BASE_URL:'https://platform.example/settlement',
 AGENT_PROD_SERVICE_ID:'random',AGENT_MCP_ENDPOINT:endpoint,AGENT_PROVIDER_CONTROL_URL:'http://127.0.0.1:6471',
 AGENT_NATIVE_NETWORK:'eip155:8453',AGENT_NATIVE_ASSET:'0x'+'1'.repeat(40),
 AGENT_PROVIDER_BINDING_STATE_FILE:join(dir,'binding.json'),AGENT_PROVIDER_BINDING_CREDENTIAL_FILE:join(dir,'token')};
 await writeFile(join(dir,'connection.env'),encodeConfig(env),{mode:0o600});
 const deployment={version:1,mode:'production',marketUrl:env.MARKET_BASE_URL,settlementUrl:env.SETTLEMENT_BASE_URL,network:env.AGENT_NATIVE_NETWORK,assetAddress:env.AGENT_NATIVE_ASSET,tokenDecimals:6,tokenSymbol:'USDC'};
 await writeFile(join(dir,'deployment.json'),JSON.stringify(deployment));
 const input={...env,AGENT_PROD_KIND:'random',AGENT_PROD_HOST:'127.0.0.1',AGENT_PROD_PORT:'6471',
 AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE:'pre_admission',AGENT_PROVIDER_SERVICE_STATE_FILE:join(dir,'service.json'),
 AGENT_PROVIDER_DB_HOST:'127.0.0.1',AGENT_PROVIDER_DB_PORT:'3306',AGENT_PROVIDER_DB_USER:'fixture',AGENT_PROVIDER_DB_NAME:'fixture',AGENT_PROVIDER_DB_PASSWORD:'fixture-secret',
 AGENT_NATIVE_SELLER:'0x'+'2'.repeat(40),AGENT_NATIVE_BASE_AMOUNT:'30000',AGENT_NATIVE_UNIT_PRICE:'5000'};
 const childEnv={...process.env};delete childEnv.NODE_TEST_CONTEXT;
 const run=()=>spawnSync(process.execPath,[new URL('../scripts/provider-managed-prepare.mjs',import.meta.url).pathname,join(dir,'connection.env'),join(dir,'deployment.json')],{input:JSON.stringify(input),encoding:'utf8',env:childEnv});
 assert.equal(run().status,1);
 await saveProviderBinding(env.AGENT_PROVIDER_BINDING_STATE_FILE,{status:'verified',endpointUrl:endpoint.replace(/\/invoke$/,''),providerId:'provider:market:fixture',credentialId:'fixture'});
 const first=run();assert.equal(first.status,0,JSON.stringify({stderr:first.stderr,stdout:first.stdout,error:first.error,signal:first.signal}));
 assert.ok(!first.stdout.includes('fixture-secret'));
 const result=JSON.parse(first.stdout);assert.equal(result.AGENT_NATIVE_BASE_AMOUNT,'30000');assert.equal(result.AGENT_NATIVE_MAX_USAGE_UNITS,'1');
 const saved=await readFile(input.AGENT_PROVIDER_SERVICE_STATE_FILE,'utf8');
 assert.deepEqual(JSON.parse(run().stdout),result);
 assert.equal(await readFile(input.AGENT_PROVIDER_SERVICE_STATE_FILE,'utf8'),saved);
 input.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE='admitted';assert.equal(run().status,1);
});
