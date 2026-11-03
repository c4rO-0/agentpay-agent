import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseEnv } from 'node:util';
import { editProviderConfiguration } from '../src/provider-config-edit.mjs';
import { encodeConfig } from '../src/provider-private-files.mjs';
const ui=answers=>({heading(){},write(){},async ask(){assert.ok(answers.length);return answers.shift();}});
test('price editing converts human units, preserves IDs/password and cancellation preserves bytes',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-edit-')),path=join(dir,'provider.env');
 const env={MARKET_BASE_URL:'https://market.example',SETTLEMENT_BASE_URL:'https://settlement.example',MARKET_EMAIL:'provider@example.com',
 MARKET_SESSION_TOKEN_FILE:join(dir,'session'),AGENT_PROD_SERVICE_ID:'random',AGENT_PROD_KIND:'random',AGENT_PROD_HOST:'127.0.0.1',AGENT_PROD_PORT:'6571',
 AGENT_PUBLIC_BASE_URL:'https://provider.example',AGENTPAY_NATIVE_PROVIDER_ENABLED:'true',AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE:'pre_admission',
 AGENT_PROVIDER_BINDING_STATE_FILE:join(dir,'binding'),AGENT_PROVIDER_BINDING_CREDENTIAL_FILE:join(dir,'token'),AGENT_PROVIDER_SERVICE_STATE_FILE:join(dir,'service'),
 AGENT_PROVIDER_DB_HOST:'127.0.0.1',AGENT_PROVIDER_DB_PORT:'3306',AGENT_PROVIDER_DB_USER:'provider',AGENT_PROVIDER_DB_NAME:'provider',AGENT_PROVIDER_DB_PASSWORD:'hidden value',
 AGENT_NATIVE_NETWORK:'eip155:8453',AGENT_NATIVE_ASSET:`0x${'1'.repeat(40)}`,AGENT_NATIVE_SELLER:`0x${'2'.repeat(40)}`,
 AGENT_NATIVE_BASE_AMOUNT:'0',AGENT_NATIVE_UNIT_PRICE:'1',AGENT_NATIVE_MAX_USAGE_UNITS:'1',AGENT_NATIVE_QUOTE_TTL_SECONDS:'600',AGENT_NATIVE_SKILL_ID:`0x${'a'.repeat(64)}`};
 try{
 await writeFile(path,encodeConfig(env),{mode:0o600});
 await editProviderConfiguration(path,ui(['prices','0.6','0.1','save']),{tokenDecimals:6,tokenSymbol:'USDC'});
 const saved=parseEnv(await readFile(path,'utf8'));assert.equal(saved.AGENT_NATIVE_BASE_AMOUNT,'600000');assert.equal(saved.AGENT_NATIVE_UNIT_PRICE,'100000');
 assert.equal(saved.AGENT_NATIVE_SKILL_ID,env.AGENT_NATIVE_SKILL_ID);assert.equal(saved.AGENT_PROVIDER_DB_PASSWORD,env.AGENT_PROVIDER_DB_PASSWORD);
 const before=await readFile(path,'utf8');await editProviderConfiguration(path,ui(['prices','0','2','q']),{tokenDecimals:6,tokenSymbol:'USDC'});
 assert.equal(await readFile(path,'utf8'),before);
 }finally{await rm(dir,{recursive:true,force:true});}
});
