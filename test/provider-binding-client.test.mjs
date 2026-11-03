import assert from "node:assert/strict";
import test from "node:test";
import { chmod, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createProviderBindingClient, readPrivateFile } from "../src/provider-binding-client.mjs";
import { readProviderBinding, saveProviderBinding } from "../src/provider-binding-state.mjs";

test("Provider issues once, resumes after restart, restores local state, and explicitly replaces lost pending plaintext", async () => {
  const dir = await mkdtemp(join(tmpdir(), "provider-bind-client-"));
  const endpoint = "http://127.0.0.1:6571/services/random/mcp/invoke";
  const endpointUrl = endpoint.replace(/\/invoke$/, "");
  const stateFile = join(dir, "binding.json");
  let binding = null;
  let credential = null;
  let oldCredential = null;
  let sequence = 0;
  let loadedToken = null;
  let challenge = null;
  const fetchImpl = async (input, init) => {
    assert.equal(init.redirect, "error");
    const url = new URL(input);
    const token = init.headers.authorization.replace("Bearer ", "");
    const body = init.body ? JSON.parse(init.body) : {};
    const ok = (result) => new Response(JSON.stringify({ ok: true, result }), { status: 200 });
    const error = (status, code) => new Response(JSON.stringify({ ok: false, error: { code } }), { status });
    if (url.host === "market.test") {
      if (token !== "session") return error(401, "UNAUTHORIZED");
      if (url.pathname === "/developers/me/provider-binding" && init.method === "GET") {
        return ok({ binding, credential: binding ? credential : null });
      }
      if (url.pathname.endsWith("/issue")) {
        sequence++;
        credential = { providerId: "provider:market:team", credentialId: `credential-${sequence}`,
          credentialStatus: "pending_verification", endpointUrl };
        binding = { ...credential, mcpEndpoint: endpoint, status: "pending", settlementChallengeId: `challenge-${sequence}` };
        return ok({ binding, credential: `secret-${sequence}`, challenge: { challengeId: binding.settlementChallengeId } });
      }
      if (url.pathname.endsWith("/rotate")) {
        assert.equal(binding.status, "verified");
        oldCredential = credential;
        sequence++;
        credential = { providerId: binding.providerId, credentialId: `credential-${sequence}`,
          credentialStatus: "pending_verification", endpointUrl };
        binding = { ...credential, mcpEndpoint: endpoint, status: "pending", settlementChallengeId: `challenge-${sequence}` };
        return ok({ binding, credential: `secret-${sequence}`, challenge: { challengeId: binding.settlementChallengeId } });
      }
      if (url.pathname === "/developers/me/provider-binding" && init.method === "POST") {
        assert.equal(body.credentialId, binding.credentialId);
        challenge = `challenge-resume-${++sequence}`;
        binding.settlementChallengeId = challenge;
        return ok({ binding, challenge: { challengeId: challenge } });
      }
      if (url.pathname.endsWith("/verify")) {
        assert.equal(body.challengeId, challenge);
        binding.status = "verified";
        credential.credentialStatus = "active";
        if (oldCredential) oldCredential.credentialStatus = "revoked";
        return ok({ binding });
      }
    }
    if (url.host === "settlement.test" && url.pathname.endsWith("/credentials/me")) {
      return credential.credentialStatus !== "revoked" &&
        token === `secret-${Number(credential.credentialId.split("-")[1])}` ? ok(credential) :
        oldCredential && oldCredential.credentialStatus === "active" &&
        token === `secret-${Number(oldCredential.credentialId.split("-")[1])}` ? ok(oldCredential) :
        error(401, "UNAUTHORIZED");
    }
    if (url.host === "127.0.0.1:6571" && url.pathname.endsWith("/authorize")) {
      if (loadedToken !== token) return error(401, "UNAUTHORIZED");
      assert.equal(body.challengeId, challenge);
      return ok({ challengeId: challenge, responseHeldByProvider: true });
    }
    throw new Error(`unexpected request ${url}`);
  };
  const client = (credentialFile) => createProviderBindingClient({ marketBaseUrl: "https://market.test",
    settlementBaseUrl: "https://settlement.test", mcpEndpoint: endpoint, sessionToken: "session",
    credentialFile, bindingStateFile: stateFile, providerControlUrl: "http://127.0.0.1:6571", fetchImpl });
  try {
    const firstFile = join(dir, "first.token");
    assert.equal((await client(firstFile).status()).binding, null);
    assert.equal((await client(firstFile).issue()).credentialSaved, true);
    assert.equal((await stat(firstFile)).mode & 0o077, 0);
    assert.equal((await readFile(firstFile, "utf8")).trim(), "secret-1");
    await assert.rejects(client(firstFile).issue(), /binding already exists/);
    await assert.rejects(client(firstFile).resume(), /UNAUTHORIZED/); // Provider has not loaded the file yet.
    loadedToken = "secret-1";
    assert.equal((await client(firstFile).resume()).action, "verified");
    assert.equal((await client(firstFile).status()).ready, true);
    await rm(stateFile);
    assert.equal((await client(firstFile).resume()).action, "restored_verified_binding");
    assert.equal((await client(firstFile).status()).ready, true);

    const other = { providerId: binding.providerId, credentialId: "credential-other",
      endpointUrl: "http://127.0.0.1:6571/services/other/mcp", status: "verified" };
    await saveProviderBinding(stateFile, other);
    assert.equal((await readProviderBinding(stateFile, endpointUrl)).credentialId, credential.credentialId);
    assert.equal((await readProviderBinding(stateFile, other.endpointUrl)).credentialId, "credential-other");

    const replacementFile = join(dir, "replacement.token");
    assert.equal((await client(replacementFile).rotate()).credentialSaved, true);
    assert.equal(oldCredential.credentialStatus, "active");
    assert.equal((await client(firstFile).status()).localCredentialMatches, false);
    await rm(replacementFile); // Simulate losing the one-time replacement plaintext before Provider loaded it.
    const recoveredFile = join(dir, "reissued.token");
    assert.equal((await client(recoveredFile).reissue()).credentialSaved, true);
    loadedToken = (await readFile(recoveredFile, "utf8")).trim();
    assert.equal((await client(recoveredFile).resume()).action, "verified");
    assert.equal(oldCredential.credentialStatus, "revoked");
    assert.equal((await client(recoveredFile).status()).ready, true);
    assert.equal((await readProviderBinding(stateFile, other.endpointUrl)).credentialId, "credential-other");

    credential.credentialStatus = "revoked";
    const afterRevocation = await client(recoveredFile).status();
    assert.equal(afterRevocation.ready, false);
    const revivedFile = join(dir, "revived.token");
    assert.equal((await client(revivedFile).recover()).credentialSaved, true);
    loadedToken = (await readFile(revivedFile, "utf8")).trim();
    assert.equal((await client(revivedFile).resume()).action, "verified");
    assert.equal((await client(revivedFile).status()).ready, true);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("session and Provider credentials require owner-held regular files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "provider-bind-permissions-"));
  try {
    const file = join(dir, "token");
    await writeFile(file, "secret\n", { mode: 0o600 });
    assert.equal(await readPrivateFile(file, "credential"), "secret");
    await chmod(file, 0o644);
    await assert.rejects(readPrivateFile(file, "credential"), /0600-or-stricter/);
    await chmod(file, 0o600);
    const link = join(dir, "link");
    await symlink(file, link);
    await assert.rejects(readPrivateFile(link, "credential"), /0600-or-stricter/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
