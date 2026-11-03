import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, stat, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareProviderServiceState, loadProviderServiceState } from "../src/provider-service-state.mjs";
const env = { AGENT_PROD_SERVICE_ID: "random", AGENT_MCP_ENDPOINT: "https://provider.example/random",
  AGENT_NATIVE_PROFILE_HASH: `0x${"1".repeat(64)}`, AGENT_NATIVE_NETWORK: "eip155:8453",
  AGENT_NATIVE_ASSET: `0x${"2".repeat(40)}`, AGENT_NATIVE_SELLER: `0x${"3".repeat(40)}`,
  AGENT_NATIVE_BASE_AMOUNT: "0", AGENT_NATIVE_UNIT_PRICE: "1", AGENT_NATIVE_MAX_USAGE_UNITS: "1", AGENT_NATIVE_VALID_UNTIL: "2000000000" };
test("saved identity survives retries; changed offer requires preparation and keeps skillId", async () => {
  const dir = await mkdtemp(join(tmpdir(), "provider-service-"));
  try {
    const path = join(dir, "service.json");
    await assert.rejects(loadProviderServiceState(path, env), /missing/);
    const first = await prepareProviderServiceState(path, env);
    assert.match(first.skillId, /^0x[0-9a-f]{64}$/);
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    assert.deepEqual(await prepareProviderServiceState(path, env), first);
    const changed = { ...env, AGENT_NATIVE_UNIT_PRICE: "2" };
    await assert.rejects(loadProviderServiceState(path, changed), /changed/);
    assert.deepEqual(await loadProviderServiceState(path, changed, {allowOfferDrift:true}), first);
    const second = await prepareProviderServiceState(path, changed);
    assert.equal(second.skillId, first.skillId);
    assert.notEqual(second.offerId, first.offerId);
    assert.equal((await loadProviderServiceState(path, changed)).offerId, second.offerId);
    await assert.rejects(prepareProviderServiceState(path, {...changed, AGENT_MCP_ENDPOINT:"https://other.example"}), /another endpoint/);
    await writeFile(`${path}.lock`, "123\n", {mode:0o600});
    await assert.rejects(prepareProviderServiceState(path, changed), /BUSY/);
    await rm(`${path}.lock`);
    await rm(path);
    await symlink(join(dir,"missing"),path);
    await assert.rejects(prepareProviderServiceState(path, env), /regular/);
  } finally { await rm(dir, {recursive:true,force:true}); }
});
