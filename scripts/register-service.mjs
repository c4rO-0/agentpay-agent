#!/usr/bin/env node
// Supplier-side operation. Uses only the Provider's public config, binding
// state and M2M credential; it has no Settlement database access.
import { lstat, readFile } from "node:fs/promises";
import { readProviderBinding } from "../src/provider-binding-state.mjs";

const execute = process.argv[2] === "--execute";
if (process.argv.length > 3 || (process.argv[2] && !["--preview", "--execute"].includes(process.argv[2]))) {
  throw new Error("Usage: register-service [--preview | --execute]");
}
const required = (name) => {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
};
const serviceId = required("AGENT_PROD_SERVICE_ID");
const host = required("AGENT_PROD_HOST");
const port = required("AGENT_PROD_PORT");
const settlementBaseUrl = required("SETTLEMENT_BASE_URL");
if (host !== "127.0.0.1" || port !== "6571" ||
  settlementBaseUrl !== "http://127.0.0.1:6572" ||
  required("AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE") !== "pre_admission") {
  throw new Error("reviewed private Provider runtime required");
}
const base = `http://${host}:${port}`;
const mcpEndpoint = `${base}/services/${encodeURIComponent(serviceId)}/mcp/invoke`;
const endpoint = mcpEndpoint.replace(/\/invoke$/, "");
const paymentEndpoint = `${base}/services/${encodeURIComponent(serviceId)}/agentpay/invoke`;
const binding = await readProviderBinding(required("AGENT_PROVIDER_BINDING_STATE_FILE"), endpoint);
if (!binding) throw new Error("verified binding for this service is missing");
const tokenPath = required("AGENT_PROVIDER_BINDING_CREDENTIAL_FILE");
const tokenInfo = await lstat(tokenPath);
if (!tokenInfo.isFile() || tokenInfo.isSymbolicLink() || tokenInfo.uid !== process.getuid() ||
  (tokenInfo.mode & 0o377)) throw new Error("Provider credential file permissions changed");
const profile = { version: "agentpay.service-profile.v1", providerId: binding.providerId,
  serviceId, mcpEndpoint, paymentEndpoint, seller: required("AGENTPAY_REHEARSAL_SELLER_ADDRESS"),
  network: "eip155:31337", asset: required("AGENT_PROD_SETTLEMENT_TOKEN_ADDRESS") };
// Register the Provider-served paid Skill identity, not the User-installed package identity.
const skillId = required("AGENTPAY_REHEARSAL_SKILL_ID").toLowerCase();
const profileHash = required("AGENTPAY_REHEARSAL_PROFILE_HASH").toLowerCase();
if (!/^0x[0-9a-f]{64}$/.test(skillId) || !/^0x[0-9a-f]{64}$/.test(profileHash)) {
  throw new Error("Provider Skill identity is invalid");
}
const response = await fetch(paymentEndpoint, { method: "POST",
  headers: { "content-type": "application/json", "x-agentpay-conformance": "1" },
  body: JSON.stringify({ agentpayConformance: true }), signal: AbortSignal.timeout(5000) });
const payload = await response.json();
if (response.status !== 402 || payload.version !== "agentpay.service-payment-required.v1" ||
  payload.resource?.url !== paymentEndpoint || payload.resource?.method !== "POST" ||
  payload.requirement?.skillId !== skillId || payload.requirement?.profileHash !== profileHash ||
  payload.requirement?.seller?.toLowerCase() !== profile.seller.toLowerCase() ||
  payload.requirement?.network !== profile.network ||
  payload.requirement?.asset?.toLowerCase() !== profile.asset.toLowerCase()) {
  throw new Error("running Provider 402 differs from configured service identity");
}
const report = { ok: true, role: "provider", mode: execute ? "execute" : "preview",
  providerId: binding.providerId, serviceId, skillId, profileHash, mcpEndpoint,
  paymentEndpoint, settlementUrl: `${settlementBaseUrl}/agentpay/provider/services/register`,
  providerResponseStatus: 402, registrationPerformed: false };
if (!execute) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }
const credential = (await readFile(tokenPath, "utf8")).trim();
if (!credential) throw new Error("Provider credential is empty");
const registered = await fetch(report.settlementUrl, { method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${credential}` },
  body: JSON.stringify({ skillId, profileHash, profile }), signal: AbortSignal.timeout(10000) });
const body = await registered.json();
if (![200, 201].includes(registered.status) || body.ok !== true ||
  body.result?.skillId !== skillId || body.result?.profileHash !== profileHash ||
  body.result?.providerId !== binding.providerId || body.result?.serviceId !== serviceId ||
  body.result?.paymentEndpoint !== paymentEndpoint) {
  throw new Error(`Settlement service registration returned HTTP ${registered.status} ${body?.error?.code || "UNEXPECTED_RESULT"}`);
}
console.log(JSON.stringify({ ...report, registrationPerformed: true,
  settlementStatus: registered.status, created: body.result.created }, null, 2));
