const baseUrl = (process.env.AGENT_PROD_BASE_URL || "http://127.0.0.1:6471").replace(/\/$/, "");
const userSafe = String(process.env.AGENT_SMOKE_USER_SAFE || "").trim();

async function httpJson(path, method = "GET", body = undefined) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const detail = payload?.error ? `${payload.error.code}: ${payload.error.message}` : `HTTP ${response.status}`;
    throw new Error(`${method} ${path} failed: ${detail}`);
  }
  return payload.result ?? payload;
}

async function main() {
  if (!userSafe) {
    throw new Error("AGENT_SMOKE_USER_SAFE is required");
  }

  const health = await httpJson("/health");
  console.log("[agent-smoke] health ok", health);

  const kind = String(health?.serviceKind || health?.service?.kind || "random");
  const prompt = kind === "serper-search" ? "latest OpenAI API docs" : "Generate a random number.";

  const body = {
    prompt,
    payerLabel: "payer.agent.smoke",
    userSafe
  };

  const result = await httpJson("/run", "POST", body);
  if (!result.settlementIntent?.required) {
    throw new Error("missing settlementIntent in agent result");
  }
  console.log(
    "[agent-smoke] ok",
    JSON.stringify(
      {
        serviceId: result.serviceId,
        serviceKind: result.serviceKind || kind,
        summary: result.summary,
        randomNumber: result.randomNumber ?? null,
        query: result.query ?? null,
        usageUnits: result.settlementIntent?.usageUnits ?? null,
        settlementFlow: result.settlementIntent?.flow ?? null
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("[agent-smoke] failed", err.message || err);
  process.exit(1);
});
