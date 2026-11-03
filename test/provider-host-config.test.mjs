import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkProviderHostConfig, loadProviderHostConfig, deriveHostProfileHash } from "../src/provider-host-config.mjs";

const config = { MARKET_BASE_URL: "https://market.example", SETTLEMENT_BASE_URL: "https://settlement.example",
  AGENT_PROD_SERVICE_ID: "random", AGENT_PROD_KIND: "random", AGENT_PROD_HOST: "127.0.0.1", AGENT_PROD_PORT: "6571",
  AGENT_PUBLIC_BASE_URL: "https://provider.example", AGENTPAY_NATIVE_PROVIDER_ENABLED: "true",
  AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE: "pre_admission", MARKET_SESSION_TOKEN_FILE: "/private/session",
  AGENT_PROVIDER_BINDING_STATE_FILE: "/private/binding", AGENT_PROVIDER_BINDING_CREDENTIAL_FILE: "/private/token",
  AGENT_NATIVE_NETWORK: "eip155:8453", AGENT_NATIVE_ASSET: `0x${"1".repeat(40)}`, AGENT_NATIVE_SELLER: `0x${"2".repeat(40)}`,
  AGENT_NATIVE_SKILL_ID: `0x${"a".repeat(64)}`, AGENT_NATIVE_OFFER_ID: `0x${"b".repeat(64)}`,
  AGENT_NATIVE_BASE_AMOUNT: "1", AGENT_NATIVE_UNIT_PRICE: "1", AGENT_NATIVE_MAX_USAGE_UNITS: "1",
  AGENT_NATIVE_VALID_UNTIL: "2000000000", AGENT_PROVIDER_DB_HOST: "127.0.0.1", AGENT_PROVIDER_DB_PORT: "3306",
  AGENT_PROVIDER_DB_USER: "provider", AGENT_PROVIDER_DB_NAME: "provider" };
test("host precheck derives endpoints and rejects unsafe listener, drift, expiry and profile mismatch", () => {
  const checked = checkProviderHostConfig(config, 1800000000000);
  assert.equal(checked.env.AGENT_MCP_ENDPOINT, "https://provider.example/services/random/mcp/invoke");
  const prefixed=checkProviderHostConfig({...config,AGENT_PUBLIC_BASE_URL:'https://platform.example/provider'},1800000000000);
  assert.equal(prefixed.mcpEndpoint,'https://platform.example/provider/services/random/mcp/invoke');
  assert.equal(prefixed.paymentEndpoint,'https://platform.example/provider/services/random/agentpay/invoke');
  assert.equal(prefixed.report.listenUrl,'http://127.0.0.1:6571');
  const hash = deriveHostProfileHash(checked.env, { providerId: "provider:team" });
  assert.match(hash, /^0x[0-9a-f]{64}$/);
  const expired = { ...config, AGENT_NATIVE_VALID_UNTIL: "1" };
  assert.throws(() => checkProviderHostConfig(expired, 1800000000000), /expiry/);
  assert.equal(checkProviderHostConfig(expired, 1800000000000, { requireFreshOffer: false }).env.AGENT_NATIVE_VALID_UNTIL, "1");
  assert.throws(() => deriveHostProfileHash({ ...checked.env, AGENT_NATIVE_PROFILE_HASH: `0x${"c".repeat(64)}` }, { providerId: "provider:team" }), /hash differs/);
  for (const change of [{ AGENT_PROD_HOST: "0.0.0.0" }, { AGENT_MCP_ENDPOINT: "https://other.example/mcp/invoke" },
    { AGENT_NATIVE_VALID_UNTIL: "1" }, { SETTLEMENT_BASE_URL: "http://settlement.example" }]) {
    assert.throws(() => checkProviderHostConfig({ ...config, ...change }, 1800000000000));
  }
});
test("host configuration supports rolling validity and refuses ambiguous fixed-plus-rolling modes", () => {
  const rolling = { ...config, AGENT_NATIVE_QUOTE_TTL_SECONDS: '600' };
  delete rolling.AGENT_NATIVE_VALID_UNTIL;
  assert.equal(checkProviderHostConfig(rolling).env.AGENT_NATIVE_QUOTE_TTL_SECONDS, '600');
  assert.throws(() => checkProviderHostConfig({ ...rolling, AGENT_NATIVE_VALID_UNTIL: '2000000000' }), /choose fixed/);
});
test("host config cannot load platform keys or execute shell expressions", async () => {
  const dir = await mkdtemp(join(tmpdir(), "provider-host-"));
  try {
    const path = join(dir, "provider.env");
    await writeFile(path, "SETTLEMENT_DB_PASSWORD=platform-secret\n", { mode: 0o600 });
    await assert.rejects(loadProviderHostConfig(path), /unsupported Provider config key/);
    await writeFile(path, 'MARKET_EMAIL="$(touch should-not-exist)"\n');
    assert.equal((await loadProviderHostConfig(path)).MARKET_EMAIL, "$(touch should-not-exist)");
  } finally { await rm(dir, { recursive: true, force: true }); }
});


test("host CLI prepares and checks automatically without a bootstrap hash or platform calls", async () => {
  const { spawnSync } = await import("node:child_process");
  const dir = await mkdtemp(join(tmpdir(), "provider-host-cli-"));
  try {
    const settings = {...config, AGENT_PROVIDER_BINDING_STATE_FILE:join(dir,"binding.json"),
      AGENT_PROVIDER_SERVICE_STATE_FILE:join(dir,"service.json")};
    delete settings.AGENT_NATIVE_SKILL_ID;
    delete settings.AGENT_NATIVE_OFFER_ID;
    const path = join(dir,"provider.env");
    await writeFile(path,Object.entries(settings).map(([k,v])=>`${k}=${v}`).join("\n"),{mode:0o600});
    const run = (...args) => {
      const childEnv={...process.env};
      delete childEnv.NODE_TEST_CONTEXT;
      const child=spawnSync(process.execPath,[new URL("../scripts/provider-host.mjs",import.meta.url).pathname,path,...args],{encoding:"utf8",env:childEnv});
      assert.equal(child.status,0,child.stderr);
      assert.ok(child.stdout,JSON.stringify(child));
      return JSON.parse(child.stdout);
    };
    const first=run("service","prepare");
    assert.equal(first.bindingPresent,false);
    assert.equal(first.remoteWrites,false);
    assert.equal(run("service","prepare").offerId,first.offerId);
    assert.equal(run("check").profileHash,first.profileHash);
    const {saveProviderBinding}=await import("../src/provider-binding-state.mjs");
    await saveProviderBinding(settings.AGENT_PROVIDER_BINDING_STATE_FILE,{providerId:"provider:team",credentialId:"credential",status:"verified",
      endpointUrl:"https://provider.example/services/random/mcp"});
    const verified=run("service","prepare");
    assert.equal(verified.skillId,first.skillId);
    assert.notEqual(verified.offerId,first.offerId);
    assert.notEqual(verified.profileHash,first.profileHash);
    assert.equal(run("check").profileHash,verified.profileHash);
  } finally {await rm(dir,{recursive:true,force:true});}
});
