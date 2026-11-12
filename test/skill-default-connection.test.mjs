// SPDX-License-Identifier: MIT
// Maintained local clients stand in for installed User. No service or payment calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadAgentPayClient} from '../templates/skill/scripts/agentpay-client.mjs';

test('default Skill follows deliberate selection and pins an in-flight invocation to its original storage',async t=>{
 const root=await mkdtemp(join(tmpdir(),'skill-default-'));t.after(()=>rm(root,{recursive:true,force:true}));
 const previousHome=process.env.HOME;process.env.HOME=join(root,'home');t.after(()=>{if(previousHome===undefined)delete process.env.HOME;else process.env.HOME=previousHome;});
 const state=join(root,'state'),record=join(state,'agentpay/user/active-services.json');
 await mkdir(join(state,'agentpay/user'),{recursive:true,mode:0o700});
 const folders=[join(root,'first'),join(root,'second')];
 for(const dir of folders){
  await mkdir(join(dir,'runtime'),{recursive:true,mode:0o700});
  await writeFile(join(dir,'runtime/connection.json'),JSON.stringify({version:'agentpay.runtime-connection.v1',clientModule:join(dir,'runtime-client.mjs')}),{mode:0o600});
  await writeFile(join(dir,'skill-client.mjs'),"export const skillClientCapabilities=['default-selection-v1']; export const runSkill=options=>options.env.AGENTPAY_USER_DATA_DIR;");
 }
 const select=async(dataDir,phase='selected')=>writeFile(record,JSON.stringify({version:1,phase,target:{dataDir}}),{mode:0o600});
 const env={XDG_STATE_HOME:state};
 await mkdir(join(process.env.HOME,'.local/state/agentpay'),{recursive:true,mode:0o700});
 await writeFile(join(process.env.HOME,'.local/state/agentpay/state-location.json'),JSON.stringify({version:1,directory:join(state,'agentpay/user')}),{mode:0o600});
 await select(folders[0]);const original=await loadAgentPayClient(env);
 await select(folders[1]);const current=await loadAgentPayClient({});
 assert.equal(await original.runSkill({}),folders[0]);assert.equal(await current.runSkill({}),folders[1]);
 assert.equal(await (await loadAgentPayClient({XDG_STATE_HOME:'relative-shell-value'})).runSkill({}),folders[1]);
 await select(folders[1],'stopped');await assert.rejects(loadAgentPayClient(env),/LOCAL_SETUP_REQUIRED/);
});
