import { readFile } from 'node:fs/promises';
import { writeSkillZip } from './skill-zip.mjs';
import { createHash } from 'node:crypto';
import {serviceReference} from './service-reference.mjs';

export const RANDOM_SKILL_BUNDLE_VERSION='1.2.0';

// Deterministic ZIP: three regular files, no links or install hooks.
export function packSkillFiles(files) { return writeSkillZip(Object.entries(files)); }
export async function randomSkillBundle(identity) {
  const service = serviceReference(identity);
  const manifest = {format:'agentpay.skill-bundle.v1',packageName:'agentpay-random',packageVersion:RANDOM_SKILL_BUNDLE_VERSION,
    entrypoint:'scripts/random.mjs',services:{main:service}};
  const files = {
    'random-skill/SKILL.md':await readFile(new URL('../skills/random/SKILL.md',import.meta.url)),
    'random-skill/agentpay.json':JSON.stringify(manifest,null,2)+'\n',
    'random-skill/scripts/random.mjs':await readFile(new URL('../skills/random/scripts/random.mjs',import.meta.url))
  };
  const bytes = packSkillFiles(files);
  return {bytes,sha256:createHash('sha256').update(bytes).digest('hex')};
}
