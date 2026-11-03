import { normalizeParticipantOrder, normalizeFinalizationDisclosure, normalizeOrderDeadlines, normalizeServiceAuthorization, AGENTPAY_SERVICE_AUTHORIZATION_V2, normalizeDeliveryResult, AGENTPAY_DELIVERY_RESULT_V2 } from '@agentpay/types';

// Formal Provider API only. Do not adapt the frozen x402 Gateway envelope.
export function readProviderSettlementResult(payload, { authorizationView = false, receiptView = false } = {}) {
  try {
    const result = payload?.result;
    if (payload?.ok !== true || !result || typeof result !== 'object' || Array.isArray(result)) throw new Error('invalid result');
    let normalized = { ...result };
    if (receiptView || result.version === AGENTPAY_DELIVERY_RESULT_V2 ||
      (Object.hasOwn(result, 'receiptId') && Object.hasOwn(result, 'billing'))) {
      normalized = normalizeDeliveryResult(result);
    } else if (authorizationView || result.version === AGENTPAY_SERVICE_AUTHORIZATION_V2 ||
      (Object.hasOwn(result, 'authorizationId') && (Object.hasOwn(result, 'expiresAt') || Object.hasOwn(result, 'expiresAtMs') || Object.hasOwn(result, 'state') || Object.hasOwn(result, 'authorization')))) {
      normalized = normalizeServiceAuthorization(result);
    } else if (Object.hasOwn(result, 'version') || Object.hasOwn(result, 'role')) {
      const { deadlines, finalizationPolicy, finalization, disputePolicy, ...projection } = result;
      const order = normalizeParticipantOrder(projection);
      if (order.role !== 'provider') throw new Error('invalid Provider Order role');
      normalized = { ...result, ...order };
      for (const key of ['createdAt', 'updatedAt', 'providerResponseDueAt']) delete normalized[key];
    }
    if (normalized.disputePolicy != null) {
      const policy = normalized.disputePolicy;
      if (policy.version !== 'agentpay.dispute-policy.v1') throw new Error('invalid dispute policy');
      let previous = 0;
      for (const field of ['submissionMs','evidenceMs','humanMs','decisionMs','releaseMs','refundMs']) {
        if (!Number.isSafeInteger(policy[field]) || policy[field] <= previous) throw new Error('invalid dispute duration');
        previous = policy[field];
      }
    }
    if (normalized.deadlines != null) normalized.deadlines = normalizeOrderDeadlines(normalized.deadlines);
    if (normalized.finalization != null) normalized.finalization = normalizeFinalizationDisclosure(normalized.finalization);
    return normalized;
  } catch { throw Object.assign(new Error('Settlement response has invalid fields or timestamps'),
    { code: 'SETTLEMENT_RESPONSE_INVALID' }); }
}
