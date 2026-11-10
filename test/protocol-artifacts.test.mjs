import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { AGENTPAY_PRIVATE_REQUEST_VERSION, canonicalizePrivateRequest, hashPrivateRequest } from "@c4roa0/agentpay-protocol";

test("Agent consumes the pinned native private-request conformance artifact", () => {
  const installed = JSON.parse(readFileSync(new URL("../package.json", import.meta.resolve('@c4roa0/agentpay-protocol'))));
  const consumer = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
  assert.equal(installed.version, consumer.dependencies['@c4roa0/agentpay-protocol']);
  const records = JSON.parse(readFileSync(new URL("../node_modules/@c4roa0/agentpay-protocol/fixtures/agentpay-native-service-v1/records.json", import.meta.url)));
  assert.equal(AGENTPAY_PRIVATE_REQUEST_VERSION, "agentpay.private-request.v1");
  assert.equal(canonicalizePrivateRequest(records.privateRequest), records.canonicalPrivateRequest);
  assert.equal(hashPrivateRequest(records.privateRequest), records.requestHash);
});
