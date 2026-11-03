import test from 'node:test';import assert from 'node:assert/strict';
import {retrieveOriginalResult} from '../src/provider-result-retrieval.mjs';
test('different business outputs are returned from storage without a new execution path',async()=>{
 for(const output of [{tracking:'ABC',carrier:'example'},{resourceHours:2,artifact:'completed'}]){
  const row={state:'receipt_submitted',order_id:'order',request_hash:'request',output_hash:'hash',output_json:output};let reads=0;
  const recovered=await retrieveOriginalResult({permission:{},skillId:'skill',profileHash:'profile',verify:async()=>({skillId:'skill',profileHash:'profile',orderId:'order',requestHash:'request',outputHash:'hash'}),read:async()=>{reads++;return row;}});
  assert.deepEqual(recovered.output_json,output);assert.equal(reads,1);
 }
});
test('wrong service, missing cache and mismatched receipt are rejected rather than regenerated',async()=>{
 const defaults={permission:{},skillId:'skill',profileHash:'profile',verify:async()=>({skillId:'skill',profileHash:'profile',orderId:'order',requestHash:'request',outputHash:'hash'}),read:async()=>null};
 await assert.rejects(()=>retrieveOriginalResult(defaults),{code:'ORIGINAL_RESULT_UNAVAILABLE'});
 await assert.rejects(()=>retrieveOriginalResult({...defaults,skillId:'other'}),{code:'RETRIEVAL_FORBIDDEN'});
 await assert.rejects(()=>retrieveOriginalResult({...defaults,read:async()=>({state:'receipt_submitted',order_id:'order',request_hash:'wrong',output_hash:'hash'})}),{code:'ORIGINAL_RESULT_UNAVAILABLE'});
});
