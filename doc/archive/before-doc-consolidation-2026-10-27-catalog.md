> Historical snapshot retained on 2026-10-27. Use current progress/TODO for
> status and sequencing; unchecked items here are not automatically cancelled.

# AgentPay agent documentation

Primary audience: Provider operators and Skill publishers. Start with the [repository introduction](../../README.md).

## Read by role

| Reader | Reading path |
| --- | --- |
| User / service or platform operator | [Installation and operation](../usage.md), then the relevant runbook below |
| Developer / integrator | [Development](../develope.md) → [architecture](../architecture.md) → [design](../design.md) → relevant reference/security documents |
| Maintainer planning work | [Current progress](../../progress.md) → [TODO](../TODO.md) → active plan |
| AI coding assistant | [AGENTS.md](../../AGENTS.md) → current progress/TODO → target documentation; AGENTS is instruction, not an end-user tutorial |
| Reviewer / experiment reader | [Evidence catalog](../records/README.md); use each record's date, tested revision and limits |

## Document responsibilities

| Document or directory | Purpose |
| --- | --- |
| README | What this repository does and where each reader starts |
| progress.md | Current state, completed evidence and next work; not a process-monitor output |
| TODO.md | Actionable current/deferred work and acceptance; not an experimental diary |
| usage.md / runbooks | Installation, operation and step-by-step recovery; distinguish user and administrator actions |
| develope.md | Development environment, code entry points and verification; the existing filename is retained |
| architecture.md / design.md | Implementation boundaries versus product requirements and rationale |
| plans | Future sequencing and acceptance; a plan is not implemented behavior |
| reference / security | Detailed contracts, interfaces and security requirements |
| records | Dated experiments, reviews and sanitized evidence; not current setup instructions |
| archive | Superseded descriptions, progress and task snapshots; never a current command queue |

Current status comes from progress/TODO, not the word “current” in an older record. Source tests, private integration, human usability and production qualification are separate claims.

## Operation by task

- [Local reference installation and random generation](../runbooks/provider-installation.md)
- [AgentPay connection: binding, registration and readiness](../runbooks/provider-onboarding.md)
- [Rolling Quotes for the reference random Provider](../runbooks/rolling-quotes.md)
- [Skill 发布、预览和获取：当前范围](../runbooks/skill-publishing.md)

## Reference

- [Retained backlog disposition](../reference/documentation-backlog.md)

## Historical archive

- [Agent Usage](before-doc-organization-2026-10-09-doc-usage.md)
- [Agent Progress](before-doc-organization-2026-10-09-progress.md)
- [agent](before-doc-organization-2026-10-09-readme.md)
- [AgentPay Skill Runtime TODO](before-doc-organization-2026-10-09-todo.md)

## Experimental and review evidence

See the [dated evidence catalog](../records/README.md). Raw logs, private configuration, credentials and request/output payloads do not belong in documentation.

## Package and source-adjacent documents

These remain beside their code/package. Packaged SKILL.md is for the consuming Agent; spike findings are experimental evidence.

- [Random integer](../../skills/random/SKILL.md)

- [Provider guided onboarding review](../records/provider-guided-onboarding-review-2026-10-09.md)

- [Provider guided source and verification](../records/provider-guided-onboarding-2026-10-09.md)

- [Provider first-use gaps and acceptance — 2026-10-09](../records/provider-first-use-review-2026-10-09.md)

- [Provider first-use corrections — 2026-10-09](../records/provider-first-use-fixes-2026-10-09.md)

- [Prepare your own Provider database](../runbooks/provider-database.md)

Current release responsibilities are assigned to three stages in [progress](../../progress.md) and [TODO](../TODO.md): private end-to-end acceptance, real-network integration and limited invitation testing. Earlier component checklists preserve unresolved evidence and do not supersede that sequencing.

## Planning review — 2026-10-23

Current [progress](../../progress.md) and [TODO](../TODO.md) separate accepted evidence
from remaining release gates. [Prior progress](before-planning-review-2026-10-23-progress.md)
and [prior TODO](before-planning-review-2026-10-23-todo.md) preserve all earlier
checkpoints and unresolved details; historical pending labels are not new instructions.

- [Terminal payment response correction](../records/terminal-payment-response-2026-10-23.md): pending versus terminal failure mapping and validation scope.

- [Provider crash-hook source cleanup](../records/provider-crash-hook-cleanup-2026-10-24.md): source removed, tests and operator restart checks passed.
