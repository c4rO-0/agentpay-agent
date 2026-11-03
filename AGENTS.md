# Agent Development Instructions

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
Market consumes a pinned ZIP; do not reintroduce duplicate source generators there.
