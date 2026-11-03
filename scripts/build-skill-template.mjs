#!/usr/bin/env node
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {buildSkillTemplate} from './lib/skill-template-release.mjs';
if(process.argv.length>3)throw Error('Usage: node scripts/build-skill-template.mjs [OUTPUT_DIRECTORY]');
const directory=resolve(process.argv[2]||'artifacts/skill-template');
const {bytes,manifest}=await buildSkillTemplate();await mkdir(directory,{recursive:true});
const target=join(directory,manifest.filename);
// A published version may never silently acquire different bytes.
try{const old=await readFile(target);if(!old.equals(bytes))throw Error('This version already has different bytes. Increment templates/skill-release.json version.');}catch(e){if(e.code!=='ENOENT')throw e;}
await writeFile(target,bytes);await writeFile(join(directory,'release.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(`Template ${manifest.version}\nZIP: ${target}\nSHA-256: ${manifest.sha256}\nNo remote release was published.`);
