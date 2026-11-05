import {serviceBase} from './service-url.mjs';
import { readFile } from 'node:fs/promises';
import { isAddress } from 'viem';

export function validateProviderDeployment(input) {
  const keys = ['version', 'mode', 'marketUrl', 'settlementUrl', 'network', 'assetAddress', 'tokenDecimals', 'tokenSymbol',
    'registrationUrl', 'supportContact', 'rehearsal'];
  if (!input || input.version !== 1 || !['private-anvil', 'production'].includes(input.mode) || Object.keys(input).some(key => !keys.includes(key)))
    throw new Error('Invalid public Provider deployment config; use the file supplied by AgentPay');
  const result = { ...input, marketUrl: serviceBase(input.marketUrl, 'Market URL'), settlementUrl: serviceBase(input.settlementUrl, 'Settlement URL') };
  if (!/^eip155:[1-9][0-9]*$/.test(input.network) || !isAddress(input.assetAddress) || /^0x0{40}$/i.test(input.assetAddress) || !Number.isSafeInteger(Number(input.network?.split(':')[1])) ||
      !Number.isInteger(input.tokenDecimals) || input.tokenDecimals < 0 || input.tokenDecimals > 36 ||
      !/^[A-Za-z0-9_-]{1,20}$/.test(input.tokenSymbol || '')) throw new Error('Invalid network/token metadata in public deployment config');
  if (input.registrationUrl) {
    const url = new URL(input.registrationUrl);
    if (url.username || url.password || url.hash || !(url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))))
      throw new Error('Invalid account registration URL');
  }
  if (input.supportContact && (typeof input.supportContact !== 'string' || /[\r\n\x00-\x1f]/.test(input.supportContact))) throw new Error('Invalid support contact');
  if (input.rehearsal) {
    const r = input.rehearsal;
    if (input.mode !== 'private-anvil' || typeof r !== 'object' || Object.keys(r).some(key => !['serviceId', 'port', 'payoutAddress'].includes(key)) ||
        !/^[a-zA-Z0-9._-]{1,120}$/.test(r.serviceId || '') || !Number.isInteger(r.port) || r.port < 1024 || r.port > 65535 ||
        (r.payoutAddress && !isAddress(r.payoutAddress))) throw new Error('Rehearsal defaults must be explicit private-Anvil service values');
  }
  return result;
}
export async function loadProviderDeployment(path) {
  const source = /^https?:\/\//.test(path) ? 'url' : 'file';
  if (source === 'url') {
    const url = new URL(path);
    if (url.username || url.password || url.hash || !(url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname))))
      throw new Error('Public deployment URL must use HTTPS or loopback HTTP');
    const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Public deployment download failed (${response.status})`);
    return validateProviderDeployment(await response.json());
  }
  return validateProviderDeployment(JSON.parse(await readFile(path, 'utf8')));
}
export function tokenAtomic(value, decimals) {
  if (!/^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(value) || (value.split('.')[1]?.length || 0) > decimals)
    throw new Error(`Enter a non-negative number with at most ${decimals} decimal places`);
  const [whole, fraction = ''] = value.split('.');
  return (BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0')).toString();
}
export function tokenDisplay(atomic, decimals) {
  const digits = String(atomic).padStart(decimals + 1, '0');
  return decimals ? `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}`.replace(/\.?0+$/, '') : digits;
}
