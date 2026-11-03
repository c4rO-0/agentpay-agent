import { lstat, readFile, writeFile, rename, rm } from "node:fs/promises";
import { randomBytes, randomUUID, createHash } from "node:crypto";

const bytes32 = value => /^0x[0-9a-f]{64}$/.test(value || "");
const version = "agentpay.provider-service-state.v1";
const id = () => `0x${randomBytes(32).toString("hex")}`;
function signature(env) {
  return createHash("sha256").update(JSON.stringify([
    env.AGENT_PROD_SERVICE_ID, env.AGENT_MCP_ENDPOINT, env.AGENT_NATIVE_PROFILE_HASH,
    env.AGENT_NATIVE_NETWORK, env.AGENT_NATIVE_ASSET.toLowerCase(), env.AGENT_NATIVE_SELLER.toLowerCase(),
    env.AGENT_NATIVE_BASE_AMOUNT, env.AGENT_NATIVE_UNIT_PRICE, env.AGENT_NATIVE_MAX_USAGE_UNITS,
    env.AGENT_NATIVE_VALID_UNTIL || `rolling:${env.AGENT_NATIVE_QUOTE_TTL_SECONDS || '600'}`
  ])).digest("hex");
}
async function read(path) {
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.uid !== process.getuid() || (info.mode & 0o077)) {
      throw new Error("Provider service state must be an owner-held regular 0600-or-stricter file");
    }
    const state = JSON.parse(await readFile(path, "utf8"));
    if (state.version !== version || !bytes32(state.skillId) || !bytes32(state.offerId) ||
        !/^[0-9a-f]{64}$/.test(state.signature || "") || !state.endpoint || !state.serviceId) {
      throw new Error("invalid Provider service state; restore the saved file rather than regenerating identity");
    }
    return state;
  } catch (error) { if (error.code === "ENOENT") return null; throw error; }
}
function checkIdentity(state, env) {
  if (state.endpoint !== env.AGENT_MCP_ENDPOINT || state.serviceId !== env.AGENT_PROD_SERVICE_ID) {
    throw new Error("service state belongs to another endpoint/service; use a separate state file");
  }
  if (env.AGENT_NATIVE_SKILL_ID && env.AGENT_NATIVE_SKILL_ID !== state.skillId) throw new Error("configured skillId differs from saved identity");
  if (env.AGENT_NATIVE_OFFER_ID && env.AGENT_NATIVE_OFFER_ID !== state.offerId) throw new Error("configured offerId differs from saved identity; remove the manual override before prepare");
}
export async function prepareProviderServiceState(path, env) {
  if (!path?.startsWith("/")) throw new Error("AGENT_PROVIDER_SERVICE_STATE_FILE must be absolute");
  const lock = `${path}.lock`;
  try { await writeFile(lock, `${process.pid}\n`, { flag: "wx", mode: 0o600 }); }
  catch (error) { if (error.code === "EEXIST") throw new Error("PROVIDER_SERVICE_STATE_BUSY: retry; inspect a stale lock before removing it"); throw error; }
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const prior = await read(path);
    if (prior) checkIdentity(prior, env);
    const nextSignature = signature(env);
    if (prior?.signature === nextSignature) return prior;
    if (prior && env.AGENT_NATIVE_OFFER_ID) throw new Error("changed offer requires removing the manual offerId override before prepare");
    const next = { version, endpoint: env.AGENT_MCP_ENDPOINT, serviceId: env.AGENT_PROD_SERVICE_ID,
      skillId: prior?.skillId || env.AGENT_NATIVE_SKILL_ID || id(),
      offerId: prior ? id() : env.AGENT_NATIVE_OFFER_ID || id(), signature: nextSignature };
    await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    await rename(temporary, path);
    return next;
  } finally { await rm(temporary, { force: true }); await rm(lock, { force: true }); }
}
export async function loadProviderServiceState(path, env, { allowOfferDrift = false } = {}) {
  if (!path?.startsWith("/")) throw new Error("AGENT_PROVIDER_SERVICE_STATE_FILE must be absolute");
  const state = await read(path);
  if (!state) throw new Error("service identity is missing; run service prepare first (restore the original file if this service already exists)");
  checkIdentity(state, env);
  if (!allowOfferDrift && state.signature !== signature(env)) throw new Error("service declaration changed; run service prepare and restart the Provider before preview/register");
  return state;
}
