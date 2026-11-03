# Agent Architecture

## Quote clock

`native-provider-quote.mjs` owns fixed versus rolling Quote lifetime. Wire expiry
is mandatory Unix seconds. Rolling mode derives immutable offerId from the saved
seed, exact declaration/prices and validity window, surviving restarts. A fixed
cutoff is not extended. Execution and local metadata use the reviewed epoch-storage path; historical migration schedules are retained only as evidence. Current verification scope is in progress.

## Standalone service declaration state

provider-service-state.mjs stores one service identity in an owner-held file, with an exclusive lock and atomic rename. Signature includes endpoint, canonical profile hash and Quote fields. prepare preserves skillId and renews offerId on changes; startup reads and verifies state without writes. Host computes a local temporary profile before B1 and canonical profile after binding. This is a reference implementation, not a required external Provider generation algorithm.

The Provider runtime hosts service implementations under `src/services/` and
exposes health, price discovery, invocation, and execution HTTP boundaries. It
owns supplier-side private execution and receipt submission. The installed
user-side Skill lives in sibling `user`. Settlement owns commercial
facts and order authorization; Wallet owns the user Session Key; Protocol owns
canonical payment structures.

The native target flow is User Runtime -> local Skill -> Provider server, with the
provider server checking Settlement online before serving. The Agent must not
become a generic signer, wallet, payment router, or quality judge.

## Core Modules

- `src/native-provider-runtime.mjs`: current native 402 discovery, Gateway
  payment forwarding, online claim/decision/Receipt and MySQL execution state.
  It receives application validation/execution/recovery hooks; random behavior is
  in `src/services/random-native.mjs`. `src/native-application.mjs` checks actual
  usage and existing JSON evidence. The legacy dispatcher is a separate path.

- `src/index.mjs`: process entry and HTTP listener.
- `src/provider-binding-runtime.mjs`: credential-authenticated challenge
  authorization and scoped endpoint-control response.
- `src/service-reference.mjs`: registered public identity and common transport;
  independent of business and example ZIP generation.
- `src/runtime-config.mjs`: validated environment-to-runtime configuration.
- `src/service-runtime.mjs`: legacy business dispatch; unknown kinds fail explicitly.
- `src/services/random.mjs` and `serper-search.mjs`: reference Skill adapters.
- `scripts/agentpay-provider-simulator.mjs`: test-only loopback Provider used
  to prove the native real-route HTTP `402` requirement and authorized random
  result; it is not mounted by `src/index.mjs`.

`src/provider-binding-state.mjs` reads the service endpoint's verified local
binding for Skill package generation and atomically saves verified records per
endpoint. `src/provider-binding-client.mjs` joins the Provider's own Market
account, Settlement self-check and local credential without platform SQL or
files; `scripts/provider-bind.mjs` exposes explicit status, issue, resume,
reissue, recovery and rotation actions. Missing onboarding state does not fall
back to an environment-supplied Provider ID. Credentials remain separate;
online paid-request authorization continues to be enforced by Settlement.
The canonical private deployment loads `/etc/agentpay/provider.env`, stores
the verified binding under `/var/lib/agentpay/provider`, and stages its
control Credential at `/run/agentpay/provider/control-credential.token`.
After commercial admission, a separate `provider.token` copy is staged in
the same runtime directory for paid operations.

## 完整随机数包组件

Provider 的 `src/random-skill-bundle.mjs` 将 `skills/random/` 的说明和脚本
与真实绑定产生的 manifest 生成确定性受限 ZIP（随机数压缩包版本 1.0.1，service 声明版本仍为 1.0.0）；原 JSON 路由保持兼容。
User 的 `src/skill-bundle.mjs` 校验并保存完整包，`scripts/install-skill-bundle.mjs`
提供不依赖 Market 的交互入口。安装不执行代码或切换当前 Runtime；包内脚本
核对 Runtime 服务引用后调用原有认证接口。

## 托管 Provider 身份准备与启动入口

scripts/provider-runtime.mjs 读取已由服务管理器注入的 Provider 专属环境，调用
src/provider-runtime-environment.mjs。该模块复用 provider-host-config 的白名单
校验、provider-binding-state 的端点绑定选择和 provider-service-state 的
prepare/load，再将确定的身份传给原有 src/index.mjs 子进程。prepare 不进行
远程注册；start 不隐式生成/改写身份。admitted 校验保留 B1 绑定及本人凭证
一致性，业务请求仍走既有 Settlement 服务授权。该入口仅服务当前原生随机数
示例；独立配置文件 CLI 仍是 provider-host.mjs。

## Installation and connection boundaries

- `provider-install.mjs` and `local-random-server.mjs`: local generation smoke-test,
  owner-only `installation.env`, loopback local generation with no paid routes; foreground and owned Linux background operation.
- `provider-setup.mjs` and `provider-connection-config.mjs`: separate connection-only
  config and resumable public-input draft; SQL and process fields are rejected.
- `provider-onboarding.mjs`: API session, B1, live 402 canonical-profile validation,
  B2 and Registry/Quote checks. It neither generates implementation IDs nor writes
  admission mode, starts processes or inspects SQL.
- `provider-binding-runtime.mjs`: application-owned control challenge and protected
  loaded-credential status. Reference runtime facts are not universal platform rules.
- Existing `provider-host.mjs`, `provider-runtime-environment.mjs` and native runtime:
  application-specific paid execution, private MySQL, identity preparation and
  process startup. These retain existing operator behavior separately from the guide.

`provider-installation.mjs` owns the reference runtime handoff: its private SQL
settings, stable identity preparation, credential loading and process reload.
`provider-installation-config.mjs` contains only local service name/port validation.
`provider-reference-handoff.mjs` formats a command; it cannot run the application.
The optional connection reference file stores only the installation path.

The local server is replaced by the existing native runtime after application
configuration, so the unpaid installation route is absent in paid mode. Generic
connection uses live protocol declarations and authoritative API checks. Neither
flow reads platform files or platform SQL. Real SQL/Registry/human acceptance remains open.

## Installation storage prerequisite correction — 2026-10-09

`provider-storage.mjs` owns private storage configuration, resumable non-secret
answers and the existing native execution-schema initialization. Installation
startup opens this storage before serving locally; health reports storage readiness.
The installation guide requires both storage readiness and generation success.
The connection application command loads already-installed storage and cannot
collect SQL inputs or initialize a missing installation. Native paid durability
and schema definitions remain unchanged. No platform SQL is read.
