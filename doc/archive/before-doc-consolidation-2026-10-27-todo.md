> Historical snapshot retained on 2026-10-27. Use current progress/TODO for
> status and sequencing; unchecked items here are not automatically cancelled.

# AgentPay Provider Server TODO

- [x] Apply this component's approved simplified dispute-review corrections and
  targeted checks; see the 2026-10-25 correction entry in progress.
- [x] Reviewed private rollout, current scratch MySQL check and exact cleanup
  passed on 2026-10-25. Original 25-Order terms remain unchanged.
- [ ] Actual model/browser/role/financial acceptance remains open.

## Duration and disputes — 2026-10-25 source checkpoint

- [x] Implement this component's approved duration/dispute integration and targeted
  source checks; see current progress and Settlement's dated source-review record.
- [x] Preserve existing Order terms and original request identity; no contract rewrite,
  generic signing or mandatory per-Order owner approval.
- [x] Operator: isolated real MySQL transactions/cleanup passed on 2026-10-25.
- [x] Private coordinated deployment/configuration, Web key exclusion, route
  restrictions and actual service/worker health passed on 2026-10-25.
- [ ] Participant/operator: verify quote acceptance, original-result retrieval,
  withdrawal/reopen, evidence and human decisions; reconcile real private funds.
  Injected-clock tests do not prove day-scale live scheduling or crash recovery.

Updated 2026-10-23. [Progress](../../progress.md) records accepted evidence.
No public-release, real-funds or destructive-operation authorization is implied.

## Closed private loops

- [x] Separate local installation and API-only connection; local SQL remains the
  reference application's implementation concern, not platform admission authority.
- [x] Business handler/orchestration split, maintained alternate-business fixtures,
  isolated real-MySQL schema/concurrency/process recovery and private paid cutover passed.
  The scratch table was removed; logs/evidence remain.
- [x] Pending-credential reissue/application reload and exact private installation
  cases accepted; extra intermediate-menu review was waived by user on 2026-10-10.
- [x] Common-client official 1.1.0 package implemented; Market publication later passed.
- [x] Public-prefix handling implemented and temporarily tested. Existing identities
  are not automatically rewritten by that source change.

- [x] Correct terminal payment result mapping; five targeted tests pass.
- [x] Restart reference Provider and replay the refunded payment twice: exit 0,
  422/ORDER_CLOSING, unchanged financial state, closed admission and locked Wallet.

## Stage 1 — remaining Provider/harness acceptance

- [x] Remove the pre-existing Provider crash switch and move completed interruption
  into the old test-only transport; ten focused tests and fixture self-test passed.
  See [cleanup evidence](../records/provider-crash-hook-cleanup-2026-10-24.md).
- [x] Operator restarted Provider with the crash-hook removal: new PID, unchanged
  service identity/admitted state, fresh quote, 25 Orders and closed platform admission.

- [ ] Verify corrected full two-flow guide on an independent host: account login,
  endpoint control, registration, automatic Registry wait, rolling Quote and local
  admission. Report qualified Registry with failed local readiness explicitly.
- [ ] Verify public deployment/config download handoff without hidden operator inputs,
  local database privileges, service supervision and multiple endpoint isolation.
- [ ] Reconcile duplicate ISO checkedAt in the status client as a scoped timestamp
  correction; source still returns it alongside checkedAtMs.
- [ ] Verify optional display introduction through actual registration and profile scope.
- [ ] Complete new prefixed endpoint identity/settings registration; preserve old requests.
- [ ] Verify response loss/reissue/rotation, offline/expired Quote and sibling-service
  recovery where evidence is missing. Existing offline recovery is not every boundary.
- [ ] Verify selected withdrawal/order drain and credential/binding cleanup with
  Settlement; accepted work retains its obligations, unaccepted closure follows deadlines.
- [ ] Coordinate current User release and reviewed onboarding digest; verify official
  wrapper/harness installation and scoped paid recovery. Already-published 1.1.0 need not be republished.
- [ ] Review retained packaged request-ID minimum validation before enabling affected packages.

## Stage 2/3 and release work

- [ ] Support maintenance responses with bounded original-request retry and intact execution history.
- [ ] Verify selected-network asset/profile/credentials and actual small-value service/payment.
- [ ] Specify per-Order contract-generation compatibility before multi-generation service.
- [ ] Verify external Providers follow public guidance without platform SQL/files;
  operational load, credential security and application-specific recovery remain explicit.

## Historical task disposition

[Full prior TODO](before-planning-review-2026-10-23-todo.md) preserves every
original task and link; [prior progress](before-planning-review-2026-10-23-progress.md)
preserves the chronology. Closed deployment/build/rehearsal items are superseded
by current evidence. Combined tasks are split above into completed implementation
and missing acceptance. Any older unchecked detail without explicit closing
evidence remains retained for reconciliation before work is scheduled; archiving
is not cancellation. Earlier documentation-backlog links remain in that snapshot.
