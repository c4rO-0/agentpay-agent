# Provider progress

## Onboarding integration corrections — 2026-11-23

Managed connection work exposed missing application handoffs and public-path configuration. The guide now supports a temporary Market session, and the managed declaration preparation entry reuses the reference service identity logic. Focused CLI verification covers missing binding, repeated preparation and refusal after admission. Full independent operator installation, real database setup and public endpoint verification remain pending; existing fixture tests do not establish that complete journey.

## Protocol dependency — 2026-11-19

The Provider now pins Protocol 0.14.4. A clean npm installation passed the private request conformance and native payment result tests.

## Compatibility supplement — 2026-11-19

Completed R11 consumer/state compatibility review. [Dispositions and evidence](doc/security/compatibility-review-2026-11-19.md). Retained historical recovery and published interfaces have explicit exit conditions; no release or deployment.

## Correction review — 2026-11-16

Follow-up review found two omissions, now corrected: old duration-unaware state is
identified with a specific upgrade code and normal preparation instructions; HTTP
fallback preserves reviewed client-error categories and emits correlated, sanitized
source-location diagnostics for unexpected failures. Managed CLI recovery verifies
stable Skill identity and one-time offer preparation. Final 109 tests passed; no old
Order or live state changed.

## Current source — 2026-11-16

The bounded R1–R10 review is complete; see the [review record](doc/security/mainnet-static-review-2026-11-16.md)
for findings, verification and limits. Corrections cover HTTP request containment,
service selection, prefixed readiness, fixed-quote identity, private transport and
Skill client compatibility. Retired failure-injection branches were removed from
the serving runtime. Native transaction rules and stored Orders were not changed.

The maintained entry points separate local service installation, AgentPay connection
and Skill publication. Native execution uses application hooks and durable MySQL
records; Settlement remains the authorization and commercial authority.

## Source, release and deployment are different states

| Component | Current state |
| --- | --- |
| Protocol dependency | Exact public npm 0.14.4 and lockfile integrity; no sibling checkout |
| Agent / generic template | Source candidate 0.1.2; last recorded published template tag v0.1.1 |
| Random Skill | Source/deployed 1.2.2; publication reported successful; Base paid test pending |
| This review | Local source, comments and documentation; no tag, push, deployment or purchase |

Candidate template/example loaders follow the active User installation and retain
legacy discovery only when no active-selection record exists. The generic template
checks all declared client requirements before invoking User. Shared payment,
input snapshots, output caching and original-request recovery stay in User.

## Existing evidence

- Public-file installation and controlled local tests work without platform source,
  credentials or sibling repositories. The current review repeats this boundary.
- Scoped private endpoint binding, registration, rolling quotes, qualification,
  local admission, Skill publication and a paid request have prior acceptance.
- Formal CLI revalidation with endpoint proof and Market projection passed from a
  controlled expired state. It did not simulate thirty days of actual downtime.
- Protocol dependency and running-identity reporting were deployed in the recorded
  November 10 rollout. This review does not re-attest that live deployment.

These results do not prove a fresh independent-host guided installation, production
MySQL contention, arbitrary external business recovery or mainnet safety.

## Next

[Onboarding review](doc/security/onboarding-correction-review-2026-11-23.md) and
[public hosting guide](doc/runbooks/public-provider.md) distinguish managed-host
acceptance from the remaining independent installation journey.


Current stage review is ready for a scoped commit. Release
candidate templates only after artifact review and explicit publication approval;
never replace an existing version's ZIP or silently change User's official digest.
Remaining acceptance and deferred work are in [TODO](doc/TODO.md). The earlier
[progress](doc/archive/pre-review-progress-2026-11-16.md) and
[task list](doc/archive/pre-review-todo-2026-11-16.md) remain traceable history.
