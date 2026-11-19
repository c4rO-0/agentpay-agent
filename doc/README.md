# Provider documentation

- Completed R11 consumer/state compatibility review. [Dispositions and evidence](security/compatibility-review-2026-11-19.md). Retained historical recovery and published interfaces have explicit exit conditions; no release or deployment.

- [Service revalidation](plans/provider-revalidation.md) — implemented connection-tool behavior after prolonged offline time.

| Reader | Start here |
| --- | --- |
| Service operator | [Installation](runbooks/provider-installation.md), [connection](runbooks/provider-onboarding.md), [usage](usage.md) |
| Developer | [Developer guide](develope.md), [architecture](architecture.md), [design](design.md), [contributing](../CONTRIBUTING.md) |
| Skill author | [Publishing](runbooks/skill-publishing.md), [template releases](runbooks/skill-template-release.md) |
| Maintainer | [Progress](../progress.md), [TODO](TODO.md), [backlog scope](reference/documentation-backlog.md) |
| Security reviewer | [Security reporting](../SECURITY.md), [public dependency provenance](../vendor/protocol/README.md) |
| AI contributor | [AGENTS](../AGENTS.md) |

## Operational references

- [Execution database preparation](runbooks/provider-database.md)
- [Rolling quotes](runbooks/rolling-quotes.md)

Installation and AgentPay connection are separate flows. Providers use public and
role-authorized platform APIs; they do not need platform source, files or SQL.
Private experiment records and historical catalogs are retained outside this public
repository. Current progress describes evidence limits, not instructions to repeat
old deployments or resets.

## Review and history

- [2026-11-16 static review](security/mainnet-static-review-2026-11-16.md): findings,
  corrections and the limits of local evidence.
- [Earlier progress](archive/pre-review-progress-2026-11-16.md) and
  [earlier TODO](archive/pre-review-todo-2026-11-16.md): superseded chronology,
  retained for traceability rather than current instructions.
