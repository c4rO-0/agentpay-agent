import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

test('random wrapper delegates snapshots/recovery, preserves CLI and rejects invalid input before invocation',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'random-skill-'));
 try {
  await mkdir(join(dir,'runtime'));await mkdir(join(dir,'scripts'));
  await copyFile(new URL('../skills/random/scripts/random.mjs',import.meta.url),join(dir,'scripts/random.mjs'));
  await writeFile(join(dir,'agentpay.json'),JSON.stringify({services:{main:{example:true}}}));
  await writeFile(join(dir,'runtime/connection.json'),JSON.stringify({version:'agentpay.runtime-connection.v1',clientModule:join(dir,'runtime-client.mjs')}),{mode:0o600});
  const client=join(dir,'skill-client.mjs');
  await writeFile(client,`export const skillClientCapabilities=['input-snapshots-v1','output-files-v1','original-request-v1'];
export async function runSkill(options){
 let request;
 if(options.args[0]==='--invoke'){
 request=options.validateRequest(JSON.parse(options.args[1]));
 if(JSON.stringify(await options.inputFiles(request))!=='[]')throw Error();
 if(JSON.stringify(await options.prepareRequest({request,files:[]}))!==JSON.stringify(request))throw Error();
 }
 if(JSON.stringify(await options.outputFiles({value:4}))!=='[]')throw Error();
 console.log(JSON.stringify({ok:true,args:options.args,request}));return 0;
}`);
  const run=(...args)=>{const r=spawnSync(process.execPath,[join(dir,'scripts/random.mjs'),...args],{env:{...process.env,AGENTPAY_USER_DATA_DIR:dir},encoding:'utf8'});return {status:r.status,body:JSON.parse(r.stdout)};};
  const good=run('--invoke','1','100','--force');assert.equal(good.status,0);assert.deepEqual(good.body.request,{min:1,max:100});assert.equal(good.body.args[2],'--force');
  for(const args of [['--check'],['--quote'],['--resume','saved-id']])assert.deepEqual(run(...args).body.args,args);
  for(const bounds of [['yes','2'],['3','2'],['1','1000000001'],['0.5','2'],['1']]){const r=run('--invoke',...bounds);assert.equal(r.status,1);assert.equal(r.body.error.code,'INVALID_RANDOM_INPUT');}
  await writeFile(client,'export async function runSkill(){throw Error("Must not invoke an old client")}');
  assert.equal(run('--invoke','1','2').body.error.code,'CLIENT_UPDATE_REQUIRED');
 }finally{await rm(dir,{recursive:true,force:true});}
});
