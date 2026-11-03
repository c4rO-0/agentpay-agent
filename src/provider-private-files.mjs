import { lstat, readFile, writeFile, rename, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseEnv } from 'node:util';

export async function privateDirectory(path) {
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink() || info.uid !== process.getuid() || (info.mode & 0o077))
    throw new Error(`Private directory must belong to you and have mode 0700: ${path}`);
}
export async function privateText(path, optional = false) {
  try {
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.uid !== process.getuid() || (info.mode & 0o077))
      throw new Error(`Private file must belong to you and have mode 0600: ${path}`);
    return await readFile(path, 'utf8');
  } catch (error) { if (optional && error.code === 'ENOENT') return null; throw error; }
}
export async function savePrivate(path, text, { create = false } = {}) {
  await privateDirectory(dirname(path));
  const prior = await privateText(path, true);
  if (create && prior !== null) throw new Error(`File already exists: ${path}`);
  if (create) return writeFile(path, text, { flag: 'wx', mode: 0o600 });
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, text, { flag: 'wx', mode: 0o600 });
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
}
// parseEnv does not unescape quotes. Choose a delimiter that preserves literals.
export function encodeConfig(values) {
  return Object.entries(values).map(([key, value]) => {
    const text = String(value);
    if (!/^[A-Z][A-Z0-9_]*$/.test(key) || /[\r\n\0]/.test(text)) throw new Error('Config values must be single-line literals');
    const quote = ["'", '"', '`'].find(delimiter => !text.includes(delimiter));
    if (!quote) throw new Error('A config value cannot contain all three quote delimiters');
    const line = `${key}=${quote}${text}${quote}`;
    if (parseEnv(line)[key] !== text) throw new Error('Config value cannot be preserved by the env parser');
    return line;
  }).join('\n') + '\n';
}
