# AgentPay Provider progress

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

[Plan](doc/plans/provider-revalidation.md): Settlement admission expires after
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

Use [TODO](doc/TODO.md) for remaining Provider acceptance and public distribution.
Protocol package naming/channel and cross-version compatibility remain separate
work; bundling the reviewed archive repairs current source installation only.
The reference's MySQL/Linux implementation choices are not requirements imposed on
other Provider implementations. No live service, database, Order or credential was
changed by this documentation/dependency cleanup.
