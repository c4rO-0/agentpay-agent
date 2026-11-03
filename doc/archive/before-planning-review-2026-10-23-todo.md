> Historical snapshot before the 2026-10-23 planning review. Dates, pending labels
> and “next” instructions describe their original checkpoint. Use current progress
> and TODO for scheduling. Unresolved tasks remain retained, not cancelled.

# AgentPay Provider Server TODO

## Business-neutrality deployment gate

- [x] Source correction and targeted verification recorded in
  [the local implementation record](../records/business-neutrality-source-2026-10-21.md).
- [x] Review existing requests and deploy matching dependencies/official package locally;
  retain all older history and stop on incompatible requests without replacement payment.
- [x] Perform the official private paid connectivity acceptance after deployment (direct reviewed Provider ZIP; Market publication remains separate).


## Reference Provider reuse

[Findings](../records/reference-provider-reuse-review-2026-10-21.md).

- [x] Separate native business validation/execution/metering from AgentPay orchestration.
- [x] Align public service references and reject unknown business kinds.
- [x] Check delivery hashes against the existing evidence contract on both sides; preserve Provider-defined output and introduce no new format/hash restriction.
- [x] Define and verify execution ownership, business idempotency and crash recovery limits.
- [x] Document the business replacement map and isolate example-specific test behavior.
- [x] Verify with maintained alternative-business fixtures; keep official random paid acceptance.


- [ ] Verify actual MySQL advisory-lock concurrency, schema changes and crash recovery after the coordinated private deployment. Unit checks do not close this gate.

## Random Skill local-client integration

- [x] Initial 1.0.2 thin-wrapper checkpoint (superseded by common-transport 1.1.0), local discovery and --invoke/--resume instructions;
  temporary installed-package/transport checks passed in the 42-test batch.
- [ ] Coordinate updated User release before publishing the new package; preserve
  existing installations and unfinished requests. Actual harness/paid acceptance
  is separate from source tests.

## Provider public-prefix loop

- [x] Public/local URL derivation, endpoint proof and native declaration/package alignment.
- [x] Canonical checks, state preservation and temporary Provider/nginx verification.
- [ ] Coordinated dependency install and operator-reviewed new endpoint onboarding;
  do not overwrite existing state or registrations.

## Unified ingress

- [x] Preserve platform API prefixes in configuration, Market login/binding and
  Settlement credential/service/readiness clients; retain local control boundary.
- [ ] Support public Provider service prefix consistently across canonical profile,
  endpoint proofs, runtime declaration and generated Skills; validate new identities.

## Three-stage execution map — 2026-10-19

The following is the current stage assignment; detailed earlier tasks retain their
original verification scope. Source tests and HTTP checks never close participant,
live-network or crash/recovery acceptance.

### Stage 1 — Private end-to-end acceptance — current

- [ ] Complete independent-host installation/connection, automatic qualification, rolling Quotes and local paid admission; verify multiple-service isolation, stale/offline recovery and selected withdrawal/drain behavior.

### Stage 2 — Real-network integration

- [ ] Configure the selected network/asset/profile and compatible service implementation; verify credentials, gas-independent service availability, endpoint control and real small-value delivery/payment evidence.

### Stage 3 — Limited invitation test

- [ ] Verify external Providers follow published guides without platform SQL/files, receive useful status/support and keep services online under invitation load; publish only explicitly supported integration behavior.

## Retained task detail and historical checkpoints

Old unchecked tasks remain traceable; reconcile them against later evidence before
execution. They are not additional automatic release requirements or permission to
repeat completed work.

Updated 2026-10-16. [Progress](../../progress.md) states evidence; this file schedules work.

## Minimal public service introduction — source complete 2026-10-18

- [x] Independent optional display endpoint (name/summary/usage), read by the reference
  registration client. No new payment profile/hash or content-approval requirement.
- [x] Preserve unchanged 402 schema and rolling quote/profile behavior in regression tests.
- [ ] Deploy/reload a reference service and supply the optional introduction through
  authenticated registration; existing profiles remain usable with fallback names.

## Current onboarding contribution

- [x] Explain the background Quote observation wait, approximate default interval and read-only recheck in the guide and runbook.
- [x] Source: replace manual operator-registration waiting with automatic registration/wait/conflict guidance; targeted tests preserve local configuration handoff.
- [x] Source: give each installation its own connection-directory handoff; reject another installation/service/port or supplied platform before reuse; verify matching reentry and unchanged existing files.
- [x] Source: identify the current service and the account of the validated saved Market session. [22-case evidence](../records/provider-guidance-followup-2026-10-16.md).
- [ ] Keep the corrected fresh multi-instance guide/independent-host human acceptance separate from the preceding private preparation and source tests.

- [x] Separate local installation from API connection; connection does not inspect SQL or own the service process.
- [x] Wire the friendly local-to-paid reference adapter transition; SQL, declaration and credential loading remain application operations.
- [ ] Rehearse the two flows with real APIs after that transition is ready.
- [x] Display distinct binding, registration, Registry, Quote and local readiness; report qualified Registry with failed local preparation explicitly.
- [x] Verify fresh/return, unknown remote state, registration/admission failure, lost credential/identity safeguards, session refresh and temporary owned-process lifecycle.
- [x] Align README/tutorials with the implemented guide and separate Skill publication.
- [ ] **[Human Provider walkthrough]** Verify the corrected guide using agreed private state, including automatic Registry waiting and Provider-owned application handoffs; source tests do not close it.
- [ ] **[Independent-host acceptance]** Verify install/database privileges, network/public endpoint and durable service manager operation.
- [ ] **[Actual recovery acceptance]** Verify explicit response-loss/reissue/rotation, offline/expired Quote and multiple endpoints through real APIs. Development safeguards and existing narrow tests do not prove the whole journey.

## Deferred / release work

- [ ] Keep C2 packaged request-ID minimum validation deferred until the agreed package update.
- [ ] Before multiple contract generations, verify each Order contract version against service requirements.
- [ ] Review legacy runtime routes, multi-instance execution and receipt recovery as separately scoped work.

## Documentation maintenance

- [x] Separate human/AI entry points, current planning and historical evidence; retain previous documents.
- [ ] Reconcile retained long-term items before scheduling the affected feature; archiving does not silently cancel them.

[Backlog disposition](../reference/documentation-backlog.md) · [Historical task snapshot](before-doc-organization-2026-10-09-todo.md). Repeated closed-loop entries and historical migration schedules are not a new execution queue.

## Guided entry development order

- [x] Review existing host, account login, B1/B2 and local admission primitives.
- [x] Add a unified read-only state and next-incomplete-step report.
- [x] Reuse/validate existing sessions and preserve interrupted binding/registration state.
- [x] Application program owns identity preparation, credential reload and paid-service preparation; connection only displays explicit handoff commands.
- [ ] Reconcile the status client's duplicate ISO `checkedAt` field in the timestamp follow-up.
- [ ] **[Deferred participant acceptance]** Verify complete Provider onboarding on agreed private state when resumed.

## First-use gate — found during participant entry

- [x] P0: provide platform public deployment information and checked rehearsal inputs; no guessing URL/network/token and no platform-private reads.
- [x] P0: distinguish new/existing services and preflight occupied port/public origin before starting.
- [x] P0: provide executable account/own-DB preparation and qualification/Quote handoff guidance.
- [x] P1: explain payout, show real token/precision and review meaningful prices.
- [x] P1: add interrupted configuration resume and safe field editing.
- [x] P1: connection reports unknown local readiness without starting/stopping the application; process ownership is an application concern.
- [x] P1: align the end-of-guide Skill publishing handoff with actually executable scope.
- [ ] Verify first-use cases without fixture-supplied hidden operator knowledge before resuming full participant acceptance.

[12-item source review](../records/provider-first-use-review-2026-10-09.md).

- [ ] **[Market handoff]** Publish the reviewed public deployment configuration/download URL and actual registration/support entry; local/operator-file support does not prove a web delivery path.
- [ ] **[Human acceptance]** Walk local installation and API connection separately, including the reference application SQL/credential/declaration handoffs; verify schema/write permissions and operator qualification.

- [x] Remove the reference random-service quantity prompt; set one usage unit automatically and retain price inputs.

- [x] **[Human local installation]** First-run local start/random check completed on private Linux; health checked afterward.
- [ ] **[Human connection]** Complete the separate account/B1/B2/application/qualification handoffs; local installation does not close this gate.

## Installation prerequisite correction — 2026-10-09

- [x] Move application SQL setup/schema initialization into installation; no SQL questionnaire in connection.
- [x] Require storage readiness before installation pass; retain participant files/process while rehearsal is paused.
- [x] **[Completed private human acceptance — 2026-10-09]** Verify corrected installation with own SQL/schema permissions, then resume the saved connection; prior stub-generation pass does not close installation.

- [x] Fix pending-credential expiry/recovery guidance: show precise expiry and an explicit reissue operation; do not keep recommending ineffective continue or silently replace credentials. Human binding is currently blocked on this state.

- [x] **[Human recovery walkthrough]** Run explicit pending-credential reissue, application loading and endpoint verification on the existing private service; preserve installation and old credential files. User execution and subsequent completed-state verification on 2026-10-09 close this exact private pending-credential case; broader recovery remains open.

- [x] Make the post-B1 canonical declaration reload an explicit guided handoff; distinguish credential loading before verification from profile refresh afterwards and prevent ineffective continue loops.

- [x] Make pending Registry review a clear waiting/handoff state, with optional status recheck; avoid implying Provider continue can grant qualification.

- [x] **[User accepted guidance — 2026-10-10]** User considers revised handoffs satisfactory and explicitly cancelled additional intermediate-menu human review. Acceptance is not a claim that those menus were re-executed.

## ZIP archive format — 2026-10-10

- [x] Source ZIP packaging/consumption and focused tests completed; see the ZIP format record.
- [ ] Participate in the approved private source update/new archive 1.0.1 publication, download and selection; refresh guide digest without overwriting old artifacts or changing Wallet authorization.
