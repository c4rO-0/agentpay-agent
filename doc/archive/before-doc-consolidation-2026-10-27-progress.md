> Historical snapshot retained on 2026-10-27. Use current progress/TODO for
> status and sequencing; unchecked items here are not automatically cancelled.

# AgentPay Provider Server Progress

## Private coordinated rollout — 2026-10-25

Operator rollout passed: protected dispute worker/table checks, seven application
services, existing nginx routes, key exclusions and unchanged frozen terms of all
25 retained Orders. Updated scratch MySQL check passed with exact cleanup. Builds
were capped at 1 GiB. New-order admission remains closed. The internal health
projection was corrected without exposing worker details through public health.
Actual model, browser/role and dispute financial acceptance remain pending.
No participant-machine update, new client release or public invitation is implied.
Earlier source checkpoints below retain their original evidence scope.


## Simplified review corrections — 2026-10-25

Provider Order reads accept the new validated policy disclosure. Identical evidence
for an Order has a content-derived operation ID across retries/restarts, without
a new recovery file. Thirteen focused quote/response/retrieval/retry tests passed.
No deployment or live business/chain mutation. Review the correction results before
coordinated private rollout; earlier source checkpoints below remain historical.

## Duration and delivery disputes — source checkpoint 2026-10-25

Reference source publishes optional duration, retrieves cached original output
under a scoped Settlement permission, and checks the protected case inbox about
once a minute. The Provider case tool submits flexible evidence or obtains a
one-Order browser code. Twenty focused checks passed; retrieval never invokes
the paid execution callback. Business output remains application-owned.

These are source/isolated-test results, **not deployed or participant acceptance**.
New rules apply only to new Orders; existing snapshots remain unchanged. Canonical
rules and the detailed evidence record are in the Settlement repository:
`doc/reference/transaction-rules.md` and
`doc/records/duration-disputes-source-review-2026-10-25.md`.
Isolated real MySQL verification and exact scratch cleanup passed on 2026-10-25.
Next: review simplified corrections and separately agree coordinated deployment, then
participant/operator and actual private financial acceptance. No public release.

Updated 2026-10-23. Current stage: **1 — Private end-to-end acceptance**.

## Current implementation and evidence

- Local installation and AgentPay API connection are separate. Connection never
  accesses platform SQL/files or owns application lifecycle. Reference installation
  prepares its own execution storage; the application loads credentials/declarations.
- Guidance distinguishes account binding, service registration, automatic Registry
  qualification, Quote observation and local paid admission. Initial private
  installation/credential-reissue cases passed; broader independent-host acceptance
  remains open. Provider LLM/manual approval was superseded by objective checks.
- Business execution/validation/metering are separated from native orchestration.
  Maintained alternate-business fixtures passed. A real isolated MySQL fixture
  covered schema conversion, same-Order concurrency and completed/executing recovery;
  subsequent private cutover and official paid test passed, and its scratch table
  was removed. Do not repeat that completed fixture as an outstanding schema task.
- Common JSON service references and package 1.1.0 work with the installed User
  client. Market publication passed separately; actual external harnesses, a new
  User release and reviewed onboarding digest handoff remain open.
- Provider prefix handling is implemented and temporarily tested; live new endpoint
  identity/registration migration is separate. Offline test services were restored
  without re-registration; actual expired-Quote rejection and online recovery passed.

[Private cutover](../records/business-neutrality-private-cutover-2026-10-22.md) ·
[Reference reuse review](../records/reference-provider-reuse-review-2026-10-21.md).

## Remaining boundaries

The pre-existing native Provider crash switch was removed from source on 2026-10-24.
[Ten focused tests and fixture checks passed](../records/provider-crash-hook-cleanup-2026-10-24.md).
Operator restart subsequently passed: new PID, unchanged identity/admitted state,
fresh quote, 25 Orders and closed platform admission. The source cleanup is loaded.

Complete independent-host/multi-service human onboarding and selected withdrawal/
credential recovery. Retain the unresolved duplicate ISO `checkedAt` status-client
field for a scoped timestamp follow-up; this review does not change program behavior.
Provider-specific execution recovery is an application responsibility; generic payment
orchestration must not require new business variants. Cross-generation contract
compatibility, maintenance retries and external invitation acceptance remain open.
See [TODO](../TODO.md).

## Planning history

[Earlier progress](before-planning-review-2026-10-23-progress.md) and
[retained task snapshot](before-planning-review-2026-10-23-todo.md) preserve
all prior detail. Their “pending” and “next” labels are historical; unresolved
items are not cancelled. Current [TODO](../TODO.md) governs scheduling.

## Terminal payment response correction — 2026-10-23

[Mapping fix](../records/terminal-payment-response-2026-10-23.md) distinguishes actual
settlement_pending (202) from terminal refusals (422), preserving Settlement code,
message and original result. Five targeted tests pass; User Runtime already handles
the outer error. Provider restart and actual refunded-request replay are prepared,
not executed. No payment rules or service authorization changed.

Provider-only deployment and replay now passed (exit 0): both expired-signature
retries returned HTTP 422/ORDER_CLOSING and the original refunded message/hash.
Financial tables/balances unchanged; admission closed, Wallet locked. The terminal
response mapping correction is deployed and privately verified.
