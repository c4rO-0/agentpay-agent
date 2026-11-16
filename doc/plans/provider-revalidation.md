# Revalidate a service after prolonged offline time

Designed 2026-11-08; implementation and scoped CLI acceptance completed 2026-11-09.
Use the [connection guide](../runbooks/provider-onboarding.md) for commands.

Settlement reduces probes after repeated failures and expire a service's
Settlement admission after 30 continuous days of observed unavailability plus a
final failed probe. Automatic checks then stop. This does not revoke Registry
qualification or change old Orders. A temporary outage can recover through normal
probing before expiry; after expiry the operator must actively revalidate.

The connection tool shows the Settlement status and offers explicit
revalidation through the existing authenticated connection flow. Reuse current
account binding, scoped credentials, endpoint-control proof and service declaration
checks. Do not silently start a recurring revalidation loop or claim success before
Settlement confirms current readiness. If credentials need recovery, follow the
existing recovery flow without losing original Order access.

For the same immutable profile, preserve service identity. A changed endpoint must
follow new-profile registration. Server execution, saved results and old credentials
are not deleted just because admission expires. Each service is independent.

The host CLI exposes `service revalidate`; the connection guide offers the action
for expired admission. It obtains endpoint proof and uses the existing authenticated
registration path, then waits for authoritative status. It does not restore service
by editing a local success flag.

Controlled tests and a private official-CLI walkthrough cover a deliberately expired
starting state, repeated challenge reuse and Market projection. They do not prove
thirty days of real downtime or all credential/restriction/interactive branches.
Those limits remain in [TODO](../TODO.md).
