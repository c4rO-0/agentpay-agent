import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import { AGENTPAY_PRIVATE_REQUEST_VERSION, canonicalizePrivateRequest, hashPrivateRequest } from "@agentpay/types";

test("Agent consumes the pinned native private-request conformance artifact", () => {
  const manifest = JSON.parse(readFileSync(new URL("../vendor/protocol/artifact-manifest.json", import.meta.url)));
  const artifact = manifest.packages.find((entry) => entry.name === "@agentpay/types");
  const installed = JSON.parse(readFileSync(new URL("../node_modules/@agentpay/types/package.json", import.meta.url)));
  const consumer = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
  assert.equal(artifact.version, installed.version);
  assert.equal(consumer.dependencies["@agentpay/types"], `file:vendor/protocol/${artifact.file}`);
  const bytes = readFileSync(new URL(`../vendor/protocol/${artifact.file}`, import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), artifact.sha256);
  const records = JSON.parse(readFileSync(new URL("../node_modules/@agentpay/types/fixtures/agentpay-native-service-v1/records.json", import.meta.url)));
  assert.equal(AGENTPAY_PRIVATE_REQUEST_VERSION, "agentpay.private-request.v1");
  assert.equal(canonicalizePrivateRequest(records.privateRequest), records.canonicalPrivateRequest);
  assert.equal(hashPrivateRequest(records.privateRequest), records.requestHash);
});
