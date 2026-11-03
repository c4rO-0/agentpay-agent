#!/usr/bin/env node
// Supplier-side binding. Reads only this Provider's configuration/private files
// and the authenticated Market/Settlement APIs; never prints credential plaintext.
import { createProviderBindingClient, readPrivateFile } from "../src/provider-binding-client.mjs";

const action = process.argv[2];
if (process.argv.length !== 3 || !["status", "issue", "reissue", "recover", "rotate", "resume"].includes(action)) {
  process.stderr.write("Usage: node scripts/provider-bind.mjs status|issue|reissue|recover|rotate|resume\n");
  process.exit(2);
}
const required = (name) => {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};
try {
  const client = createProviderBindingClient({
    marketBaseUrl: required("MARKET_BASE_URL"),
    settlementBaseUrl: required("SETTLEMENT_BASE_URL"),
    mcpEndpoint: required("AGENT_MCP_ENDPOINT"),
    sessionToken: await readPrivateFile(required("MARKET_SESSION_TOKEN_FILE"), "Market session"),
    credentialFile: required("AGENT_PROVIDER_BINDING_CREDENTIAL_FILE"),
    bindingStateFile: required("AGENT_PROVIDER_BINDING_STATE_FILE"),
    providerControlUrl: process.env.AGENT_PROVIDER_CONTROL_URL || ""
  });
  const result = await client[action]();
  process.stdout.write(`${JSON.stringify({ ok: true, action, result }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, action,
    error: { code: error.code || "PROVIDER_BINDING_FAILED", message: error.message } })}\n`);
  process.exitCode = 1;
}
