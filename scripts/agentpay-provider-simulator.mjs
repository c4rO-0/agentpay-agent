import { randomInt } from "node:crypto";
import { createServer } from "node:http";

const port = Number(process.env.AGENTPAY_SIM_PORT || "6481");
const host = "127.0.0.1";
const servicePath = "/skills/random/invoke";
const publicUrl = process.env.AGENTPAY_SIM_PUBLIC_URL || `http://${host}:${port}${servicePath}`;
const authorization = process.env.AGENTPAY_SIM_AUTHORIZATION || "smoke-service-authorization";

let requirement = {
  scheme: "agentpay",
  network: process.env.AGENTPAY_SIM_NETWORK || "eip155:8453",
  asset: process.env.AGENTPAY_SIM_ASSET || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  skillId: process.env.AGENTPAY_SIM_SKILL_ID || `0x${"1".repeat(64)}`,
  profileHash: process.env.AGENTPAY_SIM_PROFILE_HASH || `0x${"2".repeat(64)}`,
  seller: process.env.AGENTPAY_SIM_SELLER || `0x${"3".repeat(40)}`,
  baseAmount: process.env.AGENTPAY_SIM_BASE_AMOUNT || "100000",
  unitPrice: process.env.AGENTPAY_SIM_UNIT_PRICE || "1000",
  maxUsageUnits: process.env.AGENTPAY_SIM_MAX_USAGE_UNITS || "100",
  offerId: process.env.AGENTPAY_SIM_OFFER_ID || `0x${"4".repeat(64)}`,
  validUntil: process.env.AGENTPAY_SIM_VALID_UNTIL || String(Math.floor(Date.now() / 1000) + 3600)
};

function respond(res, status, body) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${host}`);
  if (req.method === "GET" && url.pathname === "/health") {
    return respond(res, 200, { ok: true, simulator: true, serviceUrl: publicUrl });
  }
  if (req.method !== "POST" || url.pathname !== servicePath) {
    return respond(res, 404, { ok: false, error: "not_found" });
  }
  if (req.headers.authorization !== `AgentPay ${authorization}`) {
    return respond(res, 402, {
      version: "agentpay.service-payment-required.v1",
      resource: { url: publicUrl, method: "POST" },
      requirement
    });
  }
  const request = await readJson(req);
  return respond(res, 200, {
    ok: true,
    result: {
      kind: "random",
      randomNumber: randomInt(0, 1_000_000_000),
      usageUnits: "1",
      request
    }
  });
});

server.listen(port, host, () => {
  process.stdout.write(`${JSON.stringify({ ready: true, url: publicUrl })}\n`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
