import {isAbsolute} from 'node:path';
import {providerServiceUrls} from './provider-service-urls.mjs';
import {serviceBase} from './service-url.mjs';
import { lstat, readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { isAddress } from "viem";
import { hashServiceProfile, paymentEndpointForService } from "@agentpay/types";
import { quoteLifetime } from './native-provider-quote.mjs';

const allowed = new Set([
  "AGENT_PROVIDER_SERVICE_STATE_FILE", "MARKET_BASE_URL", "MARKET_EMAIL", "MARKET_SESSION_TOKEN_FILE", "SETTLEMENT_BASE_URL",
  "AGENT_PROD_SERVICE_ID", "AGENT_PROD_KIND", "AGENT_PROD_HOST", "AGENT_PROD_PORT", "AGENT_PUBLIC_BASE_URL",
  "AGENT_MCP_ENDPOINT", "AGENT_PROVIDER_CONTROL_URL", "AGENT_PROVIDER_BINDING_STATE_FILE",
  "AGENT_PROVIDER_BINDING_CREDENTIAL_FILE", "AGENT_PROVIDER_CREDENTIAL_FILE",
  "AGENTPAY_NATIVE_PROVIDER_ENABLED", "AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE",
  "AGENT_PROVIDER_DB_HOST", "AGENT_PROVIDER_DB_PORT", "AGENT_PROVIDER_DB_USER", "AGENT_PROVIDER_DB_PASSWORD", "AGENT_PROVIDER_DB_NAME",
  "AGENT_NATIVE_NETWORK", "AGENT_NATIVE_ASSET", "AGENT_NATIVE_SKILL_ID", "AGENT_NATIVE_PROFILE_HASH",
  "AGENT_NATIVE_SELLER", "AGENT_NATIVE_BASE_AMOUNT", "AGENT_NATIVE_UNIT_PRICE", "AGENT_NATIVE_MAX_USAGE_UNITS",
  "AGENT_NATIVE_SERVICE_WINDOW_SECONDS", "AGENT_NATIVE_OFFER_ID", "AGENT_NATIVE_VALID_UNTIL", "AGENT_NATIVE_QUOTE_TTL_SECONDS", "AGENTPAY_PROVIDER_SETTLEMENT_TIMEOUT_MS"
]);

export async function loadProviderHostConfig(path) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || info.uid !== process.getuid() || (info.mode & 0o077)) {
    throw new Error("Provider config must be an owner-held regular 0600-or-stricter file");
  }
  const values = parseEnv(await readFile(path, "utf8"));
  for (const key of Object.keys(values)) if (!allowed.has(key)) throw new Error(`unsupported Provider config key: ${key}`);
  return values;
}

export function checkProviderHostConfig(input, now = Date.now(), { requireFreshOffer = true, allowMissingIdentifiers = false } = {}) {
  const env = { ...input };
  const need = (key) => { if (!env[key]?.trim()) throw new Error(`${key} is required`); return env[key].trim(); };
  if (need("AGENTPAY_NATIVE_PROVIDER_ENABLED") !== "true" || need("AGENT_PROD_KIND") !== "random") {
    throw new Error("this standalone entry supports the native random service");
  }
  if (!['pre_admission', 'admitted'].includes(need("AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE"))) throw new Error("explicit admission state required");
  if (need("AGENT_PROD_HOST") !== "127.0.0.1") throw new Error("standalone Provider must listen on loopback");
  const port = Number(need("AGENT_PROD_PORT"));
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Provider port must be 1024–65535");
  const serviceId = need("AGENT_PROD_SERVICE_ID");
  const {publicBase,mcpEndpoint}=providerServiceUrls(need("AGENT_PUBLIC_BASE_URL"),serviceId);
  env.AGENT_PUBLIC_BASE_URL=publicBase;
  if (env.AGENT_MCP_ENDPOINT && env.AGENT_MCP_ENDPOINT !== mcpEndpoint) throw new Error("MCP endpoint differs from public base/service ID");
  env.AGENT_MCP_ENDPOINT = mcpEndpoint;
  const control = `http://127.0.0.1:${port}`;
  if (env.AGENT_PROVIDER_CONTROL_URL && env.AGENT_PROVIDER_CONTROL_URL !== control) throw new Error("control URL differs from local listener");
  env.AGENT_PROVIDER_CONTROL_URL = control;
  for (const key of ["MARKET_BASE_URL", "SETTLEMENT_BASE_URL"]) env[key]=serviceBase(need(key),key);
  for (const key of ["AGENT_NATIVE_ASSET", "AGENT_NATIVE_SELLER"]) if (!isAddress(need(key))) throw new Error(`${key} must be an address`);
  if (!/^eip155:[1-9][0-9]*$/.test(need("AGENT_NATIVE_NETWORK"))) throw new Error("native network must be canonical eip155");
  for (const key of ["AGENT_NATIVE_SKILL_ID", "AGENT_NATIVE_OFFER_ID"]) if (!(allowMissingIdentifiers && !env[key]) && !/^0x[0-9a-f]{64}$/.test(need(key))) throw new Error(`${key} must be canonical bytes32`);
  if (env.AGENT_NATIVE_PROFILE_HASH && !/^0x[0-9a-f]{64}$/.test(env.AGENT_NATIVE_PROFILE_HASH)) throw new Error("profile hash must be canonical bytes32");
  for (const key of ["AGENT_NATIVE_BASE_AMOUNT", "AGENT_NATIVE_UNIT_PRICE", "AGENT_NATIVE_MAX_USAGE_UNITS"]) {
    if (!/^(0|[1-9][0-9]*)$/.test(need(key))) throw new Error(`${key} must be an unsigned integer`);
  }
  if(env.AGENT_NATIVE_SERVICE_WINDOW_SECONDS!==undefined&&(!/^[1-9][0-9]*$/.test(env.AGENT_NATIVE_SERVICE_WINDOW_SECONDS)||Number(env.AGENT_NATIVE_SERVICE_WINDOW_SECONDS)>31536000))throw Error("Service duration must be 1..31536000 seconds or omitted");
  const lifetime = quoteLifetime(env);
  if (BigInt(env.AGENT_NATIVE_MAX_USAGE_UNITS) < 1n ||
      (requireFreshOffer && lifetime.validUntil && BigInt(lifetime.validUntil) <= BigInt(Math.floor(now / 1000)))) throw new Error("offer usage limit must be positive and expiry must be in the future");
  for (const key of ["MARKET_SESSION_TOKEN_FILE", "AGENT_PROVIDER_BINDING_STATE_FILE", "AGENT_PROVIDER_BINDING_CREDENTIAL_FILE"]) {
    if (!isAbsolute(need(key))) throw new Error(`${key} must be an absolute path`);
  }
  for (const key of ["AGENT_PROVIDER_DB_HOST", "AGENT_PROVIDER_DB_USER", "AGENT_PROVIDER_DB_NAME"]) need(key);
  const dbPort = Number(need("AGENT_PROVIDER_DB_PORT"));
  if (!Number.isInteger(dbPort) || dbPort < 1 || dbPort > 65535) throw new Error("invalid Provider database port");
  if (env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE === "admitted" && !isAbsolute(need("AGENT_PROVIDER_CREDENTIAL_FILE"))) throw new Error("paid credential path must be absolute");
  // Identity comes from B1; derive the canonical hash only after binding exists.
  return { env, mcpEndpoint, paymentEndpoint: paymentEndpointForService(mcpEndpoint, serviceId),
    report: { serviceId, mcpEndpoint, admissionState: env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE,
      listenUrl: control, credentialsPrinted: false } };
}

export function deriveHostProfileHash(env, binding) {
  const hash = hashServiceProfile({ version: "agentpay.service-profile.v1", providerId: binding.providerId,
    serviceId: env.AGENT_PROD_SERVICE_ID, mcpEndpoint: env.AGENT_MCP_ENDPOINT,
    paymentEndpoint: paymentEndpointForService(env.AGENT_MCP_ENDPOINT, env.AGENT_PROD_SERVICE_ID),
    seller: env.AGENT_NATIVE_SELLER, network: env.AGENT_NATIVE_NETWORK, asset: env.AGENT_NATIVE_ASSET });
  if (env.AGENT_NATIVE_PROFILE_HASH && env.AGENT_NATIVE_PROFILE_HASH !== hash) throw new Error("configured profile hash differs from B1 identity");
  return hash;
}

// systemd already supplies the Provider's separate environment. Forward only
// the same fields as the standalone owner-held configuration, never platform
// credentials, arbitrary NODE_OPTIONS or historical rehearsal aliases.
export function selectProviderHostEnvironment(input) {
  return Object.fromEntries([...allowed].filter(key => typeof input[key] === 'string').map(key => [key, input[key]]));
}
