function asString(value, fallback = "") {
  if (value == null) return fallback;
  const trimmed = String(value).trim();
  return trimmed || fallback;
}

function normalizeModule(value) {
  const moduleName = asString(value, "random");
  if (moduleName === "serper-search") return "serper";
  return moduleName;
}

function moduleToKind(moduleName) {
  if (moduleName === "serper") return "serper-search";
  return "random";
}

function parseCsv(value) {
  return asString(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function defaultAgentName(kind) {
  if (kind === "serper-search") return "AgentPay Serper Search";
  return "AgentPay Random Demo";
}

function defaultAgentMetadata(kind) {
  if (kind === "serper-search") return "Paid Serper-backed web search service";
  return "Paid random-number demo service";
}

function numberArg(name, fallback) {
  const value = asString(process.env[name]);
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function loadAgentRuntimeConfig() {
  const moduleName = normalizeModule(process.env.AGENT_PROD_KIND);
  const kind = moduleToKind(moduleName);

  return {
    runtimeConfigFile: "",
    settlement: {
      baseUrl: asString(process.env.SETTLEMENT_BASE_URL)
    },
    chain: {
      settlementAsset: asString(process.env.AGENT_PROD_TOKEN || process.env.SETTLEMENT_ASSET, "USDC").toUpperCase()
    },
    contracts: {
      settlementTokenAddress: asString(
        process.env.SETTLEMENT_TOKEN_ADDRESS || process.env.AGENT_PROD_SETTLEMENT_TOKEN_ADDRESS
      )
    },
    agent: {
      serviceId: asString(process.env.AGENT_PROD_SERVICE_ID, "service.agentpay.random-prod"),
      module: moduleName,
      kind,
      listen: {
        port: asString(process.env.AGENT_PROD_PORT, "6471")
      },
      mcp: {
        name: asString(process.env.AGENT_PROD_NAME, defaultAgentName(kind)),
        provider: asString(process.env.AGENT_PROD_PROVIDER, "provider.agentpay.official"),
        token: asString(process.env.AGENT_PROD_TOKEN),
        metadata: asString(process.env.AGENT_PROD_METADATA, defaultAgentMetadata(kind)),
        endpointUrn: asString(process.env.AGENT_PROD_ENDPOINT_URN),
        pricingVersion: asString(process.env.AGENT_PROD_PRICING_VERSION, "v1"),
        pricing: {
          base: asString(process.env.AGENT_PROD_PRICE_BASE, "30000"),
          usagePerUnit: asString(process.env.AGENT_PROD_PRICE_USAGE_PER_UNIT, "5000"),
          highPrioritySurcharge: asString(process.env.AGENT_PROD_PRICE_HIGH_PRIORITY_SURCHARGE, "10000")
        },
        defaultSafe: asString(process.env.AGENT_PROD_MCP_SAFE, "0x2000000000000000000000000000000000000002"),
        supportedSettlements: parseCsv(process.env.AGENT_SUPPORTED_SETTLEMENTS),
        trustedSettlementSigners: parseCsv(process.env.AGENT_TRUSTED_SETTLEMENT_SIGNERS),
        profile: {
          signature: asString(process.env.AGENT_PROVIDER_PROFILE_SIGNATURE),
          signatureMode: asString(process.env.AGENT_PROVIDER_PROFILE_SIGNATURE_MODE, "safe"),
          timestamp: asString(process.env.AGENT_PROVIDER_PROFILE_TIMESTAMP),
          expiresAt: asString(process.env.AGENT_PROVIDER_PROFILE_EXPIRES_AT),
          chainId: asString(process.env.AGENT_PROVIDER_PROFILE_CHAIN_ID),
          verifyingContract: asString(process.env.AGENT_PROVIDER_PROFILE_VERIFYING_CONTRACT)
        }
      },
      args: {
        defaultResultCount: numberArg("AGENT_SERPER_RESULT_COUNT", undefined),
        maxResultCount: numberArg("AGENT_SERPER_MAX_RESULT_COUNT", undefined)
      }
    }
  };
}
