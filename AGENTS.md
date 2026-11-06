# Agent Development Instructions

## Behavior-first verification — 2026-11-06

- Prefer end-to-end tests through real product entry points and public interfaces.
  Test observable behavior and user outcomes, not internal implementation shape.
  Use real processes, storage and Anvil where the claim depends on them; do not
  substitute direct database writes or internal-state injection for the workflow
  being accepted. Controlled fixtures may prepare prerequisites.
- Select meaningful complete journeys and failure boundaries: independent install/
  package consumption, authorization, payment, delivery, settlement/refund, denied
  access, duplicate requests and interrupted-operation recovery as applicable.
  A test should demonstrate a functional requirement or a concrete regression.
- Avoid tests that merely mirror implementation, assert source text/private helper
  structure, or repeat the same coverage without a distinct failure boundary.
  Syntax, type and build checks are useful checks, not functional acceptance.
- Keep focused tests for signatures, canonical hashes, amount/time boundaries,
  authorization and concurrency invariants when they give precise protection that
  end-to-end tests alone cannot efficiently provide. End-to-end preference does
  not remove negative security or financial-boundary coverage.
- Review existing tests by the same standard. Consolidate redundant tests only
  after equivalent meaningful coverage passes; do not delete a regression merely
  because it is a unit test. Do not inflate test counts as a measure of readiness.
- Label mocked external dependencies and evidence limits explicitly. Simulated
  success does not prove real process recovery, real payment or participant usability.
  Keep tests bounded to the change and use maintained fixtures; this principle does
  not authorize live funds, public-network operations, destructive resets or broad
  resource-heavy test runs.



## Network portability invariant — 2026-11-04

Develop and verify the same product flows on Anvil. Moving to a supported EVM
network must use configuration, deployment artifacts and explicit signer selection,
not a separate implementation of authorization, payment or recovery. External-owner
signing must be testable against Anvil as well. Keep test signer guards and private
reset/funding tools restricted; never remove them to make a product entry portable.
Chain ID is identity, not permission to select an unlocked test signer. Network
capabilities/finality and deployment addresses are explicit validated settings.
Changing networks never silently rewrites saved Policies, Orders or request identity.
Anvil results do not establish real-network compatibility or release approval.

## Public repository boundary

This repository is public (confirmed by the owner on 2026-11-03). Treat every
commit, push, tag and release artifact as public disclosure.

- Never commit private keys, Session Keys, passwords, API keys, login tokens,
  Provider credentials, signed payment payloads, private request/output data,
  database dumps, live runtime configuration or unredacted operational logs.
- Examples and tests must use clearly synthetic credentials and identities.
  Do not copy real account emails, private host paths, deployment inventories or
  participant records into public documentation or fixtures.
- `doc/records/` and historical Protocol archives remain private and ignored.
  Only the reviewed public Protocol archive, license, README and provenance manifest
  explicitly allowlisted in `.gitignore` may be distributed. Verify source and digest
  before replacing them; never force-add older local artifacts. Preserve private
  evidence outside the public tree. Package-channel design remains separate work.
- Before committing, inspect staged diffs and newly added files for sensitive
  content. Before pushing or publishing, inspect all outgoing commits and the
  actual archive contents, including generated files and nested dependencies.
  `.gitignore` alone is not a security check.
- If sensitive content is found, stop the affected publication and report its
  location and type without printing its value. Do not assume a later deletion
  or history rewrite removes already disclosed secrets; coordinate revocation
  with the owner. Never silently rewrite history.
- Keep public evidence sanitized and independently readable. Links to ignored
  local records are not usable evidence for public readers.

This repository owns Skill execution, not
payment authority or custody. Never accept caller-supplied price, trust,
funding, or payout facts. Keep private requests/output between client and
provider, and never expose Wallet or Settlement signing capabilities.

Before editing, read `README.md`, `progress.md`, and `doc/TODO.md`. Use targeted
tests and preserve compatibility deliberately; do not extend the legacy Ticket
path or Market-owned `_agentpay_challenge` as the native AgentPay design. The
native Provider server stores its Settlement-issued M2M credential and
completes Settlement's Endpoint Control Challenge.

## Documentation navigation

Use `doc/README.md` to select documents by role and function. Keep current work in
`progress.md` and `doc/TODO.md`; put dated verification in `doc/records/` and superseded
chronology in `doc/archive/`. Archived pending tasks do not authorize repeating old
operations. Keep this repository independently readable; do not link parent workspace
documentation. Update local links and the catalog when reorganizing documents.

## Official Skill template

Agent owns `templates/skill/` and `templates/skill-release.json`. Keep this template
business-neutral; random is a reference service, not a core requirement. Build/release
with the documented template command. Shared transport/recovery remains in User.
Market consumes a validated prebuilt ZIP from remote Agent version tags, retaining
a bundled fallback. Do not reintroduce duplicate source generators there.
Template versions come from Agent package.json; commit templates/release artifacts
before tagging. Do not use independent template tags or require GitHub Releases.
