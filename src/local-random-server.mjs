import { createServer } from 'node:http';
import { execute } from './services/random.mjs';

// Installation smoke test only: bound to loopback, with no AgentPay routes,
// credentials or claims of paid-service readiness.
export function createLocalRandomServer({ serviceId, storageReady = false }) {
  return createServer(async (req, res) => {
    const send = (status, body) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (req.method === 'GET' && req.url === '/health') return send(200, { ok: true, serviceId, mode: 'local-installation', storageReady });
    if (req.method !== 'POST' || req.url !== '/random') return send(404, { error: 'NOT_FOUND' });
    // No remote inputs are needed for the local generation test.
    req.resume();
    const result = await execute('Generate a random number.');
    send(200, { ok: true, serviceId, randomNumber: result.data.randomNumber });
  });
}
