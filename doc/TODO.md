# Provider TODO

## Review closeout — 2026-11-16

- [x] Cover responsibilities, public entries, execution/recovery, security,
  dependencies, readability, operations, tests, documentation and release scope.
- [x] Repair malformed HTTP handling/body bounds, unknown business selection,
  prefixed readiness and fixed-quote duration identity.
- [x] Remove retired failure injection from the runtime; retain isolated test fixtures.
- [x] Reject credential-bearing redirects, prune expired challenges and verify all
  generic template client requirements before invoking User.
- [x] Consolidate current documentation and explain persistence/recovery boundaries.
- [x] Run local behavior checks and independent public-file installation checks.
  See the [review record](security/mainnet-static-review-2026-11-16.md).

## Release work (not authorized by review)

- [ ] Build/review candidate Agent template 0.1.2 and random package 1.2.2 artifacts;
  publish through their existing Tag / Provider-download → Market paths.
  Keep immutable published ZIPs and User's current official pin until acceptance.
- [ ] Explicitly upgrade the exact Protocol dependency when its reviewed fixes are
  released; record supported combinations, without adding a new capability framework.
- [ ] Establish public CI for independent installation, behavior and template integrity.

## Retained acceptance

- [ ] Fresh independent-host two-flow guide: login, endpoint proof, registration,
  Registry/Quote wait and local paid admission, including public configuration
  handoff, database privileges, supervision and multiple endpoint isolation.
- [ ] Interactive revalidation/reissue usability and credential response-loss,
  expiry/rotation, restriction and sibling-service boundaries. Formal revalidation
  CLI is already implemented and has scoped private acceptance.
- [ ] Selected delivery duration/price, original-result retrieval, bounded evidence,
  withdrawal/order drain and financial outcomes with Settlement. Never regenerate
  costly work to answer an original-result retrieval request.
- [ ] Prefixed endpoint registration and optional display introduction through the
  actual platform. Controlled reference readiness tests are not remote registration.
- [ ] Coordinate compatible User release, immutable Skill download and paid recovery
  for candidate packages. Template hook tests use controlled clients, not real payment.
- [ ] Selected-network asset/profile/credentials and capped actual payment/service.

## Deferred improvements and boundaries

- [ ] Reconcile duplicate ISO `checkedAt` with `checkedAtMs` through a scoped
  compatibility change; do not mechanically rename wire fields.
- [ ] Define per-Order contract-generation compatibility before multi-generation service.
- [ ] Refine bounded maintenance retry while keeping original request/execution identity.
- [ ] Review owner-assisted stale installation/guide lock recovery; do not delete a
  lock automatically just because a command is slow or another process may own it.
- [ ] Bound legacy Serper adapter HTTP duration before expanding legacy service use;
  it is separate from the current native reference.
- [ ] Retire guarded legacy rehearsal scripts only with their deployment consumers.
  The legacy Ticket API remains compatibility-only.

Application-specific recovery, operational capacity and independent Provider guidance
remain explicit limits. The [earlier queue](archive/pre-review-todo-2026-11-16.md)
retains every old unchecked item. Previously pending package 1.2.1 publication/paid
acceptance, revalidation implementation and public Protocol distribution are complete
within the evidence described in [progress](../progress.md); they are not new tasks.
Private platform SQL/Market work stays with those projects; see
[backlog scope](reference/documentation-backlog.md).
