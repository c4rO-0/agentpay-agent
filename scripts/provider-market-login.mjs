#!/usr/bin/env node
// Reuse a valid owner-held session; refresh an expired session without exposing secrets.
import { createMarketSession } from '../src/provider-market-session.mjs';
import { terminal } from '../src/provider-terminal.mjs';
try {
  const env = Object.fromEntries(['MARKET_BASE_URL', 'MARKET_EMAIL', 'MARKET_SESSION_TOKEN_FILE'].map(key => {
    if (!process.env[key]?.trim()) throw new Error(`${key} is required`);
    return [key, process.env[key].trim()];
  }));
  const client = createMarketSession({ env });
  let state = await client.inspect();
  if (state.state !== 'valid') {
    let password;
    if (process.stdin.isTTY) password = await terminal().ask('Market password (hidden)', { secret: true });
    else {
      const chunks = []; let bytes = 0;
      for await (const chunk of process.stdin) {
        bytes += chunk.length; if (bytes > 4096) throw new Error('Password input is too long'); chunks.push(chunk);
      }
      password = Buffer.concat(chunks).toString('utf8').replace(/[\r\n]+$/, '');
    }
    state = await client.login(password);
  }
  console.log(JSON.stringify({ ok: true, ...state, sessionFile: env.MARKET_SESSION_TOKEN_FILE }));
} catch (error) { console.error(JSON.stringify({ ok: false, error: { code: 'MARKET_LOGIN_FAILED', message: error.message } })); process.exitCode = 1; }
