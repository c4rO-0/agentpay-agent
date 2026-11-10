import {assertUnixMilliseconds,parseLegacyIsoMilliseconds} from '@c4roa0/agentpay-protocol';
// Legacy Date/explicit ISO ingress only. This does not establish SQL calendar
// provenance; persisted completion epoch migration remains a separate gate.
export function providerCompletionMilliseconds(value) {
  if (typeof value === 'number') return assertUnixMilliseconds(value);
  if (value instanceof Date) return assertUnixMilliseconds(value.getTime());
  return parseLegacyIsoMilliseconds(value);
}
