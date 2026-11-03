import {providerBaseForEndpoint} from './provider-service-urls.mjs';
import { createProviderBindingClient, readPrivateFile } from './provider-binding-client.mjs';
import { loadStorage, prepareStorage } from './provider-storage.mjs';
import { shellQuote } from './provider-reference-handoff.mjs';
import { loadInstallation } from './provider-installation-config.mjs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAddress } from 'viem';
import { privateText, savePrivate, encodeConfig } from './provider-private-files.mjs';
import { loadProviderConnectionConfig } from './provider-connection-config.mjs';
import { validateProviderDeployment, tokenAtomic } from './provider-deployment.mjs';
import { loadProviderHostConfig, checkProviderHostConfig } from './provider-host-config.mjs';
import { resolveProviderRuntimeEnvironment } from './provider-runtime-environment.mjs';
import { createProviderServiceClient } from './provider-service-client.mjs';
import { checkProviderDatabase } from './provider-prerequisites.mjs';
import { createManagedProvider } from './provider-managed-process.mjs';

export async function createProviderInstallation(path, { fetchImpl = fetch, databaseCheck = checkProviderDatabase,
  storageInitialize, manager = createManagedProvider(path, { script: fileURLToPath(new URL('../scripts/provider-install.mjs', import.meta.url)) }) } = {}) {
  const installation = await loadInstallation(path), directory = dirname(path), runtimePath = join(directory, 'runtime.env');
  const origin = `http://127.0.0.1:${installation.PORT}`;
  const storagePath = join(directory, 'storage.env');
  const localEnv = { AGENT_PROD_SERVICE_ID: installation.SERVICE_ID, AGENT_PROD_PORT: installation.PORT, MODE: 'local-installation' };
  async function health() {
    try {
      const response = await fetchImpl(`${origin}/health`, { redirect: 'error', signal: AbortSignal.timeout(2000) });
      const body = await response.json();
      if (!response.ok) return null;
      if (body.ok === true && body.serviceId === installation.SERVICE_ID && body.mode === 'local-installation') return { local: true, storageReady: body.storageReady === true };
      if (body.ok === true && body.result?.serviceId === installation.SERVICE_ID && body.result.nativeProvider?.enabled === true) return { local: false, native: body.result.nativeProvider };
      return null;
    } catch { return null; }
  }
  async function localCheck() {
    if (!(await health())?.storageReady) throw new Error('Local installation service is not running. Choose start; if this port is occupied, inspect its owner.');
    const response = await fetchImpl(`${origin}/random`, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(3000) });
    const result = await response.json();
    if (!response.ok || result.ok !== true || result.serviceId !== installation.SERVICE_ID || !Number.isInteger(result.randomNumber) || result.randomNumber < 0 || result.randomNumber >= 1e9)
      throw new Error('Local random generation check failed');
    return true;
  }
  async function startLocal() {
    if (await privateText(runtimePath, true) !== null) throw new Error('This installation has paid-runtime configuration. Use configure to check/reload it; local free generation will not be enabled.');
    const storage = await loadStorage(storagePath);
    await manager.ensure({...localEnv, ...storage}, { healthy: async () => !!await health(), ready: async () => !!(await health())?.storageReady });
    await localCheck();
  }
  async function configure(connectionPath, ui, { edit = false } = {}) {
    const storage = await loadStorage(storagePath);
    const connection = await loadProviderConnectionConfig(connectionPath);
    if (connection.AGENT_PROD_SERVICE_ID !== installation.SERVICE_ID || connection.AGENT_PROVIDER_CONTROL_URL !== origin)
      throw new Error('Connection service name/control port differs from this installation. Use the matching connection; nothing was changed.');
    const ownPaths = [path, storagePath, `${storagePath}.draft.json`, runtimePath, join(directory, 'service.json'), `${path}.process.json`, `${path}.process.log`, `${path}.operation.lock`, `${runtimePath}.pricing-draft.json`];
    const connectionPaths = [connectionPath, `${connectionPath}.deployment.json`, `${connectionPath}.reference.json`, `${connectionPath}.guide.lock`, connection.MARKET_SESSION_TOKEN_FILE,
      connection.AGENT_PROVIDER_BINDING_STATE_FILE, connection.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE];
    if (new Set([...ownPaths, ...connectionPaths].map(file => resolve(file))).size !== ownPaths.length + connectionPaths.length)
      throw new Error('Application and connection files must have distinct paths');
    const deployment = validateProviderDeployment(JSON.parse(await privateText(`${connectionPath}.deployment.json`)));
    if (deployment.marketUrl !== connection.MARKET_BASE_URL || deployment.settlementUrl !== connection.SETTLEMENT_BASE_URL ||
        deployment.network !== connection.AGENT_NATIVE_NETWORK || deployment.assetAddress.toLowerCase() !== connection.AGENT_NATIVE_ASSET.toLowerCase())
      throw new Error('Public deployment does not match the connection');
    const priorText = await privateText(runtimePath, true);
    let prior = priorText === null ? null : await loadProviderHostConfig(runtimePath);
    if (prior) {
      const changed = Object.keys(connection).filter(key => prior[key] !== connection[key]);
      if (changed.length) {
        if (changed.length !== 1 || changed[0] !== 'AGENT_PROVIDER_BINDING_CREDENTIAL_FILE' ||
            prior.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE !== 'pre_admission')
          throw new Error(`Runtime connection changed at ${changed[0]}. Restore its original connection; no identity was replaced.`);
        const state = await createProviderBindingClient({ marketBaseUrl: connection.MARKET_BASE_URL,
          settlementBaseUrl: connection.SETTLEMENT_BASE_URL, mcpEndpoint: connection.AGENT_MCP_ENDPOINT,
          sessionToken: await readPrivateFile(connection.MARKET_SESSION_TOKEN_FILE, 'Market session'),
          credentialFile: connection.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,
          bindingStateFile: connection.AGENT_PROVIDER_BINDING_STATE_FILE, fetchImpl }).status();
        if (state.binding?.status !== 'pending' || !state.localCredentialMatches)
          throw new Error('Replacement credential must authenticate the same pending endpoint binding. No application settings were changed.');
        ui.write('Load the explicitly reissued pending credential. Existing storage, prices and service identity are kept.');
        if (await ui.ask("Type 'confirm' to load it, or 'q' to return") !== 'confirm') return { cancelled: true };
      }
      if (edit) {
        const { editProviderConfiguration } = await import('./provider-config-edit.mjs');
        if (!await editProviderConfiguration(runtimePath, ui, deployment)) return { cancelled: true };
        prior = await loadProviderHostConfig(runtimePath);
      }
    }
    const env = { ...connection, AGENT_PROD_KIND: 'random', AGENT_PROD_HOST: '127.0.0.1', AGENT_PROD_PORT: installation.PORT,
      AGENT_PUBLIC_BASE_URL: providerBaseForEndpoint(connection.AGENT_MCP_ENDPOINT, connection.AGENT_PROD_SERVICE_ID),
      AGENTPAY_NATIVE_PROVIDER_ENABLED: 'true', AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE: prior?.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE || 'pre_admission',
      AGENT_PROVIDER_CREDENTIAL_FILE: connection.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE,
      AGENT_PROVIDER_SERVICE_STATE_FILE: join(directory, 'service.json'), AGENT_NATIVE_MAX_USAGE_UNITS: '1', AGENT_NATIVE_QUOTE_TTL_SECONDS: '600' };
    const fields = ['AGENT_NATIVE_SELLER', 'AGENT_NATIVE_BASE_AMOUNT', 'AGENT_NATIVE_UNIT_PRICE','AGENT_NATIVE_SERVICE_WINDOW_SECONDS'];
    Object.assign(env, storage);
    if (prior) {
      for(const key of Object.keys(storage)) if(prior[key]!==storage[key]) throw new Error('Application storage changed; use a dedicated recovery procedure before moving execution records.');
      for (const key of fields.filter(key => !key.startsWith('AGENT_PROVIDER_DB_'))) if(prior[key]!==undefined)env[key] = prior[key];
    }
    else {
      const draftPath = `${runtimePath}.pricing-draft.json`, text = await privateText(draftPath, true);
      const draft = text === null ? { version: 1, connectionPath: resolve(connectionPath), fields: {} } : JSON.parse(text);
      if (draft.version !== 1 || draft.connectionPath !== resolve(connectionPath) || !draft.fields ||
          Object.entries(draft.fields).some(([key, value]) => !fields.includes(key) || key === 'AGENT_PROVIDER_DB_PASSWORD' || typeof value !== 'string'))
        throw new Error('Invalid runtime draft; restore the original connection/draft');
      async function ask(key, prompt, fallback = '', validate = () => true) {
        fallback = draft.fields[key] || fallback;
        while (true) {
          const answer = await ui.ask(`${prompt}${fallback ? ` (Enter keeps '${fallback}')` : ''}; 'q' returns`);
          if (answer === 'q') throw new Error('Runtime configuration paused; non-secret answers are saved');
          const value = answer || fallback;
          if (!value || /[\r\n\0]/.test(value) || !validate(value)) { ui.write('Enter the value described in the prompt.'); continue; }
          env[key] = value; draft.fields[key] = value; await savePrivate(draftPath, JSON.stringify(draft) + '\n'); return;
        }
      }
      ui.heading('Configure the reference paid-service application');
      ui.write(`Platform: ${deployment.network}; token: ${deployment.tokenSymbol}. Storage is read from the completed installation.`);
      ui.heading('Receiving account and prices');
      await ask('AGENT_NATIVE_SELLER', `Your receiving account on ${deployment.network}`, deployment.rehearsal?.payoutAddress || '', isAddress);
      ui.write(`Each random-number request uses one usage unit. Price = base + unit price, in ${deployment.tokenSymbol}.`);
      for (const [key, label] of [['AGENT_NATIVE_BASE_AMOUNT', 'Base price per order'], ['AGENT_NATIVE_UNIT_PRICE', 'Price per usage unit']]) {
        await ask(key, `${label} (${deployment.tokenSymbol})`, '0', value => { try { tokenAtomic(value, deployment.tokenDecimals); return true; } catch { return false; } });
        env[key] = tokenAtomic(env[key], deployment.tokenDecimals);
      }
      if (BigInt(env.AGENT_NATIVE_BASE_AMOUNT) + BigInt(env.AGENT_NATIVE_UNIT_PRICE) === 0n) {
        ui.write('This paid service needs a nonzero price. Set a unit price above zero.');
        await ask('AGENT_NATIVE_UNIT_PRICE', `Price per usage unit (${deployment.tokenSymbol})`, '', value => { try { return BigInt(tokenAtomic(value, deployment.tokenDecimals)) > 0n; } catch { return false; } });
        env.AGENT_NATIVE_UNIT_PRICE = tokenAtomic(env.AGENT_NATIVE_UNIT_PRICE, deployment.tokenDecimals);
      }
      ui.write('Maximum delivery time starts at Order creation, including payment and acceptance waits. Existing Orders cannot be extended.');
      await ask('AGENT_NATIVE_SERVICE_WINDOW_SECONDS','Maximum delivery time in seconds, or default for Settlement policy','default',value=>value==='default'||/^[1-9][0-9]*$/.test(value)&&Number(value)<=31536000);
      if(env.AGENT_NATIVE_SERVICE_WINDOW_SECONDS==='default')delete env.AGENT_NATIVE_SERVICE_WINDOW_SECONDS;
    }
    checkProviderHostConfig(env, Date.now(), { allowMissingIdentifiers: true });
    const db = await databaseCheck(env);
    if (!db.ok) throw new Error(`${db.code}: ${db.message} No platform registration was attempted.`);
    if (prior && await privateText(env.AGENT_PROVIDER_SERVICE_STATE_FILE, true) === null)
      throw new Error('Existing service identity is missing. Restore service.json; no replacement identity was generated.');
    const prepared = await resolveProviderRuntimeEnvironment(env, { prepare: true });
    let qualificationConfirmed = false;
    if (prepared.bindingPresent) {
      // Application-owned enablement, based solely on authenticated/public API facts.
      const service = createProviderServiceClient({ settlementBaseUrl: env.SETTLEMENT_BASE_URL, serviceId: env.AGENT_PROD_SERVICE_ID,
        mcpEndpoint: env.AGENT_MCP_ENDPOINT, skillId: prepared.env.AGENT_NATIVE_SKILL_ID, profileHash: prepared.env.AGENT_NATIVE_PROFILE_HASH,
        seller: env.AGENT_NATIVE_SELLER, network: env.AGENT_NATIVE_NETWORK, asset: env.AGENT_NATIVE_ASSET,
        credentialFile: env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE, bindingStateFile: env.AGENT_PROVIDER_BINDING_STATE_FILE, fetchImpl });
      const state = await service.status();
      const qualified = state.registration?.registered === true && state.registration.serviceStatus?.qualification?.qualificationStatus === 'qualified';
      qualificationConfirmed = qualified;
      if (qualified && state.registration.serviceStatus?.quote?.quoteStatus === 'fresh' && state.readiness?.commercialReady === true)
        env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE = 'admitted';
      ui.write(`Registry: ${qualified ? 'qualified' : 'not yet qualified'}; local mode: ${env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE}.`);
    }
    // Save application settings independently of connection facts; a reload failure
    // is recoverable by rerunning this exact command, never by resetting B1/B2.
    await savePrivate(runtimePath, encodeConfig(env));
    const final = await resolveProviderRuntimeEnvironment(env);
    if (process.platform !== 'linux') {
      ui.write(`Application configuration saved. In another terminal, run:\nnode scripts/provider-install.mjs ${shellQuote(path)} start\nThen return to the connection guide. Runtime loading has not yet been verified.`);
      return { env: final.env, bindingPresent: prepared.bindingPresent, manualStartup: true };
    }
    const ready = async () => {
      const current = await health(), token = await privateText(env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE, true);
      if (!current || current.local || current.native.route !== `/services/${encodeURIComponent(env.AGENT_PROD_SERVICE_ID)}/agentpay/invoke` || current.native.skillId !== final.env.AGENT_NATIVE_SKILL_ID || current.native.profileHash !== final.env.AGENT_NATIVE_PROFILE_HASH ||
          current.native.admissionState !== env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE) return false;
      if (token === null) return env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE === 'pre_admission';
      const response = await fetchImpl(`${origin}/internal/agentpay/provider-binding/status`, { headers: { authorization: `Bearer ${token.trim()}` }, redirect: 'error', signal: AbortSignal.timeout(2000) });
      const body = await response.json();
      return response.ok && body.result?.credentialLoaded === true && body.result.endpointPath === new URL(env.AGENT_MCP_ENDPOINT).pathname.replace(/\/invoke$/, '') &&
        (env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE !== 'admitted' || body.result.paidCredentialMatches === true);
    };
    try {
      try { await manager.ensure(final.env, { healthy: async () => !!await health(), ready }); }
      catch (error) {
        if (error.code !== 'RESTART_CONFIRMATION_REQUIRED') throw error;
        ui.heading('Reload your paid service'); ui.write('Drain active requests before restarting this running paid service.');
        if (await ui.ask("Type 'restart' after draining, or 'q' to return") !== 'restart') throw new Error('Reload paused; saved configuration and connection progress are kept');
        await manager.ensure(final.env, { healthy: async () => !!await health(), ready, allowRestart: true });
      }
      if (!await ready()) throw new Error('Application reload did not expose the expected declaration/credential');
    } catch (error) {
      if (qualificationConfirmed) ui.write('Registry qualification is confirmed, but Provider local preparation failed. Preserve binding/registration and retry this application command.');
      throw error;
    }
    const { rm } = await import('node:fs/promises'); await rm(`${runtimePath}.pricing-draft.json`, { force: true });
    ui.write(`Application configuration loaded. Local mode: ${env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE}.\nReturn to your connection guide and follow its recommended action.\nApplication configuration step finished.`);
    return { env: final.env, bindingPresent: prepared.bindingPresent };
  }
  return { installation, runtimePath, storagePath, prepareStorage: ui => prepareStorage(storagePath, ui, {initialize:storageInitialize}), origin, health, localCheck, startLocal, configure, manager };
}
