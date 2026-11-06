# Provider documentation

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
