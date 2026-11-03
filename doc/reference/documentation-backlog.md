# Retained backlog disposition

Captured 2026-10-09. Audience: maintainers reviewing scope, not users running setup.

The current [TODO](../TODO.md) is the execution queue. This ledger preserves every previously unchecked item with its original section. It is not an additional schedule or a claim that those items remain unimplemented.

| Earlier topic | Current disposition |
| --- | --- |
| Disposable database timestamp migration and compatibility | Superseded by the approved database-only reset; do not schedule historical business-data conversion. Source/SQL evidence does not prove every recovery or browser case. |
| Fresh account, registration, qualification, package and terminal purchase | The private mainline has evidence; independent installations, all negative cases and the complete guided journey still need their own acceptance. |
| Terminal / Provider / Market onboarding | Carried into the current four-stage contribution in TODO. |
| Legacy paths and tables | Record the actual retirement scope; do not restore compatibility. Remaining runtime/operational references require specific review. |
| Security, live network, maintenance, scale and optional product features | Retained as deferred/release work; not cancelled and not implicitly authorized by private success. |
| Anything not resolved by the above | Review against current source and evidence before scheduling or closing; do not silently discard it. |

Full original wording and completed items remain in the [task snapshot](../archive/before-doc-organization-2026-10-09-todo.md). The quotations below are historical task text, not current instructions.

## Retained item 1 — 当前主线已验收 — 2026-10-09

> 接入UX（重复长摘要）、旧入口退役/替换及更广恢复/负向/UI门槛仍待确认/执行。

## Retained item 2 — 当前主线已验收 — 2026-10-09

> **[接入 UX，待单独确认修改]** INSTALL/SELECT 不再要求重复键入长摘要；保留自动哈希校验、明确安装/使用确认及本地编辑保护。

## Retained item 3 — 当前主线已验收 — 2026-10-09

> **[需批准下一闭环]** 开放新单并执行新购买，核对交付/期限和资金。

## Retained item 4 — 当前分发/衔接闭环 — 2026-10-08

> 盘点并确认退役/替换旧 publish/qualification/admission 演练入口及 host 引用；本轮不改程序、不增加兼容。

## Retained item 5 — Current runtime gate — 2026-10-08

> Complete fresh Provider/User onboarding through public APIs before enabling purchases.

## Retained item 6 — Current runtime gate — 2026-10-08

> Verify restart/retry, independent chain evidence and terminal balances.

## Retained item 7 — Current migration gate — 2026-10-08

> Review exact active-field/row historical provenance and unresolved handling;
>   protect unchanged identities/deadlines and separate durations from instants.

## Retained item 8 — Current migration gate — 2026-10-08

> Verify backup/rollback and stop old writers before coordinated migration;
>   actual recovery/financial acceptance remains pending.

## Retained item 9 — Current timestamp source checklist — 2026-10-07

> Verify actual historical provenance and coordinated migration/rollback;
>   permanent databases and running services are unchanged.

## Retained item 10 — Current timestamp source checklist — 2026-10-07

> Perform actual private recovery/API/chain/financial acceptance and human
>   timezone/usability checks after rollout. Source tests do not close this gate.

## Retained item 11 — Current timestamp source checklist — 2026-10-07

> 身份/状态接口和剩余调用方审阅；实际 SQL/恢复/部署及本地展示仍未关闭。

## Retained item 12 — 时间迁移前次待办（历史）— 2026-10-07

> 参与者阶段完成执行/绑定/登记本地时间存储、旧数据/文件兼容和同调用结果复用；只通过公开 API 获取平台事实。

## Retained item 13 — 时间迁移前次待办（历史）— 2026-10-07

> 本仓库范围完成后统一关联验证，明确源码、真实存储、进程/链和参与者
>   证据差异；最终部署前核对兼容和旧 writer，不能局部上线。

## Retained item 14 — Quote time boundary — 2026-10-06

> Host onboarding CLI subprocess test (sandbox EPERM); this separate pending CLI rollout is not proven by the systemd Provider run.

## Retained item 15 — Quote time boundary — 2026-10-06

> Versioned epoch execution/local metadata storage, preserving recovery and old files.

## Retained item 16 — 最小交互版私有演练 — 2026-10-03

> 网页教程／命令／本机结果交接；Skill 包提供与发布衔接；独立安装、绑定重启及报价错误恢复。

## Retained item 17 — 最小交互版私有演练 — 2026-10-03

> **[待演练]** 私有真实进程／浏览器接入及中断恢复；单测不代替参与者执行。

## Retained item 18 — Preparation source loop — 2026-10-03

> **[待演练 B2]** First preparation, unchanged retry, binding/hash restart, pricing/expiry changes, state-file recovery and real Settlement error correction.

## Retained item 19 — External onboarding documents — 2026-09-28

> **[待演练 B2]** Clean install, own database initialization, binding/hash
>   restart and user-level process supervision.

## Retained item 20 — External onboarding documents — 2026-09-28

> **[待演练 B2]** Real Registry outage, Quote expiry, local health mismatch
>   and process admission/restart recovery.

## Retained item 21 — External onboarding documents — 2026-09-28

> **[待演练 B1/B2]** Provider real login/binding/restart/recovery, registration,
>   status and multiple endpoints; deferred on 2026-09-30 until conditions permit.

## Retained item 22 — External onboarding documents — 2026-09-28

> Deploy and exercise B1 on an independent Provider host, including real
>   restart, Market/Settlement API access and two endpoint roles.

## Retained item 23 — External onboarding documents — 2026-09-28

> Complete Provider-only service registration beyond the current private
>   test configuration, without Settlement database or server-file access.

## Retained item 24 — Closeout review finding C2 — 2026-09-28

> Align packaged random-script request ID minimum with Runtime's eight
>   characters. IDs of length 1–7 currently fail only at Runtime before purchase.
>   Program change requires approval and explicit immutable bundle version handling;
>   do not rewrite the published 1.0.0 mirror in place.

## Retained item 25 — Provider contract compatibility — recorded 2026-09-28

> Before supporting multiple contract generations, let Provider verify that
>   each Order's actual contract generation meets the service's supported/required
>   versions before accepting execution. Resolve the deployed Factory/Vault and
>   relevant ABI/semantics from authenticated Settlement and verifiable chain
>   facts; a User-declared version or the globally newest deployment is not proof.

## Retained item 26 — Provider contract compatibility — recorded 2026-09-28

> Define trusted version identification, service compatibility requirements,
>   mismatch errors and retry/recovery behavior in a separately reviewed design.
>   Include old-Policy User/new Settlement combinations and existing in-flight
>   Orders. No new wire field, on-chain version mechanism or runtime check is
>   specified or implemented by this note.

## Retained item 27 — Approved Composition Work — Implementation Pending

> Verify paid service authorization for calls originating from third-party/local-modified Skills without trusting publisher metadata.

## Retained item 28 — Completed Owned Major Milestone M7: Native Skill And Provider Runtime

> Document the provider API and clean participant setup for M8.

## Retained item 29 — Later

> Harden multi-instance execution and receipt delivery.

## Retained item 30 — Later

> Add more Skills only after the reference contract is stable.

## Retained item 31 — Later

> Retire the legacy Ticket path after all consumers and orders migrate.

## Retained item 32 — Later

> Remove the legacy Market `_agentpay_challenge` runtime route after its
>   remaining regression consumers are migrated; Market's active API already
>   returns `410`, so do not preserve this route as an alternative verifier.

## Retained item 33 — 完整包闭环

> 后续适配 Market 完整包发布／镜像／下载，再衔接 User 设置和购买验证。

## Retained item 34 — Timestamp source review — 2026-10-07

> Remaining time interfaces/storage and real deployment/recovery evidence.
