#!/usr/bin/env node
import { createProviderServiceClient } from "../src/provider-service-client.mjs";
const action = process.argv[2];
try {
  if (process.argv.length !== 3 || !["preview", "register", "status"].includes(action)) {
    throw new Error("Usage: node scripts/provider-service.mjs preview|register|status");
  }
  const required = (name) => { const value = String(process.env[name] || "").trim();
    if (!value) throw new Error(`${name} is required`); return value; };
  const client = createProviderServiceClient({ settlementBaseUrl: required("SETTLEMENT_BASE_URL"),
    serviceId: required("AGENT_PROD_SERVICE_ID"), mcpEndpoint: required("AGENT_MCP_ENDPOINT"),
    skillId: required("AGENT_NATIVE_SKILL_ID"), profileHash: required("AGENT_NATIVE_PROFILE_HASH"),
    seller: required("AGENT_NATIVE_SELLER"), network: required("AGENT_NATIVE_NETWORK"),
    asset: required("AGENT_NATIVE_ASSET"), credentialFile: required("AGENT_PROVIDER_BINDING_CREDENTIAL_FILE"),
    bindingStateFile: required("AGENT_PROVIDER_BINDING_STATE_FILE"), providerControlUrl: process.env.AGENT_PROVIDER_CONTROL_URL });
  console.log(JSON.stringify({ ok: true, action, result: await client[action]() }, null, 2));
} catch (error) { console.error(JSON.stringify({ ok: false, action, error: { message: error.message } })); process.exitCode = 1; }
