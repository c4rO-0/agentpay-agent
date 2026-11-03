import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureSchema} from '../src/native-provider-runtime.mjs';
test('standalone Provider schema initialization creates epoch columns without requests, results or credentials',async()=>{
 const calls=[],db={async query(sql,args=[]){calls.push([sql,args]);assert.equal((sql.match(/\?/g)||[]).length,args.length);return [[]];}};
 await ensureSchema(db);
 const alters=calls.filter(([sql])=>sql.startsWith('ALTER TABLE'));
 assert.equal(alters.length,3);
 for(const field of ['created_at','updated_at','completed_at'])assert.ok(alters.some(([sql])=>sql.includes(field+'_ms BIGINT UNSIGNED NULL')));
 for(const [sql] of calls)assert.doesNotMatch(sql,/\b(?:INSERT|UPDATE|DELETE|DROP)\b/);
});
