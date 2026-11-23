# Agent Developer Guide

From an independent checkout with compatible Node installed:

```sh
npm ci
npm test
```

The exact public Protocol dependency is downloaded from npm; the lockfile pins
its integrity and the package includes its license. No sibling repository or platform database is needed for the local suite. See
[the test guide](../test/README.md) for focused commands and evidence limits.
Tests use controlled services and temporary state; the reference application itself
requires MySQL for installation/execution. See [database preparation](runbooks/provider-database.md).

Start with [architecture](./architecture.md), [design](./design.md), and
[TODO](./TODO.md). Native payment orchestration lives in
src/native-provider-runtime.mjs; its application interface accepts validate,
execute and explicit recover behavior. The reference implementation is
src/services/random-native.mjs. Replace that business module and wire it from
src/index.mjs; keep credential/challenge/authorization/receipt logic shared.
The older src/services service-runtime dispatcher belongs to the legacy MCP path;
it is not the native paid entry. Unknown kinds fail explicitly. Keep adapters free
of wallet keys and commercial policy, and validate Settlement identifiers.
Tests must cover wrong binding, expiry, replay, usage overflow,
receipt conflict, restart, and provider unavailability.

## Focused verification

Use [the test guide](../test/README.md) to select complete behaviors rather than
running every test after each edit. For example:

```bash
node --test test/provider-http-boundary.test.mjs test/native-provider-transport.test.mjs
node --test test/provider-installation.test.mjs test/provider-service-state.test.mjs
node --test test/native-alternate-orchestration.test.mjs test/skill-template.test.mjs
```

HTTP boundary tests use real disposable server processes. Coordinator tests use
controlled platform responses and owner-held temporary files. Native execution
uses a simulated database/authority; it does not prove MySQL concurrency, chain
funding or exactly-once effects. Do not add failure-injection switches to the
serving runtime to make tests pass. Linux is the validated host for this review.

## Replacing the reference business

- validate(request) checks business input and throws before any business execution.
  It receives a copy; it must not reinterpret the registered invocation identity.
- execute({request, orderId, requestHash, maxUsageUnits}) returns application-owned
  JSON output and actual usageUnits as a canonical integer string. Check capacity
  before work; the shared layer rejects evidence over the authorized cap.
- recover(context) explicitly reconciles an interrupted executing record. There
  is no default replay for arbitrary external effects. Use the stable Order ID for
  downstream idempotency/reconciliation. Random generation can repeat before its
  result is saved because it has no external effect; do not copy that assumption
  to email, purchases or infrastructure provisioning.

The random-number example quotes one unit by default. A request supplies two
integer bounds and generates exactly one number. A wider range costs the same
one unit. For a batch service, define what one unit buys and check the requested
batch size against both the Order’s authorized units and your available capacity
before accepting the Order. Reject work you cannot fulfill through the service
authorization decision. Check a new Order before acceptance and preserve the
original decision when recovering an already accepted Order. The final usage
check happens after execution, when an external API call may already have cost you
money. Concurrent Orders also share capacity, so a per-Order cap alone does not
reserve a worker or protect a shared downstream quota.

The shared layer serializes an Order with a dedicated MySQL advisory-lock
connection, persists output/hash/actual usage, and retries its stable receipt.
A crash releases the lock; a lock does not prove exactly-once external effects.
Deployment adds usage_units and changes output_json from MySQL JSON to LONGTEXT
to preserve the serialized output property order. It retains existing rows. Older completed rows
without explicit usage pause for review; no automatic usage backfill is performed.
JSON evidence preserves the existing SHA-256 JSON.stringify(output) behavior and
property order. Other business output formats or evidence agreements are not
silently standardized by this example. Update display and Skill instructions for
your business; the public service-reference route is independent of random ZIPs.
MySQL and Linux installation are reference application choices.

The native handler derives a stable claim identity from service/profile/Order,
verifies Settlement's authorization tuple before inserting an execution record,
and then reuses the persisted receipt identity. Rejected authorizations must not
write an Order request binding. Existing different claim identities pause for
review; no automatic rebind or state reset is performed.

## Protocol dependency

Install dependencies using the repository lockfile. The public Protocol package
is `@c4roa0/agentpay-protocol` 0.14.3, pinned exactly; installation does not need
a sibling Protocol checkout. Package updates require review and consumer behavior
checks. They do not authorize contract deployment, database migration or changing
saved identities. Do not restore the retired `@agentpay/types` file dependency.

## Running software identity

Software identity is diagnostic evidence, not an API compatibility or authorization
claim. A content identifier covers the explicit code/resource and dependency-lock
inputs in `scripts/software-identity.mjs`. No Git checkout is required. Configuration,
credentials, runtime data and logs are excluded. Missing inputs report unknown;
never use a source identifier to attest installed dependencies or chain contracts.

The server captures this identity once at startup and includes a minimal `software`
object in its existing health response. Editing disk files does not change a
running process's report. Restart only in the normal deployment window.
