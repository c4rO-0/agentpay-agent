# AgentPay Provider progress

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
