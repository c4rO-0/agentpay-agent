// Repository-owned software identity. Hash only the explicit code/build inputs below.
// No Git, environment values, runtime data, credentials or local paths are reported.
import {createHash} from 'node:crypto';
import {readFileSync, readdirSync, lstatSync} from 'node:fs';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
export const component = "provider";
export const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));
const inputs = ["src", "templates", "skills", "scripts/software-identity.mjs", "package.json", "package-lock.json"];
export function sourceIdentity(root = repositoryRoot) {
  try {
    const hash = createHash('sha256');
    function visit(name) {
      const path = resolve(root, name), stat = lstatSync(path);
      if (stat.isSymbolicLink()) throw Error('Symbolic code input');
      if (stat.isDirectory()) {
        for (const child of readdirSync(path).sort()) {
          if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(child)) continue;
          visit(name + '/' + child);
        }
      } else if (stat.isFile()) {
        const bytes = readFileSync(path);
        hash.update(JSON.stringify([name, bytes.length]) + '\n');
        hash.update(bytes);
      } else throw Error('Unsupported code input');
    }
    for (const input of inputs) visit(input);
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), 'utf8'));
    return Object.freeze({format: 1, component, version: pkg.version, sourceId: hash.digest('hex')});
  } catch {
    // Diagnostics must not prevent startup or misrepresent missing evidence as current.
    return Object.freeze({format: 1, component, version: null, sourceId: null});
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  console.log(JSON.stringify(sourceIdentity()));
