import {dirname,join,resolve} from 'node:path';

// Format application-owned operations; never read runtime config or execute them.
export const shellQuote = value => `'${String(value).replaceAll("'", "'\\''")}'`;
export function referenceCommand(installation, connection) {
  return `node scripts/provider-install.mjs ${shellQuote(installation)} configure ${shellQuote(connection)}`;
}
export function connectionCommand(installation) {
  const path=resolve(installation);
  return `node scripts/provider-setup.mjs --new ${shellQuote(join(dirname(path),'connection'))} --installation ${shellQuote(path)} --deployment /PATH/TO/provider-deployment.json`;
}
export function assertInstallationConnection({installationPath,installation,reference,connection}) {
  if(!reference||reference.version!==1||typeof reference.installationPath!=='string')
    throw new Error('This connection has no matching installation reference. Resume it separately or choose a new connection directory.');
  if(resolve(reference.installationPath)!==resolve(installationPath)||
     connection.AGENT_PROD_SERVICE_ID!==installation.SERVICE_ID||
     connection.AGENT_PROVIDER_CONTROL_URL!==new URL(`http://127.0.0.1:${installation.PORT}`).origin)
    throw new Error('This connection belongs to a different installation or service. Use a separate connection directory; the existing connection was kept.');
}
