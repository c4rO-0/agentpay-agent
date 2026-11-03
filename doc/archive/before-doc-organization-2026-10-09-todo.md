> Historical snapshot, captured 2026-10-09 before documentation organization.
> Statements of "current", pending tasks and commands describe earlier checkpoints.
> Use the repository README, progress and TODO for current scope. This is not an execution runbook.

# AgentPay Skill Runtime TODO

## 当前主线已验收 — 2026-10-09

- [x] 新注册/资格/分发、本次购买、同单重试/明确确认和终态资金核对通过。
- [ ] 接入UX（重复长摘要）、旧入口退役/替换及更广恢复/负向/UI门槛仍待确认/执行。
[终态证据及范围](../records/fresh-purchase-terminal-2026-10-09.md)。


- [ ] **[接入 UX，待单独确认修改]** INSTALL/SELECT 不再要求重复键入长摘要；保留自动哈希校验、明确安装/使用确认及本地编辑保护。
- [ ] **[需批准下一闭环]** 开放新单并执行新购买，核对交付/期限和资金。

## 当前分发/衔接闭环 — 2026-10-08

- [x] 新 Skill 分发/本地衔接完成；已完成阶段加真实6590最终读回通过，整份修正 runner 尚未重跑。
- [x] 本次新交易/User重启同单重试和终态财务证据通过；更广恢复/负向验收不自动关闭。
- [ ] 盘点并确认退役/替换旧 publish/qualification/admission 演练入口及 host 引用；本轮不改程序、不增加兼容。
- [x] 记录并更新已确认落后的当前文档入口/路径，历史证据保留。
[本轮发现](../records/current-flow-documentation-gaps-2026-10-08.md)。


## Fresh Provider execution queue — 2026-10-08

- [x] Exact old business cleanup and managed startup configuration completed; fresh local service state prepared, Wallet/Safe/Policy/chain retained.
- [x] Settlement/Market API restored with new Orders closed; public deployment snapshot refreshed.
- [x] **[Actual execution]** New Market account/login, pre_admission startup and B1 verified/active/ready; owner-held 0600 files.
  [Actual binding result](../records/fresh-provider-binding-2026-10-08.md).
- [x] **[Actual B1.4]** Bound profile reprepare, stable retry, restart, 402/403, B1 ready and closed Orders passed.
  [Actual result](../records/fresh-provider-bound-preparation-2026-10-08.md).
- [x] **[Actual B2]** Combined preview/register/status passed: registered=true, Quote target active, Quote fresh, Registry not_qualified.
  [Actual result](../records/fresh-provider-service-registration-2026-10-08.md).
- [x] **[Actual execution]** Registry grant and Provider preparation both passed: block41, qualified/fresh/admitted. Orders remain closed; no Order or partial failure.
  [Actual evidence](../records/fresh-provider-qualified-admitted-2026-10-08.md).
- [x] New Skill distribution and User/Wallet reconnection passed through completed stages and independent current-state checks.
- [x] One actual purchase, User restart/same-key retry and independent terminal financial reconciliation passed; broader recovery remains pending.

Provider is active/admitted; account/B1/B2 and current-service qualification passed. Wallet/User running; Orders open. One new purchase is Released and financially reconciled. No old-data migration or compatibility mechanism is planned; do not repeat the completed cleanup.
[Actual preparation result](../records/fresh-provider-preparation-2026-10-08.md).

## Managed Provider startup source ready — 2026-10-08

The User approved exact obsolete test state cleanup and fresh registration.
Managed prepare/start now reuse B1/service identity, require explicit preparation,
filter inherited platform credentials, and preserve admitted binding/credential
checks. Eight focused tests passed. Protected config preparation and cleanup
are complete; fresh account/B1/B2/Registry and paid startup remain pending.
[Implementation and boundaries](../records/managed-provider-startup-2026-10-08.md).

## Current runtime gate — 2026-10-08

- [x] Fresh timestamp schema and [real 27-combination SQL matrix](../records/time-sql-roundtrip-2026-10-08.md).
- [x] Settlement/Market API restored with admission closed; retained historical state audited.
- [ ] Complete fresh Provider/User onboarding through public APIs before enabling purchases.
- [ ] Verify restart/retry, independent chain evidence and terminal balances.

## Fresh timestamp schema verified — 2026-10-08

Operator initialization passed: Settlement 68 tables/180 epoch columns, Market
13/37, Provider 1/3. Admission is closed; only two control rows exist. Chain/local
state is preserved and applications stopped. Historical backfill is superseded by
the approved database reset. Next: prepared temporary-table SQL timezone matrix,
then retained-state/public-API restoration and real recovery/financial acceptance.
[Actual schema evidence and next check](../records/time-schema-initialized-2026-10-08.md).

## Three-database reset completed — 2026-10-08

Operator reset succeeded; chain and local state remain, applications stay stopped.
Current-source schema-only initializer is ready; new-order admission will be
closed and no account/credential/Order seeded. 36 focused source checks and the
Market API build pass. Actual schema initialization and retained-state/public-API
reconciliation remain pending. The destructive reset must not be repeated.
[Result, targets and evidence](../records/time-database-reset-and-schema-init-2026-10-08.md).

## Current migration gate — 2026-10-08

- [x] Complete three-role read-only [inventory](../records/time-storage-inventory-2026-10-08.md).
- [ ] Review exact active-field/row historical provenance and unresolved handling;
  protect unchanged identities/deadlines and separate durations from instants.
- [ ] Verify backup/rollback and stop old writers before coordinated migration;
  actual recovery/financial acceptance remains pending.

## Current timestamp source checklist — 2026-10-07

- [x] Complete this repository's interface/storage/display changes and focused
  regression scope in the [source review](../records/participant-interface-time-review-2026-10-07.md).
- [ ] Verify actual historical provenance and coordinated migration/rollback;
  permanent databases and running services are unchanged.
- [ ] Perform actual private recovery/API/chain/financial acceptance and human
  timezone/usability checks after rollout. Source tests do not close this gate.

Older timestamp source checklists below are historical; non-time product tasks
remain actionable.

- [x] 绑定运行时整数 expiry、严格旧接口兼容及到期负例；见 [检查点](../records/identity-market-time-source-2026-10-07.md)。
- [ ] 身份/状态接口和剩余调用方审阅；实际 SQL/恢复/部署及本地展示仍未关闭。


## 时间迁移前次待办（历史）— 2026-10-07

Order/授权/划款/通知等消费者与滚动报价有源码证据；Provider 执行 SQL 和本地状态时间迁移未完成。

- [ ] 参与者阶段完成执行/绑定/登记本地时间存储、旧数据/文件兼容和同调用结果复用；只通过公开 API 获取平台事实。
- [ ] 本仓库范围完成后统一关联验证，明确源码、真实存储、进程/链和参与者
  证据差异；最终部署前核对兼容和旧 writer，不能局部上线。

下方已勾选时间记录是历史源码证据；未勾选的非时间产品任务仍有效。

- [x] T2f notice/delivery timestamp interfaces and consumers; 426 three-zone checks.

- [x] T2e service authorization epoch interfaces and consumers; three-zone 399 checks.

- [x] T2d versioned deadline timestamps; three-zone 384 checks plus 25 rule regressions.

- [x] T2c Provider Order v2 and decoder, three timezone scoped regression (30 tests).

- [x] T2b finalization timestamp source loop; three-zone regression, types 0.8.0.

## Quote time boundary — 2026-10-06

- [x] Rolling TTL, Unix expiry, window offerId and fixed-cutoff protection; three Node timezone tests.
- [x] Private Provider update, cross-window renewal, same-window restart identity and successful Settlement observation; see [the record](../records/provider-rolling-quote-2026-10-06.md).
- [ ] Host onboarding CLI subprocess test (sandbox EPERM); this separate pending CLI rollout is not proven by the systemd Provider run.
- [ ] Versioned epoch execution/local metadata storage, preserving recovery and old files.


## 最小交互版私有演练 — 2026-10-03

- [ ] 网页教程／命令／本机结果交接；Skill 包提供与发布衔接；独立安装、绑定重启及报价错误恢复。
- [ ] **[待演练]** 私有真实进程／浏览器接入及中断恢复；单测不代替参与者执行。

本条是当前计划；下方历史 closeout 仅对应已结束的上一轮后端演练。

## Preparation source loop — 2026-10-03

- [x] Protected service prepare, automatic persisted identifiers/profile hashes and Quote error recovery display.
- [ ] **[待演练 B2]** First preparation, unchanged retry, binding/hash restart, pricing/expiry changes, state-file recovery and real Settlement error correction.

## External onboarding documents — 2026-09-28

- [x] Review and correct expiry/hash recovery blockers, API redirects and concurrent binding saves.
- [x] Complete standalone service preparation: automatic local/verified hashes and saved Skill/offer identity; pricing and expiry remain Provider inputs.

- [x] B2 first source loop: formal preview/register/status with canonical profile,
  live 402 identity and authorized service read-back.
- [x] B2 Quote/qualification breakdown, local health identity checks and
  admission preparation guidance; no automatic qualification or mode changes.
- [x] Standalone config precheck and unified foreground/login/binding/service entry.
- [ ] **[待演练 B2]** Clean install, own database initialization, binding/hash
  restart and user-level process supervision.
- [ ] **[待演练 B2]** Real Registry outage, Quote expiry, local health mismatch
  and process admission/restart recovery.
- [ ] **[待演练 B1/B2]** Provider real login/binding/restart/recovery, registration,
  status and multiple endpoints; deferred on 2026-09-30 until conditions permit.

- [x] Put role-facing setup and recovery guidance inside this repository;
  README and usage now point to local docs.
- [x] Complete B1 Provider-only binding status, recovery and explicit credential
  replacement/recovery in source, without Settlement database or server-file access.
- [ ] Deploy and exercise B1 on an independent Provider host, including real
  restart, Market/Settlement API access and two endpoint roles.
- [ ] Complete Provider-only service registration beyond the current private
  test configuration, without Settlement database or server-file access.

## Closeout review finding C2 — 2026-09-28

- [ ] Align packaged random-script request ID minimum with Runtime's eight
  characters. IDs of length 1–7 currently fail only at Runtime before purchase.
  Program change requires approval and explicit immutable bundle version handling;
  do not rewrite the published 1.0.0 mirror in place.


## Provider contract compatibility — recorded 2026-09-28

- [ ] Before supporting multiple contract generations, let Provider verify that
  each Order's actual contract generation meets the service's supported/required
  versions before accepting execution. Resolve the deployed Factory/Vault and
  relevant ABI/semantics from authenticated Settlement and verifiable chain
  facts; a User-declared version or the globally newest deployment is not proof.
- [ ] Define trusted version identification, service compatibility requirements,
  mismatch errors and retry/recovery behavior in a separately reviewed design.
  Include old-Policy User/new Settlement combinations and existing in-flight
  Orders. No new wire field, on-chain version mechanism or runtime check is
  specified or implemented by this note.


## Current scope — 2026-09-28

The current private scenario run has ended at the User's request. Follow the
[current progress](../../progress.md)
for executed evidence, review status and explicitly deferred cases. Historical
setup/repetition tasks below do not require restarting this completed run.

## Approved Composition Work — Implementation Pending

- [x] Document separate Provider-side service registration and add its
  Provider-role CLI; source syntax passes.
- [x] Run registration preview/execute against protected private Settlement
  and independently verify one canonical profile and active target persisted.
- [ ] Verify paid service authorization for calls originating from third-party/local-modified Skills without trusting publisher metadata.

- [x] Implement approved Provider configuration separation and binding-derived
  Skill identity; focused tests pass.
- [x] User executed the protected existing-host migration; process configuration
  and bound Skill identity passed.
- [x] Publish and download the Provider-authored complete random Skill through Market.

Last updated: 2026-09-26

## Pre-M8 Remediation And Acceptance

The approved private reset restored the **current** Provider to
`pre_admission`; the historical admitted/purchase development checks below
remain evidence, not current business state. The fresh Stage 2 gate passed
with no credential, qualification, Quote or Order. A focused regression test
now covers startup before the Provider Credential is issued; admission still
requires that credential. This was a pre-rehearsal handoff checkpoint.

The earlier private readiness review tracked C1–C6. Agent-owned findings and
their component results are listed below.

- [x] C1 / R1: exercise changed and repeated offers through the real service route against Settlement admission.
- [x] C2 / R6: expose bound result/Receipt evidence and prove a test-only altered result is rejected without making quality judgments.
- [x] C3 / R3: keep Provider credentials separate from Wallet and Settlement roles. The approved same-account private host does not provide filesystem isolation; cross-account isolation is not a C6 requirement.
- [x] C5: rerun real Provider claim/result/Receipt recovery and rejection/silence/outage cases against the corrected current runtime; distinguish accepted-claim recovery after expiry from new claims on expired, never-claimed authorization.
- [x] C6 / Stage 2: start the actual Provider with independent MySQL and no
  credential in `pre_admission`; return real native `402`, reject payment and
  service attempts, prove no Registry/Quote/Order/credential/execution state,
  and repeat after restart.
- [x] C6 / Stage 3B: implement the actual Settlement Endpoint Control Challenge
  handler in this Provider server, install the pending M2M Credential without
  logging it, align the provisional `providerId`, and keep the Provider
  `pre_admission` after Market publication.
- [x] C6 / Stage 3C development: transition to admitted behavior only after Market binding,
  test-only Registry qualification and real Quote observation pass. Native
  `/x402/settle` should use that verified M2M Credential, not a second Gateway
  credential; standard `exact` remains separate.
  The native Provider now reuses its M2M Credential in code and no longer
  requires a second Gateway file. Gateway unit, isolated MySQL and formal
  no-Order rejection tests passed, followed by actual admission/rollback and
  positive Gateway/installed-Skill purchases.


- [x] A2: bound Provider-to-Settlement native HTTP waits and retain durable
  claim/payment/Receipt identities after timeout. Include stalled headers/body
  and exact retry tests in the cross-component recovery loop.


Acceptance requires recorded behavioral evidence on the corrected source and
updated usage/recovery documentation. Report each loop before advancing;
these tasks precede M8 participant sessions.

## Completed Owned Major Milestone M7: Native Skill And Provider Runtime

M6/F4 is complete. M7/F1 assigns the user-side Skill to `user` and the
supplier-operated Provider server to this repository.

- [x] Use the approved Settlement Order prepare/read,
  Wallet `service.ready`, and Provider Account–Server Binding/credential
  lifecycle boundaries; do not
  invent parallel Agent-local contracts.
- [x] Pin and test the shared `agentpay.private-request.v1` package/fixture;
  retain legacy Ticket hashing only for legacy execution compatibility.
- [x] Add a test-only loopback random Provider simulator for the strict native
  HTTP `402` requirement/authorized-result conformance loop; do not mount its
  static smoke authorization in the production runtime.
- [x] Freeze the random Skill/Provider participant contract, execution states,
  idempotency identity, and real-process verification rule in M7/F1.
- [x] Implement the random Provider-server path using online claim and one-time
  service authorization rather than the legacy execution Ticket; the local
  Skill implementation belongs in sibling `user`.
- [x] Keep private request/output on the client/Skill/provider path and submit
  only bound receipt metadata and usage.
- [x] Make provider claim, execution, and receipt behavior idempotent across
  retry and process restart.
- [x] Prove accept, reject, silence, over-usage, expired authorization,
  duplicate execution, conflicting receipt, and provider outage behavior.
- [x] Bind the persistent rehearsal Provider explicitly to loopback and prove
  its process and database recover across the F5-C restart sequence.
- [x] Prove the Provider as a persistent loopback service in the deployed M7
  success transaction.
- [ ] Document the provider API and clean participant setup for M8.

Acceptance: a rehearsal participant invokes a real local Skill through the
intended Wallet/Settlement flow without test helpers, payment authority, or
private data entering Settlement.

## Later

- [ ] Harden multi-instance execution and receipt delivery.
- [ ] Add more Skills only after the reference contract is stable.
- [ ] Retire the legacy Ticket path after all consumers and orders migrate.
- [ ] Remove the legacy Market `_agentpay_challenge` runtime route after its
  remaining regression consumers are migrated; Market's active API already
  returns `410`, so do not preserve this route as an alternative verifier.

## 完整包闭环

- [x] 实现 Provider 三文件目录包和 User 独立预览／安装。
- [x] 校验归档拒绝、原始内容保存、本地修改保留与脚本有界调用。
- [x] 用户执行当前 Provider 重启和直接下载验收，三文件归档及保存摘要核对通过。
- [ ] 后续适配 Market 完整包发布／镜像／下载，再衔接 User 设置和购买验证。

## Timestamp source review — 2026-10-07

- [x] Timestamp changes and affected caller checks in [this record](../records/quote-time-boundary-review-2026-10-07.md).
- [ ] Remaining time interfaces/storage and real deployment/recovery evidence.
