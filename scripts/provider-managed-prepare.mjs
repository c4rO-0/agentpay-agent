#!/usr/bin/env node
// The host passes only this service's environment over stdin. Private database
// settings stay in memory; stdout contains the validated public declaration.
import {verifyProviderHostAdmission} from '../src/provider-host-admission.mjs';
import {resolve} from 'node:path';
import {loadProviderConnectionConfig} from '../src/provider-connection-config.mjs';
import {loadProviderDeployment} from '../src/provider-deployment.mjs';
import {providerBaseForEndpoint} from '../src/provider-service-urls.mjs';
import {resolveProviderRuntimeEnvironment} from '../src/provider-runtime-environment.mjs';
import {readProviderBinding} from '../src/provider-binding-state.mjs';

try {
  const [connectionPath, deploymentPath, action] = process.argv.slice(2);
  if (!connectionPath || !deploymentPath || (process.argv.length !== 4 && !(process.argv.length===5 && action==='admission'))) throw Error('Expected connection and public deployment files.');
  let data='';
  for await (const chunk of process.stdin) {
    data+=chunk;
    if (Buffer.byteLength(data)>65536) throw Error('Managed environment is too large.');
  }
  const input=JSON.parse(data);
  const connection=await loadProviderConnectionConfig(resolve(connectionPath));
  const deployment=await loadProviderDeployment(deploymentPath);
  if(!action && input.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE!=='pre_admission') throw Error('Configure the service before paid admission.');
  if (input.AGENT_PROD_SERVICE_ID!==connection.AGENT_PROD_SERVICE_ID ||
      input.AGENT_PROVIDER_BINDING_STATE_FILE!==connection.AGENT_PROVIDER_BINDING_STATE_FILE ||
      deployment.network!==connection.AGENT_NATIVE_NETWORK ||
      deployment.assetAddress.toLowerCase()!==connection.AGENT_NATIVE_ASSET.toLowerCase() ||
      deployment.marketUrl!==connection.MARKET_BASE_URL ||
      deployment.settlementUrl!==connection.SETTLEMENT_BASE_URL) throw Error('Connection and managed deployment differ.');
  const env={...input,MARKET_BASE_URL:connection.MARKET_BASE_URL,MARKET_SESSION_TOKEN_FILE:connection.MARKET_SESSION_TOKEN_FILE,
    AGENT_MCP_ENDPOINT:connection.AGENT_MCP_ENDPOINT,SETTLEMENT_BASE_URL:connection.SETTLEMENT_BASE_URL,
    AGENT_NATIVE_NETWORK:deployment.network,AGENT_NATIVE_ASSET:deployment.assetAddress,
    AGENT_PUBLIC_BASE_URL:providerBaseForEndpoint(connection.AGENT_MCP_ENDPOINT,connection.AGENT_PROD_SERVICE_ID),
    AGENTPAY_NATIVE_PROVIDER_ENABLED:'true',AGENT_NATIVE_MAX_USAGE_UNITS:'1',AGENT_NATIVE_QUOTE_TTL_SECONDS:'600'};
  if(!await readProviderBinding(env.AGENT_PROVIDER_BINDING_STATE_FILE,env.AGENT_MCP_ENDPOINT.replace(/\/invoke$/,'')))
    throw Error('Complete endpoint verification before preparing the paid declaration.');
  if(action==='admission'){
    // Root staging uses the same protected source for control and paid copies.
    // Validate its currently loaded control credential before changing admission.
    const state=await verifyProviderHostAdmission({...env,
      AGENT_PROVIDER_CREDENTIAL_FILE:env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE});
    console.log(JSON.stringify({ok:true,admissionState:'admitted',localAdmission:state.localAdmission}));
    process.exit(0);
  }
  const prepared=await resolveProviderRuntimeEnvironment(env,{prepare:true});
  const keys=['AGENT_PUBLIC_BASE_URL','SETTLEMENT_BASE_URL','AGENT_NATIVE_NETWORK','AGENT_NATIVE_ASSET',
    'AGENTPAY_NATIVE_PROVIDER_ENABLED','AGENT_NATIVE_MAX_USAGE_UNITS','AGENT_NATIVE_QUOTE_TTL_SECONDS',
    'AGENT_NATIVE_SKILL_ID','AGENT_NATIVE_OFFER_ID','AGENT_NATIVE_PROFILE_HASH',
    'AGENT_NATIVE_SELLER','AGENT_NATIVE_BASE_AMOUNT','AGENT_NATIVE_UNIT_PRICE'];
  console.log(JSON.stringify(Object.fromEntries(keys.map(k=>[k,prepared.env[k]]))));
} catch(error) {
  // Only known validation errors are exposed; never serialize the input environment.
  console.error('Provider declaration preparation failed: '+error.message);
  process.exitCode=1;
}
