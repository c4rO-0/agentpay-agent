import test from 'node:test';
import assert from 'node:assert/strict';
import {hashServiceProfile} from '@agentpay/types';
import {serviceReference} from '../src/service-reference.mjs';
test('public reference is independent of business and excludes mutable pricing and credentials',()=>{
 for(const serviceId of ['random','translation']){
 const profile={version:'agentpay.service-profile.v1',providerId:'provider:test',serviceId,mcpEndpoint:`https://example.test/services/${serviceId}/mcp/invoke`,paymentEndpoint:`https://example.test/services/${serviceId}/agentpay/invoke`,seller:'0x'+'1'.repeat(40),network:'eip155:31337',asset:'0x'+'2'.repeat(40)};
 const ref=serviceReference({skillId:'0x'+'3'.repeat(64),profileHash:hashServiceProfile(profile),profile});assert.equal(ref.adapter,'agentpay.json.v1');assert.equal(ref.profile.serviceId,serviceId);assert.equal('price' in ref,false);assert.equal('credential' in ref,false);
 assert.throws(()=>serviceReference({...ref,profile:{...profile,paymentEndpoint:profile.paymentEndpoint+'?secret=1'}}));
 }
});
