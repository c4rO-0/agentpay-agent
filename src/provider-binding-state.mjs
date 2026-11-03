import { lstat, readFile, rename, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

// Local onboarding result, written only after the endpoint binding is verified.
// Credentials remain in their separate protected file. Multiple endpoints may
// belong to one Provider; select this service's binding by its exact endpoint.
export async function readProviderBinding(path, endpointUrl) {
  if (!path) return null;
  let body;
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.uid !== process.getuid() || (info.mode & 0o077))
      throw new Error('PROVIDER_BINDING_STATE_PERMISSIONS');
    body = JSON.parse(await readFile(path, "utf8"));
  }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
  if (body.version !== "agentpay.provider-binding-state.v1" || !Array.isArray(body.bindings)) {
    throw new Error("PROVIDER_BINDING_STATE_INVALID");
  }
  const matches = body.bindings.filter((entry) => entry.endpointUrl === endpointUrl);
  if (matches.length > 1) throw new Error("PROVIDER_BINDING_STATE_AMBIGUOUS");
  const binding = matches[0];
  if (!binding) return null;
  if (binding.status !== "verified" || typeof binding.providerId !== "string" ||
    !binding.providerId.startsWith("provider:") || !binding.credentialId) {
    throw new Error("PROVIDER_BINDING_STATE_INVALID");
  }
  return binding;
}

// Replace only this endpoint's verified record; other service bindings survive.
// The temporary file is created beside the target, so rename is atomic.
export async function saveProviderBinding(path, binding) {
  if (!path) throw new Error("PROVIDER_BINDING_STATE_INVALID");
  const lock = `${path}.lock`;
  try { await writeFile(lock, `${process.pid}\n`, { flag: "wx", mode: 0o600 }); }
  catch (error) {
    if (error.code === "EEXIST") throw new Error("PROVIDER_BINDING_STATE_BUSY: retry after the other writer finishes; inspect a stale lock before removing it");
    throw error;
  }
  try { return await saveUnlocked(path, binding); }
  finally { await rm(lock, { force: true }); }
}

async function saveUnlocked(path, binding) {
  if (!path || !binding || binding.status !== "verified" || !binding.endpointUrl ||
      !binding.providerId?.startsWith("provider:") || !binding.credentialId) {
    throw new Error("PROVIDER_BINDING_STATE_INVALID");
  }
  let body = { version: "agentpay.provider-binding-state.v1", bindings: [] };
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.uid !== process.getuid() || (info.mode & 0o077)) {
      throw new Error("PROVIDER_BINDING_STATE_PERMISSIONS");
    }
    body = JSON.parse(await readFile(path, "utf8"));
  } catch (error) { if (error.code !== "ENOENT") throw error; }
  if (body.version !== "agentpay.provider-binding-state.v1" || !Array.isArray(body.bindings) ||
      body.bindings.some((entry) => !entry?.endpointUrl || !entry.providerId || !entry.credentialId || entry.status !== "verified") ||
      new Set(body.bindings.map((entry) => entry.endpointUrl)).size !== body.bindings.length) {
    throw new Error("PROVIDER_BINDING_STATE_INVALID");
  }
  const next = { version: body.version, bindings: [
    ...body.bindings.filter((entry) => entry.endpointUrl !== binding.endpointUrl),
    { providerId: binding.providerId, credentialId: binding.credentialId,
      endpointUrl: binding.endpointUrl, status: "verified" }
  ] };
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
  return next.bindings.find((entry) => entry.endpointUrl === binding.endpointUrl);
}
