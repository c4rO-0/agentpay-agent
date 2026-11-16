# Provider repository review — 2026-11-16

## Scope and baseline

Reviewed Agent source starting at `1b116e5`, initially clean, on Linux with Node
22.22.3. Package source is 0.1.2; exact Protocol npm dependency is 0.14.3, with
mysql2 and viem resolved by the lockfile. This is a bounded static review and local
correction verification, not an independent security audit or deployment approval.

Entry points include the HTTP server, install/connection/host/runtime tools,
binding/service/case commands, example Skill and generic template. Review followed
native payment forwarding → authorization → execution → receipt/retrieval, plus
identity preparation, credentials, quotes, startup/shutdown and release packaging.
Legacy Ticket/Serper paths were checked as retained compatibility surfaces, not
promoted to the native integration model. Private platform code/data is not required
for this report or the public test suite.

## Coverage

| Area | Modules / conclusion |
| --- | --- |
| R1 Responsibilities | `index`, `runtime-config`, `native-application`, service adapters and templates. Random remains reference business; unknown kinds now fail instead of falling back. No new Protocol variant or transaction rule. |
| R2 Complete paths | Install/setup/host/bind/service/case commands, native runtime, result retrieval and Skill client hooks traced. Prefixed application readiness and declared client requirements corrected. |
| R3 Failure/recovery | File journals/locks, dedicated MySQL execution connection, claim/receipt retry, application recovery and process shutdown reviewed. HTTP rejection containment, schema-start cleanup and expired proof retention corrected. Database contention remains evidence-limited. |
| R4 Trust/funds | Online tuple verification precedes execution binding; usage bounded; original result retrieval never executes business. Credential-bearing redirects refused; old test probes removed. No change to acceptance, settlement/refund or original-Order authority. |
| R5 Dependencies | Protocol exact npm/lockfile, standalone public snapshot and shared User client requirements checked. Provider endpoint HTTP/HTTPS/prefix support retained. Template 0.1.2 and example 1.2.2 are candidates, not deployed releases. |
| R6 Maintainability | Dense native execution, onboarding/installation, binding, service state, retrieval/case and bundle modules formatted for readable branches. Comments explain authorize-before-bind, execution intent, receipt reuse and shutdown ordering. Formatting does not redesign these modules. |
| R7 Operations | Terminal guides and status/reissue/revalidation paths reviewed; saved state retained after uncertain failure. Unsupported-host wording corrected; readiness checks use the public prefixed route. Owner-assisted stale-lock inspection remains explicit. |
| R8 Tests | Real HTTP/process regressions plus controlled authorization/storage and template tests. Four identical retired-probe journeys consolidated into one. No test switches remain in the native serving path. Public CI is still deferred. |
| R9 Documentation | README, catalog, architecture/design, developer/operator guides, AGENTS, progress and TODO reconciled. Prior chronology/unchecked items archived with links; stale revalidation, dependency and package claims corrected. |
| R10 Release/operations | Public-file install and candidate ZIP content inspected; MIT retained, private records/vendor archives remain ignored. Existing release ZIP unchanged. No push, tag, package publication, service/database operation or payment performed. |

## Findings and corrections

| ID | Trigger / impact | Correction and evidence |
| --- | --- | --- |
| A1 | Malformed URL/percent escape or rejected route handler escapes Node's async request callback; oversized bodies retain unbounded memory. Non-native SIGTERM did not close its listener. | Central HTTP rejection boundary, 2 MiB reference body limit, drain listener before closing storage. Real product child stays healthy after bad/oversized requests and exits on SIGTERM (`provider-http-boundary`). |
| A2 | Unknown `AGENT_PROD_KIND` silently selects random. | Explicit configured-kind rejection; reference random/Serper aliases still work. Same HTTP-boundary test file. |
| A3 | Prefixed public payment route compared with unprefixed local path, so a correctly loaded application never reaches readiness. | Derive expected public route through `providerServiceUrls` in installation and CLI checks. Controlled installation/binding/admission regression with prefix. |
| A4 | Editing service duration with a fixed quote cutoff does not rotate the saved offer seed. | Include explicit duration in service-state signature; preserve omitted-duration signatures. Deliberate prepare rotates offer, keeps Skill identity, and repeat prepare is stable. `provider-service-state` regression. |
| A5 | Retired native environment probes can submit negative financial requests or tamper with returned hashes. | Remove probe configuration and execution branches entirely. One alternate-business recovery journey sets retired variables and verifies unchanged saved output/receipt identity. Simulator stays isolated. |
| A6 | Native Settlement posts/control authorization can follow redirects; expired endpoint proofs accumulate. | Reject redirects; evict expired proof entries during handling. Real local redirect test confirms no second request/body forwarding; existing binding time/prefix tests retained. Remove unintended named media-type headers while preserving required `Accept` negotiation. |
| A7 | Generic template declares three client requirements but checks only one, so missing recovery/file support can fail late. | Check all three and return `CLIENT_UPDATE_REQUIRED` before calling User. Execute template against controlled complete/incomplete clients. Existing published ZIP is not rewritten. |
| A8 | Schema initialization throws after opening a pool, leaving resources behind. | Close the pool on startup failure and rethrow the original error. Static correction; normal startup path covered with controlled database fixtures, not a real DB failure rehearsal. |

These are implementation corrections within existing design, not new pricing,
claim, refund or authorization semantics. A4 requires deliberate service preparation
for installations that already explicitly configure duration with an older saved
signature. Do not delete the state file or replace Skill identity to bypass it.
No running state was migrated during review.

## Verification

- Full final suite: `npm test`, sequential, **107 passed**, zero failed/skipped.
  It ran from a separate snapshot containing only Git-visible public files after
  `npm ci --ignore-scripts --no-audit --no-fund`; no sibling checkout/private
  archive was available. Dependencies installed successfully.
- Standalone HTTP/template/Protocol artifact checks also passed. HTTP tests launch
  real disposable loopback processes. Native text recovery and random authorization
  checks use controlled Settlement and database responses; they do not establish
  real funds or MySQL multi-connection concurrency.
- Candidate template build succeeded in a temporary directory, containing only
  LICENSE, README, SKILL, manifest and two scripts. Determinism/immutable-version
  behavior is covered by template tests. Published `templates/release/` untouched.
- Reviewed changed source and public docs; local Markdown links and whitespace
  checks passed. Automated secret-pattern scan had no matches; this is not proof
  that an arbitrary future artifact is safe to publish.

## Limits and closeout

No unresolved transaction-design decision was identified in this scope. This does
not establish absence of unknown defects. Real database contention/crash recovery,
external-business reconciliation, clean independent-host human installation,
credential/withdrawal combinations and selected-network financial acceptance retain
their existing limits in [TODO](../TODO.md). Do not repeat all historical tests just
to close this review.

File-based installation/guide locks still fail closed after uncertain interruption;
owner inspection is needed rather than automatic lock deletion. Legacy Serper HTTP
calls have no explicit adapter deadline; bound that before expanding legacy use.
Guarded rehearsal registration remains because a deployment consumer still calls
it. Public CI and multi-generation contract compatibility are deferred, not silently
implemented here. Current release status remains in [progress](../../progress.md).

Scoped source and documentation are ready for commit. Publication/deployment are
separate actions. The next component review is Settlement.

## Focused follow-up correction

A second review found two omissions in the original closeout:

- Duration-unaware saved records could fail startup under unchanged configuration.
  Startup now reports `PROVIDER_STATE_UPGRADE_REQUIRED` when the legacy signature
  matches but duration is unverified. It does not mutate the record. Explicit
  normal preparation records signature format 2, preserves Skill identity, and
  creates one fresh offer when needed; repeats preserve it. Other declaration
  mismatches remain rejected. Host and managed CLIs preserve the error code.
- The HTTP fallback classified known cross-service rejection as 500 and discarded
  diagnostic context. Reviewed public codes now retain their status/category.
  Unknown errors emit a correlation ID and bounded own-module locations, omitting
  error messages, request data, URLs, credentials and private paths. Diagnostic
  sink failure cannot escape the fallback. The test no longer expects the wrong 500.

Verification uses a controlled historical state fixture through the real managed
CLI, actual HTTP listener rejection checks, and focused diagnostic-redaction checks.
See [upgrade instructions](../runbooks/rolling-quotes.md). No live migration,
service restart or transaction was performed.

Correction verification: final sequential `npm test` passed **109 tests**, zero
failed/skipped, on Linux / Node 22.22.3. No real database or chain was used.
