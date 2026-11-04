# AgentPay Provider Server Progress

## Official random Skill cache adapter — 2026-11-03

Verification: wrapper and template tests passed (2); controlled multi-service Runtime regressions passed (26), including installation of the new random ZIP and repeated-call result reuse with one simulated Order. User ZIP validation confirms three expected files and unchanged service references. The User test's stale hardcoded 1.1.0 assertion now reads the exported package version. These are controlled fixtures, not live paid acceptance.

Random Skill candidate 1.2.0 now declares JSON-only input/output hooks and requires current User shared-client capabilities before invocation. Existing positional CLI, service identity and Provider business remain unchanged. Invalid ranges have a specific pre-invocation error. ZIP generation is deterministic. Controlled wrapper/client checks are separate from pending Market publication and paid participant acceptance.


## Remote Agent template tags — 2026-11-03

Supersedes independent template release planning below. Agent template version now
follows its package/Provider version; v0.1.1 artifacts include MIT and editable
input/output hooks. Market uses MARKET_SKILL_TEMPLATE_REPOSITORY for public GitHub
tag checks, hourly in background, with bounded downloads, digest/ZIP checks, atomic
local persistence and last-valid fallback. No sibling checkout, GitHub Release
requirement, request-time network calls or remote code execution.

Verified: Agent packaging test, five Market sync regressions, artifact validation,
and generated-template/shared-client interoperability passed; Market API no-emit
typecheck passed. Actual public-tag verification is next; deployed Market refresh
and participant acceptance are not yet claimed.


## License — 2026-11-03

Owner selected MIT for Agent and the editable Skill template, allowing commercial
and closed-source reuse with notice retention. Root and template LICENSE files
and package metadata are aligned. The template ZIP must be rebuilt and its digest
updated before Market distribution; the previously pinned artifact is unchanged.

## Public repository preparation — 2026-11-03

Per owner decision, `doc/records/` and `vendor/protocol/` are local-only; local files are preserved when
removing Git tracking. Historical Git objects are unchanged; history sanitization
is deferred before public release. Protocol disclosure review is deferred.
Package and lock still depend on the local Protocol archives. Existing local
installation retains these files, but a fresh clone needs an approved dependency
delivery mechanism before standalone installation can work. Documentation links
to excluded local evidence need review before publication.

Template follow-up: use the Agent/Provider version tag, not an independent template
version. Market should check remote tags only (not Releases or a sibling checkout).
This supersedes the independent candidate packaging described below; implementation
of remote tag refresh remains pending.

## Official template ownership — 2026-11-03

Agent now owns editable template files and independent release metadata (initial
candidate 0.1.0), with deterministic ZIP/manifest packaging. Market's source generator
was removed; it validates and serves a pinned Agent ZIP from its own tracked vendor
directory. No runtime sibling checkout or GitHub fetch. Existing download URL remains.
Shared implementation stays in User, not in the template.

Agent release test passed. Market artifact/template/publication checks: 23 passed,
1 failed in an existing database-schema fixture (WALLET_MAPPING_SCHEMA_INVALID,
wallet mapping validator), outside template code; do not count this as a clean full
publication suite. Market API no-emit typecheck passed. Tag/remote release, commits
and deployment have not been performed. Resolve the retained schema-test mismatch
before claiming complete publication regression acceptance.

## Scope update — 2026-11-03

macOS background startup development and acceptance are explicitly deferred until
a Mac is available. They are outside the current repair sequence; do not claim
macOS support from Linux tests. Continue the remaining non-macOS work.

## Customer assumption repairs — 2026-11-02

Implemented: installer identifies missing npm/Corepack before dependency/build
changes and gives repair commands; child commands prepend the selected Node's bin
path. Non-POSIX installation fails with an explicit supported-environment message
before ownership APIs. Provider absolute private paths use Node's path semantics.
This does not establish Windows support or macOS service management.

Runtime Provider retries back off from 200 ms to a five-second cap within the
existing operation deadline, preserving the same authorization and request. Actual
process regression verifies transient failures do not create another Order.
Quote risk now evaluates usage counts separately with zero absolute count allowance;
monetary atomic-unit allowance cannot hide a large usage increase. Existing monetary
caps remain operator-configured atomic quantities, not universal human token amounts.

Verification: User 34 tests, Provider 7, Settlement 5 passed. No services restarted,
no real registration/payment, Policy or database writes. Source remains undeployed.

Remaining work is explicit: actual macOS supervisor/permission acceptance; full
real-chain Safe-owner authorization; destination-change recovery design; and
asset-specific monetary risk configuration. Preserve request destination binding
and package HTTPS/trusted-digest protection until their separate designs are agreed.
Anvil signing is not a real-network signing implementation. No genericity claim
from removing a chain/transport check is permitted.

## Provider transport alignment — source verified, 2026-11-02

HTTP/HTTPS Provider profiles and retrieval are separated from platform login and
credential transport. Types 0.14.1 keep existing profile hashes and canonical paths;
User/Wallet/Agent/Settlement artifacts and locks match. Platform credentials and
local control boundaries remain. Literal loopback registration still needs the
operator option; no general HTTP rehearsal exception. No contract/DB/Policy writes.

Controlled verification: Protocol 10, Agent 17, Settlement 33, User 22 tests passed;
Wallet no-emit typecheck and installed-consumer hash parity passed. No service
restart, actual new registration or paid purchase. Coordinated rollout is pending.
Customer platform/path assumptions and remaining review findings stay open.

## New-Order restriction enforcement — source verified, SQL acceptance pending

Implemented the approved boundary: new Orders consult current Provider/service/Buyer
restrictions; existing requests and all already-created Orders retain their original
lifecycle. Canonical SQL restrictions and operation history commit atomically under
the existing admission singleton lock. Memory snapshots no longer rewrite them;
the redundant active-set reader/writer and fresh-schema table were removed.

Readiness and Market share a safe restriction category. Fresh blocked services show
Suspended, stale status becomes Unknown, and unblock rechecks normal prerequisites.
Status-cache invalidation runs after commit. Wallet preserves reviewed restriction
codes/messages; the reference Provider guide directs suspended operators to support
without re-registering. No contract/Registry/Policy or spending authority changes.

Targeted repository, admission/retry, Market projection/cache/UI, provider-guide,
Wallet HTTP error and existing-order recovery regressions passed. API/Web/Wallet
no-emit typechecks passed. Schema regression fixtures were corrected for existing
SHOW INDEX reads; the schema-retirement roster now includes the previously omitted
retained dispute table. These changes do not remove dispute records.

The prepared operator script runs isolated MySQL transaction/lock tests and read-only
legacy/canonical inventory, cleaning its unique fixture tables. It does not deploy,
retire business tables, change live restrictions/admission or create Orders. Real SQL,
empty redundant-table retirement, deployment and participant block/unblock acceptance
remain pending. No compatibility migration or conflict precedence is invented.


Updated 2026-10-27.

Stage 1 — private end-to-end acceptance remains open. Private evidence does not
approve real funds, a real-network deployment or general public invitation.
Recorded deployment state is dated evidence, not a fresh live health check.

## Current state

Reference Provider installation and AgentPay connection are separate flows.
The common transport/authorization boundary is business-neutral; random-number
input/output remains the reference application's responsibility. Rolling Quotes,
local execution persistence and credential lifecycle have recorded private tests.

Optional service duration, price/time acceptance, original-result retrieval and
case evidence/retry tools are implemented. Retrieval never re-executes paid work.
Duration/dispute integration was privately deployed; actual new-rule case/evidence
and financial acceptance remain pending. Provider crash hooks were removed from
production code. Terminal payment mapping was deployed and two original refunded
requests were replayed without financial changes.

Independent-host onboarding, selected withdrawal/drain and sibling-credential
preservation remain open. Existing completed private tests need not be repeated.

## Next closed loop

Coordinate selected Provider withdrawal and new-rule evidence/financial acceptance,
then independent-host onboarding and maintained official Skill/harness testing.

## Evidence and history



[Evidence index](doc/records/README.md) · [Actionable TODO](doc/TODO.md) ·
[Prior progress](doc/archive/before-doc-consolidation-2026-10-27-progress.md).
Source tests, operator deployment and participant outcomes are separate claims.
Older pending labels do not override this summary; unresolved limits remain in TODO.
