import { readFile } from "node:fs/promises";
import { timingSafeEqual } from "node:crypto";

import { assertUnixMilliseconds, parseLegacyIsoMilliseconds } from "@agentpay/types";

const suffix = "/.well-known/agentpay/provider-binding/";

export async function createProviderBindingRuntime({ endpointPath, publicEndpointPath = endpointPath, settlementBaseUrl, credentialFile, allowMissing = false, inspectPaidRuntime = () => ({}), fetchImpl = globalThis.fetch, now = () => Date.now() }) {
  if (!credentialFile) return null;
  const source = await readFile(credentialFile, "utf8").catch((error) => {
    if (allowMissing && error.code === "ENOENT") return null;
    throw error;
  });
  if (source === null) return null;
  const credential = source.trim();
  if (!credential) throw new Error("Provider binding credential is empty");
  const responses = new Map();
  const base = endpointPath.replace(/\/+$/, "");
  const publicBase = publicEndpointPath.replace(/\/+$/, "");
  return {
    async handle(req, res, url, { json, readJson }) {
      const statusRequest = req.method === 'GET' && url.pathname === '/internal/agentpay/provider-binding/status';
      if (statusRequest || (req.method === "POST" && url.pathname === "/internal/agentpay/provider-binding/authorize")) {
        const bearer = String(req.headers.authorization || "").match(/^Bearer\s+(.+)$/i)?.[1] || "";
        const a = Buffer.from(bearer); const b = Buffer.from(credential);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          json(res, 401, { ok: false, error: { code: "UNAUTHORIZED" } }); return true;
        }
        if (statusRequest) {
          res.setHeader('cache-control', 'no-store');
          json(res, 200, { ok: true, result: { endpointPath: publicBase, credentialLoaded: true,
            ...inspectPaidRuntime(credential) } });
          return true;
        }
        const body = await readJson(req);
        const challengeId = String(body?.challengeId || "");
        if (!/^provider_challenge_[a-f0-9]{32}$/.test(challengeId)) {
          json(res, 400, { ok: false, error: { code: "INVALID_CHALLENGE_ID" } }); return true;
        }
        try {
          const response = await fetchImpl(`${settlementBaseUrl}/agentpay/provider/bindings/challenges/authorize`, {
            method: "POST", headers: { authorization: `Bearer ${credential}`, "content-type": "application/json" },
            body: JSON.stringify({ challengeId }), signal: AbortSignal.timeout(5000) });
          const payload = await response.json();
          if (!response.ok || payload?.ok !== true) {
            json(res, response.status, { ok: false, error: { code: payload?.error?.code || "BINDING_AUTHORIZATION_FAILED" } });
            return true;
          }
          const { challengeResponse, challengeUrl } = payload.result;
          const expiresAtMs = bindingExpiry(payload.result);
          if (expiresAtMs <= assertUnixMilliseconds(now())) throw new Error('Endpoint challenge expired');
          const expected = `${publicBase}${suffix}${encodeURIComponent(challengeId)}`;
          if (new URL(challengeUrl).pathname !== expected) {
            json(res, 502, { ok: false, error: { code: "BINDING_ENDPOINT_MISMATCH" } }); return true;
          }
          responses.set(challengeId, { challengeResponse, expiresAtMs });
          json(res, 200, { ok: true, result: { challengeId, expiresAtMs, expiresAt: new Date(expiresAtMs).toISOString(), responseHeldByProvider: true } });
        } catch {
          json(res, 502, { ok: false, error: { code: "BINDING_SETTLEMENT_UNAVAILABLE" } });
        }
        return true;
      }
      if (req.method === "GET" && url.pathname.startsWith(`${base}${suffix}`)) {
        const challengeId = url.pathname.slice((`${base}${suffix}`).length);
        const held = responses.get(challengeId);
        if (!held || held.expiresAtMs <= assertUnixMilliseconds(now())) {
          res.writeHead(404, { "cache-control": "no-store" }); res.end(); return true;
        }
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
        res.end(held.challengeResponse); return true;
      }
      return false;
    }
  };
}

// Explicit legacy adapter; malformed integer values never fall back to ISO.
function bindingExpiry(result) {
  if (!result || typeof result !== 'object') throw new Error('Missing binding expiry');
  if (Object.hasOwn(result, 'expiresAtMs')) {
    const ms = assertUnixMilliseconds(result.expiresAtMs);
    if (Object.hasOwn(result, 'expiresAt') && parseLegacyIsoMilliseconds(result.expiresAt) !== ms) {
      throw new Error('Binding expiry representations disagree');
    }
    return ms;
  }
  return parseLegacyIsoMilliseconds(result.expiresAt);
}
