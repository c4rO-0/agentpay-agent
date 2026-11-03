import {serviceBase,serviceUrl} from './service-url.mjs';
import { lstat, readFile, writeFile } from "node:fs/promises";
import { readProviderBinding, saveProviderBinding } from "./provider-binding-state.mjs";

function required(value, name) {
  const result = String(value || "").trim();
  if (!result) throw new Error(`${name} is required`);
  return result;
}

function endpointBase(mcpEndpoint) {
  const url = new URL(required(mcpEndpoint, "mcpEndpoint"));
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash ||
      !url.pathname.endsWith("/mcp/invoke")) throw new Error("mcpEndpoint must be a clean MCP invoke URL");
  return `${url.origin}${url.pathname.slice(0, -"/invoke".length)}`;
}

function requireSafeApiUrl(url, label) {
  if (url.username || url.password || url.search || url.hash ||
      (url.protocol !== "https:" && !(url.protocol === "http:" &&
        ["127.0.0.1", "localhost", "::1", "[::1]"].includes(url.hostname)))) {
    throw new Error(`${label} must use HTTPS or loopback HTTP without URL credentials`);
  }
}

async function readPrivateFile(path, label) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || info.uid !== process.getuid() || (info.mode & 0o077)) {
    throw new Error(`${label} must be a regular, owner-held 0600-or-stricter file`);
  }
  return required(await readFile(path, "utf8"), label);
}

async function optionalPrivateFile(path, label) {
  try { return await readPrivateFile(path, label); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

function apiError(path, response, payload) {
  const code = payload?.error?.code || `HTTP_${response.status}`;
  return Object.assign(new Error(`${path}: ${code}`), { code, status: response.status });
}

export function createProviderBindingClient({ marketBaseUrl, settlementBaseUrl, mcpEndpoint,
  sessionToken, credentialFile, bindingStateFile, providerControlUrl, fetchImpl = fetch }) {
  const market = new URL(serviceBase(required(marketBaseUrl, "marketBaseUrl")));
  const settlement = new URL(serviceBase(required(settlementBaseUrl, "settlementBaseUrl")));
  const endpointUrl = endpointBase(mcpEndpoint);
  const session = required(sessionToken, "sessionToken");
  const credentialPath = required(credentialFile, "credentialFile");
  const statePath = required(bindingStateFile, "bindingStateFile");
  requireSafeApiUrl(market, "Market URL");
  requireSafeApiUrl(settlement, "Settlement URL");
  async function request(base, path, { method = "POST", token, body } = {}) {
    const response = await fetchImpl(serviceUrl(base,path), { method, redirect: "error",
      headers: { authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000) });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok !== true) throw apiError(path, response, payload);
    return payload.result;
  }
  const marketGet = () => request(market, `/developers/me/provider-binding?mcpEndpoint=${encodeURIComponent(mcpEndpoint)}`,
    { method: "GET", token: session });
  const marketPost = (path, body) => request(market, `/developers/me/provider-binding${path}`, { token: session, body });
  const self = async (token) => request(settlement, "/agentpay/provider/bindings/credentials/me", { token, body: {} });
  async function inspectLocal() {
    const token = await optionalPrivateFile(credentialPath, "Provider credential");
    if (!token) return { token: null, credential: null };
    try { return { token, credential: await self(token) }; }
    catch (error) {
      if (error.status === 401 || error.status === 404) return { token, credential: null, credentialError: error.code };
      throw error;
    }
  }
  async function status() {
    const remote = await marketGet();
    const local = await inspectLocal();
    const saved = await readProviderBinding(statePath, endpointUrl);
    const match = !!(remote.binding && remote.credential && local.credential &&
      remote.binding.providerId === local.credential.providerId &&
      remote.binding.credentialId === local.credential.credentialId &&
      remote.binding.endpointUrl === local.credential.endpointUrl &&
      remote.credential.credentialId === local.credential.credentialId &&
      remote.credential.credentialStatus === local.credential.credentialStatus);
    return { binding: remote.binding, credential: remote.credential, localCredentialPresent: !!local.token,
      localCredential: local.credential, localCredentialError: local.credentialError || null,
      localCredentialMatches: match, savedBinding: saved,
      ready: !!(match && remote.binding.status === "verified" && remote.credential.credentialStatus === "active" &&
        saved?.providerId === remote.binding.providerId && saved?.credentialId === remote.binding.credentialId) };
  }
  async function storeIssued(result) {
    if (!result?.credential || !result?.binding?.credentialId || !result?.challenge?.challengeId ||
        result.binding.endpointUrl !== endpointUrl || result.binding.status !== "pending") {
      throw new Error("Market returned an incomplete pending binding");
    }
    await writeFile(credentialPath, `${result.credential}\n`, { flag: "wx", mode: 0o600 });
    return { binding: result.binding, challengeId: result.challenge.challengeId,
      credentialFile: credentialPath, credentialSaved: true };
  }
  async function issue() {
    const remote = await marketGet();
    if (remote.binding && remote.binding.status !== "revoked") throw new Error("binding already exists; use status/resume or explicit reissue/rotate");
    if (await optionalPrivateFile(credentialPath, "Provider credential")) throw new Error("credential file already exists");
    return storeIssued(await marketPost("/issue", { mcpEndpoint }));
  }
  async function reissue() {
    const remote = await marketGet();
    if (remote.binding?.status !== "pending") throw new Error("only a pending binding may be explicitly reissued");
    if (await optionalPrivateFile(credentialPath, "Provider credential")) throw new Error("new credential file must not already exist");
    return storeIssued(await marketPost("/issue", { mcpEndpoint }));
  }
  async function recover() {
    const remote = await marketGet();
    if (remote.binding?.status !== "verified" || remote.credential?.credentialStatus === "active") {
      throw new Error("recover requires a verified binding without an active credential; use rotate if active");
    }
    if (await optionalPrivateFile(credentialPath, "Provider credential")) throw new Error("new credential file must not already exist");
    return storeIssued(await marketPost("/issue", { mcpEndpoint }));
  }
  async function rotate() {
    const remote = await marketGet();
    if (remote.binding?.status !== "verified" || remote.credential?.credentialStatus !== "active") {
      throw new Error("only an active verified binding may be rotated");
    }
    if (await optionalPrivateFile(credentialPath, "Provider credential")) throw new Error("new credential file must not already exist");
    return storeIssued(await marketPost("/rotate", { mcpEndpoint }));
  }
  async function resume() {
    const remote = await marketGet();
    const binding = remote.binding;
    if (!binding || !["pending", "verified"].includes(binding.status)) throw new Error("no pending or verified binding for this endpoint");
    const token = await readPrivateFile(credentialPath, "Provider credential");
    const mine = await self(token);
    if (mine.providerId !== binding.providerId || mine.credentialId !== binding.credentialId ||
        mine.endpointUrl !== endpointUrl || remote.credential?.credentialId !== mine.credentialId) {
      throw new Error("local credential does not match the Market/Settlement binding");
    }
    if (binding.status === "verified") {
      if (mine.credentialStatus !== "active") throw new Error("verified binding has no active credential");
      const saved = await saveProviderBinding(statePath, binding);
      return { binding: saved, action: "restored_verified_binding" };
    }
    if (!["pending_verification", "active"].includes(mine.credentialStatus)) {
      throw new Error("pending binding credential is no longer usable");
    }
    const intent = await marketPost("", { mcpEndpoint, providerId: binding.providerId,
      credentialId: binding.credentialId });
    const challengeId = intent?.challenge?.challengeId;
    if (!challengeId || intent?.binding?.credentialId !== mine.credentialId) throw new Error("Market challenge does not match the credential");
    const control = new URL(required(providerControlUrl, "providerControlUrl"));
    if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(control.hostname) ||
        (!["http:", "https:"].includes(control.protocol) || control.pathname !== "/" || control.search || control.hash || control.username || control.password)) throw new Error("providerControlUrl must be loopback HTTP(S)");
    const authorized = await request(control, "/internal/agentpay/provider-binding/authorize",
      { token, body: { challengeId } });
    if (!authorized?.responseHeldByProvider || authorized.challengeId !== challengeId) {
      throw new Error("Provider did not hold the endpoint challenge response");
    }
    const verified = await marketPost("/verify", { challengeId });
    if (verified?.binding?.status !== "verified" || verified.binding.credentialId !== mine.credentialId ||
        verified.binding.endpointUrl !== endpointUrl) throw new Error("Market did not verify this endpoint binding");
    const active = await self(token);
    if (active.credentialStatus !== "active") throw new Error("Settlement did not activate the credential");
    const saved = await saveProviderBinding(statePath, verified.binding);
    return { binding: saved, action: "verified" };
  }
  return Object.freeze({ status, issue, reissue, recover, rotate, resume });
}

export { readPrivateFile };
