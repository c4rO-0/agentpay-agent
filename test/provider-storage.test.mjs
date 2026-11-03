import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareStorage,loadStorage} from '../src/provider-storage.mjs';
const screen=answers=>({text:[],heading(s){this.text.push(s);},write(s){this.text.push(s);},async ask(){assert.ok(answers.length);return answers.shift();}});
test('installation requires schema initialization before saving complete storage, reuses saved SQL without questions',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-storage-')),path=join(dir,'storage.env');let checks=0;
 const initialize=async env=>{checks++;assert.equal(env.AGENT_PROVIDER_DB_NAME,'own_execution');return{async end(){}};};
 try{
  const ui=screen(['','','own_execution','own_user','PASSWORD_SECRET']);await prepareStorage(path,ui,{initialize});
  assert.equal((await loadStorage(path)).AGENT_PROVIDER_DB_PASSWORD,'PASSWORD_SECRET');assert.doesNotMatch(ui.text.join('\n'),/PASSWORD_SECRET/);
  await prepareStorage(path,screen([]),{initialize});assert.equal(checks,2);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('failed installation schema check preserves nonsecret draft but cannot claim storage installed',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'provider-storage-fail-')),path=join(dir,'storage.env');
 try{
  await assert.rejects(prepareStorage(path,screen(['','','own_execution','own_user','PASSWORD_SECRET']),{initialize:async()=>{throw new Error('schema permission denied');}}),/schema permission/);
  await assert.rejects(loadStorage(path),/installation is incomplete/);
  assert.doesNotMatch(await readFile(`${path}.draft.json`,'utf8'),/PASSWORD_SECRET/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
