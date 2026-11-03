import { createHash, randomInt } from "node:crypto";

function toHexSha256(input) {
  return `0x${createHash("sha256").update(input).digest("hex")}`;
}

export function defaultPrompt() {
  return "Generate a random number.";
}

export function prepareRequest(input = {}, config = {}) {
  const prompt = typeof input?.prompt === "string" && input.prompt.trim() ? input.prompt.trim() : defaultPrompt(config);
  return { prompt, config };
}

export async function execute(prompt) {
  const value = randomInt(0, 1_000_000_000);
  const summary = `Generated random integer ${value}.`;
  const payload = {
    kind: "random",
    prompt,
    randomNumber: value,
    summary
  };

  return {
    kind: "random",
    prompt,
    summary,
    contentType: "application/json",
    data: payload,
    source: `urn:random:${value}`,
    aggregateHash: toHexSha256(JSON.stringify(payload)),
    responseFields: {
      randomNumber: value,
      summary,
      usageUnits: 1
    }
  };
}
