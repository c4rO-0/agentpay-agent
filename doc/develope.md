# Agent Developer Guide

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

## 托管身份启动定向回归

```bash
node --test test/provider-runtime-environment.test.mjs test/provider-host-config.test.mjs test/provider-service-state.test.mjs
```

覆盖未绑定本地准备、绑定后必须重新准备、稳定 skillId/变更 offerId 与
profileHash、排除平台环境字段，以及 admitted 绑定/凭证检查。它不验证
真实数据库、端点控制 API、Registry 登记或链上资金。受保护环境执行和
参与者演练分别记录，不能用本地夹具通过替代。

## Guided onboarding checks

```bash
node --test --experimental-test-isolation=none test/local-random-server.test.mjs test/provider-storage.test.mjs test/provider-installation.test.mjs test/provider-two-flows.test.mjs test/provider-onboarding.test.mjs test/provider-managed-process.test.mjs test/provider-host-config.test.mjs test/provider-service-client.test.mjs test/provider-binding-state.test.mjs test/provider-binding-startup.test.mjs test/provider-binding-time.test.mjs test/native-provider-quote.test.mjs test/provider-service-state.test.mjs test/provider-runtime-environment.test.mjs
```

The coordinator tests use the existing API clients with injected HTTP responses and
owner-held temporary files. Process tests start/stop only their own temporary child.
They do not operate the current platform or prove Anvil/DB/human acceptance. See the
[two-flow implementation verification](records/provider-two-flows-complete-2026-10-09.md).

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
