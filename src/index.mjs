import {randomNativeApplication} from './services/random-native.mjs';
import {providerServiceUrls} from './provider-service-urls.mjs';
import {parseLegacyIsoMilliseconds} from '@agentpay/types';
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { resolve as resolvePath } from "node:path";
import { isAddress, isAddressEqual, recoverMessageAddress } from "viem";
import { loadAgentRuntimeConfig } from "./runtime-config.mjs";
import { executeServiceRun, prepareServiceRun } from "./service-runtime.mjs";
import { createNativeProviderRuntime } from "./native-provider-runtime.mjs";
import { createProviderBindingRuntime } from "./provider-binding-runtime.mjs";
import { randomSkillBundle, RANDOM_SKILL_BUNDLE_VERSION } from "./random-skill-bundle.mjs";
import {serviceReference} from "./service-reference.mjs";
import { readProviderBinding } from "./provider-binding-state.mjs";

const runtimeConfig = loadAgentRuntimeConfig();
const port = Number(runtimeConfig.agent.listen?.port || process.env.AGENT_PROD_PORT || "6471");
const host = String(process.env.AGENT_PROD_HOST || "127.0.0.1").trim() || "127.0.0.1";
const serviceId = runtimeConfig.agent.serviceId;
const serviceKind = runtimeConfig.agent.kind || "random";
const serviceName = runtimeConfig.agent.mcp?.name || serviceId;
const settlementBaseUrl = (runtimeConfig.settlement?.baseUrl || process.env.SETTLEMENT_BASE_URL || "").replace(/\/$/, "");
const agentPublicBaseUrl = (
  process.env.AGENT_PUBLIC_BASE_URL ||
  process.env.AGENT_BASE_URL ||
  `http://127.0.0.1:${port}`
).replace(/\/$/, "");
const serviceUrls=providerServiceUrls(agentPublicBaseUrl,serviceId);
const settlementAsset = runtimeConfig.chain.settlementAsset;
const settlementTokenAddress =
  runtimeConfig.contracts?.settlementTokenAddress ||
  process.env.AGENT_PROD_SETTLEMENT_TOKEN_ADDRESS ||
  "0x4000000000000000000000000000000000000004";
const settlementToken = runtimeConfig.agent.mcp?.token || settlementAsset;
const provider = runtimeConfig.agent.mcp?.provider;
const baseAmount = runtimeConfig.agent.mcp?.pricing?.base;
const usagePerUnit = runtimeConfig.agent.mcp?.pricing?.usagePerUnit;
const highPrioritySurcharge = runtimeConfig.agent.mcp?.pricing?.highPrioritySurcharge;
const pricingVersion = runtimeConfig.agent.mcp?.pricingVersion;
const endpointUrn = runtimeConfig.agent.mcp?.endpointUrn || `mcp://agentpay/demo/${serviceId}`;
const metadata = runtimeConfig.agent.mcp?.metadata;
const challengeDir = process.env.AGENT_PROD_CHALLENGE_DIR || "/run/agentpay-secrets/mcp-challenges";
const defaultMcpSafe = runtimeConfig.agent.mcp?.defaultSafe;
const supportedSettlements = Array.isArray(runtimeConfig.agent.mcp?.supportedSettlements)
  ? runtimeConfig.agent.mcp.supportedSettlements
  : [];
const providerProfileConfig = runtimeConfig.agent.mcp?.profile || {};
const trustedSettlementSigners = Array.isArray(runtimeConfig.agent.mcp?.trustedSettlementSigners)
  ? runtimeConfig.agent.mcp.trustedSettlementSigners.filter((item) => isAddress(String(item || "")))
  : [];
const claimedExecutionTickets = new Set();
const nativeProviderRuntime = await createNativeProviderRuntime({ serviceId,
  settlementBaseUrl, publicBaseUrl: agentPublicBaseUrl,application:serviceKind==='random'?randomNativeApplication:null });
const providerBindingRuntime = await createProviderBindingRuntime({
  endpointPath: serviceUrls.localMcpPath, publicEndpointPath: serviceUrls.publicMcpPath, settlementBaseUrl,
  credentialFile: process.env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE || "",
  allowMissing: process.env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE === "pre_admission",
  inspectPaidRuntime: credential => ({ nativeProvider: nativeProviderRuntime?.health || { enabled: false },
    paidCredentialMatches: nativeProviderRuntime?.credentialMatches(credential) === true }) });

const service = {
  serviceId,
  kind: serviceKind,
  name: serviceName,
  provider,
  token: settlementToken,
  endpoint: endpointUrn,
  metadata,
  pricingModel: "hybrid",
  pricingVersion,
  pricing: {
    base: baseAmount,
    usagePerUnit,
    highPrioritySurcharge
  }
};

function nowIso() {
  return new Date().toISOString();
}

function nowPlusMinutes(minutes) {
  return new Date(Date.now() + Math.max(1, Number(minutes) || 1) * 60_000).toISOString();
}

function scopedMcpBaseUrl() {
  return `${agentPublicBaseUrl}/services/${encodeURIComponent(serviceId)}`;
}

function json(res, code, payload) {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

function logRequest(tag, details = {}) {
  try {
    console.log(`[agent][${nowIso()}][${tag}] ${JSON.stringify(details)}`);
  } catch {
    console.log(`[agent][${nowIso()}][${tag}]`);
  }
}

function stableSerialize(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }
  const entries = Object.entries(value)
    .filter(([, entry]) => entry !== undefined)
    .sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`).join(",")}}`;
}

function sha256Hex(value) {
  return `0x${createHash("sha256").update(String(value || "")).digest("hex")}`;
}

function executionTicketMessage(ticket) {
  return [
    "AgentPay Execution Ticket v1",
    stableSerialize(ticket)
  ].join("\n");
}

async function verifyExecutionTicket({ ticket, ticketSignature, request }) {
  if (!trustedSettlementSigners.length) {
    throw createToolError("TRUSTED_SETTLEMENT_SIGNERS_MISSING", "trusted settlement signer addresses are not configured");
  }
  if (!ticket || typeof ticket !== "object") {
    throw createToolError("INVALID_INPUT", "ticket is required");
  }
  if (ticket.type !== "agentpay.execution-ticket.v1") {
    throw createToolError("UNAUTHORIZED", "unsupported execution ticket type");
  }
  if (String(ticket.serviceId || "") !== serviceId || String(ticket.audience || "") !== serviceId) {
    throw createToolError("UNAUTHORIZED", "execution ticket is not scoped to this service");
  }
  const expiresAtMs = parseLegacyIsoMilliseconds(ticket.expiresAt);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    throw createToolError("UNAUTHORIZED", "execution ticket expired");
  }
  const recovered = await recoverMessageAddress({
    message: executionTicketMessage(ticket),
    signature: String(ticketSignature || "")
  });
  if (!trustedSettlementSigners.some((item) => isAddressEqual(item, recovered))) {
    throw createToolError("UNAUTHORIZED", "execution ticket signer is not trusted");
  }
  const expectedRequestHash = String(ticket.requestHash || "").toLowerCase();
  const actualRequestHash = sha256Hex(stableSerialize(request || {}));
  if (expectedRequestHash !== actualRequestHash) {
    throw createToolError("INVALID_INPUT", "request payload does not match execution ticket requestHash", {
      expectedRequestHash,
      actualRequestHash
    });
  }
  return recovered;
}

async function postSettlementTicket(path, payload) {
  const baseUrl = String(payload?.ticket?.settlementBaseUrl || settlementBaseUrl || "").replace(/\/+$/, "");
  if (!baseUrl) {
    throw createToolError("SETTLEMENT_FAILED", "settlement base URL is not configured for ticket receipt");
  }
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const parsed = await response.json().catch(() => ({}));
  if (!response.ok || parsed?.ok === false) {
    throw createToolError("SETTLEMENT_FAILED", "settlement ticket update failed", {
      statusCode: response.status,
      response: parsed
    });
  }
  return parsed;
}

async function readBodyBuffer(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0);
}

function parseJsonBuffer(buffer) {
  if (!buffer || buffer.length === 0) return {};
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch {
    return null;
  }
}

async function readJson(req) {
  return parseJsonBuffer(await readBodyBuffer(req));
}

function normalizeUsageUnits(value) {
  const usageUnits = Number(value ?? 1);
  if (!Number.isInteger(usageUnits) || usageUnits < 1 || usageUnits > 10000) {
    throw createToolError("INVALID_INPUT", "usageUnits must be an integer between 1 and 10000");
  }
  return usageUnits;
}

function extractObservedUsageUnits(resultPayload, fallback = 1) {
  const candidates = [
    resultPayload?.usageUnits,
    resultPayload?.result?.usageUnits,
    resultPayload?.output?.usageUnits
  ];
  for (const candidate of candidates) {
    if (candidate == null || candidate === "") continue;
    const parsed = Number(candidate);
    if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 1_000_000) {
      return String(parsed);
    }
  }
  return String(Math.max(0, Number.isInteger(fallback) ? fallback : 1));
}

function createToolError(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function toolErrorResponse(err) {
  const code = err?.code || "SETTLEMENT_FAILED";
  const statusCode =
    code === "NOT_FOUND" ? 404
      : code === "CONFLICT" ? 409
        : code === "UNAUTHORIZED" ? 401
          : code === "TRUSTED_SETTLEMENT_SIGNERS_MISSING" ? 503
            : code === "SETTLEMENT_FAILED" ? 500
              : 400;
  return {
    statusCode,
    payload: {
      ok: false,
      error: {
        code,
        message: err instanceof Error ? err.message : String(err),
        details: err?.details || {}
      }
    }
  };
}

function parseScopedInvokePath(pathname) {
  const match = /^\/services\/([^/]+)\/mcp\/invoke$/.exec(pathname);
  if (!match?.[1]) {
    return null;
  }
  return { serviceId: decodeURIComponent(match[1]) };
}

function parseScopedChallengePath(pathname) {
  const match = /^\/services\/([^/]+)\/mcp\/_agentpay_challenge$/.exec(pathname);
  if (!match?.[1]) {
    return null;
  }
  return { serviceId: decodeURIComponent(match[1]) };
}

function parseScopedExecutePath(pathname) {
  const match = /^\/services\/([^/]+)\/mcp\/execute$/.exec(pathname);
  if (!match?.[1]) {
    return null;
  }
  return { serviceId: decodeURIComponent(match[1]) };
}

function parseScopedProviderProfilePath(pathname) {
  const match = /^\/services\/([^/]+)\/mcp\/provider-profile$/.exec(pathname);
  if (!match?.[1]) {
    return null;
  }
  return { serviceId: decodeURIComponent(match[1]) };
}

function assertServiceId(candidate) {
  if (String(candidate || "").trim() !== serviceId) {
    throw createToolError("POLICY_VIOLATION", "scoped endpoint does not allow cross-service access", {
      expectedServiceId: serviceId,
      requestedServiceId: String(candidate || "")
    });
  }
}

async function handleTool(tool, input) {
  const payload = input && typeof input === "object" ? input : {};

  if (tool === "services.list") {
    return { services: [service] };
  }

  if (tool === "services.get") {
    assertServiceId(payload.serviceId);
    return { service };
  }

  throw createToolError("INVALID_INPUT", `unsupported tool: ${tool}`);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");

  if (req.method === 'GET' && url.pathname === `/services/${encodeURIComponent(serviceId)}/agentpay/display`) {
    return json(res,200,{ok:true,result:{name:serviceName,
      summary:serviceKind==='random'?'Generate a random integer with one paid request.':'',
      usage:serviceKind==='random'?'Use an AgentPay-compatible Skill or client to request a random number. Each request uses one usage unit.':''}});
  }

  if (req.method === "GET" &&
    [ `/services/${encodeURIComponent(serviceId)}/agentpay/skill-package`,
      `/services/${encodeURIComponent(serviceId)}/agentpay/skill-bundle.zip`,
      `/services/${encodeURIComponent(serviceId)}/agentpay/service-reference` ].includes(url.pathname)) {
    if(!url.pathname.endsWith('/service-reference')&&serviceKind!=='random')return json(res,404,{ok:false,error:{code:'NOT_FOUND'}});
    try {
      const binding = await readProviderBinding(process.env.AGENT_PROVIDER_BINDING_STATE_FILE,
        `${serviceUrls.publicBase}${serviceUrls.localMcpPath}`);
      if (!binding) return json(res, 409, { ok: false, error: { code: "PROVIDER_NOT_BOUND" } });
      const profile={version:'agentpay.service-profile.v1',providerId:binding.providerId,serviceId,
        mcpEndpoint:serviceUrls.mcpEndpoint,paymentEndpoint:serviceUrls.paymentEndpoint,
        seller:process.env.AGENT_NATIVE_SELLER,network:process.env.AGENT_NATIVE_NETWORK,asset:process.env.AGENT_NATIVE_ASSET};
      const reference=serviceReference({skillId:process.env.AGENT_NATIVE_SKILL_ID,profileHash:process.env.AGENT_NATIVE_PROFILE_HASH,profile});
      if(url.pathname.endsWith('/service-reference'))return json(res,200,reference);
      if (url.pathname.endsWith('/skill-bundle.zip')) {
        const bundle = await randomSkillBundle(reference);
        res.writeHead(200, { 'content-type':'application/zip', 'cache-control':'no-store',
          'content-disposition':`attachment; filename="random-skill-${RANDOM_SKILL_BUNDLE_VERSION}.zip"`,
          'x-agentpay-package-sha256':bundle.sha256 });
        res.end(bundle.bytes); return;
      }
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(`${JSON.stringify(reference)}\n`);
    } catch {
      json(res, 503, { ok: false, error: { code: "PROVIDER_BINDING_STATE_INVALID" } });
    }
    return;
  }

  if (providerBindingRuntime && await providerBindingRuntime.handle(req, res, url, { json, readJson })) return;

  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, {
      ok: true,
      result: {
        serviceId,
        serviceKind,
        mode: "mcp-agent",
        settlementConnected: Boolean(settlementBaseUrl),
        invokePath: `/services/${encodeURIComponent(serviceId)}/mcp/invoke`,
        challengePath: `/services/${encodeURIComponent(serviceId)}/mcp/_agentpay_challenge`,
        providerProfilePath: `/services/${encodeURIComponent(serviceId)}/mcp/provider-profile`,
        executePath: `/services/${encodeURIComponent(serviceId)}/mcp/execute`,
        nativeProvider: nativeProviderRuntime?.health || { enabled: false },
        timestamp: nowIso()
      }
    });
  }

  if (req.method === "GET") {
    const scopedProviderProfile = parseScopedProviderProfilePath(url.pathname);
    if (scopedProviderProfile) {
      assertServiceId(scopedProviderProfile.serviceId);
      return json(res, 200, {
        ok: true,
        result: {
          serviceId,
          mcpSafe: defaultMcpSafe || null,
          pricing: service.pricing,
          pricingVersion,
          token: settlementToken,
          settlementTokenAddress: settlementTokenAddress || null,
          supportedSettlements,
          timestamp: providerProfileConfig.timestamp || nowIso(),
          expiresAt: providerProfileConfig.expiresAt || nowPlusMinutes(30),
          signature: providerProfileConfig.signature || "",
          signatureMode: providerProfileConfig.signatureMode || "safe",
          chainId: providerProfileConfig.chainId || "",
          verifyingContract: providerProfileConfig.verifyingContract || ""
        }
      });
    }

    const scopedChallenge = parseScopedChallengePath(url.pathname);
    if (scopedChallenge) {
      assertServiceId(scopedChallenge.serviceId);
      try {
        const token = (await readFile(resolvePath(challengeDir, `${serviceId}.token`), "utf8")).trim();
        if (!token) {
          res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
          res.end("challenge token not configured");
          return;
        }
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
        res.end(token);
        return;
      } catch {
        res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        res.end("challenge token not configured");
        return;
      }
    }
  }

  if (req.method === "POST" && url.pathname === "/run") {
    const body = await readJson(req);
    if (!body || typeof body !== "object") {
      return json(res, 400, {
        ok: false,
        error: {
          code: "INVALID_INPUT",
          message: "invalid JSON body"
        }
      });
    }

    try {
      const prepared = prepareServiceRun(serviceKind, body, runtimeConfig.agent);
      const observedUnits = String(normalizeUsageUnits(body.usageUnits));
      logRequest("run.intent.created", {
        serviceId,
        observedUnits,
        hasUserSafe: Boolean(typeof body.userSafe === "string" && body.userSafe.trim())
      });
      return json(res, 200, {
        ok: true,
        result: {
          serviceId,
          serviceKind,
          providerId: provider,
          prompt: prepared.prompt,
          execution: {
            required: "settlement",
            note: "The agent does not execute paid service work from /run. Create and execute a settlement deal; settlement will call the scoped MCP execute endpoint after funding."
          },
          settlementIntent: {
            required: true,
            flow: "settlement_orchestrated_execution",
            serviceId,
            usageUnits: observedUnits,
            userSafe:
              typeof body.userSafe === "string" && body.userSafe.trim() ? body.userSafe.trim() : null,
            mcpSafe: null,
            settlementTokenAddress: settlementTokenAddress || null,
            settlementAsset,
            note:
              "Client must call settlement APIs directly. Settlement resolves providerSafe from verified service policy and executes the service after funding."
          },
          timestamp: nowIso()
        }
      });
    } catch (err) {
      logRequest("run.error", {
        serviceId,
        message: err instanceof Error ? err.message : String(err)
      });
      const { statusCode, payload } = toolErrorResponse(err);
      return json(res, statusCode, payload);
    }
  }

  if (nativeProviderRuntime && await nativeProviderRuntime.handle(req, res, url, { json, readJson })) return;

  const scopedInvoke = req.method === "POST" ? parseScopedInvokePath(url.pathname) : null;
  if (scopedInvoke) {
    try {
      assertServiceId(scopedInvoke.serviceId);
      const body = await readJson(req);
      if (!body || typeof body !== "object") {
        throw createToolError("INVALID_INPUT", "invalid request payload");
      }
      if (!body.tool) {
        throw createToolError("INVALID_INPUT", "tool is required");
      }
      const result = await handleTool(String(body.tool), body.input || {});
      return json(res, 200, { ok: true, result });
    } catch (err) {
      const { statusCode, payload } = toolErrorResponse(err);
      return json(res, statusCode, payload);
    }
  }

  const scopedExecute = req.method === "POST" ? parseScopedExecutePath(url.pathname) : null;
  if (scopedExecute) {
    const executeStartedAtMs = Date.now();
    try {
      assertServiceId(scopedExecute.serviceId);
      logRequest("mcp.execute.stage", {
        serviceId,
        stage: "request.received"
      });
      const body = await readJson(req);
      if (!body || typeof body !== "object") {
        throw createToolError("INVALID_INPUT", "invalid request payload");
      }
      const ticket = body.ticket;
      const ticketSignature = body.ticketSignature;
      const requestPayload = body.request && typeof body.request === "object" ? body.request : {};
      await verifyExecutionTicket({ ticket, ticketSignature, request: requestPayload });
      const ticketNonce = String(ticket.nonce || "");
      if (!ticketNonce) {
        throw createToolError("INVALID_INPUT", "ticket nonce is required");
      }
      if (claimedExecutionTickets.has(ticketNonce)) {
        throw createToolError("CONFLICT", "execution ticket already used by this agent process");
      }
      await postSettlementTicket(`/settlement/tickets/${encodeURIComponent(ticketNonce)}/claim`, {
        ticket,
        ticketSignature
      });
      claimedExecutionTickets.add(ticketNonce);
      const preparedStartedAtMs = Date.now();
      const prepared = prepareServiceRun(serviceKind, requestPayload, runtimeConfig.agent);
      logRequest("mcp.execute.stage", {
        serviceId,
        stage: "request.prepared",
        elapsedMs: Date.now() - preparedStartedAtMs
      });
      logRequest("mcp.execute.request", {
        serviceId,
        kind: serviceKind,
        hasPrompt: Boolean(typeof prepared.prompt === "string" && prepared.prompt.trim()),
        keys: requestPayload && typeof requestPayload === "object" ? Object.keys(requestPayload).slice(0, 20) : []
      });
      const runStartedAtMs = Date.now();
      logRequest("mcp.execute.stage", {
        serviceId,
        stage: "service.run.start"
      });
      const generated = await executeServiceRun(serviceKind, prepared.prompt, prepared.config);
      logRequest("mcp.execute.stage", {
        serviceId,
        stage: "service.run.done",
        elapsedMs: Date.now() - runStartedAtMs
      });
      const outputHash = generated.aggregateHash;
      const usageUnits = extractObservedUsageUnits(generated.responseFields || generated.data || {}, 1);
      const receipt = await postSettlementTicket(`/settlement/tickets/${encodeURIComponent(ticketNonce)}/receipt`, {
        ticket,
        ticketSignature,
        outputHash,
        usageUnits,
        completedAt: nowIso()
      });
      logRequest("mcp.execute.stage", {
        serviceId,
        stage: "response.ready",
        totalElapsedMs: Date.now() - executeStartedAtMs
      });
      return json(res, 200, {
        ok: true,
        result: {
          serviceId,
          serviceKind,
          prompt: prepared.prompt,
          summary: generated.summary,
          output: generated.data,
          outputHash,
          settlementReceipt: {
            submitted: true,
            statusPath: receipt?.result?.statusPath || null,
            dealPath: receipt?.result?.dealPath || null
          },
          ...generated.responseFields
        }
      });
    } catch (err) {
      logRequest("mcp.execute.error", {
        serviceId,
        message: err instanceof Error ? err.message : String(err),
        totalElapsedMs: Date.now() - executeStartedAtMs
      });
      const { statusCode, payload } = toolErrorResponse(err);
      return json(res, statusCode, payload);
    }
  }

  return json(res, 404, {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: "route not found"
    }
  });
});

server.listen(port, host, () => {
  console.log(`[agent] listening on ${host}:${port}`);
  console.log(`[agent] serviceId=${serviceId}`);
  console.log(`[agent] kind=${serviceKind}`);
  console.log(`[agent] config=${runtimeConfig.runtimeConfigFile}`);
  console.log(`[agent] invoke=/services/${serviceId}/mcp/invoke`);
  console.log(`[agent] execute=/services/${serviceId}/mcp/execute`);
});

for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => {
  void nativeProviderRuntime?.close().finally(() => server.close(() => process.exit(0)));
});
