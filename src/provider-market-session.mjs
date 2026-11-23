import {serviceBase,serviceUrl} from './service-url.mjs';
import { privateText, savePrivate, privateDirectory } from './provider-private-files.mjs';
import { dirname } from 'node:path';

export function createMarketSession({ env, fetchImpl = fetch, temporary = false }) {
  const base=serviceBase(env.MARKET_BASE_URL,'Market URL');
  const path = env.MARKET_SESSION_TOKEN_FILE;
  if (!path?.startsWith('/')) throw new Error('Market session file must use an absolute private path');
  let inMemory = null;
  const readToken = () => temporary ? inMemory : privateText(path, true);
  async function inspect() {
    const text = await readToken();
    if (text === null) return { state: 'missing' };
    const token = text.trim();
    if (!token) throw new Error('Market session file is empty');
    const response = await fetchImpl(serviceUrl(base,'/developers/me'), { redirect: 'error',
      headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
    if (response.status === 401) return { state: 'expired' };
    const body = await response.json();
    if (!response.ok || body?.ok !== true || !body.result?.developer?.id) throw new Error('Market account status is unavailable; retry later');
    const account = body.result.developer;
    if (account.email?.toLowerCase() !== env.MARKET_EMAIL.toLowerCase()) throw new Error('Saved Market session belongs to a different account');
    return { state: 'valid', accountId: account.id, email: account.email };
  }
  async function login(password) {
    await privateDirectory(dirname(path));
    const state = await inspect();
    if (state.state === 'valid') return state;
    if (!password || Buffer.byteLength(password) > 4096) throw new Error('Market password is empty or too long');
    const response = await fetchImpl(serviceUrl(base,'/developers/login'), { method: 'POST', redirect: 'error',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: env.MARKET_EMAIL, password }),
      signal: AbortSignal.timeout(10000) });
    const body = await response.json();
    if (!response.ok || body?.ok !== true || typeof body.result?.sessionToken !== 'string' || !body.result.sessionToken.trim() || /[\r\n]/.test(body.result.sessionToken) ||
        typeof body.result.developer?.id !== 'string' || !body.result.developer.id)
      throw new Error(`Market login rejected (${response.status}); check your account and password`);
    if (body.result.developer?.email?.toLowerCase() !== env.MARKET_EMAIL.toLowerCase()) throw new Error('Market returned another account');
    if (temporary) inMemory = body.result.sessionToken;
    else await savePrivate(path, `${body.result.sessionToken}\n`, { create: state.state === 'missing' });
    return { state: 'valid', accountId: body.result.developer.id };
  }
  async function close() {
    if (!inMemory) return;
    const token = inMemory;
    inMemory = null;
    const response = await fetchImpl(serviceUrl(base, '/developers/logout'), {
      method: 'POST', redirect: 'error', headers: {authorization: `Bearer ${token}`},
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok || (await response.json()).result?.revoked !== true)
      throw new Error('Market could not confirm sign-out. The local session was discarded.');
  }
  return { inspect, login, readToken, close };
}
