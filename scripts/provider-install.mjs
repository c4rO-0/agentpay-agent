#!/usr/bin/env node
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { shellQuote, connectionCommand } from '../src/provider-reference-handoff.mjs';
import { terminal } from '../src/provider-terminal.mjs';
import { privateDirectory, privateText, savePrivate, encodeConfig } from '../src/provider-private-files.mjs';
import { loadStorage, openStorage } from '../src/provider-storage.mjs';
import { createLocalRandomServer } from '../src/local-random-server.mjs';
import { createProviderInstallation } from '../src/provider-installation.mjs';
import { loadInstallation } from '../src/provider-installation-config.mjs';
import { loadProviderHostConfig } from '../src/provider-host-config.mjs';
import { resolveProviderRuntimeEnvironment } from '../src/provider-runtime-environment.mjs';
const ui = terminal(); let lock;
async function newInstallation(directory) {
  const dir = resolve(directory), repository = fileURLToPath(new URL('..', import.meta.url));
  if (!relative(repository, dir).startsWith('../')) throw new Error('Use a private directory outside the Agent repository');
  await mkdir(dir, { recursive: true, mode: 0o700 }); await privateDirectory(dir);
  const path = join(dir, 'installation.env');
  if (await privateText(path, true) !== null) { await loadInstallation(path); return path; }
  ui.heading('Install the local random-number service');
  ui.write('Choose a local service name and port. Application storage is prepared before service verification. AgentPay connection is separate.');
  const draftPath = `${path}.draft.json`, text = await privateText(draftPath, true);
  const draft = text === null ? {} : JSON.parse(text);
  if (Object.keys(draft).some(key => !['SERVICE_ID', 'PORT'].includes(key)) || Object.values(draft).some(value => typeof value !== 'string')) throw new Error('Invalid installation draft');
  for (const [key, prompt, fallback, valid] of [
    ['SERVICE_ID', 'Service name', 'random-guided', x => /^[A-Za-z0-9._-]{1,120}$/.test(x)],
    ['PORT', 'Local port', '6584', x => /^\d+$/.test(x) && Number(x) >= 1024 && Number(x) <= 65535]]) {
    if (draft[key] && valid(draft[key])) continue;
    while (true) {
      const answer = await ui.ask(`${prompt} (Enter uses '${fallback}'; 'q' returns)`);
      if (answer === 'q') throw new Error('Installation paused; saved answers are kept');
      const value = answer || fallback;
      if (!valid(value)) { ui.write(key === 'PORT' ? 'Enter an integer port from 1024 to 65535.' : 'Use letters, numbers, dots, underscores or hyphens.'); continue; }
      draft[key] = value; await savePrivate(draftPath, JSON.stringify(draft) + '\n'); break;
    }
  }
  await savePrivate(path, encodeConfig(draft), { create: true }); await rm(draftPath, { force: true }); return path;
}
async function guide(path, ops) {
  ui.heading('Local service installation');
  await ops.prepareStorage(ui);
  while (true) {
    const configured = await privateText(ops.runtimePath, true) !== null;
    if (configured) {
      ui.write('This application is already configured for paid service. Local free testing is disabled.\nUse the AgentPay connection guide to check registration and paid readiness.\nInstallation guide finished.'); return;
    }
    const state = await ops.health();
    if (state?.local && state.storageReady) {
      await ops.localCheck();
      ui.heading('Installation verified');
      ui.write(`Local random generation passed. Your service is running at ${ops.origin}.\nInstallation file: ${path}\nNext: connect this service to AgentPay:\n${connectionCommand(path)}\nGet the public deployment config from the Market/operator.\nInstallation guide finished. You can close this terminal; the service stays running.`); return;
    }
    if (process.platform !== 'linux') {
      ui.write(`Start in a separate terminal: node scripts/provider-install.mjs ${shellQuote(path)} start\nThen run: node scripts/provider-install.mjs ${shellQuote(path)} check\nManaged background startup currently supports Linux. These foreground commands work on macOS.\nInstallation guide finished; generation verification is still pending.`); return;
    }
    ui.heading('Choose an action');
    ui.write("* 'continue' Start and verify your local service\n  'details'  Show port and private process log\n  'q'        Quit; keep saved installation");
    const action = await ui.ask("Enter 'continue', 'details' or 'q'");
    if (action === 'q') return;
    if (action === 'details') { ui.write(`Local address: ${ops.origin}\nPrivate log: ${ops.manager.logFile}`); continue; }
    if (action !== 'continue') continue;
    try { await ops.startLocal(); } catch (error) { ui.write(`Installation paused: ${error.message}\nNo unrelated process was stopped. Correct the reported condition, then continue.`); }
  }
}
try {
  const args = process.argv.slice(2); const creating = args[0] === '--new';
  if (!args.length || (creating && args.length !== 2) || (!creating && (args.length > 4 || !['guide', 'start', 'check', 'stop', 'configure'].includes(args[1] || 'guide'))) ||
      (!creating && args[1] === 'configure' && (!args[2] || (args[3] && args[3] !== '--edit'))) ||
      (!creating && args[1] !== 'configure' && args.length > 2))
    throw new Error('Usage: provider-install.mjs --new PRIVATE_DIRECTORY | INSTALL_CONFIG [guide|start|check|stop] | INSTALL_CONFIG configure CONNECTION_CONFIG [--edit]');
  const path = creating ? await newInstallation(args[1]) : resolve(args[0]), action = creating ? 'guide' : args[1] || 'guide';
  const ops = await createProviderInstallation(path);
  if (['guide', 'configure', 'stop'].includes(action)) {
    const candidate = `${path}.operation.lock`;
    try { await writeFile(candidate, String(process.pid) + '\n', { flag: 'wx', mode: 0o600 }); lock = candidate; }
    catch { throw new Error('Another application operation is active, or its lock needs owner inspection'); }
  }
  if (action === 'guide') await guide(path, ops);
  else if (action === 'configure') await ops.configure(resolve(args[2]), ui, { edit: args[3] === '--edit' });
  else if (action === 'stop') {
    const state = await ops.manager.owned();
    if (state?.admission === 'admitted' && await ui.ask("Drain active requests. Type 'stop' to stop this paid service, or 'q' to return") !== 'stop') ui.write('Stop cancelled.');
    else ui.write((await ops.manager.stop()).stopped ? 'Your managed service stopped. Files and connection progress are kept.' : 'No live process owned by this installation was found.');
  } else if (action === 'start') {
    if (await privateText(ops.runtimePath, true) !== null) {
      const env = await loadProviderHostConfig(ops.runtimePath);
      if (env.AGENT_PROD_SERVICE_ID !== ops.installation.SERVICE_ID || env.AGENT_PROD_PORT !== ops.installation.PORT) throw new Error('Runtime differs from this installation');
      const child = spawn(process.execPath, [fileURLToPath(new URL('./provider-host.mjs', import.meta.url)), ops.runtimePath, 'start'], {
        env: { PATH: process.env.PATH || '', HOME: process.env.HOME || '', LANG: process.env.LANG || 'C.UTF-8' }, stdio: 'inherit' });
      for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => child.kill(signal));
      process.exitCode = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
    } else {
      const pool = await openStorage(await loadStorage(ops.storagePath));
      const server = createLocalRandomServer({ serviceId: ops.installation.SERVICE_ID, storageReady: true });
      server.once('close', () => pool.end().catch(() => {}));
      server.on('error', error => { ui.write(`Local service failed: ${error.code || error.message}`); process.exitCode = 1; pool.end().catch(() => {}); });
      server.listen(Number(ops.installation.PORT), '127.0.0.1', () => ui.write(`Local random-number service running at ${ops.origin}. Ctrl+C stops it.\nAgentPay paid routes are not enabled.`));
      for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close());
    }
  } else {
    if (await privateText(ops.runtimePath, true) !== null) {
      const { env } = await resolveProviderRuntimeEnvironment(await loadProviderHostConfig(ops.runtimePath));
      const state = await ops.health();
      if (!state || state.local || state.native.route !== `/services/${encodeURIComponent(env.AGENT_PROD_SERVICE_ID)}/agentpay/invoke` || state.native.skillId !== env.AGENT_NATIVE_SKILL_ID || state.native.profileHash !== env.AGENT_NATIVE_PROFILE_HASH || state.native.admissionState !== env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE)
        throw new Error('Paid runtime is not running with the saved declaration. Rerun the application configure command.');
      ui.write(`Application health passed. Local mode: ${state.native.admissionState}.\nNo unpaid generation or Order was executed. Use the connection guide to verify platform readiness.`);
    } else { await ops.localCheck(); ui.write('Local random generation passed. Installation verification finished.\nAgentPay connection is a separate step.'); }
  }
} catch (error) { ui.write(`Application operation paused: ${error.message}`); process.exitCode = 1; }
finally { if (lock) await rm(lock, { force: true }); }
