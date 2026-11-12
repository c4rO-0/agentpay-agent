import { readFile } from 'node:fs/promises';
import { writeSkillZip } from './skill-zip.mjs';
import { createHash } from 'node:crypto';
import {serviceReference} from './service-reference.mjs';

export const RANDOM_SKILL_BUNDLE_VERSION='1.2.2';

// Deterministic ZIP: four regular files, no links or install hooks.
export function packSkillFiles(files) { return writeSkillZip(Object.entries(files)); }

// One artifact per server, not an unbounded cache of service identities. Source
// changes are deployed by restarting the process; never edit a published version
// in place. A changed registered reference rebuilds the manifest and ZIP.
export function createRandomSkillBundle(readSource=readFile) {
  let cached, building;
  return async function getBundle(identity) {
    const service=serviceReference(identity);
    const manifest={format:'agentpay.skill-bundle.v1',packageName:'agentpay-random',packageVersion:RANDOM_SKILL_BUNDLE_VERSION,
      entrypoint:'scripts/random.mjs',services:{main:service}};
    const key=JSON.stringify(manifest,null,2)+'\n';
    // Serialize different identities too: configuration changes must not create
    // concurrent compression work. Same-identity downloads share the promise.
    while(building){
      if(building.key===key)return building.promise;
      try{await building.promise;}catch{/* A failed prior identity must not poison this request. */}
    }
    if(cached?.key===key)return cached.bundle;
    cached=undefined;
    const promise=(async()=>{
      const [instructions,script,loader]=await Promise.all([
        readSource(new URL('../skills/random/SKILL.md',import.meta.url)),
        readSource(new URL('../skills/random/scripts/random.mjs',import.meta.url)),
        readSource(new URL('../skills/random/scripts/agentpay-client.mjs',import.meta.url))
      ]);
      if(instructions.length+script.length+loader.length+Buffer.byteLength(key)>4*1024*1024)throw Error('SKILL_PACKAGE_TOO_LARGE');
      const bytes=packSkillFiles({'random-skill/SKILL.md':instructions,'random-skill/agentpay.json':key,'random-skill/scripts/random.mjs':script,'random-skill/scripts/agentpay-client.mjs':loader});
      if(bytes.length>4*1024*1024)throw Error('SKILL_PACKAGE_TOO_LARGE');
      const bundle={bytes,sha256:createHash('sha256').update(bytes).digest('hex')};
      cached={key,bundle};return bundle;
    })();
    building={key,promise};
    try{return await promise;}finally{building=undefined;}
  };
}

// Shared by every HTTP download. Do not mutate the returned Buffer.
export const randomSkillBundle=createRandomSkillBundle();
