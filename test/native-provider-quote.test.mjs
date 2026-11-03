import test from 'node:test';
import assert from 'node:assert/strict';
import { quoteLifetime, providerPaymentRequired } from '../src/native-provider-quote.mjs';
const base={offerId:`0x${'1'.repeat(64)}`,endpoint:'https://provider.example/invoke',network:'eip155:31337',
 asset:`0x${'2'.repeat(40)}`,skillId:`0x${'3'.repeat(64)}`,profileHash:`0x${'4'.repeat(64)}`,
 seller:`0x${'5'.repeat(40)}`,baseAmount:'600000',unitPrice:'100000',maxUsageUnits:'1'};
test('rolling quotes renew with new immutable offer identities; retries/restarts stay stable',()=>{
 const config={...base,...quoteLifetime({})};const now=Date.parse('2026-10-06T00:00:00Z');
 const first=providerPaymentRequired(config,now),retry=providerPaymentRequired({...config},now+1000);
 assert.deepEqual(first,retry);
 const next=providerPaymentRequired(config,now+300000);
 assert.notEqual(next.requirement.offerId,first.requirement.offerId);
 assert(BigInt(next.requirement.validUntil)>BigInt(first.requirement.validUntil));
 assert.deepEqual(providerPaymentRequired({...config},now+300000),next);
 assert.notEqual(providerPaymentRequired({...config,unitPrice:'100001'},now).requirement.offerId,first.requirement.offerId);
 for(const offset of [0,299000,300000,599000,90000000]){
  const r=providerPaymentRequired(config,now+offset).requirement;
  const remaining=Number(r.validUntil)-Math.floor((now+offset)/1000);
  assert(remaining>300&&remaining<=600);
 }
});
test('explicit fixed deadlines remain fixed even after expiry; invalid modes fail',()=>{
 const config={...base,...quoteLifetime({AGENT_NATIVE_VALID_UNTIL:'1791017311'})};
 const response=providerPaymentRequired(config,Date.parse('2026-10-06T00:00:00Z'));
 assert.equal(response.requirement.validUntil,'1791017311');assert.equal(response.requirement.offerId,base.offerId);
 for(const env of [{AGENT_NATIVE_QUOTE_TTL_SECONDS:'0'},{AGENT_NATIVE_QUOTE_TTL_SECONDS:'86401'},
  {AGENT_NATIVE_VALID_UNTIL:'1791017311',AGENT_NATIVE_QUOTE_TTL_SECONDS:'600'},
  {AGENT_NATIVE_VALID_UNTIL:'2026-10-06T00:00:00Z'},{AGENT_NATIVE_VALID_UNTIL:'8640000000001'}])assert.throws(()=>quoteLifetime(env));
});

test('invalid clocks, direct TTL configuration and rolling expiry overflow fail before emitting an offer',()=>{
 const config={...base,...quoteLifetime({})};
 for(const now of [NaN,Infinity,-1,1.2,'1791020911000',253402300800000])assert.throws(()=>providerPaymentRequired(config,now),/clock/);
 for(const quoteTtlSeconds of [0,1.2,86401,Infinity,'600'])assert.throws(()=>providerPaymentRequired({...config,quoteTtlSeconds},1791020911000),/TTL/);
 assert.throws(()=>providerPaymentRequired(config,253402300799999));
 assert.throws(()=>providerPaymentRequired({...config,quoteTtlSeconds:null,validUntil:'1791020911000'},1791020911000));
});

test('maximum delivery duration is optional and changes the rolling offer identity independently of expiry',()=>{
 const config={...base,...quoteLifetime({})},now=Date.parse('2026-10-24T00:00:00Z');
 const absent=providerPaymentRequired(config,now),timed=providerPaymentRequired({...config,serviceWindowSeconds:'86400'},now);
 assert.equal(absent.requirement.serviceWindowSeconds,undefined);assert.equal(timed.requirement.serviceWindowSeconds,'86400');assert.equal(timed.requirement.validUntil,absent.requirement.validUntil);assert.notEqual(timed.requirement.offerId,absent.requirement.offerId);
 assert.throws(()=>providerPaymentRequired({...config,serviceWindowSeconds:'0'},now));
});
