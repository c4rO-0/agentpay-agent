# Agent Design

## Approved Composition Direction — 2026-09-26

The Provider supplies paid services independently of Market package
publication. A calling Skill may be authored by the Provider, a third party or
modified locally; the Provider checks the service request and valid payment /
Service Authorization, not publisher ownership. One Skill may call several
Providers, with separate Orders. The current random package generator is an
optional reference authoring path, not the exclusive Skill distribution model.



The installed Skill lives in the sibling open `user` runtime. The Provider
server lives in this supplier-operated repository; they are separate logical
roles and processes. Private input/output bypasses Settlement. Only request/output hashes,
usage, delivery metadata, and identifiers needed for settlement are reported.

Execution starts only after Settlement reports the order ready. Provider usage
cannot choose money values: Settlement derives price and fee from the frozen
quote. Duplicate authorization, execution, or receipt requests must be
idempotent or rejected explicitly.

M7 evidence starts the real processes and uses formal IPC/HTTP. A harness may
orchestrate failures and assertions but may not fabricate state through direct
database writes, internal stores, or static authorization.
# Skill package boundary

The Provider authors the versioned user-side Skill adapter and may offer its
package directly. Market stores a byte-for-byte downloadable copy for
discovery and installation. The Provider server remains the separate private
service implementation and never packages its M2M Credential or execution
secrets into a Skill. See the project-wide
distribution boundary.

## Guided operational composition

Onboarding combines independent operations at the terminal without merging their
domain state. Account login, endpoint control, paid service registration, authoritative
qualification/Quote observation and local admission remain separate retryable facts.
Unknown remote state is not absence. Lost credentials require explicit owner recovery;
lost existing service identity requires restore. Publisher ownership is not admission.
Installation and AgentPay connection are separate flows. Installation owns local
service operation. Connection owns account/control/registration API operations;
it cannot require SQL access or manage the supplier's process. The application
owns prices, service identifiers, credentials and paid-admission configuration.
Platform success and local readiness must be reported separately.
