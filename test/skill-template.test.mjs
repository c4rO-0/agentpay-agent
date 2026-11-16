import test from "node:test";
import assert from "node:assert/strict";
import { buildSkillTemplate } from "../scripts/lib/skill-template-release.mjs";
import { readFile, mkdtemp, mkdir, cp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
test("official generic template is reproducible and uses the Agent version, independently of the example package", async () => {
  const a = await buildSkillTemplate(),
    b = await buildSkillTemplate();
  assert.deepEqual(a, b);
  assert.equal(
    a.manifest.version,
    JSON.parse(
      await readFile(new URL("../package.json", import.meta.url), "utf8"),
    ).version,
  );
  assert.equal(
    a.manifest.sha256,
    createHash("sha256").update(a.bytes).digest("hex"),
  );
  assert.equal(a.manifest.byteLength, a.bytes.length);
  assert.match(
    a.manifest.filename,
    /^agentpay-skill-template-\d+\.\d+\.\d+\.zip$/,
  );
  const manifest = JSON.parse(
    await readFile(
      new URL("../templates/skill/agentpay.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(manifest.packageVersion, "1.0.0");
  assert.notEqual(manifest.packageVersion, a.manifest.version);
});

// Controlled installed client: exercise the real template entry, without payment.
test("generic template validates text and refuses incomplete client capabilities before invocation", async () => {
  const dir = await mkdtemp(join(tmpdir(), "generic-skill-"));
  try {
    await cp(
      new URL("../templates/skill/", import.meta.url),
      join(dir, "skill"),
      { recursive: true },
    );
    await mkdir(join(dir, "runtime"));
    await writeFile(
      join(dir, "runtime/connection.json"),
      JSON.stringify({
        version: "agentpay.runtime-connection.v1",
        clientModule: join(dir, "runtime-client.mjs"),
      }),
      { mode: 0o600 },
    );
    const run = () =>
      spawnSync(
        process.execPath,
        [
          join(dir, "skill/scripts/call-runtime.mjs"),
          "--invoke",
          '{"text":"hello"}',
        ],
        {
          env: { ...process.env, AGENTPAY_USER_DATA_DIR: dir },
          encoding: "utf8",
        },
      );
    for (const missing of [
      "input-snapshots-v1",
      "output-files-v1",
      "original-request-v1",
    ]) {
      const caps = [
        "input-snapshots-v1",
        "output-files-v1",
        "original-request-v1",
      ].filter((cap) => cap !== missing);
      await writeFile(
        join(dir, "skill-client.mjs"),
        `export const skillClientCapabilities=${JSON.stringify(caps)}; export function runSkill(){throw Error('MUST_NOT_INVOKE')}`,
      );
      const result = run();
      assert.equal(result.status, 1);
      assert.equal(
        JSON.parse(result.stdout).error.code,
        "CLIENT_UPDATE_REQUIRED",
      );
    }
    await writeFile(
      join(dir, "skill-client.mjs"),
      `export const skillClientCapabilities=['input-snapshots-v1','output-files-v1','original-request-v1'];
   export async function runSkill(options){
    const request=options.validateRequest(JSON.parse(options.args[1]));
    const files=await options.inputFiles(request);
    const prepared=await options.prepareRequest({request,files,requestId:'fixture'});
    console.log(JSON.stringify({request:prepared,files,outputs:await options.outputFiles({text:'answer'})}));return 0;
   }`,
    );
    const result = run();
    assert.equal(result.status, 0);
    assert.deepEqual(JSON.parse(result.stdout), {
      request: { text: "hello" },
      files: [],
      outputs: [],
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
