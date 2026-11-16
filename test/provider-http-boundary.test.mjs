import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { request } from "node:http";
import { once } from "node:events";
import { fileURLToPath } from "node:url";
import { loadAgentRuntimeConfig } from "../src/runtime-config.mjs";

// Real product listener, native mode disabled: no MySQL, credentials or transactions.
test(
  "malformed and oversized requests do not kill Provider; SIGTERM stops non-native mode",
  { timeout: 15000 },
  async (t) => {
    const reserve = createServer();
    await new Promise((resolve) => reserve.listen(0, "127.0.0.1", resolve));
    const port = reserve.address().port;
    await new Promise((resolve) => reserve.close(resolve));
    const child = spawn(
      process.execPath,
      [fileURLToPath(new URL("../src/index.mjs", import.meta.url))],
      {
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          AGENT_PROD_PORT: String(port),
          AGENT_PROD_SERVICE_ID: "fixture",
          AGENT_PROD_KIND: "random",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    t.after(() => {
      if (child.exitCode === null) child.kill("SIGKILL");
    });
    let output = "";
    child.stderr.on("data", (data) => {
      output += data;
    });
    await new Promise((resolve, reject) => {
      child.stdout.on("data", (data) => {
        output += data;
        if (output.includes("[agent] listening")) resolve();
      });
      child.once("exit", () => reject(Error(output)));
    });
    async function call(path, body) {
      return new Promise((resolve, reject) => {
        const req = request(
          { host: "127.0.0.1", port, path, method: body ? "POST" : "GET" },
          (res) => {
            let text = "";
            res.on("data", (data) => {
              text += data;
            });
            res.on("end", () =>
              resolve({ status: res.statusCode, body: JSON.parse(text) }),
            );
          },
        );
        req.on("error", reject);
        req.end(body);
      });
    }
    for (const [path, status] of [
      ["http://[", 400],
      ["/services/%ZZ/mcp/provider-profile", 400],
      ["/services/another/mcp/provider-profile", 400],
    ]) {
      const result = await call(path);
      assert.equal(result.status, status);
      assert.equal(result.body.error.code, path.includes("another") ? "POLICY_VIOLATION" : "INVALID_INPUT");
      assert.equal((await call("/health")).status, 200);
    }
    const large = await call(
      "/services/fixture/mcp/invoke",
      JSON.stringify({
        tool: "services.list",
        input: "x".repeat(2 * 1024 * 1024),
      }),
    );
    assert.equal(large.status, 413);
    assert.equal(large.body.error.code, "REQUEST_TOO_LARGE");
    assert.equal((await call("/health")).status, 200);
    const stopped = once(child, "exit");
    child.kill("SIGTERM");
    assert.equal((await stopped)[0], 0);
  },
);

test("unknown configured business never silently runs random", () => {
  const before = process.env.AGENT_PROD_KIND;
  try {
    process.env.AGENT_PROD_KIND = "document-render";
    assert.throws(
      () => loadAgentRuntimeConfig(),
      /Unsupported AGENT_PROD_KIND/,
    );
    for (const kind of ["random", "serper-search", "serper"]) {
      process.env.AGENT_PROD_KIND = kind;
      assert.equal(
        loadAgentRuntimeConfig().agent.kind,
        kind === "random" ? "random" : "serper-search",
      );
    }
  } finally {
    before === undefined
      ? delete process.env.AGENT_PROD_KIND
      : (process.env.AGENT_PROD_KIND = before);
  }
});


test("unexpected HTTP failures correlate safe diagnostics without leaking error contents", async () => {
  const { providerHttpFailure } = await import('../src/provider-http-errors.mjs');
  const error = Error('fixture-private-password and private request');
  error.code = 'fixture-private-code';
  error.stack = `Error: fixture-private-password\n    at handler (${new URL('../src/index.mjs', import.meta.url).href}:401:7)`;
  const logs = [];
  const failure = providerHttpFailure(error, { report: line => logs.push(line) });
  assert.equal(failure.status, 500);
  assert.equal(failure.payload.error.code, 'PROVIDER_REQUEST_FAILED');
  const diagnostic = JSON.parse(logs[0]);
  assert.equal(diagnostic.diagnosticId, failure.payload.error.diagnosticId);
  assert.deepEqual(diagnostic.locations, [{ module: 'index.mjs', line: 401, column: 7 }]);
  assert.doesNotMatch(JSON.stringify([failure, logs]), /fixture-private|file:\/\/|private request/);
  assert.equal(providerHttpFailure(error, { report() { throw Error('sink failed'); } }).status, 500);
});
