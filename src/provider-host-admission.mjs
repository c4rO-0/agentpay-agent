import {writeFile,rm} from 'node:fs/promises';
import {loadProviderHostConfig} from './provider-host-config.mjs';
import {privateText,savePrivate,encodeConfig} from './provider-private-files.mjs';
import {resolveProviderRuntimeEnvironment} from './provider-runtime-environment.mjs';
import {createProviderServiceClient} from './provider-service-client.mjs';

// Application configuration for an existing externally managed host. This never
// creates service IDs, registers a service, changes price, or manages a process.
export async function verifyProviderHostAdmission(values,{fetchImpl=fetch}={}){
  const {env}=await resolveProviderRuntimeEnvironment({...values,AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE:'admitted'});
  const service=createProviderServiceClient({settlementBaseUrl:env.SETTLEMENT_BASE_URL,serviceId:env.AGENT_PROD_SERVICE_ID,
   mcpEndpoint:env.AGENT_MCP_ENDPOINT,skillId:env.AGENT_NATIVE_SKILL_ID,profileHash:env.AGENT_NATIVE_PROFILE_HASH,
   seller:env.AGENT_NATIVE_SELLER,network:env.AGENT_NATIVE_NETWORK,asset:env.AGENT_NATIVE_ASSET,
   credentialFile:env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,bindingStateFile:env.AGENT_PROVIDER_BINDING_STATE_FILE,
   providerControlUrl:env.AGENT_PROVIDER_CONTROL_URL,fetchImpl});
  await service.preview(); // Live public declaration must still match this identity.
  const state=await service.status();
  if(state.registration?.registered!==true||state.registration.serviceStatus?.qualification?.qualificationStatus!=='qualified'
   ||state.registration.serviceStatus?.quote?.quoteStatus!=='fresh'||state.readiness?.commercialReady!==true){
   throw Object.assign(Error('Paid service is not ready. Run service status and resolve the reported blockers; configuration was kept.'),{code:'PROVIDER_NOT_READY'});
  }
  return state;
}

export async function configureProviderHostAdmission(path,{fetchImpl=fetch}={}){
 await loadProviderHostConfig(path);
 const lock=path+'.configure.lock';
 await writeFile(lock,String(process.pid)+'\n',{flag:'wx',mode:0o600});
 try{
  const before=await privateText(path),values=await loadProviderHostConfig(path);
  // Enabling requires the same binding and both credential files that startup
  // will use; validate them before persisting any configuration.
  const state=await verifyProviderHostAdmission(values,{fetchImpl});
  if(await privateText(path)!==before)throw Error('Configuration changed during verification; retry with the current file');
  const changed=values.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE!=='admitted';
  if(changed)await savePrivate(path,encodeConfig({...values,AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE:'admitted'}));
  return {ok:true,changed,admissionState:'admitted',restartRequired:state.localAdmission?.admissionState!=='admitted',
   message:'Paid-service configuration verified. Reload this file with your process manager, then run service status. No process was restarted or Order created.'};
 }finally{await rm(lock);}
}
