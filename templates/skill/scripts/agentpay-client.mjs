// SPDX-License-Identifier: MIT
// Local bootstrap only. Business scripts call this module; installed User owns
// transport, authentication, snapshots and payment recovery. Never fetch client code.
import {constants} from 'node:fs';
import {open} from 'node:fs/promises';
import {join,dirname,isAbsolute} from 'node:path';
import {homedir} from 'node:os';
import {pathToFileURL} from 'node:url';

async function privateJson(path, publishedLocator=false) {
  const handle=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);
  try {
    const info=await handle.stat();
    if(!info.isFile() || (!publishedLocator && info.nlink!==1) || info.uid!==process.getuid() || info.mode & 0o077 || info.size>32768)
      throw Error('LOCAL_SETUP_REQUIRED');
    return JSON.parse(await handle.readFile('utf8'));
  } finally {await handle.close();}
}
export async function loadAgentPayClient(env=process.env) {
  let dataDir=env.AGENTPAY_USER_DATA_DIR;
  let defaultSelection=false;
  if(!dataDir) {
    const base=env.XDG_STATE_HOME || join(homedir(),'.local/state');
    let directory=join(base,'agentpay/user');
    try {
      const location=await privateJson(join(homedir(),'.local/state/agentpay/state-location.json'),true);
      if(location.version!==1 || typeof location.directory!=='string' || !isAbsolute(location.directory) || /[\x00-\x1f\x7f]/.test(location.directory))throw Error('LOCAL_SETUP_REQUIRED');
      directory=location.directory;
    } catch(error) {if(error.code!=='ENOENT')throw error;}
    if(!isAbsolute(directory))throw Error('LOCAL_SETUP_REQUIRED');
    try {
      const selected=await privateJson(join(directory,'active-services.json'));
      if(selected.version!==1 || selected.phase!=='selected' || typeof selected.target?.dataDir!=='string')
        throw Error('LOCAL_SETUP_REQUIRED');
      dataDir=selected.target.dataDir;
      defaultSelection=true;
    } catch(error) {
      // Old single-install setup remains usable only when no selection record exists.
      if(error.code!=='ENOENT')throw error;
      dataDir=join(homedir(),'.local/share/agentpay/user');
    }
  }
  if(!isAbsolute(dataDir))throw Error('LOCAL_SETUP_REQUIRED');
  const connection=await privateJson(join(dataDir,'runtime/connection.json'));
  if(connection.version!=='agentpay.runtime-connection.v1' || !isAbsolute(connection.clientModule || '') || !connection.clientModule.endsWith('/runtime-client.mjs'))
    throw Error('LOCAL_SETUP_REQUIRED');
  const client=await import(pathToFileURL(join(dirname(connection.clientModule),'skill-client.mjs')).href);
  if(defaultSelection && !client.skillClientCapabilities?.includes('default-selection-v1')) throw Error('CLIENT_UPDATE_REQUIRED');
  // Pin this invocation to the selected storage. A concurrent switch must fail
  // against its original endpoint; it cannot silently retry using another Wallet.
  return {...client,runSkill:options=>client.runSkill({...options,env:{...env,AGENTPAY_USER_DATA_DIR:dataDir,...(defaultSelection?{AGENTPAY_DEFAULT_SELECTION:'1'}:{})}})};
}
