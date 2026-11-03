import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readProviderBinding, saveProviderBinding } from "../src/provider-binding-state.mjs";
import {serviceReference} from "../src/service-reference.mjs";
import {hashServiceProfile} from "@agentpay/types";

test("unbound service has no identity; verified endpoints persist independently", async () => {
  const dir = await mkdtemp(join(tmpdir(), "provider-binding-state-"));
  const path = join(dir, "binding.json");
  const endpoint = "http://127.0.0.1:6571/services/random/mcp";
  try {
    assert.equal(await readProviderBinding(path, endpoint), null);
    assert.equal(await readProviderBinding(undefined, endpoint), null);
    const binding = { providerId: "provider:market:current", credentialId: "credential-current",
      endpointUrl: endpoint, status: "verified" };
    await writeFile(path, JSON.stringify({ version: "agentpay.provider-binding-state.v1",
      bindings: [binding, { ...binding, endpointUrl: "http://127.0.0.1:6571/services/other/mcp",
        credentialId: "credential-other" }] }), { mode: 0o600 });
    const restored = await readProviderBinding(path, endpoint);
    assert.deepEqual(restored, binding);
    const profile={version:'agentpay.service-profile.v1',providerId:restored.providerId,serviceId:'random',mcpEndpoint:endpoint+'/invoke',paymentEndpoint:endpoint.replace(/\/mcp$/,'/agentpay/invoke'),seller:'0x'+'1'.repeat(40),network:'eip155:31337',asset:'0x'+'2'.repeat(40)};
    const skill=serviceReference({skillId:'0x'+'1'.repeat(64),profileHash:hashServiceProfile(profile),profile});
    assert.equal(skill.profile.providerId,'provider:market:current');
    assert.equal(await readProviderBinding(path, "http://127.0.0.1:6571/services/missing/mcp"), null);
    // A new read after the file is replaced observes the new onboarding result.
    await writeFile(path, JSON.stringify({ version: "agentpay.provider-binding-state.v1",
      bindings: [{ ...binding, providerId: "provider:market:next" }] }));
    assert.equal((await readProviderBinding(path, endpoint)).providerId, "provider:market:next");
    for (const bindings of [[{ ...binding, status: "pending" }], [binding, binding]]) {
      await writeFile(path, JSON.stringify({ version: "agentpay.provider-binding-state.v1", bindings }));
      await assert.rejects(readProviderBinding(path, endpoint), /PROVIDER_BINDING_STATE/);
    }
    await writeFile(path, "{broken");
    await assert.rejects(readProviderBinding(path, endpoint));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("concurrent endpoint saves cannot silently lose a sibling record", async () => {
  const dir = await mkdtemp(join(tmpdir(), "provider-binding-concurrent-"));
  try {
    const path = join(dir, "binding.json");
    const entries = ["a", "b"].map((name) => ({ providerId: "provider:team", credentialId: name,
      endpointUrl: `https://provider.example/services/${name}/mcp`, status: "verified" }));
    const results = await Promise.allSettled(entries.map((entry) => saveProviderBinding(path, entry)));
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === "rejected") {
        assert.match(results[i].reason.message, /STATE_BUSY/);
        await saveProviderBinding(path, entries[i]);
      }
    }
    for (const entry of entries) assert.equal((await readProviderBinding(path, entry.endpointUrl)).credentialId, entry.credentialId);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
