import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProviderBindingRuntime } from "../src/provider-binding-runtime.mjs";

const dir = await mkdtemp(join(tmpdir(), "agentpay-provider-binding-"));
const tokenFile = join(dir, "provider.token");
await writeFile(tokenFile, "test-provider-token\n", { mode: 0o400 });
const challengeId = `provider_challenge_${"a".repeat(32)}`;
let calls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (_url, options) => {
  calls++;
  assert.equal(options.headers.authorization, "Bearer test-provider-token");
  return Response.json({ ok: true, result: { challengeResponse: "private-response",
    challengeUrl: `http://127.0.0.1:6571/services/random/mcp/.well-known/agentpay/provider-binding/${challengeId}`,
    expiresAt: new Date(Date.now() + 60_000).toISOString() } });
};
const runtime = await createProviderBindingRuntime({ endpointPath: "/services/random/mcp",
  settlementBaseUrl: "http://127.0.0.1:6572", credentialFile: tokenFile });
const invoke = async (method, path, bearer = "") => {
  let status; let output = "";
  const req = { method, headers: { authorization: bearer && `Bearer ${bearer}` } };
  const res = { writeHead(code) { status = code; }, end(value = "") { output = value; } };
  const json = (_res, code, body) => { status = code; output = JSON.stringify(body); };
  const handled = await runtime.handle(req, res, new URL(path, "http://127.0.0.1"), {
    json, readJson: async () => ({ challengeId }) });
  return { handled, status, output };
};
try {
  assert.equal((await invoke("GET", `/services/random/mcp/.well-known/agentpay/provider-binding/${challengeId}`)).status, 404);
  assert.equal((await invoke("POST", "/internal/agentpay/provider-binding/authorize", "wrong-token")).status, 401);
  assert.equal(calls, 0);
  const authorized = await invoke("POST", "/internal/agentpay/provider-binding/authorize", "test-provider-token");
  assert.equal(authorized.status, 200);
  assert.equal(authorized.output.includes("private-response"), false);
  assert.equal(calls, 1);
  const served = await invoke("GET", `/services/random/mcp/.well-known/agentpay/provider-binding/${challengeId}`);
  assert.equal(served.status, 200);
  assert.equal(served.output, "private-response");
  process.stdout.write(`${JSON.stringify({ ok: true, unauthorizedRejected: true,
    responseNotReturnedToOperator: true, scopedChallengeServed: true })}\n`);
} finally {
  globalThis.fetch = originalFetch;
  await rm(dir, { recursive: true });
}
