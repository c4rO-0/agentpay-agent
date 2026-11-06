import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import mysql from 'mysql2/promise';
import {createNativeProviderRuntime} from '../src/native-provider-runtime.mjs';

test('payment forwarding distinguishes pending from terminal results without executing service',async t=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-payment-'));t.after(()=>rm(dir,{recursive:true,force:true}));
 const credential=join(dir,'credential');await writeFile(credential,'fixture-only',{mode:0o600});
 const env={AGENTPAY_NATIVE_PROVIDER_ENABLED:'true',AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE:'admitted',AGENT_PROVIDER_CREDENTIAL_FILE:credential,
  AGENT_NATIVE_NETWORK:'eip155:31337',AGENT_PROVIDER_DB_USER:'fixture',AGENT_PROVIDER_DB_NAME:'fixture',AGENT_NATIVE_ASSET:'0x'+'2'.repeat(40),
  AGENT_NATIVE_SKILL_ID:'0x'+'3'.repeat(64),AGENT_NATIVE_PROFILE_HASH:'0x'+'4'.repeat(64),AGENT_NATIVE_SELLER:'0x'+'1'.repeat(40),
  AGENT_NATIVE_OFFER_ID:'0x'+'5'.repeat(64),AGENT_NATIVE_QUOTE_TTL_SECONDS:'600'};
 const before={...process.env};Object.assign(process.env,env);delete process.env.AGENT_NATIVE_VALID_UNTIL;
 t.after(()=>{for(const key of [...Object.keys(env),'AGENT_NATIVE_VALID_UNTIL'])before[key]===undefined?delete process.env[key]:process.env[key]=before[key];});
 t.mock.method(mysql,'createPool',()=>({query:async()=>[[],[]],getConnection:()=>{throw Error('Payment forwarding must not execute service');},end:async()=>{}}));
 let result,forwarded=0,executed=0;
 t.mock.method(globalThis,'fetch',async(url,options)=>{assert.equal(url,'https://settlement.example/x402/settle');assert.equal(JSON.parse(options.body).paymentPayload.accepted.scheme,'agentpay');forwarded++;return Response.json(result);});
 const runtime=await createNativeProviderRuntime({serviceId:'example',settlementBaseUrl:'https://settlement.example',publicBaseUrl:'https://provider.example',application:{validate(){throw Error('No execution input');},execute(){executed++;throw Error('No payment-only execution');}}});t.after(()=>runtime.close());
 const payment=Buffer.from(JSON.stringify({x402Version:2,accepted:{scheme:'agentpay'},payload:{}})).toString('base64');
 async function invoke(value){result=value;let status,body;await runtime.handle({method:'POST',headers:{'payment-signature':payment}},{},new URL('https://provider.example/services/example/agentpay/invoke'),{json(_r,s,b){status=s;body=b;},readJson(){throw Error('No service input required');}});return {status,body};}
 const original='0x'+'a'.repeat(64);
 for(const [value,status,code] of [
  [{success:true,transaction:original},200,null],
  [{success:false,errorReason:'settlement_pending'},202,'SETTLEMENT_PENDING'],
  [{success:false,errorReason:'ORDER_CLOSING',errorMessage:'The original Order has been refunded.',transaction:original},422,'ORDER_CLOSING'],
  [{success:false,errorReason:'redemption_failed',errorMessage:'Original transaction reverted.'},422,'redemption_failed'],
  [{success:false,errorReason:'FUTURE_REASON',errorMessage:'Future rejection.'},422,'FUTURE_REASON'],
  [{success:false},422,'PAYMENT_REJECTED']
 ]){const response=await invoke(value);assert.equal(response.status,status);assert.deepEqual(response.body.result,value);assert.equal(response.body.error?.code||null,code);if(value.errorMessage)assert.equal(response.body.error.message,value.errorMessage);}
 const invalid=await invoke({transaction:original});assert.equal(invalid.status,502);assert.equal(invalid.body.error.code,'SETTLEMENT_RESPONSE_INVALID');
 assert.equal(forwarded,7);assert.equal(executed,0);
});
