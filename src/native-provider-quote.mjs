import { assertUnixMilliseconds, assertUnixSeconds } from '@agentpay/types';
import { createHash } from 'node:crypto';

// Reference Provider policy; wire validUntil always remains Unix seconds.
// A fixed operator deadline is never silently renewed.
export function quoteLifetime(env) {
  const fixed = String(env.AGENT_NATIVE_VALID_UNTIL || '').trim();
  const ttl = String(env.AGENT_NATIVE_QUOTE_TTL_SECONDS || '').trim();
  if (fixed && ttl) throw Error('choose fixed AGENT_NATIVE_VALID_UNTIL or rolling AGENT_NATIVE_QUOTE_TTL_SECONDS');
  if (fixed) {
    if (!/^[1-9][0-9]*$/.test(fixed) || BigInt(fixed) > 253402300799n) throw Error('invalid fixed Quote Unix timestamp');
    return { validUntil: fixed, quoteTtlSeconds: null };
  }
  const seconds = ttl || '600';
  if (!/^[1-9][0-9]*$/.test(seconds) || Number(seconds) < 60 || Number(seconds) > 86400) throw Error('rolling Quote TTL must be 60..86400 seconds');
  return { validUntil: null, quoteTtlSeconds: Number(seconds) };
}

export function providerPaymentRequired(config, nowMs = Date.now()) {
  try { assertUnixMilliseconds(nowMs); } catch { throw Error('invalid Provider clock'); }
  let validUntil = config.validUntil, offerId = config.offerId;
  if (config.quoteTtlSeconds != null) {
    if (!Number.isSafeInteger(config.quoteTtlSeconds) || config.quoteTtlSeconds < 60 || config.quoteTtlSeconds > 86400) {
      throw Error('invalid rolling Quote TTL');
    }
    const step = Math.floor(config.quoteTtlSeconds / 2);
    // Same window/content yields the same offer across retries and restarts.
    validUntil = String((Math.floor(Math.floor(nowMs / 1000) / step) + 2) * step);
    offerId = `0x${createHash('sha256').update(JSON.stringify([
      config.offerId, config.endpoint, config.network, config.asset, config.skillId,
      config.profileHash, config.seller, config.baseAmount, config.unitPrice,
      config.maxUsageUnits, validUntil, config.serviceWindowSeconds??null
    ])).digest('hex')}`;
  }
  if (typeof validUntil !== 'string' || !/^[1-9][0-9]*$/.test(validUntil)) throw Error('invalid Quote Unix expiry');
  assertUnixSeconds(validUntil);
  if(config.serviceWindowSeconds!=null&&(!/^[1-9][0-9]*$/.test(config.serviceWindowSeconds)||Number(config.serviceWindowSeconds)>31536000))throw Error("Invalid serviceWindowSeconds");
  return { version: 'agentpay.service-payment-required.v1',
    resource: { url: config.endpoint, method: 'POST' }, requirement: {
      scheme: 'agentpay', network: config.network, asset: config.asset,
      skillId: config.skillId, profileHash: config.profileHash, seller: config.seller,
      baseAmount: config.baseAmount, unitPrice: config.unitPrice,
      maxUsageUnits: config.maxUsageUnits, ...(config.serviceWindowSeconds==null?{}:{serviceWindowSeconds:config.serviceWindowSeconds}), offerId, validUntil } };
}
