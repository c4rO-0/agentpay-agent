import {isAbsolute} from 'node:path';
import {providerBaseForEndpoint} from './provider-service-urls.mjs';
import {serviceBase} from './service-url.mjs';
import { parseEnv } from 'node:util';
import { isAddress } from 'viem';
import { privateText } from './provider-private-files.mjs';
const keys = new Set(['MARKET_BASE_URL','MARKET_EMAIL','MARKET_SESSION_TOKEN_FILE','SETTLEMENT_BASE_URL',
  'AGENT_PROD_SERVICE_ID','AGENT_MCP_ENDPOINT','AGENT_PROVIDER_CONTROL_URL','AGENT_PROVIDER_BINDING_STATE_FILE',
  'AGENT_PROVIDER_BINDING_CREDENTIAL_FILE','AGENT_NATIVE_NETWORK','AGENT_NATIVE_ASSET']);
export function checkProviderConnectionConfig(input) {
  for (const key of Object.keys(input)) if (!keys.has(key)) throw new Error(`Not an AgentPay connection setting: ${key}. Keep implementation settings in the service installation config.`);
  const env={...input};
  for(const key of keys) if(!env[key]?.trim()) throw new Error(`${key} is required`);
  for(const key of ['MARKET_BASE_URL','SETTLEMENT_BASE_URL','AGENT_PROVIDER_CONTROL_URL']) {
    env[key]=serviceBase(env[key],key);
    const url=new URL(env[key]);
    if(key==='AGENT_PROVIDER_CONTROL_URL'&&(!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.pathname!=='/'))throw Error('Provider control URL must be a loopback origin');
  }
  providerBaseForEndpoint(env.AGENT_MCP_ENDPOINT,env.AGENT_PROD_SERVICE_ID);
  for(const key of ['MARKET_SESSION_TOKEN_FILE','AGENT_PROVIDER_BINDING_STATE_FILE','AGENT_PROVIDER_BINDING_CREDENTIAL_FILE']) if(!isAbsolute(env[key])) throw new Error(`${key} must use an absolute private path`);
  if(!/^eip155:[1-9][0-9]*$/.test(env.AGENT_NATIVE_NETWORK)||!isAddress(env.AGENT_NATIVE_ASSET)) throw new Error('Invalid supported network/token');
  return env;
}
export async function loadProviderConnectionConfig(path) { return checkProviderConnectionConfig(parseEnv(await privateText(path))); }
