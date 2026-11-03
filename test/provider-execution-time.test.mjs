import test from 'node:test';
import assert from 'node:assert/strict';
import {createExecutionStore} from '../src/native-provider-runtime.mjs';
import {executionTimeRow} from '../src/provider-execution-time.mjs';
const at=1791331200999;
test('Provider reconstructs the same result from epoch and refuses unproven SQL calendars',()=>{
 const row={order_id:'order',state:'completed',created_at:'wrong calendar',updated_at:'wrong calendar',completed_at:'wrong calendar',created_at_ms:String(at),updated_at_ms:at,completed_at_ms:at,output_json:{result:5}};
 const restored=executionTimeRow(row);assert.equal(restored.completed_at_ms,at);assert.equal(restored.completed_at,new Date(at).toISOString());assert.deepEqual(restored.output_json,row.output_json);
 assert.throws(()=>executionTimeRow({...row,completed_at_ms:null}),{code:'TIMESTAMP_MIGRATION_REQUIRED'});
 assert.throws(()=>executionTimeRow({...row,completed_at_ms:-1}),{code:'TIMESTAMP_STORAGE_INVALID'});
 assert.equal(executionTimeRow({...row,state:'received',completed_at:null,completed_at_ms:null}).completed_at,null);
});
test('Provider lifecycle dual-writes epochs without replacing durable claim/receipt identity',async()=>{
 const calls=[],db={async query(sql,args){assert.equal((sql.match(/\?/g)||[]).length,args.length,sql);calls.push([sql,args]);return [sql.startsWith('SELECT')?[{order_id:'order',state:'completed',created_at_ms:at,updated_at_ms:at,completed_at_ms:at,claim_id:'existing-claim',receipt_id:'existing-receipt',output_json:{result:5}}]:{affectedRows:1}];}};
 const original=Date.now;Date.now=()=>at;
 try{
 const store=createExecutionStore(db);assert.equal((await store.begin({orderId:'order',requestHash:'hash',request:{min:1,max:6}})).claim_id,'existing-claim');
 await store.recordClaim('order','a','1');await store.accept('order','a');await store.executing('order');await store.complete('order',{result:5},'hash');await store.receiptSubmitted('order');
 const writes=calls.filter(([sql])=>!sql.startsWith('SELECT'));assert.equal(writes.length,6);for(const [sql,args] of writes){assert.ok(sql.includes('updated_at_ms'));assert.ok(args.includes(at));}
 assert.match(writes[0][0],/ON DUPLICATE KEY UPDATE updated_at=updated_at/);
 assert.match(writes[4][0],/completed_at_ms=\?/);
 }finally{Date.now=original;}
});
