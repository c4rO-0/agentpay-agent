import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashServiceProfile } from "@agentpay/types";
import { createProviderServiceClient } from "../src/provider-service-client.mjs";
import { saveProviderBinding } from "../src/provider-binding-state.mjs";

for(const scheme of ['http','https'])for(const settlementPrefix of ['','/settlement'])test("service preview cannot register; mismatched live identity blocks registration; status does not infer qualification "+scheme+settlementPrefix, async () => {
  const dir = await mkdtemp(join(tmpdir(), "provider-service-"));
  const profile = { version: "agentpay.service-profile.v1", providerId: "provider:team", serviceId: "random",
    mcpEndpoint: `${scheme}://provider.example/services/random/mcp/invoke`,
    paymentEndpoint: `${scheme}://provider.example/services/random/agentpay/invoke`,
    seller: `0x${"1".repeat(40)}`, asset: `0x${"2".repeat(40)}`, network: "eip155:8453" };
  const skillId = `0x${"a".repeat(64)}`;
  const profileHash = hashServiceProfile(profile);
  let wrongOffer = false;
  let writes = 0;let submittedDisplay;let displayAvailable=true;
  let wrongHealth = false;
  let quoteTarget = null;
  try {
    const credentialFile = join(dir, "token");
    const bindingStateFile = join(dir, "binding.json");
    await writeFile(credentialFile, "private-token", { mode: 0o600 });
    await saveProviderBinding(bindingStateFile, { providerId: profile.providerId, credentialId: "cred",
      endpointUrl: profile.mcpEndpoint.replace(/\/invoke$/, ""), status: "verified" });
    const client = createProviderServiceClient({ ...profile, skillId, profileHash,
      settlementBaseUrl: `https://settlement.example${settlementPrefix}`, credentialFile, bindingStateFile,
      providerControlUrl: "http://127.0.0.1:6571",
      fetchImpl: async (input, options) => {
        assert.equal(options.redirect, "error");
        const url = new URL(input);
        if(url.hostname==='settlement.example')assert.ok(url.pathname.startsWith(settlementPrefix+'/agentpay/'),'Settlement prefix lost');
        const ok = (result) => new Response(JSON.stringify({ ok: true, result }));
        if (url.pathname.endsWith("/credentials/me")) return ok({ providerId: profile.providerId,
          credentialId: "cred", endpointUrl: profile.mcpEndpoint.replace(/\/invoke$/, ""), credentialStatus: "active" });
        if (url.pathname.endsWith("/invoke")) return new Response(JSON.stringify({ version: "agentpay.service-payment-required.v1",
          resource: { url: profile.paymentEndpoint, method: "POST" }, requirement: { skillId, profileHash,
            seller: wrongOffer ? `0x${"3".repeat(40)}` : profile.seller, asset: profile.asset, network: profile.network } }), { status: 402 });
        if (url.pathname.endsWith('/display')) {if(!displayAvailable)throw Error('optional endpoint missing');return ok({name:'Random',summary:'Generate a number',usage:'Call the client'});}
        if (url.pathname.endsWith("/register")) { submittedDisplay=JSON.parse(options.body).display;writes++; return ok({ skillId, profileHash,
          providerId: profile.providerId, serviceId: profile.serviceId, paymentEndpoint: profile.paymentEndpoint, created: writes === 1 }); }
        if (url.pathname.endsWith("/read")) return ok({ registered: true, profile, quoteTarget,
          serviceStatus: { qualification: { qualificationStatus: "not_qualified" }, quote: { quoteStatus: "missing" } } });
        if (url.pathname === "/health") return new Response(JSON.stringify({ ok: true, result: {
          serviceId: wrongHealth ? "other" : profile.serviceId,
          nativeProvider: { enabled: true, admissionState: "pre_admission", route: "/services/random/agentpay/invoke" } } }));
        if (url.pathname.endsWith("/purchase-readiness")) return ok({ commercialReady: false, blockers: ["NATIVE_QUOTE_NOT_FOUND"], quote: null });
        throw new Error("unexpected request");
      } });
    await client.preview();
    assert.equal(writes, 0);
    wrongOffer = true;
    await assert.rejects(client.register(), /402 differs/);
    assert.equal(writes, 0);
    wrongOffer = false;
    assert.equal((await client.register()).registration.created, true);
    assert.equal(submittedDisplay.name,'Random');
    displayAvailable=false;await client.preview();assert.equal(writes,1);
    const status = await client.status();
    assert.equal(status.readiness.commercialReady, false);
    assert.equal(status.readinessScope, "first_blocker_snapshot");
    assert.equal(status.localAdmission.admissionState, "pre_admission");
    assert.ok(status.nextActions.includes("await_registry_qualification"));
    assert.ok(status.nextActions.includes("await_or_check_quote_observation"));
    assert.ok(status.nextActions.includes("review_and_configure_local_admission"));
    quoteTarget = { observationFailed: true, observationError: {code:"QUOTE_OFFER_CONFLICT",message:"new offerId required"} };
    assert.equal((await client.status()).quoteRecovery.action, "prepare_changed_offer_and_restart");
    quoteTarget = { observationFailed: true };
    assert.equal((await client.status()).quoteRecovery.code, "QUOTE_OBSERVATION_FAILED");
    wrongHealth = true;
    assert.equal((await client.status()).localAdmission.admissionState, "unknown");
    assert.equal(writes, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
