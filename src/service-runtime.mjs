import * as randomService from "./services/random.mjs";
import * as serperSearchService from "./services/serper-search.mjs";

const SERVICES = {
  random: randomService,
  "serper-search": serperSearchService
};

function requireService(kind) {
  if(!Object.hasOwn(SERVICES,kind))throw Object.assign(Error('Unknown service kind'),{code:'UNKNOWN_SERVICE_KIND'});
  return SERVICES[kind];
}

export function prepareServiceRun(kind, input = {}, config = {}) {
  const service = requireService(kind);
  if (typeof service.prepareRequest === "function") {
    return service.prepareRequest(input, config);
  }
  const prompt = typeof input?.prompt === "string" && input.prompt.trim() ? input.prompt.trim() : service.defaultPrompt(config);
  return { prompt, config };
}

export async function executeServiceRun(kind, prompt, config = {}) {
  return requireService(kind).execute(prompt, config);
}
