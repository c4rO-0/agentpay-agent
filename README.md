# AgentPay Provider Server

A reference paid random-number Provider and editable Skill template for service developers.

For service operators and Skill publishers. This reference Provider offers paid services, keeps its own credentials and execution state, and submits only required payment evidence to Settlement.

## Install and use

There are two independent flows:

1. [Install and test the local random-number service](doc/runbooks/provider-installation.md).
   This prepares the application execution storage and verifies local generation, without a Market account.
2. [Connect an already running service to AgentPay](doc/runbooks/provider-onboarding.md).
   This handles account binding, endpoint verification and service registration,
   without managing the service's database or process.

Use Linux with Node 22.22.3 or a later compatible version and npm. The reference
application also needs its own MySQL database/login; see [database preparation](doc/runbooks/provider-database.md).
From this repository:

```bash
npm ci
node scripts/provider-install.mjs --new "$HOME/.local/share/agentpay/provider/random"
```

Choose `continue` to start and verify the local service on Linux. Installation
ends with the separate AgentPay connection command. The connection guide gives
exact application commands for credential loading, profile refresh and paid
admission; successfully completed steps are reused. A local generation check
alone is not an AgentPay-ready service.

Full private human acceptance is pending;
source tests do not establish public release readiness.

[Publish a Skill](doc/runbooks/skill-publishing.md) after preparing its package. Publication is independent of Provider trading admission.

## Documentation by reader

| Reader | Start here |
| --- | --- |
| Users / service or platform operators | [Local installation](doc/runbooks/provider-installation.md), [AgentPay connection](doc/runbooks/provider-onboarding.md) |
| Developers / integrators | [Development](doc/develope.md), [architecture](doc/architecture.md), [design](doc/design.md) |
| Maintainers | [Current progress](progress.md), [actionable TODO](doc/TODO.md) |
| AI coding assistants | [AGENTS.md](AGENTS.md), then current progress and target documents |
| Reviewers / contributors | [Contributing](CONTRIBUTING.md), [security reporting](SECURITY.md), [development and test scope](doc/develope.md) |

[All documentation by purpose](doc/README.md).

## Current scope

Provider B1/B2, rolling quotes, qualification and local admission have private execution evidence. Skill publication and one subsequent paid purchase were verified. This does not prove a clean independent-host guided installation or every recovery case.

Current work is tracked in progress and TODO. Dated evidence and archived instructions do not authorize deployment, migration, reset or a new purchase.

The required public Protocol archive is included with its license and
[provenance](vendor/protocol/README.md). Private experiment records and old archives
are not distributed. Public package-channel and compatibility design remain open.

[Official Skill template releases](doc/runbooks/skill-template-release.md) use Agent
version tags; normal Provider installation does not require the User repository.

## License

[MIT](LICENSE). You may use and modify this reference Provider and its Skill
template in commercial or closed-source products. Retain the copyright and
license notice when distributing copies or substantial portions. Third-party
dependencies retain their own licenses.
