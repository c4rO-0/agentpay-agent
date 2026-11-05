import {retrieveOriginalResult} from './provider-result-retrieval.mjs';
import {createProviderCaseMonitor} from './provider-case-monitor.mjs';
import {executeApplication} from './native-application.mjs';
import {providerServiceUrls} from './provider-service-urls.mjs';
import {executionTimeRow,executionClock,executionCalendar} from './provider-execution-time.mjs';
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import mysql from "mysql2/promise";
import { normalizeServiceInvocation, AGENTPAY_FINALIZATION_V2_MEDIA_TYPE, AGENTPAY_ORDER_V2_MEDIA_TYPE, AGENTPAY_DEADLINES_V2_MEDIA_TYPE, AGENTPAY_AUTHORIZATION_V2_MEDIA_TYPE, AGENTPAY_DELIVERY_V2_MEDIA_TYPE } from "@agentpay/types";
import { readProviderSettlementResult } from './settlement-response.mjs';
import { quoteLifetime, providerPaymentRequired } from './native-provider-quote.mjs';

const B32 = /^0x[0-9a-fA-F]{64}$/;

export async function createNativeProviderRuntime({ serviceId, settlementBaseUrl, publicBaseUrl, application }) {
  if (process.env.AGENTPAY_NATIVE_PROVIDER_ENABLED !== "true") return null;
  if(!application||typeof application.validate!=='function'||typeof application.execute!=='function')throw Error('Native paid service requires an application implementation');
  const config = loadConfig({ serviceId, settlementBaseUrl, publicBaseUrl });
  if (config.admissionState === "admitted" && !config.credentialFile) {
    throw new Error("admitted Provider requires a Provider credential file");
  }
  const credential = config.admissionState === "pre_admission" ? null
    : (await readFile(config.credentialFile, "utf8")).trim();
  if (config.admissionState === "admitted" && !credential) throw new Error("Provider credential file is empty");
  const db = mysql.createPool({ host: config.dbHost, port: config.dbPort, user: config.dbUser,
    password: config.dbPassword, database: config.dbName, connectionLimit: 4, queueLimit:64 });
  await ensureSchema(db);
  const cases=credential?createProviderCaseMonitor({base:config.settlementBaseUrl,credential}):null;cases?.start();
  return Object.freeze({
    credentialMatches(candidate) {
      if (!credential) return false;
      const a = Buffer.from(candidate); const b = Buffer.from(credential);
      return a.length === b.length && timingSafeEqual(a, b);
    },
    health: { enabled: true, admissionState: config.admissionState,
      skillId: config.skillId, profileHash: config.profileHash,
      route: config.publicRoute, persistence: "mysql", dbName: config.dbName },
    async handle(req, res, url, helpers) {
      if (req.method !== "POST" || url.pathname !== config.route) return false;
      if (config.admissionState === "pre_admission") {
        if (req.headers.authorization || req.headers["payment-signature"]) {
          helpers.json(res, 403, { ok: false, error: { code: "PROVIDER_NOT_ADMITTED",
            message: "Provider has not completed AgentPay admission" } });
        } else {
          helpers.json(res, 402, paymentRequired(config));
        }
        return true;
      }
      if(String(req.headers.authorization||'').startsWith('AgentPayResult ')){
        try{
          const encoded=String(req.headers.authorization).slice(15);
          if(encoded.length>4096)throw coded('RETRIEVAL_INVALID','Invalid result retrieval request');
          const permission=JSON.parse(Buffer.from(encoded,'base64url').toString('utf8'));
          const previous=await retrieveOriginalResult({permission,skillId:config.skillId,profileHash:config.profileHash,
            verify:value=>settlementPost(config,credential,'/agentpay/provider/disputes/retrieval/verify',value),read:orderId=>createExecutionStore(db).read(orderId)});
          helpers.json(res,200,success(previous,true));
        }catch(error){helpers.json(res,409,{ok:false,error:{code:error.code||'RETRIEVAL_FAILED',message:String(error.message||error)}});}
        return true;
      }
      const authorization = parseServiceAuthorization(req.headers.authorization);
      if (!authorization) {
        try {
          const payment = parsePaymentSignature(req.headers["payment-signature"]);
          if (payment) {
            const result = await settlePayment(config, credential, payment);
            if (typeof result?.success !== 'boolean') {
              throw coded('SETTLEMENT_RESPONSE_INVALID', 'Settlement returned an invalid payment result');
            }
            const pending = !result.success && result.errorReason === 'settlement_pending';
            helpers.json(res, result.success ? 200 : pending ? 202 : 422, {
              ok: result.success, result,
              error: result.success ? undefined : {
                code: pending ? 'SETTLEMENT_PENDING' : result.errorReason || 'PAYMENT_REJECTED',
                message: result.errorMessage || (pending
                  ? 'Payment is accepted and settlement is still running'
                  : 'Settlement rejected this payment')
              }
            });
            return true;
          }
          helpers.json(res, 402, paymentRequired(config));
        } catch (error) {
            helpers.json(res, error?.status || 502, { ok: false, error: {
              code: error?.code || "PAYMENT_SETTLEMENT_FAILED", message: String(error?.message || error) } });
        }
        return true;
      }
      let releaseExecution=async()=>{};
      try {
        const body = await helpers.readJson(req);
        const input = validateInvocation(body);
        await application.validate(structuredClone(input.request));
        releaseExecution=await lockExecution(db,input.orderId);
        const store=createExecutionStore(releaseExecution.connection);
        const claimId=`claim_${createHash("sha256").update(JSON.stringify([config.skillId,config.profileHash,input.orderId])).digest("hex")}`;
        const claimed = await settlementPost(config, credential,
          "/agentpay/provider/service-authorizations/claim", { authorization,
            orderId: input.orderId, requestHash: input.requestHash, claimId });
        if (String(claimed.orderId).toLowerCase() !== input.orderId || String(claimed.requestHash).toLowerCase() !== input.requestHash || String(claimed.skillId).toLowerCase() !== config.skillId
          || String(claimed.profileHash).toLowerCase() !== config.profileHash) {
          throw coded("SETTLEMENT_IDENTITY_MISMATCH", "Settlement authorization does not match this Skill version");
        }
        if (BigInt(claimed.maxUsageUnits) < 1n) throw coded("SETTLEMENT_USAGE_REJECTED", "Settlement authorization allows no usage");
        // Persist only after Settlement verifies authorization. A fabricated
        // authorization must not poison this public Order's local request binding.
        const execution=await store.begin({...input,claimId});
        if(execution.request_hash!==input.requestHash)throw coded('EXECUTION_CONFLICT','Order already has a different requestHash');
        if(execution.claim_id!==claimId)throw coded('EXECUTION_REVIEW_REQUIRED','Stored claim identity needs review; preserve the original execution');
        if (execution.state === "receipt_submitted") {
          helpers.json(res, 200, success(execution, true, config.tamperResponse,input));
          return true;
        }
        await store.recordClaim(input.orderId, claimed.authorizationId, claimed.maxUsageUnits);
        let current = await store.read(input.orderId);
        if (current.state === "received") {
          if (config.decision === "silence") throw coded("PROVIDER_SILENT", "Provider did not accept or reject the request");
          if (config.decision === "reject") {
            await settlementPost(config, credential,
              "/agentpay/provider/service-authorizations/decision", { authorizationId: claimed.authorizationId,
                orderId: input.orderId, claimId: execution.claim_id, decision: "reject",
                reasonCode: "provider_unavailable" });
            throw coded("PROVIDER_REJECTED", "Provider rejected the service request");
          }
          const accepted = await settlementPost(config, credential,
            "/agentpay/provider/service-authorizations/decision", { authorizationId: claimed.authorizationId,
              orderId: input.orderId, claimId: execution.claim_id, decision: "accept" });
          await store.accept(input.orderId, accepted.authorizationId || claimed.authorizationId);
          current = await store.read(input.orderId);
        }
        let completed = current;
        const recovering=completed.state === "executing";
        if (completed.state === "accepted") {
          completed = await store.executing(input.orderId);
        }
        if (completed.state === "executing") {
          const result=await executeApplication(application,{request:input.request,orderId:input.orderId,requestHash:input.requestHash,maxUsageUnits:claimed.maxUsageUnits},{recovering,maxUsageUnits:claimed.maxUsageUnits});
          completed = await store.complete(input.orderId,result.output,result.outputHash,result.usageUnits);
        }
        if (completed.state !== "completed" || !B32.test(String(completed.output_hash || ""))) {
          throw coded("EXECUTION_STATE_INVALID", "Provider execution did not persist a valid completed output");
        }
        if(typeof completed.usage_units!=='string'||!/^(0|[1-9][0-9]{0,76})$/.test(completed.usage_units)||BigInt(completed.usage_units)>BigInt(claimed.maxUsageUnits))throw coded('EXECUTION_REVIEW_REQUIRED','Stored execution usage is missing or outside authorization; preserve it for review');
        const negativeProbe = config.negativeProbe ? await runPreReceiptNegativeProbes(config, credential,
          { authorization, input, claimed, execution }) : null;
        const receipt = await settlementPost(config, credential,
          "/agentpay/provider/service-authorizations/receipt", {
            authorizationId: completed.authorization_id, orderId: input.orderId,
            claimId: completed.claim_id, receiptId: completed.receipt_id,
            outputHash: completed.output_hash, usageUnits: completed.usage_units, completedAtMs: completed.completed_at_ms });
        if (negativeProbe) await runPostReceiptNegativeProbes(config, credential,
          { authorization, input, claimed, execution: completed, evidence: negativeProbe });
        completed = await store.receiptSubmitted(input.orderId);
        helpers.json(res, 200, { ...success(completed, Boolean(receipt.duplicate), config.tamperResponse,input),
          ...(negativeProbe ? { negativeProbe } : {}) });
      } catch (error) {
        const status = ["EXECUTION_CONFLICT","EXECUTION_BUSY","APPLICATION_RECOVERY_REQUIRED","EXECUTION_REVIEW_REQUIRED"].includes(error?.code) ? 409
          : error?.code === "INVALID_INPUT" ? 400 : error?.status || 502;
        helpers.json(res, status, { ok: false, error: { code: error?.code || "PROVIDER_EXECUTION_FAILED",
          message: String(error?.message || error) } });
      }
      finally {await releaseExecution();}
      return true;
    },
    async close() { await cases?.stop();await db.end(); }
  });
}

function loadConfig({ serviceId, settlementBaseUrl, publicBaseUrl }) {
  const required = (name, fallback = "") => { const value = String(process.env[name] || fallback).trim();
    if (!value) throw new Error(`${name} is required`); return value; };
  const urls=providerServiceUrls(publicBaseUrl,serviceId);
  const route=urls.localPaymentPath;
  const endpoint=urls.paymentEndpoint;
  return { serviceId, route, publicRoute: urls.publicPaymentPath, settlementBaseUrl: required("SETTLEMENT_BASE_URL", settlementBaseUrl), endpoint,
    admissionState: enumValue(process.env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE || "admitted",
      ["pre_admission", "admitted"], "AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE"),
    credentialFile: String(process.env.AGENT_PROVIDER_CREDENTIAL_FILE || "").trim(),
    dbHost: required("AGENT_PROVIDER_DB_HOST", "127.0.0.1"), dbPort: Number(process.env.AGENT_PROVIDER_DB_PORT || 3306),
    dbUser: required("AGENT_PROVIDER_DB_USER"), dbPassword: String(process.env.AGENT_PROVIDER_DB_PASSWORD || ""),
    dbName: required("AGENT_PROVIDER_DB_NAME", "agentpay_agent"),
    network: required("AGENT_NATIVE_NETWORK"), asset: required("AGENT_NATIVE_ASSET"),
    skillId: bytes32(required("AGENT_NATIVE_SKILL_ID"), "AGENT_NATIVE_SKILL_ID"),
    profileHash: bytes32(required("AGENT_NATIVE_PROFILE_HASH"), "AGENT_NATIVE_PROFILE_HASH"),
    seller: required("AGENT_NATIVE_SELLER"), baseAmount: uint(required("AGENT_NATIVE_BASE_AMOUNT", "0"), "baseAmount"),
    unitPrice: uint(required("AGENT_NATIVE_UNIT_PRICE", "1"), "unitPrice"),
    ...(process.env.AGENT_NATIVE_SERVICE_WINDOW_SECONDS?{serviceWindowSeconds:process.env.AGENT_NATIVE_SERVICE_WINDOW_SECONDS}:{}),
    maxUsageUnits: uint(required("AGENT_NATIVE_MAX_USAGE_UNITS", "1"), "maxUsageUnits"),
    offerId: bytes32(required("AGENT_NATIVE_OFFER_ID"), "AGENT_NATIVE_OFFER_ID"),
    ...quoteLifetime(process.env),
    decision: enumValue(process.env.AGENTPAY_NATIVE_PROVIDER_DECISION || "accept",
      ["accept", "reject", "silence"], "AGENTPAY_NATIVE_PROVIDER_DECISION"),
    negativeProbe: process.env.AGENTPAY_NATIVE_PROVIDER_NEGATIVE_PROBE === "true",
    tamperResponse: process.env.AGENTPAY_NATIVE_PROVIDER_TAMPER_RESPONSE === "true",
    negativeProbeExpiryWaitMs: Number(process.env.AGENTPAY_NATIVE_PROVIDER_EXPIRY_WAIT_MS || 31_000),
    settlementHttpTimeoutMs: positiveTimeout(process.env.AGENTPAY_PROVIDER_SETTLEMENT_TIMEOUT_MS || "30000") };
}

export async function ensureSchema(db) {
  await db.query(`CREATE TABLE IF NOT EXISTS agentpay_provider_executions (
    order_id CHAR(66) PRIMARY KEY, request_hash CHAR(66) NOT NULL,
    request_json JSON NOT NULL, claim_id VARCHAR(191) NOT NULL UNIQUE,
    receipt_id VARCHAR(191) NOT NULL UNIQUE, authorization_id VARCHAR(64) NULL,
    max_usage_units VARCHAR(78) NULL, state VARCHAR(32) NOT NULL,
    output_json LONGTEXT NULL, output_hash CHAR(66) NULL, completed_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL, updated_at DATETIME(3) NOT NULL,
    KEY idx_agentpay_provider_execution_state (state, updated_at))`);
  // MySQL JSON storage may reorder object keys; keep the exact serialized output
  // used for evidence. Existing rows remain retained for explicit usage review.
  const [outputColumns]=await db.query('SELECT data_type AS columnType FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND column_name=?',['agentpay_provider_executions','output_json']);
  if(outputColumns[0]?.columnType==='json')await db.query('ALTER TABLE agentpay_provider_executions MODIFY COLUMN output_json LONGTEXT NULL');
  const [usageColumns]=await db.query('SELECT column_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND column_name=?',['agentpay_provider_executions','usage_units']);
  if(!usageColumns.length)await db.query('ALTER TABLE agentpay_provider_executions ADD COLUMN usage_units VARCHAR(78) NULL');
  for(const field of ['created_at','updated_at','completed_at']){
    const [columns]=await db.query('SELECT column_name FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? AND column_name=?',['agentpay_provider_executions',field+'_ms']);
    if(columns.length===0)await db.query(`ALTER TABLE agentpay_provider_executions ADD COLUMN ${field}_ms BIGINT UNSIGNED NULL`);
  }
}

export function createExecutionStore(db) {
  return Object.freeze({
    async begin(input) {
      const atMs=executionClock(),at=executionCalendar(atMs);
      await db.query(`INSERT INTO agentpay_provider_executions
        (order_id,request_hash,request_json,claim_id,receipt_id,state,created_at,updated_at,created_at_ms,updated_at_ms)
        VALUES (?,?,CAST(? AS JSON),?,?,'received',?,?,?,?)
        ON DUPLICATE KEY UPDATE updated_at=updated_at`, [input.orderId, input.requestHash,
        JSON.stringify(input.request), input.claimId, `receipt_${randomUUID()}`, at, at,atMs,atMs]);
      return this.read(input.orderId);
    },
    async read(orderId) { const [rows] = await db.query("SELECT * FROM agentpay_provider_executions WHERE order_id=? LIMIT 1", [orderId]);
      if (!rows[0]) throw new Error("Provider execution not found"); return executionTimeRow(rows[0]); },
    async recordClaim(orderId, authorizationId, maxUsageUnits) { const atMs=executionClock();await db.query(
      "UPDATE agentpay_provider_executions SET authorization_id=?,max_usage_units=?,updated_at=?,updated_at_ms=? WHERE order_id=? AND state='received'",
      [authorizationId, String(maxUsageUnits),executionCalendar(atMs),atMs,orderId]); },
    async accept(orderId, authorizationId) { const atMs=executionClock();await db.query(
      "UPDATE agentpay_provider_executions SET state='accepted',authorization_id=?,updated_at=?,updated_at_ms=? WHERE order_id=? AND state IN ('received','accepted')",
      [authorizationId,executionCalendar(atMs),atMs,orderId]); },
    async executing(orderId) { const atMs=executionClock();await db.query(
      "UPDATE agentpay_provider_executions SET state='executing',updated_at=?,updated_at_ms=? WHERE order_id=? AND state='accepted'", [executionCalendar(atMs),atMs,orderId]);
      return this.read(orderId); },
    async complete(orderId, output, outputHash, usageUnits) { const atMs=executionClock(),at=executionCalendar(atMs); await db.query(
      `UPDATE agentpay_provider_executions SET state='completed',output_json=?,output_hash=?,usage_units=?,
       completed_at=?,updated_at=?,updated_at_ms=?,completed_at_ms=? WHERE order_id=? AND state='executing'`,
      [JSON.stringify(output), outputHash,usageUnits,at,at,atMs,atMs,orderId]); return this.read(orderId); },
    async receiptSubmitted(orderId) { const atMs=executionClock();await db.query(
      "UPDATE agentpay_provider_executions SET state='receipt_submitted',updated_at=?,updated_at_ms=? WHERE order_id=? AND state IN ('completed','receipt_submitted')", [executionCalendar(atMs),atMs,orderId]);
      return this.read(orderId); }
  });
}

function validateInvocation(body) {
 try{return normalizeServiceInvocation(body);}catch{throw coded('INVALID_INPUT','Use a valid AgentPay invocation and matching request hash');}
}

// Serialize this Order across processes using a dedicated MySQL connection.
// A crash releases the lock; the application must reconcile external effects.
async function lockExecution(db,orderId){
 const connection=await db.getConnection(),key='ap:'+createHash('sha256').update(orderId).digest('hex').slice(0,60);
 try{
  const [rows]=await connection.query('SELECT GET_LOCK(?, 0) AS acquired',[key]);
  if(Number(rows[0]?.acquired)!==1)throw coded('EXECUTION_BUSY','This Order is already being processed; retry the same request');
 }catch(error){connection.release();throw error;}
 const release=async()=>{try{await connection.query('SELECT RELEASE_LOCK(?)',[key]);connection.release();}catch{connection.destroy();}};
 release.connection=connection;return release;
}

async function settlementPost(config, credential, path, body) {
  const {response,payload} = await postSettlementJson(`${config.settlementBaseUrl}${path}`,credential,body,config.settlementHttpTimeoutMs,
    { finalizationV2: true });
  if (!response.ok || !payload?.ok) throw Object.assign(new Error(payload?.error?.message || `Settlement HTTP ${response.status}`),
    { code: payload?.error?.code || "SETTLEMENT_REJECTED", status: response.status });
  return readProviderSettlementResult(payload, { authorizationView: path.endsWith('/claim') || path.endsWith('/decision'), receiptView: path.endsWith('/receipt') });
}

async function settlePayment(config, credential, paymentPayload) {
  if (!paymentPayload || paymentPayload.x402Version !== 2 || paymentPayload.accepted?.scheme !== "agentpay") {
    throw coded("INVALID_PAYMENT", "PAYMENT-SIGNATURE is not an AgentPay x402 v2 payload");
  }
  const {response,payload} = await postSettlementJson(`${config.settlementBaseUrl}/x402/settle`,credential,
    { x402Version: 2, paymentPayload, paymentRequirements: paymentPayload.accepted },config.settlementHttpTimeoutMs);
  if (!response.ok) throw Object.assign(new Error(payload?.message || `Settlement Gateway HTTP ${response.status}`),
    { code: payload?.error || "SETTLEMENT_GATEWAY_REJECTED", status: response.status });
  return payload;
}

export async function postSettlementJson(url, credential, body, timeoutMs = 30_000, { finalizationV2 = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), positiveTimeout(timeoutMs));
  try {
    const response = await fetch(url, { method: "POST", signal: controller.signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${credential}`,
        ...(finalizationV2 ? { accept: `${AGENTPAY_ORDER_V2_MEDIA_TYPE}, ${AGENTPAY_FINALIZATION_V2_MEDIA_TYPE}, ${AGENTPAY_DEADLINES_V2_MEDIA_TYPE}, ${AGENTPAY_AUTHORIZATION_V2_MEDIA_TYPE}, ${AGENTPAY_DELIVERY_V2_MEDIA_TYPE}`, AGENTPAY_ORDER_V2_MEDIA_TYPE, AGENTPAY_DEADLINES_V2_MEDIA_TYPE, AGENTPAY_AUTHORIZATION_V2_MEDIA_TYPE, AGENTPAY_DELIVERY_V2_MEDIA_TYPE } : {}) }, body: JSON.stringify(body) });
    const payload = await response.json().catch((error) => { if (controller.signal.aborted) throw error; return null; });
    return {response,payload};
  } catch (error) {
    if (controller.signal.aborted) throw coded("SETTLEMENT_TIMEOUT", "Settlement HTTP did not complete in time");
    throw error;
  } finally { clearTimeout(timer); }
}

function positiveTimeout(value) { const milliseconds = Number(value);
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 1) throw new Error("AGENTPAY_PROVIDER_SETTLEMENT_TIMEOUT_MS must be positive");
  return milliseconds; }

function paymentRequired(config) { return providerPaymentRequired(config); }
function success(row,duplicate,tamperResponse=false){
 const output=typeof row.output_json==='string'?JSON.parse(row.output_json):row.output_json;
 if(typeof row.usage_units!=='string')throw coded('EXECUTION_REVIEW_REQUIRED','Stored execution predates explicit usage; preserve it for review');
 return {ok:true,result:{version:'agentpay.service-result.v1',orderId:row.order_id,requestHash:row.request_hash,output,outputHash:tamperResponse?'0x'+'f'.repeat(64):row.output_hash,usageUnits:row.usage_units}};
}

function parseServiceAuthorization(value) { const match = String(value || "").match(/^AgentPay\s+(.+)$/i); return match?.[1]?.trim() || null; }
function parsePaymentSignature(value) { if (!value) return null; try {
  const decoded = Buffer.from(String(value), "base64").toString("utf8"); return JSON.parse(decoded);
} catch { throw coded("INVALID_PAYMENT", "PAYMENT-SIGNATURE must be base64 encoded JSON"); } }
function bytes32(value, field) { const normalized = String(value || "").toLowerCase(); if (!B32.test(normalized)) throw coded("INVALID_INPUT", `${field} must be bytes32`); return normalized; }
function uint(value, field) { const normalized = String(value ?? ""); if (!/^(0|[1-9][0-9]*)$/.test(normalized)) throw coded("INVALID_INPUT", `${field} must be uint`); return normalized; }
function coded(code, message) { return Object.assign(new Error(message), { code }); }
function enumValue(value, allowed, field) { const normalized=String(value).trim().toLowerCase();
  if(!allowed.includes(normalized))throw new Error(`${field} must be one of ${allowed.join(", ")}`);return normalized; }

async function runPreReceiptNegativeProbes(config, credential, { authorization, input, claimed, execution }) {
  const evidence = {};
  evidence.overUsageRejected = await rejectedSettlementPost(config, credential,
    "/agentpay/provider/service-authorizations/receipt", { authorizationId: claimed.authorizationId,
      orderId: input.orderId, claimId: execution.claim_id, receiptId: execution.receipt_id,
      outputHash: `0x${"11".repeat(32)}`, usageUnits: (BigInt(claimed.maxUsageUnits)+1n).toString() });
  const conflictingHash='0x'+(input.requestHash[2]==='0'?'1':'0')+input.requestHash.slice(3);
  const response=await fetch(config.endpoint,{method:"POST",headers:{"content-type":"application/json",
    authorization:`AgentPay ${authorization}`},body:JSON.stringify({version:"agentpay.service-invocation.v1",
      orderId:input.orderId,requestHash:conflictingHash,request:input.request})});
  const body=await response.json().catch(()=>null);
  if(response.status!==400||body?.error?.code!=="INVALID_INPUT")throw new Error("conflicting Provider request was not rejected");
  evidence.conflictingRequestRejected=true;
  return evidence;
}

async function runPostReceiptNegativeProbes(config, credential, { authorization, input, claimed, execution, evidence }) {
  const duplicateClaim=await settlementPost(config, credential,
    "/agentpay/provider/service-authorizations/claim", {authorization,orderId:input.orderId,
      requestHash:input.requestHash,claimId:execution.claim_id});
  evidence.duplicateClaimIdempotent=Boolean(duplicateClaim.duplicate);
  evidence.conflictingClaimRejected=await rejectedSettlementPost(config, credential,
    "/agentpay/provider/service-authorizations/claim", {authorization,orderId:input.orderId,
      requestHash:input.requestHash,claimId:`conflict_${randomUUID()}`});
  const duplicateReceipt=await settlementPost(config, credential,
    "/agentpay/provider/service-authorizations/receipt", {authorizationId:claimed.authorizationId,
      orderId:input.orderId,claimId:execution.claim_id,receiptId:execution.receipt_id,
      outputHash:execution.output_hash,usageUnits:"1",completedAtMs:execution.completed_at_ms});
  evidence.duplicateReceiptIdempotent=Boolean(duplicateReceipt.duplicate);
  evidence.conflictingReceiptRejected=await rejectedSettlementPost(config, credential,
    "/agentpay/provider/service-authorizations/receipt", {authorizationId:claimed.authorizationId,
      orderId:input.orderId,claimId:execution.claim_id,receiptId:`conflict_${randomUUID()}`,
      outputHash:`0x${"22".repeat(32)}`,usageUnits:"1",completedAtMs:execution.completed_at_ms});
  await new Promise((resolve)=>setTimeout(resolve,config.negativeProbeExpiryWaitMs));
  const expiredReplay=await settlementPost(config, credential,
    "/agentpay/provider/service-authorizations/claim", {authorization,orderId:input.orderId,
      requestHash:input.requestHash,claimId:execution.claim_id});
  evidence.expiredClaimReplayRecovered=Boolean(expiredReplay.duplicate);
}

async function rejectedSettlementPost(config, credential, path, body) { try {
  await settlementPost(config,credential,path,body);return false;
} catch { return true; } }
