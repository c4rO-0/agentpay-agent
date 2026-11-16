import { randomUUID } from "node:crypto";

// These are reviewed public failures, not arbitrary application messages/details.
const known = {
  INVALID_INPUT: [400, "Invalid request input or address."],
  POLICY_VIOLATION: [
    400,
    "This endpoint does not allow access to another service.",
  ],
  NOT_FOUND: [404, "Requested resource was not found."],
  CONFLICT: [
    409,
    "Request conflicts with saved state. Keep the original request identity.",
  ],
  UNAUTHORIZED: [401, "Request authorization was rejected."],
  TRUSTED_SETTLEMENT_SIGNERS_MISSING: [
    503,
    "Provider signing configuration is incomplete. Contact the Provider.",
  ],
  REQUEST_TOO_LARGE: [413, "Request body exceeds 2 MiB."],
};
const sourceRoot = new URL("./", import.meta.url).href;

export function providerHttpFailure(error, { report = console.error } = {}) {
  const code =
    error instanceof URIError || error?.code === "ERR_INVALID_URL"
      ? "INVALID_INPUT"
      : error?.code;
  if (Object.hasOwn(known, code)) {
    const [status, message] = known[code];
    return { status, payload: { ok: false, error: { code, message } } };
  }
  const diagnosticId = randomUUID();
  // Never serialize the error message, cause, request, SQL or URL. Only fixed
  // module names and numeric locations from our own stack frames are reportable.
  const locations = [];
  for (const line of String(error?.stack || "")
    .split("\n")
    .slice(1)) {
    const offset = line.indexOf(sourceRoot);
    if (offset < 0) continue;
    const frame = line
      .slice(offset + sourceRoot.length)
      .match(
        /^(index|native-provider-runtime|provider-binding-runtime|provider-http-errors)\.mjs:(\d+):(\d+)\)?$/,
      );
    if (frame)
      locations.push({
        module: `${frame[1]}.mjs`,
        line: Number(frame[2]),
        column: Number(frame[3]),
      });
    if (locations.length === 4) break;
  }
  try {
    report(
      JSON.stringify({
        event: "provider.request.failed",
        code: "PROVIDER_REQUEST_FAILED",
        diagnosticId,
        locations,
      }),
    );
  } catch {
    /* A diagnostic sink failure must not escape the HTTP error boundary. */
  }
  return {
    status: 500,
    payload: {
      ok: false,
      error: {
        code: "PROVIDER_REQUEST_FAILED",
        diagnosticId,
        message:
          "Provider could not complete this request. Contact the Provider with the diagnostic ID; keep the original request identity.",
      },
    },
  };
}
