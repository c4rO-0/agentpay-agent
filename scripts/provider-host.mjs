#!/usr/bin/env node
import { prepareProviderServiceState, loadProviderServiceState } from "../src/provider-service-state.mjs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { loadProviderHostConfig, checkProviderHostConfig, deriveHostProfileHash } from "../src/provider-host-config.mjs";
import { readProviderBinding } from "../src/provider-binding-state.mjs";
import { readPrivateFile } from "../src/provider-binding-client.mjs";

try {
  const [configPath, action, subaction] = process.argv.slice(2);
  if (configPath && ['guide', 'status'].includes(action) && !subaction && process.argv.length === 4) {
    const child = spawn(process.execPath, [fileURLToPath(new URL('./provider-setup.mjs', import.meta.url)),
      resolve(configPath), ...(action !== 'guide' ? [`--${action}`] : [])], {
      env: { PATH: process.env.PATH || '', HOME: process.env.HOME || '', LANG: process.env.LANG || 'C.UTF-8' }, stdio: 'inherit' });
    process.on('SIGTERM', () => child.kill('SIGTERM'));
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', code => resolve(code ?? 1)); });
    process.exitCode = code;
  } else {
  const scripts = { start: "../src/index.mjs", login: "./provider-market-login.mjs", bind: "./provider-bind.mjs", service: "./provider-service.mjs" };
  if (!configPath || !["check", ...Object.keys(scripts)].includes(action) || process.argv.length > 5 ||
      (["check", "start", "login"].includes(action) && subaction) ||
      (action === "bind" && !["status", "issue", "resume", "rotate", "recover", "reissue"].includes(subaction)) ||
      (action === "service" && !["prepare", "preview", "register", "status"].includes(subaction))) {
    throw new Error("Usage: provider-host.mjs CONFIG guide|status|check|start|login|bind ACTION|service ACTION");
  }
  const recovering = action === "login" || action === "bind" || (action === "service" && subaction === "status");
  const checked = checkProviderHostConfig(await loadProviderHostConfig(resolve(configPath)), Date.now(),
    { requireFreshOffer: !recovering, allowMissingIdentifiers: true });
  const env = checked.env;
  const binding = action === "login" || action === "bind" ? null :
    await readProviderBinding(env.AGENT_PROVIDER_BINDING_STATE_FILE, env.AGENT_MCP_ENDPOINT.replace(/\/invoke$/, ""));
  if (binding && action !== "login" && action !== "bind") env.AGENT_NATIVE_PROFILE_HASH = deriveHostProfileHash(env, binding);
  if (!binding && !recovering) {
    // Temporary local declaration only; not a registered Provider identity.
    env.AGENT_NATIVE_PROFILE_HASH ||= deriveHostProfileHash(env, { providerId: "provider:unbound" });
  }
  if (env.AGENT_PROVIDER_SERVICE_STATE_FILE && action !== "login" && action !== "bind") {
    const state = action === "service" && subaction === "prepare"
      ? await prepareProviderServiceState(env.AGENT_PROVIDER_SERVICE_STATE_FILE, env)
      : await loadProviderServiceState(env.AGENT_PROVIDER_SERVICE_STATE_FILE, env,
          { allowOfferDrift: action === "service" && subaction === "status" });
    env.AGENT_NATIVE_SKILL_ID = state.skillId;
    env.AGENT_NATIVE_OFFER_ID = state.offerId;
  } else if (!recovering) {
    if (!env.AGENT_NATIVE_SKILL_ID || !env.AGENT_NATIVE_OFFER_ID) {
      throw new Error("configure AGENT_PROVIDER_SERVICE_STATE_FILE and run service prepare");
    }
  }
  if (action === "service" && subaction === "prepare") {
    if (!env.AGENT_PROVIDER_SERVICE_STATE_FILE) throw new Error("service prepare requires AGENT_PROVIDER_SERVICE_STATE_FILE");
    console.log(JSON.stringify({ ok: true, skillId: env.AGENT_NATIVE_SKILL_ID,
      offerId: env.AGENT_NATIVE_OFFER_ID, profileHash: env.AGENT_NATIVE_PROFILE_HASH,
      bindingPresent: !!binding, restartRequired: true, remoteWrites: false }, null, 2));

  }
  if (action === "start" && env.AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE === "admitted") {
    if (!binding) throw new Error("admitted startup requires a saved B1 binding");
    const controlToken = await readPrivateFile(env.AGENT_PROVIDER_BINDING_CREDENTIAL_FILE, "control credential");
    const paidToken = await readPrivateFile(env.AGENT_PROVIDER_CREDENTIAL_FILE, "paid credential");
    if (controlToken !== paidToken) throw new Error("paid runtime credential differs from this endpoint's control credential");
  }
  if (action === "check") {
    console.log(JSON.stringify({ ok: true, ...checked.report, bindingPresent: !!binding,
      profileHash: env.AGENT_NATIVE_PROFILE_HASH || null, databaseChecked: false,
      message: "configuration checked; process, API and database operation require separate verification" }, null, 2));
  } else if (!(action === "service" && subaction === "prepare")) {
    // Never inherit platform credentials or arbitrary Node preload options.
    const childEnv = { PATH: process.env.PATH || "", HOME: process.env.HOME || "", LANG: process.env.LANG || "C.UTF-8", ...env };
    const child = spawn(process.execPath, [fileURLToPath(new URL(scripts[action], import.meta.url)), ...(subaction ? [subaction] : [])],
      { env: childEnv, stdio: "inherit" });
    process.on("SIGTERM", () => child.kill("SIGTERM"));
    child.on("error", () => { console.error("Provider child process could not start"); process.exitCode = 1; });
    child.on("exit", (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
  }
  }
} catch (error) { console.error(JSON.stringify({ ok: false, error: { message: error.message } })); process.exitCode = 1; }
