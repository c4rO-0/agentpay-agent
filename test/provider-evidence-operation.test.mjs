import test from 'node:test';import assert from 'node:assert/strict';
import {providerEvidenceOperationId} from '../src/provider-evidence-operation.mjs';
test('retry identity is stable after restart and across JSON key order; edits and other Orders differ',()=>{
 const id='0x'+'1'.repeat(64),evidence={text:'Original delivery',links:['https://example.com/proof']};
 const first=providerEvidenceOperationId(id,evidence);
 assert.equal(providerEvidenceOperationId(id,JSON.parse(JSON.stringify(evidence))),first);
 assert.equal(providerEvidenceOperationId(id,{links:evidence.links,text:evidence.text}),first);
 assert.notEqual(providerEvidenceOperationId(id,{...evidence,text:'Additional proof'}),first);
 assert.notEqual(providerEvidenceOperationId('0x'+'2'.repeat(64),evidence),first);
});
