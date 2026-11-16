# Provider architecture

This repository runs the supplier's service. The installed Skill calls the buyer's
User Runtime, which reaches this Provider. Wallet owns the buyer's Session Key;
Settlement owns payment routing and service authorization. Provider keeps private
input/output and submits hashes, actual usage and receipt metadata.

## Entry points and ownership

| Entry / module | Responsibility |
| --- | --- |
| `scripts/provider-install.mjs`, `provider-installation.mjs` | Reference Linux service installation, private application storage and owned process handoff |
| `scripts/provider-setup.mjs`, `provider-onboarding.mjs` | Resumable API-only account, endpoint binding, registration and readiness guide |
| `scripts/provider-host.mjs` | Explicit application configuration, start/check and service operations |
| `scripts/provider-runtime.mjs` | Managed-service environment validation and identity preparation/start |
| `src/index.mjs` | HTTP routing, transport bounds, graceful shutdown; reference business wiring |
| `native-provider-runtime.mjs` | Native 402, payment forwarding, online authorization and durable execution/receipt |
| `native-application.mjs`, `services/random-native.mjs` | Shared execution contract versus the random business implementation |
| `provider-result-retrieval.mjs`, `provider-case-monitor.mjs` | Scoped saved-result retrieval and bounded case observation; no regeneration |
| `provider-binding-*`, `provider-service-*` | Local identity/credential state, control challenges and authenticated platform clients |
| `native-provider-quote.mjs` | Fixed/rolling quote lifetime and immutable offer derivation |
| `random-skill-bundle.mjs`, `templates/skill/` | Reference package versus editable generic template |

Paths without a prefix in this table are under `src/`. Legacy Ticket dispatch and
`services/serper-search.mjs` remain separate compatibility paths, not native paid
integration examples. The loopback simulator is a test tool and is never mounted
by the serving process. The guarded `register-service.mjs` helper is retained for
an older private deployment consumer; use the host/connection commands for new work.

## Native request and recovery order

1. Publish a canonical 402 declaration. A signed payment is forwarded to Settlement;
   Provider cannot substitute prices, funding or permission.
2. Validate business input and obtain an Order-scoped MySQL advisory lock on a
   dedicated connection. Claim authorization online and verify its exact tuple
   before inserting an execution record.
3. Reuse the durable claim/receipt identities. Accept through Settlement before
   marking execution intent and running the application.
4. Persist output, its existing JSON hash, actual usage and completion time before
   submitting the receipt. Lost receipt responses retry the same receipt.
5. Return the saved result. An interrupted `executing` record requires the
   application's explicit recovery hook; there is no general automatic replay.

The lock serializes this implementation's execution, but cannot make arbitrary
external side effects exactly once. Use Order identity in downstream idempotency
and reconciliation. Result retrieval checks scoped online authority and returns
saved output only. MySQL is this reference application's choice, not a protocol
requirement for every Provider. Old rows without explicit usage pause for review.

## Identity, storage and transport

Service preparation preserves `skillId` and rotates the offer seed when its
endpoint/profile/quote settings change. Fixed-quote signatures include explicit
service duration; rolling quotes also bind duration and their validity window.
Startup verifies prepared state without silently rewriting identity. After editing
configuration, use the normal prepare command deliberately; preserve old Orders.

Binding and service files use owner-only storage, exclusive file locks and atomic
replacement. Credential plaintext is separate from public identity and never enters
Skill ZIPs. Installation/guide locks fail closed after uncertain interruption;
owner inspection may be needed. Execution locks use the live MySQL connection.

Public Provider endpoints support HTTP and HTTPS and can include a path prefix;
local control remains separate. Credential-bearing platform requests do not follow
redirects. HTTP dispatch contains rejected handlers, caps retained bodies at 2 MiB
and drains accepted work before closing native storage on shutdown. File-service
adapters should exchange bounded references rather than embed large binaries.

## Packages and dependencies

The exact public Protocol npm dependency supplies schemas, hashes and ABIs. User
supplies the installed shared Skill client; it is not a Provider installation
dependency. Generic template releases follow Agent tags; random package versions
are independent. Current source/release states are in [progress](../progress.md).

ZIP generation caches one bounded artifact per current identity, coalesces builds
and discards failed in-flight work for retry. Source updates need a restart. Market
checks remote Agent tags and consumes prebuilt templates; Provider never fetches
Git at request time. See [template releases](runbooks/skill-template-release.md).
