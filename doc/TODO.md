# AgentPay Provider Server TODO

- [x] Exclude local rehearsal records and Protocol archives from Git tracking while preserving all local files.
- [ ] Arrange public Protocol dependency distribution before fresh-clone installation; disclosure review is deferred, local tarballs and current dependency references remain.
- [ ] Before public release, sanitize repository history and review documentation links to excluded local evidence. Ignoring files does not remove historical content.
- [ ] Align template version with Agent/Provider tags and connect Market remote-tag refresh; no local sibling fallback or GitHub Release requirement.

- [x] Move official editable Skill template and independent version/release packaging into Agent; Market distributes a digest-checked pinned artifact only.
- [ ] Commit reviewed template changes, create an Agent template tag/release and publish ZIP + manifest when authorized; coordinate matching User capability rollout.
- [ ] Investigate retained publication schema-test failure: WALLET_MAPPING_SCHEMA_INVALID in the pre-existing fresh-schema fixture. Template artifact/interop checks pass; full suite is not green.

- [x] Align Provider HTTP/HTTPS support with types 0.14.1; keep platform credential and local-control protection, original profile hashes and historical identity. Controlled source verification recorded in progress.
- [ ] Coordinate deployment of matching transport validators/artifacts; verify actual Provider onboarding without changing old identities.

- [x] Implement new-Order-only restriction enforcement and atomic audit, safe Market
  status and participant guidance; targeted source/HTTP/type checks passed.
- [ ] Run prepared isolated SQL lock/rollback tests and live read-only inventory.
- [ ] After successful inventory, retire only the empty redundant restriction table,
  deploy the matching services and perform scoped Provider block/unblock acceptance.

Updated 2026-10-27. Tasks below separate remaining acceptance from completed source
work. See [current progress](../progress.md) for evidence and scope.

## Next closed loops

- [ ] Verify actual duration/price acceptance, original-result retrieval, varied
  bounded evidence, withdrawal/reopening and financial outcomes with Settlement.
  Retrieval must not regenerate costly work; result backups remain a recommendation.

## Stage 1 — remaining Provider/harness acceptance

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

## Retained history

[Prior TODO](archive/before-doc-consolidation-2026-10-27-todo.md) preserves every
original task and link. Duplicate deployment/connection tasks are consolidated
above; full-Safe owner website proof is superseded by Wallet-only access. Completed
source tests do not close actual participant or financial acceptance. Other old
unchecked limits remain retained and must be reconciled before scheduling related work.
