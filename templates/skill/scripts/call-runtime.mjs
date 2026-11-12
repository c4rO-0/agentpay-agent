#!/usr/bin/env node
// Author's map:
// REQUIRED: edit validateBusinessRequest below and the adjacent agentpay.json / SKILL.md.
// OPTIONAL: add service aliases in agentpay.json and choose validation by alias.
// KEEP: local discovery, private-file checks and the shared runSkill call.
// The installed AgentPay User client owns authentication, payment and recovery.
import {readFile} from 'node:fs/promises';
import {loadAgentPayClient} from './agentpay-client.mjs';

// BEGIN BUSINESS INPUT — REQUIRED EDIT
// This template accepts {"text":"hello"}. Replace its fields and limits with
// your Provider's input contract. These example rules are not AgentPay rules.
function validateBusinessRequest(input, alias) {
  // If services have different inputs, branch on alias here, for example:
  // if (alias === 'search') { ...validate and return that service's request... }
  // main is the default alias; its complete public reference is in agentpay.json.
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      typeof input.text !== 'string' || !input.text.trim() || input.text.length > 8192) {
    throw Error('INVALID_INPUT');
  }
  // Return the private business JSON to send to the Provider. It becomes part of
  // the durable request identity; changing it is not a way to retry an old call.
  // Never add caller prices, trusted usage, credentials or payment signatures.
  return {text: input.text};
}
// END BUSINESS INPUT

// OPTIONAL FILE ADAPTERS — leave these defaults for JSON-only services.
// Select only files this task explicitly needs; do not scan the user's folders.
function declareInputFiles(input, alias) {
  // Example: return [{fileKey:'document', sourcePath:input.absoluteFilePath,
  //                   filename:'document.pdf'}];
  // Or use url instead of sourcePath. Optional sha256 pins the expected bytes.
  // Each source must have a unique fileKey. Never include credentials here.
  return [];
}
async function prepareBusinessRequest({request, files, requestId}, alias) {
  // For file services, adapt using files[].localPath (the saved copy), never the
  // original input path/URL. Follow YOUR Provider's upload/reference format.
  // If uploading first, use requestId/fileKey for idempotency where supported;
  // this adapter can repeat after interruption. Do not purchase a service here.
  // Return bounded JSON. Do not embed large binary files as base64.
  // Once saved, this final request is reused unchanged for paid continuation.
  return request;
}
function declareOutputFiles(output, alias) {
  // Example: return [{fileKey:'report', url:output.reportUrl, filename:'report.pdf'}];
  // Optional sha256 is a content check, not a new Settlement delivery proof.
  // These downloads occur only after verified delivery; a failed download can
  // retry using the saved result without executing or purchasing the service again.
  return [];
}

try {
  // Keep the local loader unchanged; edit the business adapters above.
  const {runSkill,skillClientCapabilities}=await loadAgentPayClient();
  if (!skillClientCapabilities?.includes('input-snapshots-v1')) throw Error('LOCAL_SETUP_REQUIRED');
  const manifest = JSON.parse(await readFile(new URL('../agentpay.json',import.meta.url),'utf8'));

  // OPTIONAL: main is the default. Add another full reference under services in
  // agentpay.json, then call --service <alias> before --check / --invoke / --resume.
  // Copy references from the Provider; do not invent IDs, endpoints or profile hashes.
  const args = process.argv.slice(2);
  let alias = 'main';
  if (args[0] === '--service') { args.shift(); alias = args.shift(); }
  if (!manifest.services || !Object.hasOwn(manifest.services,alias)) throw Error('SERVICE_ALIAS_REQUIRED');

  // KEEP: runSkill handles --check, JSON parsing, --units, durable request IDs,
  // same-request retries, verified-result reuse and deliberate --force purchases.
  // --units caps requested usage; it is not a price or the Provider's actual usage.
  // validateRequest runs for new input before any paid call; --resume preserves
  // previously saved input instead of reinterpreting it through your new rules.
  // result.output belongs to your business: explain it in SKILL.md. To customize
  // presentation you may supply runSkill's write(value) callback, keeping errors
  // and the recovery requestId visible. Do not replace delivery verification.
  process.exitCode = await runSkill({
    service: manifest.services[alias],
    args,
    validateRequest(input) { return validateBusinessRequest(input,alias); },
    inputFiles(input) { return declareInputFiles(input,alias); },
    prepareRequest(context) { return prepareBusinessRequest(context,alias); },
    outputFiles(output) { return declareOutputFiles(output,alias); }
  });
} catch (error) {
  // KEEP: bootstrap errors contain no private connection/credential details.
  // runSkill reports input, Wallet, payment and recovery errors itself.
  if (error?.message === 'SERVICE_ALIAS_REQUIRED') {
    console.log(JSON.stringify({ok:false,error:{code:'SERVICE_ALIAS_REQUIRED',message:'Choose a service alias declared in agentpay.json.'}}));
  } else {
    console.log(JSON.stringify({ok:false,error:{code:'LOCAL_SETUP_REQUIRED',message:'Run AgentPay setup to prepare the local Runtime client. Use AGENTPAY_USER_DATA_DIR for a non-default data directory.'}}));
  }
  process.exitCode = 1;
}
