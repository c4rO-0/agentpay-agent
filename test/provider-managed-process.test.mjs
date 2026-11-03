import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createManagedProvider } from '../src/provider-managed-process.mjs';
import { savePrivate } from '../src/provider-private-files.mjs';

test('managed child persists, restarts with changed credential, and rejects external process/PID drift', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'provider-process-'));
  const configPath = join(dir, 'config'), script = join(dir, 'fixture.mjs'), marker = `${configPath}.ready`;
  await writeFile(configPath, 'fixture-only', { mode: 0o600 });
  await writeFile(script, `import {writeFileSync, unlinkSync} from 'node:fs';\nconst path=process.argv[2]+'.ready';writeFileSync(path,String(process.pid),{mode:0o600});\nprocess.on('SIGTERM',()=>{try{unlinkSync(path)}catch{}process.exit(0)});setInterval(()=>{},1000);\n`, { mode: 0o600 });
  const manager = createManagedProvider(configPath, { script });
  const env = { AGENT_PROVIDER_BINDING_CREDENTIAL_FILE: join(dir, 'token'), AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE: 'pre_admission' };
  const ready = async () => !!await readFile(marker, 'utf8').catch(() => '');
  let original;
  try {
    await manager.ensure(env, { healthy: ready, ready });
    const first = await manager.owned(); assert.ok(first); original = first;
    assert.equal((await manager.ensure(env, { healthy: ready, ready })).reused, true);
    await writeFile(env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE, 'new-credential', { mode: 0o600 });
    await manager.ensure(env, { healthy: ready, ready });
    const second = await manager.owned(); assert.notEqual(second.pid, first.pid); original = second;
    const admitted = { ...env, AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE: 'admitted' };
    await manager.ensure(admitted, { healthy: ready, ready }); original = await manager.owned();
    await assert.rejects(manager.ensure({ ...admitted, CHANGED: 'yes' }, { healthy: ready, ready }), { code: 'RESTART_CONFIRMATION_REQUIRED' });
    await savePrivate(`${configPath}.process.json`, JSON.stringify({ ...original, startTicks: 'wrong' }));
    await assert.rejects(manager.stop(), /identity changed/);
    assert.equal(await ready(), true);
    await savePrivate(`${configPath}.process.json`, JSON.stringify(original));
    await manager.stop(); assert.equal(await ready(), false);
    await assert.rejects(manager.ensure(env, { healthy: async () => true, ready: async () => false }), /EXTERNAL_PROVIDER_RELOAD_REQUIRED/);
  } finally {
    if (original) await savePrivate(`${configPath}.process.json`, JSON.stringify(original));
    await manager.stop().catch(() => {}); await rm(dir, { recursive: true, force: true });
  }
});
