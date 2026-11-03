import {serviceBase,serviceUrl} from './service-url.mjs';
import {assertUnixMilliseconds} from '@agentpay/types';
import { canonicalizeServiceProfile, hashServiceProfile, paymentEndpointForService } from "@agentpay/types";
import { readProviderBinding } from "./provider-binding-state.mjs";
import { readPrivateFile } from "./provider-binding-client.mjs";

// Provider-only service onboarding. Configuration describes the service; live
// endpoint and authenticated Settlement results must agree before registration.
export function createProviderServiceClient({ settlementBaseUrl, serviceId, mcpEndpoint,
  skillId, profileHash, seller, network, asset, credentialFile, bindingStateFile,
  providerControlUrl, fetchImpl = fetch }) {
  const base = new URL(serviceBase(settlementBaseUrl));
  if (base.username || base.password || base.search || base.hash ||
      (base.protocol !== "https:" && !(base.protocol === "http:" &&
        ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)))) throw new Error("Settlement requires HTTPS or loopback HTTP");
  if (!/^0x[0-9a-f]{64}$/.test(skillId || "") || !/^0x[0-9a-f]{64}$/.test(profileHash || "")) {
    throw new Error("skillId and profileHash must be canonical bytes32");
  }
  const paymentEndpoint = paymentEndpointForService(mcpEndpoint, serviceId);
  async function api(path, token, body) {
    const response = await fetchImpl(serviceUrl(base,path), { method: body === undefined ? "GET" : "POST", redirect: "error",
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), "content-type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(10000) });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.ok !== true) {
      const code = payload?.error?.code || `HTTP_${response.status}`;
      const message = typeof payload?.error?.message === "string" ? payload.error.message.slice(0, 500) : "Settlement rejected this request";
      throw Object.assign(new Error(`${path}: ${code}: ${message}`), { code });
    }
    return payload.result;
  }
  async function preflight({ checkOffer = true } = {}) {
    const endpointUrl = mcpEndpoint.replace(/\/invoke$/, "");
    const binding = await readProviderBinding(bindingStateFile, endpointUrl);
    if (!binding) throw new Error("verified binding for this endpoint is missing; complete B1");
    const token = await readPrivateFile(credentialFile, "Provider credential");
    const credential = await api("/agentpay/provider/bindings/credentials/me", token, {});
    if (credential.providerId !== binding.providerId || credential.credentialId !== binding.credentialId ||
        credential.endpointUrl !== endpointUrl || credential.credentialStatus !== "active") {
      throw new Error("active credential does not match this endpoint binding; restore B1");
    }
    const profile = JSON.parse(canonicalizeServiceProfile({ version: "agentpay.service-profile.v1",
      providerId: binding.providerId, serviceId, mcpEndpoint, paymentEndpoint, seller, network, asset }));
    if (hashServiceProfile(profile) !== profileHash) throw new Error("configured profileHash differs from canonical service profile");
    if (!checkOffer) return { token, profile, report: { skillId, profileHash, profile } };
    const response = await fetchImpl(paymentEndpoint, { method: "POST", redirect: "error",
      headers: { "content-type": "application/json", "x-agentpay-conformance": "1" },
      body: JSON.stringify({ agentpayConformance: true }), signal: AbortSignal.timeout(5000) });
    const payment = await response.json();
    const offer = payment.requirement;
    if (response.status !== 402 || payment.version !== "agentpay.service-payment-required.v1" ||
        payment.resource?.url !== paymentEndpoint || payment.resource?.method !== "POST" ||
        offer?.skillId !== skillId || offer?.profileHash !== profileHash ||
        offer?.seller?.toLowerCase() !== profile.seller || offer?.asset?.toLowerCase() !== profile.asset ||
        offer?.network !== profile.network) throw new Error("live Provider 402 differs from the canonical service declaration");
    let display;
    try {
      const metadata=await fetchImpl(paymentEndpoint.replace(/\/invoke$/, '/display'),{method:'GET',redirect:'error',signal:AbortSignal.timeout(5000)});
      const value=await metadata.json();
      if(metadata.ok&&value?.ok===true)display=value.result;
    } catch { /* Optional copy cannot block payment-profile registration. */ }
    return { token, profile, display, report: { skillId, profileHash, profile, providerResponseStatus: 402 } };
  }
  async function preview() { return (await preflight()).report; }
  async function register() {
    const checked = await preflight();
    const result = await api("/agentpay/provider/services/register", checked.token,
      { skillId, profileHash, profile: checked.profile, ...(checked.display?{display:checked.display}:{}) });
    if (result?.skillId !== skillId || result.profileHash !== profileHash ||
        result.providerId !== checked.profile.providerId || result.serviceId !== serviceId ||
        result.paymentEndpoint !== paymentEndpoint) throw new Error("Settlement registration response differs from this service");
    return { ...checked.report, registration: result };
  }
  async function status() {
    const checked = await preflight({ checkOffer: false });
    const registration = await api("/agentpay/provider/services/read", checked.token, { skillId, profileHash });
    if (registration.registered && canonicalizeServiceProfile(registration.profile) !== canonicalizeServiceProfile(checked.profile)) {
      throw new Error("Settlement registered profile differs from this service");
    }
    const readiness = await api(`/agentpay/purchase-readiness?skillId=${skillId}&profileHash=${profileHash}`);
    if (readiness.quote && (readiness.quote.providerId !== checked.profile.providerId ||
        readiness.quote.skillId !== skillId || readiness.quote.profileHash !== profileHash)) {
      throw new Error("Settlement readiness refers to another service");
    }
    let localAdmission = { admissionState: "unknown", source: "provider_loopback", ...inspectionTime() };
    if (providerControlUrl) {
      const control = new URL(providerControlUrl);
      if (!["localhost", "127.0.0.1", "[::1]"].includes(control.hostname) ||
          !["http:", "https:"].includes(control.protocol) || control.username || control.password || control.search || control.hash || control.pathname !== "/") {
        throw new Error("Provider control URL must be clean loopback HTTP(S)");
      }
      try {
        const response = await fetchImpl(new URL("/health", control), { redirect: "error", signal: AbortSignal.timeout(5000) });
        const body = await response.json();
        const native = body?.result?.nativeProvider;
        if (response.ok && body.ok === true && body.result.serviceId === serviceId && native?.enabled === true &&
            native.route === new URL(paymentEndpoint).pathname && ["admitted", "pre_admission"].includes(native.admissionState)) {
          localAdmission.admissionState = native.admissionState;
        }
      } catch { /* Unavailable or mismatched health remains unknown. */ }
    }
    const nextActions = [];
    const observationError = registration.quoteTarget?.observationError || null;
    const quoteRecovery = observationError ? {
      code: observationError.code, message: observationError.message,
      action: observationError.code === "QUOTE_OFFER_CONFLICT" ? "prepare_changed_offer_and_restart"
        : observationError.code === "QUOTE_INVALID_REQUIREMENT" ? "check_declaration_prepare_and_restart"
        : observationError.code === "QUOTE_HTTP_STATUS" ? "check_public_price_endpoint"
        : observationError.code === "QUOTE_CHARGE_LIMIT" ? "review_price_and_settlement_limits"
        : "retry_observation_or_contact_operator"
    } : registration.quoteTarget?.observationFailed ? {
      code: "QUOTE_OBSERVATION_FAILED", message: "Quote observation failed; this Settlement did not return details",
      action: "retry_observation_or_contact_operator"
    } : null;
    if (quoteRecovery) nextActions.push(quoteRecovery.action);
    if (!registration.registered) nextActions.push("register_service");
    else {
      const state = registration.serviceStatus;
      if (state?.qualification?.qualificationStatus !== "qualified") {
        nextActions.push(state?.qualification?.qualificationStatus === "not_qualified" ? "await_registry_qualification" : "retry_registry_check");
      }
      if (state?.quote?.quoteStatus !== "fresh") nextActions.push("await_or_check_quote_observation");
      if (readiness.commercialReady !== true) nextActions.push("resolve_settlement_blockers");
    }
    if (localAdmission.admissionState !== "admitted") nextActions.push(
      localAdmission.admissionState === "pre_admission" ? "review_and_configure_local_admission" : "check_local_provider_process");
    return { ...checked.report, registration, readiness, readinessScope: "first_blocker_snapshot",
      localAdmission, quoteRecovery, nextActions, ...inspectionTime() };
  }
  return Object.freeze({ preview, register, status });
}

function inspectionTime(){const checkedAtMs=assertUnixMilliseconds(Date.now());return {checkedAtMs,checkedAt:new Date(checkedAtMs).toISOString()};}
