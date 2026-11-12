import test from 'node:test';
import assert from 'node:assert/strict';
import {hashServiceProfile} from '@c4roa0/agentpay-protocol';
import {serviceReference} from '../src/service-reference.mjs';
test('public reference is independent of business and excludes mutable pricing and credentials',()=>{
 for(const serviceId of ['random','translation']){
 const profile={version:'agentpay.service-profile.v1',providerId:'provider:test',serviceId,mcpEndpoint:`https://example.test/services/${serviceId}/mcp/invoke`,paymentEndpoint:`https://example.test/services/${serviceId}/agentpay/invoke`,seller:'0x'+'1'.repeat(40),network:'eip155:31337',asset:'0x'+'2'.repeat(40)};
 const ref=serviceReference({skillId:'0x'+'3'.repeat(64),profileHash:hashServiceProfile(profile),profile});assert.equal(ref.adapter,'agentpay.json.v1');assert.equal(ref.profile.serviceId,serviceId);assert.equal('price' in ref,false);assert.equal('credential' in ref,false);
 assert.throws(()=>serviceReference({...ref,profile:{...profile,paymentEndpoint:profile.paymentEndpoint+'?secret=1'}}));
 }
});

test('Skill downloads coalesce concurrent builds, replace changed identities and recover after failure',async()=>{
 const {createRandomSkillBundle}=await import('../src/random-skill-bundle.mjs');
 const {readFile}=await import('node:fs/promises');const {createHash}=await import('node:crypto');
 const profile={version:'agentpay.service-profile.v1',providerId:'provider:test',serviceId:'random',mcpEndpoint:'http://example.test/services/random/mcp/invoke',paymentEndpoint:'http://example.test/services/random/agentpay/invoke',seller:'0x'+'1'.repeat(40),network:'eip155:31337',asset:'0x'+'2'.repeat(40)};
 const identity={skillId:'0x'+'3'.repeat(64),profileHash:hashServiceProfile(profile),profile};
 let reads=0,fail=false;
 const download=createRandomSkillBundle(async path=>{reads++;if(fail)throw Error('Temporary read failure');return readFile(path);});
 const responses=await Promise.all(Array.from({length:40},()=>download(identity)));
 const firstBuildReads=reads;assert.ok(firstBuildReads>0);for(const response of responses)assert.equal(response,responses[0]);
 assert.equal(responses[0].sha256,createHash('sha256').update(responses[0].bytes).digest('hex'));
 assert.equal(await download(identity),responses[0]);assert.equal(reads,firstBuildReads);
 const changed={...identity,skillId:'0x'+'4'.repeat(64)};fail=true;await assert.rejects(download(changed),/Temporary/);
 fail=false;const replacement=await download(changed);assert.notEqual(replacement.sha256,responses[0].sha256);
 const restarted=await createRandomSkillBundle()(identity);assert.deepEqual(restarted.bytes,responses[0].bytes);
});
