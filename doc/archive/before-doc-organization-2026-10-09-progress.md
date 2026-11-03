> Historical snapshot, captured 2026-10-09 before documentation organization.
> Statements of "current", pending tasks and commands describe earlier checkpoints.
> Use the repository README, progress and TODO for current scope. This is not an execution runbook.

# Agent Progress

## 新注册/Skill/购买主线及终态资金核对通过 — 2026-10-09

实际续验 ok=true：同一订单 Released/finalized；SQL/jobs 与独立链回执、
转账和收款方历史余额一致。0.7rUSDC 预付拆分 Provider0.665、fee0.035，
退款0、Vault余额0；Safe原始17.9→17.2，续验17.2→17.2，未重复购买。
保留的检查点 confirmed=true，续验跳过下单/重启/再确认。原 User 重启同单
重试证据和此前适配脚本错误保留，不把修正前失败 runner 写成全程一次成功。
Provider admitted，Wallet/User及新Skill衔接通过，Settlement新单保持开放，
原Wallet Policy未改变。本轮私有主线闭环通过，其他恢复/负向、人类接入、
Market UI及公开上线门槛不据此关闭。后续接入UX/旧入口整改待独立确认。
[实际终态证据与范围](../records/fresh-purchase-terminal-2026-10-09.md)。


## 新 Skill 分发及本地衔接核对通过 — 2026-10-08

用户实际完成 Market mirror、字节一致性校验、安装/选择、Wallet 解锁及
User 启动。诊断脚本误查6490；实际 User active/6590，独立 health 身份/
包摘要一致。Agent 以现有普通用户只读程序及最终 readiness 阶段核对通过，
唯一阻断 NEW_ORDERS_PAUSED，并修正本人公开快照 runtimeUrl 为6590。
整份修正后的合并 runner 未重跑；本结论基于已完成阶段和独立最终读回。
INSTALL/SELECT 重复输入长摘要的 UX 问题已记录，程序修改待独立确认。
下一闭环待批准：开放新单、完成一次新购买及交付/时限/资金验收。
[实际证据、脚本错误与边界](../records/fresh-skill-connected-2026-10-08.md)。


## 新 Skill 分发与 Wallet/User 衔接 — 2026-10-08，待实际执行

新 Provider 已完成账号/B1/B2、Registry 资格及 admitted 准备；平台数据库重置
和 API 恢复已完成，不再安排旧数据迁移。当前合并入口先核对保留的 Policy，
再发布/list/mirror 新 Skill，经 User 正常安装/选择程序确认，启动并以 Wallet
正常隐藏输入解锁，衔接 User Runtime，最后只读核对。新单保持关闭，预期
唯一购买阻断为 NEW_ORDERS_PAUSED。无新 Policy、付款或链写入。
执行入口语法检查通过；实际安装、解锁、进程和最终核对均待用户运行。
发现并记录文档进度/凭据路径落后及旧演练入口依赖；不为其重建旧数据。
[差异、已修正文档与待办](../records/current-flow-documentation-gaps-2026-10-08.md)。


## 新 Provider 资格与本地接单准备通过 — 2026-10-08

实际 ok=true：当前新服务 Registry 交易在私链31337/block41 确认，回执/
SkillUpdated/链上 isQualified/Settlement 读回一致。本人付费凭据 uid1001/0600，
独立 provider.env 切换 admitted，重启及最终 health/status 通过；Quote fresh。
本地服务声明未改变，新单仍关闭，没有 Order。两部分均成功，未发生部分
失败或实际回退。历史旧资格未撤销；本轮开发写链明确记录，不能算用户购买。
Provider 接入准备完成；下一闭环待确认：重建/分发新测试 Skill 并衔接保留的
Wallet/User Runtime，再独立批准新单开放和购买验收。
[实际证据及范围](../records/fresh-provider-qualified-admitted-2026-10-08.md)。


## Registry / Provider 接单合并入口 — 2026-10-08，待实际执行

用户批准本组。按 B2 的精确身份，通过 Provider 公开 status 核对登记和
fresh Quote，在现有私有 Anvil31337 为该 tuple 授予 Registry 资格并核对
回执/事件/链上及 Settlement 读回；只复制本人端点凭据到本人付费凭据文件，
切换独立 provider.env 为 admitted，重启 Provider 并最终核对。新单保持关闭。
不恢复旧声明/会话文件、不通过 Settlement 数据库进行 Provider 核对。
复用现有配置原子更新和失败回退模块；两份定向测试及入口语法检查通过。
用户要求部分完成必须明确报告：若资格已写入而本地准备失败，日志记录
交易哈希及配置状态，核对真实 health 后报告回退情况，不重复授予资格，
也不宣告整组成功。Registry grant 不因本地准备失败自动撤销。
本组尚未实际执行，尚无资格授予或本地 admitted 的成功证据。


## B2 服务登记及首次报价观察通过 — 2026-10-08

合并 preview/register/status 实际 ok=true：新服务档案登记成功，Quote target
active，Quote fresh，无观察错误。Registry 单独读回 not_qualified；Provider
仍 pre_admission，新单关闭。本地声明未改变，无重启、Order 或链写入。
正常公开 API/观察器写入服务档案、报价目标、报价和凭据使用审计。
下一闭环待确认：合并平台 Registry 授予资格与 Provider 本地接单准备/最终
核对，使用当前精确 skillId/profileHash/seller；包含链写入，仍保持新单关闭。
[实际结果与验收边界](../records/fresh-provider-service-registration-2026-10-08.md)。


## B2 合并执行入口准备完成 — 2026-10-08，待实际执行

用户批准继续并要求减少操作次数。现有 Provider CLI 的 preview → register →
status 合并为一次手动执行：先验证活跃凭据/规范档案/实时 402，再通过公开
Settlement API 登记服务档案及 Quote target，最后权威读回。登记具备既有
重试语义，不重做 B1；Quote 异步观察最多短等，未 fresh 或观察错误按实际
状态报告，不把登记成功等同于报价/Registry/接单成功。
Provider 命令以 uid1001 使用本人文件及公开 API；管理员仅注入独立 Provider
配置。保持 pre_admission 和新单关闭，不授予 Registry、不写链或重启进程。
两份执行适配脚本及 shell 语法检查通过，实际 B2 写入/验收尚未发生。
当前到 Provider 可接单剩两组合并操作：本组登记；后续 Registry 资格与本地
接单准备/最终核对（待本组结果及下一闭环确认）。


## B1.4 绑定后档案准备及重启通过 — 2026-10-08

实际 ok=true：skillId 保留，绑定身份派生 profileHash，报价种子随声明更新；
重复 prepare 结果稳定。服务状态 uid1001/0600。prepare 后重启 Provider，
health/pre_admission、绑定档案的 402 价格/Unix 秒有效期、403 未准入拒绝
及 B1 verified/active/ready 均通过。新单保持关闭，无 B2/Registry/Order 或链操作。
下一闭环待确认：B2 付费服务登记与公开权威状态读回；Quote 和 Registry 分别核对。
[实际结果与范围](../records/fresh-provider-bound-preparation-2026-10-08.md)。


## B1.4 绑定后档案准备 — 2026-10-08，待实际执行

用户已同意本闭环。执行入口先以普通 Provider 用户运行现有
`provider-runtime.mjs prepare`，保留 skillId、按已验证 Provider 身份派生
profileHash，并核对重复 prepare 的标识稳定性；成功后才通过
`deploy/agentpay restart provider` 重启。随后核对 health、绑定档案的
402 报价/价格/Unix 秒有效期、403 未准入拒绝以及 B1 ready。
使用 Provider 自有配置/文件与公开 API，新单保持关闭，不做 B2、Registry
或链上操作。脚本语法检查通过；实际执行及结果读回尚未完成。


## B1.3 新 Provider 绑定通过 — 2026-10-08

普通 Provider CLI 签发凭证、管理员仅重启 Provider 加载，再执行挑战/验证及
status 读回，实际 ok=true、verified/active/ready，三方记录一致。control-credential.token
与 binding.json 均为 uid1001/0600。正常 API 写入凭证/挑战/绑定/使用审计，
无链操作，Provider 仍 pre_admission，新单关闭。未登记付费服务或申请 Registry。

下一闭环待确认：显式 prepare 绑定后的服务档案再重启，核对保留 skillId、
规范 profileHash 和对应报价一致，然后才进入 B2。当前仍是绑定前临时档案，
不能直接登记；prepare 前不要重启已保存绑定的 Provider。
[实际结果与边界](../records/fresh-provider-binding-2026-10-08.md)。

## B1.0 private Provider startup passed — 2026-10-08

Provider now active/pre_admission: health, current 402 identity/expiry and 403
paid execution refusal passed; Settlement Orders remain closed. Account/B1/B2
not created. Effective Market email delivery is unconfigured with dev mode off;
normal registration waits for the User's delivery-mode choice. No Market config
change or chain write. Older stopped-state preparation below is historical.
[Actual result and registration dependency](../records/fresh-provider-startup-2026-10-08.md).

## Private fresh Provider local preparation completed — 2026-10-08

Exact old business references removed by the operator; Provider set pre_admission,
managed startup configured, Provider-owned 0600 local service state generated.
Temporary unbound profile only: no account/B1/B2/Registry/Order yet. Wallet and
chain preserved, Provider/Wallet/User stopped and new Orders closed.
[Actual local result](../records/fresh-provider-preparation-2026-10-08.md).


### Next execution sequence (pending)

1. Create/login to a new Market account; start Provider in `pre_admission` and complete B1 endpoint control/account binding.
2. Explicitly prepare again after binding, then restart and verify the bound profile. The current unbound profile must not be registered; skillId stays stable while profileHash/offerId follow the bound service declaration.
3. Complete B2 paid service registration and read back authoritative status through public APIs; verify Quote and Registry qualification separately before local admission.
4. Rebuild/publish/download the test Skill, reconnect User Runtime while retaining Wallet/Safe/Policy, then verify recovery and independent financial reconciliation before claiming end-to-end readiness.

Only local preparation is complete. Provider/Wallet/User remain stopped and new Orders remain closed; subsequent execution and opening admission require the agreed next loop. No old-data migration or compatibility mechanism is planned.

## Managed Provider startup source ready — 2026-10-08

The User approved exact obsolete test state cleanup and fresh registration.
Managed prepare/start now reuse B1/service identity, require explicit preparation,
filter inherited platform credentials, and preserve admitted binding/credential
checks. Eight focused tests passed. Protected configuration, exact cleanup and
local preparation have now completed (see the actual result above); fresh
account/B1/B2/Registry and paid startup remain pending.
[Implementation and boundaries](../records/managed-provider-startup-2026-10-08.md).

## Actual MySQL timezone matrix passed — 2026-10-08

The operator's temporary-table probe passed all 27 role/Node/SQL timezone
combinations. Fresh schema and storage/driver time checks are complete; admission
stays closed, applications stopped, chain/local state preserved. Next: compatible
public-API/service restoration and retained-reference handling, then recovery and
financial acceptance. This is not an end-to-end purchase or release gate.
[Actual SQL evidence](../records/time-sql-roundtrip-2026-10-08.md).

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

## Operator time inventory completed — 2026-10-08

All three existing databases were inspected read-only: Settlement 186, Market 37,
Provider 3 calendar fields; no matching epoch columns are deployed. No data/schema,
service or chain change occurred. Duration `_ms` fields retain their existing
semantics. Historical provenance, protected backup and coordinated rollout remain
open; current server UTC is not a historical conversion rule.
[Inventory and limitations](../records/time-storage-inventory-2026-10-08.md).

## Current timestamp source result — 2026-10-07

Execution SQL uses explicit millisecond columns; unknown history fails closed and stored output/claim/receipt identities remain intact.
The final nine-component matrix passed 1,242 checks across three timezones;
this repository's source is covered within the recorded scope. Running databases,
services and private financial acceptance have not migrated. Next is coordinated
historical inventory/manifest, protected backup and rollout; no participant
execution or release authorization is implied.
[Review and evidence boundaries](../records/participant-interface-time-review-2026-10-07.md).

Earlier timestamp “next” notes below are historical checkpoints.

## Identity/Market timestamp source checkpoint — 2026-10-07

Endpoint binding runtime now stores/checks integer challenge expiry and validates strict legacy adapters.
The six-component three-zone matrix passed 1,080 checks; no database or running
service was changed. The entire identity/Market stage remains open; participant
local recovery/display and coordinated migration follow.
[Scope and remaining work](../records/identity-market-time-source-2026-10-07.md).


## 时间迁移前次安排（历史）— 2026-10-07

Order/授权/划款/通知等消费者与滚动报价有源码证据；Provider 执行 SQL 和本地状态时间迁移未完成。
当前整体顺序是 Settlement 财务链、身份认证与 Market、参与者恢复/展示、
整体迁移验收；不再按单字段或单 worker 交接。

本仓库后续：参与者阶段完成执行/绑定/登记本地时间存储、旧数据/文件兼容和同调用结果复用；只通过公开 API 获取平台事实。
[本仓库待办](../TODO.md)。下方日期检查点中的 Next/下一步是当时安排，
不覆盖本节；源码/fixtures 通过不证明实际部署、恢复或真人演练通过。
本轮已修改源码并验证；永久存储和运行服务未切换。

## T2f Notice and delivery timestamps — source verified 2026-10-07

Versioned notice/confirmation/receipt timestamps and consumer adapters are
complete; 426 tests pass across three timezones, including real Wallet IPC.
No SQL migration, service restart or financial write.
[Evidence](../records/notice-delivery-timestamp-wire-2026-10-07.md). Next: financial clock validation/storage.

## T2e Service Authorization timestamps — source verified 2026-10-07

Issue/claim/decision have explicit versioned millisecond clocks, preserving
one-time authorization and bounded request identity. Three timezone matrix:
399 checks. No service deployment or financial database writes.
[Evidence](../records/service-authorization-timestamp-wire-2026-10-07.md). Next: notice/mutation timestamps, then financial SQL.

## T2d Order deadline timestamps — source verified 2026-10-07

Deadline disclosure v2 and its consumers are complete; existing per-Order policy
snapshots and chain seconds are preserved. Three-zone regression: 384 checks;
25 additional Order read/deadline/finalization checks. No deployment or financial
state writes. [Evidence](../records/order-deadline-timestamp-wire-2026-10-07.md). Authorization/notice time interfaces remain next.

## T2c Provider Order timestamps — source verified 2026-10-07

Provider Order v2 negotiation and strict consumer adaptation are complete.
Three-zone scoped HTTP/authentication regression passed: 30 tests. No deployment
or financial state mutation. Next: authorization/deadline timestamp interfaces.
[Evidence](../records/provider-order-timestamp-wire-2026-10-07.md).

## T2b finalization timestamps — source verified 2026-10-07

Public finalization v2 uses explicit epoch milliseconds with strict legacy
adaptation. Three timezone focused checks passed; no service deployment,
financial SQL migration or funded Order.
[Evidence](../records/finalization-time-ingress-2026-10-07.md). Other time loops remain open.

## Quote time boundary review — 2026-10-07

Protocol 0.7.0 timestamp source and affected consumers are verified within the
[recorded boundary](../records/quote-time-boundary-review-2026-10-07.md). No running service restart, schema migration
or paid Order. Other timestamp surfaces remain open.

## Quote automatic renewal — 2026-10-06, private verified

Rolling Quote TTL defaults to 600 seconds when no fixed cutoff is configured;
wire validUntil remains mandatory Unix seconds. Fixed AGENT_NATIVE_VALID_UNTIL
is never silently renewed; fixed and rolling settings are mutually exclusive.
Window/content-derived offerId survives retries and restarts. Focused quote
tests pass under three Node timezones. The User's host run verified fresh 402
quotes, renewal with new offerId, same-window identity after Provider restart,
and successful Settlement observation. See
[the scoped record](../records/provider-rolling-quote-2026-10-06.md).
Settlement timestamp correction and execution DATETIME/ISO metadata migration
remain open; no paid Order was performed.


## 最小交互版私有演练 — 2026-10-03

本轮最小交互版私有演练通过 Market 入口引导 Provider，实际 prepare、启动、绑定和登记仍由本人本机命令完成。B1/B2 源码已有基础；网页不能接收凭证明文或远程执行本机命令。本机状态与远端权威状态需明确交接，实际独立安装和恢复待验。沿用 Anvil，nginx 不上线。

本条是当前计划；下方历史 closeout 仅对应已结束的上一轮后端演练。

## Provider preparation and Quote recovery — 2026-10-03

本轮五项定向测试通过（含真实本地 CLI 子进程与临时文件）；未启动服务或连接数据库。

Source adds service prepare with protected per-service state: stable skillId, offerId retained on identical retries and renewed for changed requirements, automatic temporary/verified profile hashes. Start rejects unprepared drift; status remains available for recovery. Settlement observation errors are shown with recovery actions. No platform reads outside public APIs, no deployment or business-state writes. **[待演练 B2]** First install, B1 preparation/restart, changed pricing and real error recovery remain pending.

## Source review corrections — 2026-10-02

Expired offers no longer block login/binding/service status recovery, and old
bootstrap hashes do not block B1 commands. Credential-bearing API calls reject
redirects. Binding writes now hold an exclusive file lock, so concurrent endpoint
saves fail explicitly for retry instead of overwriting a sibling record. Focused
tests and syntax/diff checks pass. Standalone declaration preparation is still
cumbersome; bootstrap profileHash and skill/offer identities need a separate
preparation entry. **[待演练 B1/B2]** operational verification remains deferred.

## Standalone Provider host source entry — 2026-10-02

`provider-host.mjs` loads an owner-held config with a Provider-only allowlist,
prechecks endpoints/offer expiry, launches the foreground server and delegates
login/binding/service commands without inheriting platform credentials.
Verified identity derives the canonical profile hash; admitted startup checks
control/paid token consistency. Installation and user systemd instructions are
local to this repo. Focused tests pass; **[待演练 B2]** actual installation,
database initialization, restart and supervisor operation remain open.

## B2 separate status and local preparation guidance — 2026-10-02

Provider status now displays independent Registry/Quote results from the
authorized Settlement service read. Loopback health must match the service ID
and payment route before reporting local admission. Registry outage and local
unavailability remain unknown; nextActions preserves independent work items.
Status can inspect remote state without a successful live 402, while registration
still verifies the 402 identity. Focused tests pass. **[待演练 B2]** Real API,
Registry outage, Quote expiry and process mode/restart remain deferred.

## B2 service onboarding first source loop — 2026-09-30

`scripts/provider-service.mjs preview|register|status` now checks the canonical
profile, endpoint binding, active credential and live 402 identity. It submits
the existing idempotent registration API and reads the endpoint-scoped profile
plus public readiness. Types 0.6.0 uses the same archived artifact as Settlement.
Provider 5 focused tests and Settlement 4 registration/read tests passed with
temporary files and fixtures. Complete qualification/Quote breakdown and local
admission preparation remain open. **[待演练 B1/B2]** Real process/API operations
are deferred until the User has suitable conditions; no private service writes.

## B1 account-to-server binding source loop — 2026-09-29

Provider-only commands now log in to Market without printing secrets, query
the account's exact endpoint binding and Settlement credential, prove local
credential possession, issue once, resume a challenge after restart, restore
verified local state, and explicitly reissue/rotate/recover lost or revoked credentials. The
per-endpoint binding state is saved atomically and preserves sibling services.
Focused tests use in-memory API responses and temporary Provider files; the
private services and MySQL were not changed. This is B1 source completion,
not independent-host deployment or completion of service registration.

## Current onboarding documentation — 2026-09-28

External Providers can access this repository, not the platform root. The
[Provider onboarding guide](../runbooks/provider-onboarding.md) and
[Skill publishing guide](../runbooks/skill-publishing.md) are now local to
this repository. README and usage link to them without requiring a root checkout.
The guided private rehearsal completed Provider admission, random Skill
publication and paid execution; external installation, credential recovery and
public API orchestration still need program work. The Wallet error fallback was
fixed/tested in source separately; the random script's short key validation
mismatch is deferred to a future package version. No program was changed in
this documentation loop.

Older sections below are internal development history. Evidence stored in
other repositories is not distributed with this repository.


## Separate service registration — 2026-09-27 source ready

The private Provider service declaration now uses the verified Provider ID and
canonical profile hash after an operator-approved preparation/restart. Its
running 402 was checked. A Provider-role CLI now previews or submits the
service registration to Settlement using only its own binding and M2M
Credential. Protected preview passed, execute returned HTTP `201` with
`created: true`, and independent Settlement read-back verified the canonical
profile and active target. Endpoint verification was not repeated.

## Approved Model Update — 2026-09-26, Implementation Pending

The User approved independent Provider trading admission and Skills authored
by Providers or third parties, with optional zero/multiple Provider references.
The single-service publication-first C6 flow below is historical/current code
behavior, not acceptance of the expanded model. Rehearsal is held before
publication while the two implementation loops are reviewed.

## Provider role correction — source and host migration verified

Current rehearsal has a logged-in Market account and verified Provider binding;
publication stopped on a stale configured Provider ID. The approved correction
separates Provider configuration from platform services and derives Skill
identity from persisted verified binding. 15 focused tests pass; existing-host migration passed; publication is held for the approved model update. No
Registry, Quote, Policy or Order writes were made for this correction.
Scope and verification. Earlier starting-state reports below are dated.

## Past

- The self-operated `mcp+agent` runtime and reference Skills exist.
- The legacy signed-Ticket execution path validates request binding and returns
  private output directly.

## Historical C6 current-state snapshot (superseded by closeout above)

After the approved 2026-09-26 private reset, the persistent Provider is
running in `pre_admission`. A fresh read-only gate verified native HTTP 402,
refusal of paid execution, and zero Provider/Gateway credentials, Registry
qualification, Quote, execution or Order. The pre-reset admitted state and
purchase evidence below are historical. Startup initially failed because the
binding runtime required a not-yet-issued credential file; it now permits a
missing file only in `pre_admission`, with a focused test and a healthy
persistent process. See the reset handoff.

Current phase: **pre-M8 remediation and acceptance; participant admission held**.
Provider admission and the installed-Skill development journeys are complete.
The historical `admitted` result below is a dated checkpoint. The pre-reset review
identified A2 bounded network-wait work shared with User and Wallet. The
Provider-to-Settlement request now has a 30-second default deadline for
headers and body; stalled-peer tests pass. The corrected Provider process also
passed one existing-stack paid Order, same-key User replay and exact terminal
release verification. Durable claim, execution and Receipt identities are
unchanged.
Operator handoff,
protected backup/reset and human repetition remain open.
The current admitted Provider process completed a private C6 installed-Skill
refusal: its built-in reject mode returned an explicit refusal, Settlement
refunded the funded Order in full, and the original Provider unit was restored
healthy with no runtime override remaining. This is development evidence,
not a participant exercise or refund crash-recovery proof.
The built-in `silence` mode then left a funded installed-Skill Order with
no Provider decision, and Settlement's permissionless timeout worker refunded
the full amount only after the Vault deadline. The Provider unit was again
restored healthy with no override. This tests business non-response, not an
indefinitely hung network connection or a process-crash refund recovery.
C6 Stage 2 now proves the real Provider process can start in native
`pre_admission` without credentials, serve its actual HTTP `402`, deny payment
and execution, keep Registry/credential/Quote/Order/execution state empty, and
repeat the gate after systemd restart.
Native Gateway M2M reuse now passes focused and isolated-MySQL tests, and the
formal Gateway rejects a foreign Order with the repaired active Provider
credential. Positive admitted-Provider/Order execution and commercial admission
subsequently passed; human rehearsal remains held.
The C6 Stage 3B gate now passes against the running Provider:
pending credential authorization, scoped endpoint response, and verified
Market binding. The provisional rehearsal `providerId` was aligned and the
versioned Skill published. The Provider ran `pre_admission` at that checkpoint;
Registry qualification and Quote admission later passed.
C1, C2 and C5 support is complete: real Provider offer changes, stable
execution/Receipt replay, altered-result rejection, Provider crash recovery,
and rejection/silence/outage passed on the current process path. Exact
accepted-claim replay after authorization expiry remains recoverable; a
separate never-claimed expired authorization was rejected. C5 evidence.
The earlier private readiness review defined C1–C6;
historical M7 results below do not close these findings.

The native Wallet-readiness, Provider Order read, service authorization, and
Provider Account–Server Binding boundaries are now proven through Settlement's
formal runtime. The native Provider implements real execution and durable
Receipts alongside the retained legacy Ticket compatibility path. It consumes
Protocol's shared private-request hash. A test-only loopback Provider simulator proves the
pre-Order native service behavior: the real service route returns the strict
HTTP `402` price requirement without authorization and a random-number result
when authorized. It is a conformance fixture, not a production authentication
shortcut.

## Completed Owned Major Milestone M7

M6 is complete and M7/F1 now assigns the installed random Skill to the sibling
open `user` runtime and the supplier-operated Provider server to this
repository. The participant contract and execution states are frozen.

M7/F2 is complete: the formal Provider path returns its real HTTP 402, lets
Settlement observe an immutable Quote, submits the Wallet payment payload with
the separate Gateway credential used at that historical milestone, claims and accepts Service Authorization,
executes a random result, persists its hash, and submits Receipt Metadata. The
real multi-process run reached a Released Vault.
Current C6 code removes that second native credential dependency: after
admission, the Provider uses its verified M2M Credential for native Gateway
payment and online service calls. Focused Gateway and temporary-MySQL checks
pass, as do the subsequent positive process/restart proof
and installed-Skill purchase. These remain development evidence.

M7/F3 is complete: the Provider was terminated after claim, acceptance,
completed-result persistence, and Settlement Receipt acceptance. Each restart
resumed one durable execution with the same claim, random result, output hash,
and Receipt, then reached Wallet-confirmed release. The proof also corrected a
MySQL `DATETIME` timezone mismatch in Provider transition timestamps.

M7/F4 is complete. The Provider and Settlement real HTTP path rejects
over-usage, conflicting requests/claims/Receipts, and expired authorization;
exact claim and Receipt replay remain idempotent. Isolated Provider rejection,
silence, and outage runs fail closed with no Receipt or seller release, using
refund only after the applicable frozen Order deadline. F5 persistent service
packaging now runs the Provider as a persistent loopback-only service and
survives whole-stack and independent-chain restart. F5-D completed a deployed
random-Skill transaction through release with exact frozen-Quote billing. M7 is
complete within the historical evidence scope; pre-M8 remediation and backend
acceptance must now close before participant rehearsal.

## 完整 Skill 包首个闭环 — 2026-09-27

用户批准完整包结构与执行方式。Provider 源码已增加包含说明、公开配置和调用脚本的
确定性归档；User 新增不依赖 Market 的预览与确认安装入口，保留本地修改和原始来源。
详见当前格式、限制及验收。
当前 Provider 重启／直接下载待用户执行；User 实际安装与付款、Market 新包发布适配
未完成。现有服务档案、Registry、Quote、Policy 和 Order 状态未由本次测试修改。

## Provider 完整包直接下载已验证 — 2026-09-27

用户执行重启／下载成功：压缩包 2526 字节，包含 SKILL.md、agentpay.json 和
scripts/random.mjs；独立读回文件验证摘要一致，Provider 保持 admitted。
SHA-256：f8b0a5b825c4f57a89b59be19b625b2e4c71e70e7398d7f5bade6c7dee933599。
未访问 Market，未安装或购买。Provider 包准备及直接下载闭环完成。
下一步按约定准备 Market 完整包发布／镜像／下载；现有 JSON 镜像不能视为已支持新包。
