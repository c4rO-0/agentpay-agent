# Revalidate a service after prolonged offline time

2026-11-08. Planned integration; not a currently available command.

Settlement will reduce probes after repeated failures and expire a service's
Settlement admission after 30 continuous days of observed unavailability plus a
final failed probe. Automatic checks then stop. This does not revoke Registry
qualification or change old Orders. A temporary outage can recover through normal
probing before expiry; after expiry the operator must actively revalidate.

The connection tool should show the Settlement status and offer explicit
revalidation through the existing authenticated connection flow. Reuse current
account binding, scoped credentials, endpoint-control proof and service declaration
checks. Do not silently start a recurring revalidation loop or claim success before
Settlement confirms current readiness. If credentials need recovery, follow the
existing recovery flow without losing original Order access.

For the same immutable profile, preserve service identity. A changed endpoint must
follow new-profile registration. Server execution, saved results and old credentials
are not deleted just because admission expires. Each service is independent.

Implement after Settlement defines the scoped action/status response. Test retry,
expired credentials, wrong service, ownership, administrative restrictions, failure
remaining expired and successful restoration through controlled maintained fixtures.
Operator guidance belongs in the existing connection guide, not installation steps.
