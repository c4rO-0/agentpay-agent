import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProviderBindingRuntime } from "../src/provider-binding-runtime.mjs";

test("pre-admission can start without a yet-unissued Provider Credential", async () => {
  const dir = await mkdtemp(join(tmpdir(), "agentpay-binding-startup-"));
  try {
    const options = { endpointPath: "/services/random/mcp", settlementBaseUrl: "http://127.0.0.1:6572",
      credentialFile: join(dir, "pending-provider.token") };
    assert.equal(await createProviderBindingRuntime({ ...options, allowMissing: true }), null);
    await assert.rejects(createProviderBindingRuntime(options), { code: "ENOENT" });
    await writeFile(options.credentialFile, "\n");
    await assert.rejects(createProviderBindingRuntime({ ...options, allowMissing: true }), /empty/);
    await writeFile(options.credentialFile, "test-only-token\n");
    assert.ok(await createProviderBindingRuntime({ ...options, allowMissing: true }));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
