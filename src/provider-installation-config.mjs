import { dirname } from 'node:path';
import { parseEnv } from 'node:util';
import { privateDirectory, privateText } from './provider-private-files.mjs';

export function checkInstallation(input) {
  if (Object.keys(input).some(key => !['SERVICE_ID', 'PORT'].includes(key)) ||
      !/^[A-Za-z0-9._-]{1,120}$/.test(input.SERVICE_ID || '') || !/^\d+$/.test(input.PORT || '') ||
      Number(input.PORT) < 1024 || Number(input.PORT) > 65535) throw new Error('Invalid local installation config');
  return { ...input };
}
export async function loadInstallation(path) {
  await privateDirectory(dirname(path));
  return checkInstallation(parseEnv(await privateText(path)));
}
