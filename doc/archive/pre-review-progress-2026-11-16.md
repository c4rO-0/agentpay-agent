> Historical snapshot. Current status is in [progress](../../progress.md) and [TODO](../TODO.md). Pending labels below may have been superseded.

# AgentPay Provider progress

## Default local Skill connection — 2026-11-11

Candidate template 0.1.2 and official bundle 1.2.2 include a fixed local loader.
It resolves active User selection, retains legacy single-install behavior only when
no selection record exists, and pins the selected data folder for each invocation.
Template/example execution and concurrent package-cache regression checks passed
using controlled local clients. No actual payment, deployment, tag or publication.
Candidate loaders now follow User's saved per-user state location when shell and
background XDG environments differ. Controlled loader verification passed.
Review release artifacts before updating User's official package digest.


## Running identity rollout passed — 2026-11-10

Operator execution built Market API and Web separately under verified 1 GiB
cgroup limits (13.321 seconds and 2 minutes 21.212 seconds). All five restarted
services report identities matching disk, and both compiled services also match
their build manifests. Web was not ready on the first probe and matched on the
second. HTTPS Browse/catalog, anonymous account denial, installed Protocol/private
verifier and private platform health passed. Previous builds and logs are retained.
No test purchase, Policy change, registration or chain reset was requested. This
closes identity-reporting deployment, not operation-specific API compatibility.


## Running software identity — 2026-11-10

Reference Provider now participates in source/build/process identity diagnostics. This reports
code loading separately from health, API compatibility and payment readiness.
Source identity excludes configuration, credentials and runtime data. No service
was restarted and no release, database or chain change was made for this stage.
Controlled process/build tests passed; API and Web source type checks passed.
Production builds and deployment verification subsequently passed (see above). The separate operation-capability framework was deferred by user decision
on 2026-11-10. Keep existing version/protocol checks and record verified release
combinations; matching identity alone does not prove compatibility.


## Protocol dependency rollout passed — 2026-11-10

Operator execution verified Protocol 0.14.3 in Agent, Settlement and Market API,
plus private verifier 0.4.1. Market API compiled under an enforced 1 GiB cgroup;
Settlement, Provider and Market API restarted with changed PIDs. HTTPS Skill and
Provider reads passed; the existing service is active/available and anonymous
account access remains denied. Private platform health passed. No new payment,
registration, Policy or credential change. Web was not rebuilt. This is scoped
restart/HTTP readiness evidence, not a new paid journey or broad mixed-version
acceptance. Deployment log and old API build are retained; debug entry is read-only.


## Public Protocol dependency migration — 2026-11-09

Source now consumes exact npm `@c4roa0/agentpay-protocol` 0.14.3 with a locked
integrity. Old types archives remain local for traceability but are no longer
tracked or installed. No active deployment, Policy, Order, service identity or
credential was changed; dependency installation is not a service rollout.


## Formal Provider revalidation passed — 2026-11-09

Operator execution passed the old-schema upgrade and isolated SQL checks; scratch
tables were cleaned. The existing private reference service was prepared as expired,
then restored through the official Provider host CLI, real endpoint proof and the
normal worker. Repeated requests reused the same challenge; Market projected both
expired and restored states. Identity, configuration, binding and credential stayed
unchanged. No Order/payment or Registry write. Settlement restarted for the schema
fix; Provider did not restart. This verifies restoration from a controlled starting
condition, not thirty days of live downtime or all interactive guide branches.

## Formal Provider revalidation rehearsal prepared — 2026-11-09

User confirmed the Web deployment and approved using the existing AgentPay Random
Demo for revalidation acceptance. The operator script checks private Anvil 31337,
exact service identity/configuration and readiness, records a private checkpoint,
then prepares only expired Settlement admission with a distinct rehearsal audit.
It invokes the ordinary owner's provider-host service revalidate/status commands;
real endpoint proof, normal worker restoration and Market projection must succeed.
Repeated runs reuse the checkpoint; no direct success restoration, Registry writes,
credential rotation, Order creation or payment. The prepared fixture is not evidence
of 30 days offline. Execution remains pending.

## Provider offline lifecycle — 2026-11-09

Provider service tools now expose explicit `revalidate`; the guide offers it for
expired Settlement admission. It loads a fresh endpoint challenge and submits one
queued attempt through the existing registration API, preserving local state and
credentials. Controlled client/guide tests pass. Joint Settlement rollout and actual
operator revalidation remain pending; no package/tag publication was performed.


## Current sequencing — 2026-11-09

Reference package 1.2.1 was subsequently published through Market; its fixed ZIP
and the reviewed User paid-test path were verified. Earlier pending publication
notes below describe preparation stages. Next: integrate explicit revalidation
after Settlement implements the approved offline lifecycle; no automatic loop.

Earlier dated entries below retain their evidence and original pending states;
this summary and TODO govern current sequencing.

## Package 1.2.1 endpoint verified — 2026-11-08

Operator restart and controlled HTTP download checks passed. The running endpoint
returned version 1.2.1; concurrent/repeated ZIP bytes and response digest matched
the source-generated artifact. This verifies deployed download consistency, not
production load capacity. Market publication and new-package paid acceptance are
still pending; the User test pin has not changed.


## Skill download caching implemented — 2026-11-08

The reference package is now 1.2.1. Downloads reuse one process-local ZIP/SHA;
concurrent requests share the build and different identities serialize compression.
Changed registered service references replace the cached artifact. Source/version
updates require a process restart. Failed builds are cleared for later retry;
source content and compressed ZIP are each limited to 4 MiB. No disk package cache
or unbounded identity map is introduced.

Four focused regressions passed, covering 40 concurrent package requests, reuse,
changed identity, failure recovery, restart determinism, shared User client behavior
and generic-template reproducibility. These are controlled tests, not deployed HTTP
load acceptance. The generic template version is unchanged.

Deployment remains pending. Deploy Provider first, download its formal ZIP, then
upload those same bytes to Market. Verify same-version/different-byte refusal before
publishing the new package. Existing Market releases and User test pin stay intact
until replacement review and acceptance finish.

## Existing-host admission walkthrough — 2026-11-08

Operator executed the official configure entry and reloaded the externally managed
service. Post-restart status confirmed local admission and platform commercial
readiness. No purchase was made; matching Skill and paid-path acceptance remain
pending. This is one reference-host walkthrough, not independent-host acceptance.


## Existing-host paid admission — 2026-11-08

The official `provider-host.mjs CONFIG configure` command now verifies binding,
credentials, live declaration, qualification and Quote before saving local admission.
It does not register, change service identity/price/storage, restart or purchase.
Eight targeted tests passed, including the actual CLI against controlled HTTP
fixtures: denied readiness and wrong credentials preserve configuration; success
changes only admission; repetition preserves identity. Live deployment remains pending.


## Official login command — 2026-11-08

The standalone login CLI prompts for a missing Market email when interactive and
shows the selected account before hidden password input. Noninteractive callers
still supply MARKET_EMAIL; valid saved sessions are reused. Ten focused tests
passed, including executing the login CLI against a controlled local HTTP server.
This is not live onboarding or human TTY acceptance.

## Service revalidation plan — 2026-11-08

[Plan](../plans/provider-revalidation.md): Settlement admission expires after
30 continuous offline days and a final failed check; automatic probes then stop.
Add an explicit revalidation step to the connection tool after the backend API is
ready. Existing Orders, Registry qualification and other services are unchanged.
Documentation only; no new command is implemented.

## Public-source follow-up — 2026-11-06

Agent is public. The published main and v0.1.1 tag were anonymously readable during
review. The initial history reset is complete; older pre-reset histories must not
be merged back. Current publication is not a production readiness claim.

Fresh source installation now includes one reviewed Protocol 0.14.1 archive rebuilt
from public Protocol commit `1c6ffab`, with license, manifest and matching lockfile
integrity. Historical local archives and operational records remain private. An isolated public-file snapshot installed successfully with offline `npm ci
--ignore-scripts` and passed all 100 local tests (no failures/skips). It had no
private artifacts or sibling checkouts. This is dependency/test evidence, not an
actual MySQL, participant onboarding or live financial acceptance.

Current documentation separates Provider tasks from private platform operations.
Historical catalogs/task snapshots were retained privately. Security/contribution
entries and local-secret ignore rules are present. Business logic was not changed. Test fixtures were aligned with the already-required
explicit network, current package provenance and delivery-window prompt; schema
checks assert required columns instead of a fixed statement count.

## Implemented scope and evidence

- Separate local application installation and API-only AgentPay connection.
- Explicit network configuration, verified endpoint binding, canonical service
  declaration, rolling quotes, Registry/admission checks and durable native execution.
- Random Skill package 1.2.0 uses shared User cache/recovery hooks. The generic
  editable Skill template follows Agent's version (v0.1.1), with committed ZIP/manifest.
- Market's remote-tag discovery is implemented in Market. Its deployment monitoring
  belongs to that project, not a Provider process or request-time Git fetch.

Controlled tests and scoped private registration, qualification, service use and
paid purchase evidence exist. They do not prove clean independent-host onboarding,
every credential/recovery case, arbitrary-file handling or public-network readiness.

## Next work

Use [TODO](../TODO.md) for remaining Provider acceptance and public distribution.
Protocol package naming/channel and cross-version compatibility remain separate
work; bundling the reviewed archive repairs current source installation only.
The reference's MySQL/Linux implementation choices are not requirements imposed on
other Provider implementations. No live service, database, Order or credential was
changed by this documentation/dependency cleanup.
