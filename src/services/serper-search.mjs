import { createHash } from "node:crypto";

function toHexSha256(input) {
  return `0x${createHash("sha256").update(input).digest("hex")}`;
}

function buildSnippet(page) {
  let snippet = typeof page?.snippet === "string" ? page.snippet : "";
  if (typeof page?.date === "string" && page.date) {
    snippet = `Date published: ${page.date}\n${snippet}`;
  }
  if (typeof page?.source === "string" && page.source) {
    snippet = `Source: ${page.source}\n${snippet}`;
  }
  snippet = snippet.replace("Your browser can't play this video.", "").trim();
  return `<title>${typeof page?.title === "string" ? page.title : ""}</title>\n<url>${typeof page?.link === "string" ? page.link : ""}</url>\n<snippet>\n${snippet}\n</snippet>`;
}

function asPositiveCount(value, fallback = 5) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(10, Math.trunc(parsed)));
}

export function defaultPrompt(config = {}) {
  const keyword = typeof config?.args?.keyword === "string" ? config.args.keyword.trim() : "";
  return keyword;
}

export function prepareRequest(input = {}, config = {}) {
  const prompt = typeof input?.prompt === "string" && input.prompt.trim() ? input.prompt.trim() : defaultPrompt(config);
  const resultCount = input?.resultCount;
  if (resultCount == null || resultCount === "") {
    return { prompt, config };
  }

  const normalized = Number(resultCount);
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 10) {
    throw new Error("resultCount must be an integer between 1 and 10");
  }

  return {
    prompt,
    config: {
      ...config,
      args: {
        ...(config?.args || {}),
        resultCount: String(normalized)
      }
    }
  };
}

export async function execute(prompt, config = {}) {
  const apiKey =
    config?.args?.apiKey ||
    process.env.SERPER_KEY_ID ||
    process.env.AGENT_SERPER_API_KEY ||
    process.env.SERPER_API_KEY ||
    "";
  if (!apiKey.trim()) {
    throw new Error("SERPER_KEY_ID is required for the serper-search service");
  }

  const query = String(prompt || defaultPrompt(config)).trim();
  if (!query) {
    throw new Error("query is required for the serper-search service");
  }

  const requestedCount = asPositiveCount(config?.args?.resultCount || config?.args?.defaultResultCount || process.env.AGENT_SERPER_RESULT_COUNT || "5");
  const maxCount = asPositiveCount(config?.args?.maxResultCount || "10", 10);
  const topk = Math.min(requestedCount, maxCount);
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey
    },
    body: JSON.stringify({ q: query, num: topk })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`serper search failed with status ${response.status}`);
  }

  const organic = Array.isArray(payload?.organic) ? payload.organic.slice(0, topk) : [];
  const formattedResults = organic.map(buildSnippet);
  const searchResultsText = formattedResults.join("\n\n");
  const summary = organic.length
    ? `Found ${organic.length} search results for \"${query}\".`
    : `No search results found for \"${query}\".`;

  const normalized = {
    kind: "serper-search",
    query,
    summary,
    topk,
    searchResultsText,
    organic: organic.map((item) => ({
      title: typeof item?.title === "string" ? item.title : "",
      link: typeof item?.link === "string" ? item.link : "",
      snippet: typeof item?.snippet === "string" ? item.snippet : "",
      source: typeof item?.source === "string" ? item.source : "",
      date: typeof item?.date === "string" ? item.date : ""
    }))
  };

  return {
    kind: "serper-search",
    prompt: query,
    summary,
    contentType: "application/json",
    data: normalized,
    source: `urn:serper:${toHexSha256(query).slice(2, 18)}`,
    aggregateHash: toHexSha256(JSON.stringify(normalized)),
    responseFields: {
      query,
      summary,
      usageUnits: Math.max(1, organic.length),
      searchResultsText,
      organic: normalized.organic
    }
  };
}
