import { open, readFile, readlink, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { privateText, savePrivate } from './provider-private-files.mjs';
import { listenerPresent } from './provider-prerequisites.mjs';

const hostScript = fileURLToPath(new URL('../scripts/provider-host.mjs', import.meta.url));
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function processIdentity(pid) {
  try {
    const [stat, command, executable, status] = await Promise.all([
      readFile(`/proc/${pid}/stat`, 'utf8'), readFile(`/proc/${pid}/cmdline`, 'utf8'), readlink(`/proc/${pid}/exe`), readFile(`/proc/${pid}/status`, 'utf8')
    ]);
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    if (fields[0] === 'Z') return null;
    return { startTicks: fields[19], command: command.split('\0').filter(Boolean), executable,
      uid: Number(status.match(/^Uid:\s+(\d+)/m)?.[1]), group: Number(fields[2]), session: Number(fields[3]) };
  } catch (error) { if (['ENOENT', 'ESRCH'].includes(error.code)) return null; throw error; }
}
export function createManagedProvider(configPath, { script = hostScript } = {}) {
  const stateFile = `${configPath}.process.json`, logFile = `${configPath}.process.log`;
  async function owned() {
    const text = await privateText(stateFile, true);
    if (text === null) return null;
    const state = JSON.parse(text);
    if (state.version !== 1 || !Number.isInteger(state.pid) || state.pid < 2 || state.configPath !== configPath)
      throw new Error('Invalid managed process record; inspect it before continuing');
    const live = await processIdentity(state.pid);
    if (!live) return null;
    if (live.startTicks !== state.startTicks || live.executable !== process.execPath || live.uid !== process.getuid() || live.group !== state.pid || live.session !== state.pid ||
        JSON.stringify(live.command) !== JSON.stringify([process.execPath, script, configPath, 'start']))
      throw new Error('Managed process identity changed; no process was stopped');
    return state;
  }
  async function fingerprint(env) {
    const secret = env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE ? await privateText(env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE, true) : null;
    return createHash('sha256').update(JSON.stringify(env)).update(secret || '').digest('hex');
  }
  async function stop() {
    const prior = await owned();
    if (!prior) return { stopped: false };
    process.kill(-prior.pid, 'SIGTERM');
    for (let i = 0; i < 100 && await processIdentity(prior.pid); i++) await sleep(100);
    if (await processIdentity(prior.pid)) throw new Error('Provider did not stop; inspect its process log');
    await rm(stateFile, { force: true });
    return { stopped: true };
  }
  async function ensure(env, { healthy, ready, allowRestart = false }) {
    if (process.platform !== 'linux') throw new Error('Managed Provider startup currently requires Linux; use the foreground host command on other systems');
    const digest = await fingerprint(env), prior = await owned();
    if (prior && prior.fingerprint === digest && await ready()) return { reused: true, managed: true };
    if (!prior && await healthy()) {
      if (await ready()) return { reused: true, managed: false };
      throw new Error('EXTERNAL_PROVIDER_RELOAD_REQUIRED: this guide does not own the running process. Restart it with the current Provider config, then continue.');
    }
    if (!prior && env.AGENT_PROD_PORT && await listenerPresent(env.AGENT_PROD_PORT))
      throw new Error('PROVIDER_PORT_IN_USE: another process occupies this port. Reopen the existing service config or choose a free port; no process was stopped.');
    if (prior) {
      if (prior.admission === 'admitted' && !allowRestart)
        throw Object.assign(new Error('Restarting this admitted Provider can interrupt active work'), { code: 'RESTART_CONFIRMATION_REQUIRED' });
      // Verify identity immediately before signalling the process group created here.
      await stop();
    }
    await privateText(logFile, true); // Reject unsafe existing log files before opening.
    const log = await open(logFile, 'a', 0o600);
    let child;
    let recorded = false;
    try {
      child = spawn(process.execPath, [script, configPath, 'start'], { detached: true,
        env: { PATH: process.env.PATH || '', HOME: process.env.HOME || '', LANG: process.env.LANG || 'C.UTF-8' },
        stdio: ['ignore', log.fd, log.fd] });
      await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
      const identity = await processIdentity(child.pid);
      if (!identity) throw new Error('Provider exited during startup; inspect the private process log');
      await savePrivate(stateFile, JSON.stringify({ version: 1, pid: child.pid, configPath,
        startTicks: identity.startTicks, fingerprint: digest, admission: env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE }) + '\n');
      recorded = true;
      child.unref();
    } catch (error) {
      // A child created in this call is ours even if saving its record failed.
      if (child?.pid && !recorded) { try { process.kill(-child.pid, 'SIGTERM'); } catch {} child.unref(); }
      throw error;
    } finally { await log.close(); }
    for (let i = 0; i < 60; i++) {
      if (!await processIdentity(child.pid)) throw new Error(`Provider startup failed; private log: ${logFile}`);
      if (await ready()) return { reused: false, managed: true };
      await sleep(250);
    }
    throw new Error(`Provider startup checks timed out; private log: ${logFile}. Saved steps are kept.`);
  }
  return { owned, ensure, stop, logFile };
}
