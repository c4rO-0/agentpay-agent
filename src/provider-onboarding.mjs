import { randomUUID } from 'node:crypto';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { paymentEndpointForService } from '@agentpay/types';
import { loadProviderConnectionConfig } from './provider-connection-config.mjs';
import { readPrivateFile, createProviderBindingClient } from './provider-binding-client.mjs';
import { createProviderServiceClient } from './provider-service-client.mjs';
import { createMarketSession } from './provider-market-session.mjs';
import { privateDirectory, privateText, savePrivate, encodeConfig } from './provider-private-files.mjs';
import { referenceCommand, assertInstallationConnection } from './provider-reference-handoff.mjs';
import { loadInstallation } from './provider-installation-config.mjs';
import { validateProviderDeployment } from './provider-deployment.mjs';

export function serviceReady(state) {
  return state?.registration?.registered === true &&
    state.registration.serviceStatus?.qualification?.qualificationStatus === 'qualified' &&
    state.registration.serviceStatus?.quote?.quoteStatus === 'fresh' && state.readiness?.commercialReady === true;
}
export function localReady(state, runtime) {
  const native = runtime?.nativeProvider;
  return serviceReady(state) && runtime?.credentialLoaded === true && runtime.paidCredentialMatches === true &&
    native?.enabled === true && native.admissionState === 'admitted' &&
    native.skillId === state.skillId && native.profileHash === state.profileHash;
}

// This client owns connection files and API calls, never the supplier's process,
// database, identifiers, prices or admission configuration.
export async function createProviderOnboarding(configPath, { fetchImpl = fetch } = {}) {
  const repository = fileURLToPath(new URL('..', import.meta.url));
  const path = relative(repository, configPath);
  if (!path.startsWith('../')) throw new Error('Keep connection configuration outside the Agent repository');
  const env = await loadProviderConnectionConfig(configPath);
  const files = [configPath, env.MARKET_SESSION_TOKEN_FILE, env.AGENT_PROVIDER_BINDING_STATE_FILE, env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE];
  if (new Set(files.map(file => resolve(file))).size !== files.length) throw new Error('Connection, session, binding and credential paths must be distinct');
  for (const file of files) await privateDirectory(dirname(file));
  const text = await privateText(`${configPath}.deployment.json`, true);
  const deployment = text === null ? null : validateProviderDeployment(JSON.parse(text));
  if (deployment && (deployment.marketUrl !== env.MARKET_BASE_URL || deployment.settlementUrl !== env.SETTLEMENT_BASE_URL ||
      deployment.network !== env.AGENT_NATIVE_NETWORK || deployment.assetAddress.toLowerCase() !== env.AGENT_NATIVE_ASSET.toLowerCase()))
    throw new Error('Saved public deployment differs from the connection settings');
  const referenceText = await privateText(`${configPath}.reference.json`, true);
  const reference = referenceText === null ? null : JSON.parse(referenceText);
  if (reference && (reference.version !== 1 || Object.keys(reference).some(key => !['version', 'installationPath'].includes(key)) ||
      typeof reference.installationPath !== 'string' || !reference.installationPath.startsWith('/')))
    throw new Error('Invalid reference application handoff');
  if(reference) assertInstallationConnection({installationPath:reference.installationPath,
    installation:await loadInstallation(reference.installationPath),reference,connection:env});
  const applicationCommand = reference ? referenceCommand(reference.installationPath, configPath) : null;
  function handoff(ui) {
    if (applicationCommand) ui.write(`In another terminal, from the Agent repository, run:\n${applicationCommand}\nThis is the reference application's own configuration/reload command. Return here when it finishes.`);
    else ui.write('Ask your service administrator to load the credential and canonical declaration using your application tools.');
  }
  const session = () => createMarketSession({ env, fetchImpl });
  async function bindingClient(credentialFile = env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE) {
    return createProviderBindingClient({ marketBaseUrl: env.MARKET_BASE_URL, settlementBaseUrl: env.SETTLEMENT_BASE_URL,
      mcpEndpoint: env.AGENT_MCP_ENDPOINT, sessionToken: await readPrivateFile(env.MARKET_SESSION_TOKEN_FILE, 'Market session'),
      credentialFile, bindingStateFile: env.AGENT_PROVIDER_BINDING_STATE_FILE,
      providerControlUrl: env.AGENT_PROVIDER_CONTROL_URL, fetchImpl });
  }
  async function serviceClient() {
    const endpoint = paymentEndpointForService(env.AGENT_MCP_ENDPOINT, env.AGENT_PROD_SERVICE_ID);
    const response = await fetchImpl(endpoint, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
      headers: { 'content-type': 'application/json', 'x-agentpay-conformance': '1' }, body: JSON.stringify({ agentpayConformance: true }) });
    const body = await response.json(); const offer = body.requirement;
    if (response.status !== 402 || body.version !== 'agentpay.service-payment-required.v1' ||
        body.resource?.url !== endpoint || body.resource?.method !== 'POST' || offer?.network !== env.AGENT_NATIVE_NETWORK ||
        offer?.asset?.toLowerCase() !== env.AGENT_NATIVE_ASSET.toLowerCase())
      throw new Error('Running service must expose its AgentPay 402 declaration on the configured network/token. Configure it with your service administrator first.');
    const client = createProviderServiceClient({ settlementBaseUrl: env.SETTLEMENT_BASE_URL,
      serviceId: env.AGENT_PROD_SERVICE_ID, mcpEndpoint: env.AGENT_MCP_ENDPOINT, skillId: offer.skillId,
      profileHash: offer.profileHash, seller: offer.seller, network: offer.network, asset: offer.asset,
      credentialFile: env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE, bindingStateFile: env.AGENT_PROVIDER_BINDING_STATE_FILE,
      providerControlUrl: env.AGENT_PROVIDER_CONTROL_URL, fetchImpl });
    await client.preview(); // Independently checks canonical binding/profile and live declaration.
    return client;
  }
  async function runtime() {
    const token = await privateText(env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE, true);
    if (token === null) return null;
    try {
      const response = await fetchImpl(new URL('/internal/agentpay/provider-binding/status', env.AGENT_PROVIDER_CONTROL_URL), {
        headers: { authorization: `Bearer ${token.trim()}` }, redirect: 'error', signal: AbortSignal.timeout(1500) });
      const body = await response.json();
      return response.ok && body?.ok === true && body.result?.endpointPath === new URL(env.AGENT_MCP_ENDPOINT).pathname.replace(/\/invoke$/, '') ? body.result : null;
    } catch { return null; }
  }
  async function inspect() {
    const account = await session().inspect();
    const result = { checkedAtMs: Date.now(), serviceId: env.AGENT_PROD_SERVICE_ID, account,
      binding: null, service: null, serviceError: null, runtime: null };
    if (account.state === 'valid') {
      result.binding = await (await bindingClient()).status();
      if (result.binding.ready) {
        try { result.service = await (await serviceClient()).status(); }
        catch (error) { result.serviceError = await errorMessage(error); }
        result.runtime = await runtime();
      }
    }
    result.platformComplete = serviceReady(result.service);
    result.complete = localReady(result.service, result.runtime);
    result.localAdmission = result.runtime?.nativeProvider?.admissionState || 'unknown';
    result.credentialRecovery = result.binding?.binding?.status === 'pending' && !result.binding.localCredentialMatches;
    result.nextStep = result.complete ? 'complete' : account.state !== 'valid' ? 'sign_in' : result.credentialRecovery ? 'reissue' : !result.binding?.ready ? 'verify_endpoint'
      : !result.service ? 'configure_service' : !result.service.registration.registered ? 'register_service'
      : !result.platformComplete ? 'qualification' : 'local_readiness';
    return result;
  }
  async function reissue(ui) {
    const state = await (await bindingClient()).status();
    if (state.binding?.status !== 'pending' || state.localCredentialMatches)
      throw new Error('Reissue requires a pending binding without a usable matching credential. Recheck status.');
    ui.heading('Replace the pending credential');
    ui.write('The previous pending credential will stop working. Its file, account and installation are kept. Your service must load the new credential before verification.');
    if (await ui.ask("Type 'confirm' to request a new credential, or 'q' to return") !== 'confirm') return;
    const credentialFile = `${env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE}.${randomUUID()}`;
    // Persist the destination before the remote write. A response/file-write failure
    // leaves a visible, retryable pending state, never an unnoticed old credential.
    const updated = { ...env, AGENT_PROVIDER_BINDING_CREDENTIAL_FILE: credentialFile };
    await savePrivate(configPath, encodeConfig(updated));
    Object.assign(env, updated);
    await (await bindingClient()).reissue();
    ui.write('New credential saved. Choose \'continue\' to load it in your service and verify the endpoint.');
  }
  async function bind(ui) {
    const client = await bindingClient(); const state = await client.status();
    if (state.ready) return;
    if (!state.binding) {
      if (state.localCredentialPresent) throw new Error('Local credential exists without a matching binding. Restore the original account/config; nothing was replaced.');
      await client.issue();
    } else if (!state.localCredentialMatches || !state.localCredentialPresent || !['pending', 'verified'].includes(state.binding.status))
      throw new Error('Binding requires explicit credential recovery. Restore the original credential or use documented recovery with a new file.');
    if (state.binding?.status !== 'verified') {
      const loaded = await runtime();
      if (!loaded?.credentialLoaded) {
        ui.heading('Load the connection credential in your service');
        ui.write(`Credential file: ${env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE}\nBinding state file: ${env.AGENT_PROVIDER_BINDING_STATE_FILE}\nSettlement: ${env.SETTLEMENT_BASE_URL}\nHave your service administrator configure these paths and load the credential.\nThis guide does not install or restart your server. Keep the credential private.`);
        handoff(ui);
        if (await ui.ask("Type 'ready' after your service has loaded these settings, or 'q' to return") !== 'ready')
          throw new Error('Service credential loading is pending. Continue after your server has loaded it.');
      }
    }
    await client.resume();
    if (!(await client.status()).ready) throw new Error('Endpoint verification has not completed');
  }
  async function errorMessage(error) {
    let message = String(error.message || 'Connection operation failed');
    for (const path of [env.MARKET_SESSION_TOKEN_FILE, env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE]) {
      try { const secret = (await privateText(path, true))?.trim(); if (secret) message = message.split(secret).join('[redacted]'); } catch {}
    }
    return message;
  }
  return { inspect, session, bind, reissue, serviceClient, errorMessage, deployment, handoff, applicationCommand, env: () => ({ ...env }) };
}

export function renderProviderStatus(ui, state) {
  ui.heading('Your connection progress');
  ui.write(`Service: ${state.serviceId}`);
  const account=state.account.state==='valid'&&state.account.email
    ? `valid · ${state.account.email} (saved session)` : state.account.state;
  ui.write(`Market account: ${account}\nEndpoint binding: ${state.binding?.ready ? 'Verified' : state.binding?.binding?.status || 'Not checked'}\nPaid service: ${state.service?.registration?.registered ? 'Registered' : 'Not checked'}\nRegistry: ${state.service?.registration?.serviceStatus?.qualification?.qualificationStatus || 'Not checked'}\nQuote: ${state.service?.registration?.serviceStatus?.quote?.quoteStatus || 'Not checked'}\nLocal paid admission: ${state.localAdmission}\nPlatform connection: ${state.platformComplete ? 'Complete' : 'Pending'}\nReference server paid readiness: ${state.complete ? 'Verified' : 'Not verified'}`);
  const check=state.service?.registration?.qualificationCheck;
  if(check){
    const labels={ready_to_register:'Checks passed; Registry entry pending',already_qualified:'Already qualified on Registry',
      hold:'Needs attention',unknown:'Could not finish checks'};
    const reasons={invalid_payment_identity:'Service payment identity is invalid',service_profile_invalid:'Service declaration is invalid',
      service_profile_hash_mismatch:'Service declaration changed',service_network_or_asset_mismatch:'Network or token differs from AgentPay',
      service_endpoint_invalid:'Service endpoint is invalid',credential_not_active_for_service:'Provider credential is not active for this endpoint',
      endpoint_control_unverified:'Endpoint control has not been verified',fresh_402_quote_missing:'Waiting for a fresh price declaration',
      quote_unavailable:'Price status could not be read',registry_identity_conflict:'Registry contains a different service identity',
      registry_entry_inactive:'Registry entry was disabled',registry_unavailable:'Registry could not be read'};
    ui.write(`Qualification checks: ${labels[check.action]||'Unknown'}${check.blockers.length?`\nReason: ${check.blockers.map(code=>reasons[code]||code).join('; ')}`:''}`);
  }
  if (state.credentialRecovery) {
    const expiry = state.binding?.credential?.expiresAtMs;
    ui.write(Number.isSafeInteger(expiry) && expiry <= Date.now()
      ? `Pending credential expired: ${new Date(expiry).toLocaleString()} (local time). Request a new credential to continue.`
      : 'The pending credential is missing or does not authenticate this binding. Request a new credential, or restore the matching file.');
  }
  if (state.serviceError) ui.write(`Service declaration check: ${state.serviceError}`);
}
export async function runProviderGuide(ops, ui) {
  ui.heading('AgentPay · Connect an existing Provider service');
  ui.write('Account binding, endpoint verification and paid-service registration. Saved steps are reused.');
  while (true) {
    let state;
    try { state = await ops.inspect(); renderProviderStatus(ui, state); }
    catch (error) { ui.write(`Status unavailable: ${await ops.errorMessage(error)}`); }
    if (state?.complete) {
      ui.heading('Connection complete');
      ui.write('Your reference service is ready for paid work.\nNext: prepare and publish your client Skill; see doc/runbooks/skill-publishing.md in the Agent repository.\nThis guide has finished.'); return;
    }
    const registered = state?.service?.registration?.registered === true;
    const qualification = state?.service?.registration?.serviceStatus?.qualification?.qualificationStatus;
    const waitingReview = registered && qualification !== 'qualified';
    const needsConfiguration = state?.nextStep === 'configure_service' || state?.nextStep === 'local_readiness';
    if (state?.platformComplete && !state.runtime?.nativeProvider && !ops.applicationCommand) {
      ui.write('Platform connection complete. Verify local paid readiness using your application tools.\nThis guide has finished; local paid readiness has not been proved.'); return;
    }
    const restriction=state?.service?.readiness?.blockers?.find(code=>['PROVIDER_RESTRICTED','SERVICE_RESTRICTED'].includes(code));
    if (restriction) {
      ui.heading('Service suspended');
      ui.write('The platform has restricted new Orders for this service. Existing Orders continue under their original rules. Contact AgentPay support; do not repeat registration or replace credentials.');
    } else if (waitingReview) {
      ui.heading('Waiting for Registry qualification');
      const check=state.service?.registration?.qualificationCheck;
      ui.write(check?.action==='ready_to_register'
        ? "The checks passed. Settlement will register your service automatically.\nWait about a minute, then enter 'check'. You can quit and return later.\nIf it is still pending after a few minutes, contact the platform operator."
        :check?.action==='hold'?`Qualification is held by the checks shown above. Correct the service or ask ${ops.deployment?.supportContact || 'the AgentPay operator'} to investigate the conflict.`
        :"Settlement has not confirmed qualification yet. Keep your service online and enter 'check' again in about a minute.\nIf it is still pending after a few minutes, contact the platform operator. Status checks do not write Registry.");
    } else if (needsConfiguration) {
      ui.heading(state.platformComplete ? 'Prepare local paid admission' : 'Update your service declaration');
      ui.write(state.platformComplete
        ? 'Registry qualification is confirmed, but Provider local paid admission is not ready. Load your application settings; do not repeat binding.'
        : 'Endpoint control is verified. Your service must load the verified identity before registration.');
    } else if (registered && !state?.platformComplete) {
      ui.heading('Waiting for service readiness');
      ui.write("Settlement checks your price declaration in the background (default: about once a minute).\nKeep your service online. Wait about a minute, then enter 'check' to read the latest status.\nIf blockers remain after a few minutes, use 'details' and contact the platform operator.");
      const blockers = state.service.readiness?.blockers || [];
      if (blockers.length) ui.write(`Blockers: ${blockers.join(', ')}`);
    }
    ui.heading('Choose an action');
    const labels = { sign_in: 'Sign in', verify_endpoint: 'Verify endpoint control', register_service: 'Register the declared service' };
    const recommended = state?.credentialRecovery ? 'reissue' : needsConfiguration ? 'configure'
      : !state || waitingReview || registered ? 'check' : 'continue';
    const label = recommended === 'reissue' ? 'Request a new pending credential'
      : recommended === 'configure' ? 'Load application settings in another terminal'
      : recommended === 'check' ? 'Recheck status only' : labels[state?.nextStep] || 'Continue connection';
    ui.write(`* '${recommended}' ${label}\n  'details'  Connection addresses and recovery\n  'q'        Quit; keep saved progress`);
    const action = await ui.ask(`Enter '${recommended}', 'details' or 'q'`);
    if (action === 'q') return;
    if (action === 'details') {
      const env = ops.env();
      ui.write(`Service: ${env.AGENT_PROD_SERVICE_ID}\nEndpoint: ${env.AGENT_MCP_ENDPOINT}\nMarket: ${env.MARKET_BASE_URL}\nSettlement: ${env.SETTLEMENT_BASE_URL}\nCredential file: ${env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE}\nRecovery: doc/runbooks/provider-onboarding.md in the Agent repository`);
      if (ops.applicationCommand) ui.write(`Application command: ${ops.applicationCommand}`);
      continue;
    }
    if (action === 'check' && recommended === 'check') continue;
    if (action === 'configure' && needsConfiguration) {
      ops.handoff(ui);
      const answer = await ui.ask("Run the application command above. Type 'ready' when it finishes, or 'q' to return");
      if (answer !== 'ready') ui.write('Application loading is pending. Saved platform progress is kept.');
      continue;
    }
    if (action === 'reissue' && state?.credentialRecovery) {
      try { await ops.reissue(ui); } catch (error) { ui.write(`Credential request paused: ${await ops.errorMessage(error)}. Saved progress is kept; recheck status before retrying.`); }
      continue;
    }
    if (action !== 'continue' || recommended !== 'continue' || !state) continue;
    let qualified = state.platformComplete;
    try {
      if (state.account.state !== 'valid') {
        ui.heading('Sign in to Market');
        ui.write(`Account: ${ops.env().MARKET_EMAIL}. Password input is hidden and not saved.`);
        await ops.session().login(await ui.ask('Market password', { secret: true }));
      }
      if (!state.binding?.ready) {
        await ops.bind(ui); ui.write('Endpoint control verified.');
        // Reinspect after verification: the running declaration may still use
        // the pre-binding identity. Surface the application handoff before B2.
        const verified = await ops.inspect();
        if (!verified.service) continue;
      }
      const client = await ops.serviceClient(); let service = await client.status();
      if (!service.registration.registered) { await client.register(); ui.write('Paid service registered.'); service = await client.status(); }
      qualified = service.registration.serviceStatus?.qualification?.qualificationStatus === 'qualified';
      if (!serviceReady(service)) {
        ui.write(`Registry: ${service.registration.serviceStatus?.qualification?.qualificationStatus || 'unknown'}\nQuote: ${service.registration.serviceStatus?.quote?.quoteStatus || 'unknown'}\nBlockers: ${(service.readiness?.blockers || []).join(', ') || 'awaiting checks'}`);
        if (!qualified) ui.write(`Ask ${ops.deployment?.supportContact || 'the AgentPay operator'} to review service ${service.skillId}. Return after approval and check status.`);
        else ui.write('Keep your service online with a fresh price declaration, then continue.');
      }
    } catch (error) {
      if (qualified) ui.write('Registry qualification is confirmed, but Provider local preparation/check failed. Do not repeat endpoint binding.');
      ui.write(`Connection paused: ${await ops.errorMessage(error)}\nSaved progress is kept. Recheck the recommended action below.`);

    }
  }
}
