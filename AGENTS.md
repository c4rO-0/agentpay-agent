# Agent Development Instructions


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
- `doc/records/` and `vendor/protocol/` are intentionally ignored and local-only.
  Preserve local files; never force-add them or remove their ignore rules without
  explicit owner authorization and a disclosure review. Protocol publication and
  dependency distribution are separate decisions.
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
