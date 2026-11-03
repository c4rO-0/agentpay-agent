import {checkProviderHostConfig,deriveHostProfileHash,selectProviderHostEnvironment} from './provider-host-config.mjs';
import {readProviderBinding} from './provider-binding-state.mjs';
import {prepareProviderServiceState,loadProviderServiceState} from './provider-service-state.mjs';
import {readPrivateFile} from './provider-binding-client.mjs';

// Reuse the current B1/service preparation contracts for managed startup.
// Preparing a local declaration does not register, qualify or admit a service.
export async function resolveProviderRuntimeEnvironment(input,{prepare=false}={}) {
 const {env}=checkProviderHostConfig(selectProviderHostEnvironment(input),Date.now(),{allowMissingIdentifiers:true});
 const binding=await readProviderBinding(env.AGENT_PROVIDER_BINDING_STATE_FILE,env.AGENT_MCP_ENDPOINT.replace(/\/invoke$/,''));
 env.AGENT_NATIVE_PROFILE_HASH=deriveHostProfileHash(env,binding||{providerId:'provider:unbound'});
 if(!env.AGENT_PROVIDER_SERVICE_STATE_FILE)throw new Error('AGENT_PROVIDER_SERVICE_STATE_FILE required; run service preparation before startup');
 const state=await (prepare?prepareProviderServiceState:loadProviderServiceState)(env.AGENT_PROVIDER_SERVICE_STATE_FILE,env);
 env.AGENT_NATIVE_SKILL_ID=state.skillId;env.AGENT_NATIVE_OFFER_ID=state.offerId;
 if(!prepare&&env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE==='admitted') {
  if(!binding)throw new Error('admitted startup requires a saved B1 binding');
  const control=await readPrivateFile(env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,'control credential');
  const paid=await readPrivateFile(env.AGENT_PROVIDER_CREDENTIAL_FILE,'paid credential');
  if(control!==paid)throw new Error('paid runtime credential differs from this endpoint\'s control credential');
 }
 return {env,bindingPresent:!!binding};
}
