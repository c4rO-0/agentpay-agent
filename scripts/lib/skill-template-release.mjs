import {readFile,readdir,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {writeSkillZip} from '../../src/skill-zip.mjs';
const root=new URL('../../templates/',import.meta.url);
export async function buildSkillTemplate(){
 const config=JSON.parse(await readFile(new URL('skill-release.json',root),'utf8'));
 if(config.name!=='agentpay-skill-template'||!/^\d+\.\d+\.\d+$/.test(config.version)||!Array.isArray(config.requiredClientCapabilities)||config.requiredClientCapabilities.some(v=>typeof v!=='string'))throw Error('Invalid template release metadata.');
 const files=[];
 async function collect(url,prefix=''){
  for(const name of (await readdir(url)).sort()){
   const path=prefix+name,entry=new URL(name,url),info=await lstat(entry);
   if(info.isSymbolicLink())throw Error('Template symlinks are not allowed.');
   if(info.isDirectory())await collect(new URL(name+'/',url),path+'/');
   else if(info.isFile())files.push(['my-skill/'+path,await readFile(entry)]);
   else throw Error('Template entries must be regular files.');
  }
 }
 await collect(new URL('skill/',root));
 for(const path of ['SKILL.md','agentpay.json','README.md','scripts/call-runtime.mjs'])if(!files.some(([name])=>name==='my-skill/'+path))throw Error('Missing required template file: '+path);
 const readme=files.find(([name])=>name==='my-skill/README.md');
 readme[1]=Buffer.from(readme[1].toString().replace('{{TEMPLATE_VERSION}}',config.version));
 if(files.length>256||files.some(([,body])=>body.length>1048576)||files.reduce((n,[,body])=>n+body.length,0)>8388608)throw Error('Template exceeds package limits.');
 const bytes=writeSkillZip(files);
 if(bytes.length>2097152)throw Error('Template ZIP exceeds 2 MiB.');
 const manifest={...config,filename:`agentpay-skill-template-${config.version}.zip`,byteLength:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};
 return {bytes,manifest};
}
