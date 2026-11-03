import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureSchema} from '../src/native-provider-runtime.mjs';

test('explicit metadata alias recognizes an existing JSON output column',async()=>{
 const statements=[];
 await ensureSchema({async query(sql){
  statements.push(sql);
  if(sql.includes('SELECT data_type'))return [[sql.includes('AS columnType')?{columnType:'json'}:{DATA_TYPE:'json'}],[]];
  if(sql.includes('SELECT column_name'))return [[{COLUMN_NAME:'present'}],[]];
  return [[],[]];
 }});
 assert.equal(statements.filter(sql=>sql.startsWith('ALTER TABLE')&&sql.includes('output_json LONGTEXT')).length,1);
});

test('an existing text output column needs no repeated type alteration',async()=>{
 const statements=[];
 await ensureSchema({async query(sql){
  statements.push(sql);
  if(sql.includes('SELECT data_type'))return [[{columnType:'longtext'}],[]];
  if(sql.includes('SELECT column_name'))return [[{COLUMN_NAME:'present'}],[]];
  return [[],[]];
 }});
 assert.equal(statements.some(sql=>sql.startsWith('ALTER TABLE')),false);
});
