import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSkillTemplate} from '../scripts/lib/skill-template-release.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
test('official generic template is reproducible and has a version independent of the example package',async()=>{
 const a=await buildSkillTemplate(),b=await buildSkillTemplate();assert.deepEqual(a,b);
 assert.equal(a.manifest.sha256,createHash('sha256').update(a.bytes).digest('hex'));assert.equal(a.manifest.byteLength,a.bytes.length);
 assert.match(a.manifest.filename,/^agentpay-skill-template-\d+\.\d+\.\d+\.zip$/);
 const manifest=JSON.parse(await readFile(new URL('../templates/skill/agentpay.json',import.meta.url),'utf8'));
 assert.equal(manifest.packageVersion,'1.0.0');assert.notEqual(manifest.packageVersion,a.manifest.version);
 const script=await readFile(new URL('../templates/skill/scripts/call-runtime.mjs',import.meta.url),'utf8');
 for(const hook of ['declareInputFiles','prepareBusinessRequest','declareOutputFiles','skillClientCapabilities'])assert.ok(script.includes(hook));
 assert.ok(!script.includes('random-number'));
});
