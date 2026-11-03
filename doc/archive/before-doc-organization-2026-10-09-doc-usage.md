> Historical operational text captured 2026-10-09. Use current usage and progress before any operation; this is not authorization to replay commands.

# Agent Usage

This file documents private-host operation and focused development. An
external Provider should begin with [Provider onboarding](../runbooks/provider-onboarding.md).
The independent B1 source commands are `scripts/provider-market-login.mjs`
and `scripts/provider-bind.mjs`; the guide lists their configuration, status,
resume, reissue and rotation behavior. They do not use the private rehearsal
administrator scripts or Settlement database/files.
The `deploy/agentpay rehearsal ...` commands below belong to a platform
administrator in a joint development checkout; they are not Provider commands.

For focused local development, configure the service and Settlement loopback URL, then run:

```bash
npm install
npm start
```

Configuration names and endpoint examples remain in [README](../../README.md).
Do not treat the legacy Ticket example as the final native rehearsal flow.

For the private C6 Stage 2 entry, use the root
`deploy/agentpay rehearsal provider-declare`, `provider-mysql`,
`provider-start`, and `provider-check` after Settlement Stage 1 passes.
`AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE=pre_admission` allows the real
Provider server to expose its native HTTP `402` without any Provider/Gateway
credential file; all payment and Service Authorization attempts return
`403 PROVIDER_NOT_ADMITTED`. This is a visible deployment checkpoint, not
permission to take Orders. Market-first onboarding and admission are separate
Later binding and admission stages are separate and were exercised privately.

The Provider service loads `/etc/agentpay/provider.env`; database, Settlement
and Market platform services may share `/etc/agentpay/agentpay.env`. Provider
configuration contains its own database connection, public offer and Settlement
client address, never platform database or signing credentials.

After successful binding, onboarding saves the verified Provider ID, Credential
ID and endpoint in `/var/lib/agentpay/provider/binding.json` (mode `0600`, owned
by the Provider runtime user). `AGENT_PROVIDER_BINDING_STATE_FILE` selects this
file. Multiple verified endpoints are stored separately. Credential plaintext
remains in its separate Provider-owned protected file.
The configured `AGENT_PROVIDER_BINDING_CREDENTIAL_FILE` is
`/var/lib/agentpay/provider/control-credential.token` (0600). It is
usable for endpoint control and service registration after the Settlement M2M
Credential becomes active, even when paid execution is still fenced by
`pre_admission`. The separate `/var/lib/agentpay/provider/provider.token` copy is
prepared when enabling local paid execution. The current private host has
completed its path migration.

For the random service, `GET /services/:serviceId/agentpay/skill-package` reads
that service's binding each time. Before binding it returns `409
PROVIDER_NOT_BOUND`; corrupt state returns `503 PROVIDER_BINDING_STATE_INVALID`.
After binding it returns the declarative package, with no price, Quote or
credential. `AGENT_NATIVE_PROVIDER_ID` and `AGENTPAY_REHEARSAL_PROVIDER_ID` no
longer supply identity. This local state records onboarding; Settlement still
checks live credentials and service authorization on paid requests.

Provider credentials remain separate from Settlement platform credentials.

After Provider service preparation, the supplier-side
`scripts/register-service.mjs --preview|--execute` checks its own live 402 and
verified binding, then uses its M2M Credential to register the paid service
with Settlement. The private rehearsal launches this CLI as the ordinary
Provider runtime user through `deploy/agentpay rehearsal provider-service-register`.
Preview does not write. Execute registers a service profile and Quote target;
it does not grant Registry qualification or admit paid execution. A failed
registration can be retried without repeating endpoint control verification.

## 完整随机数 Skill 目录包（2026-09-27，源码已实现）

Provider 新下载地址为 `/services/:serviceId/agentpay/skill-bundle.tar.gz`，
旧 `/skill-package` 返回的 JSON 只是兼容配置。新包包含 SKILL.md、agentpay.json
和 scripts/random.mjs。直接安装无需 Market，具体
[Provider 接入与 Skill 发布](../runbooks/provider-onboarding.md)包含限制和部署状态。

```bash
node user/scripts/install-skill-bundle.mjs --preview DATA PROVIDER_BUNDLE_URL EXPECTED_SHA256
node user/scripts/install-skill-bundle.mjs --execute DATA PROVIDER_BUNDLE_URL EXPECTED_SHA256
```

DATA 是已建立的用户私有数据目录。执行命令在普通用户交互终端运行，
确认摘要后只安装文件。源码包没有凭证或安装钩子。安装不会配置或重启 Runtime，
不会建立 Policy，也不自动购买。展开目录中的 SKILL.md 说明 `--check` 和 `--invoke`；
后者必须在 User 准备完成后使用，重试沿用同一请求标识。

## 托管原生随机数服务的自动身份入口

当服务管理器已注入 Provider 自己的配置时，可运行：

```bash
node scripts/provider-runtime.mjs prepare
node scripts/provider-runtime.mjs start
```

这是现有 B1/服务状态流程的托管启动入口，仅支持当前原生随机数示例。
prepare 只保存本地 skillId/offerId 和声明校验状态；未绑定阶段的 profileHash
是临时值，不用于正式登记。B1 验证成功后重新 prepare，再启动并执行 B2。
start 不生成或覆盖身份；声明变化时拒绝启动并提示重新准备。

配置必须包含服务状态路径、本人持有的 Market 会话/绑定/控制凭证文件路径
及 Provider 自己的数据库配置。控制凭证由 B1 保存到持久化私有文件；接单
准备时把同一有效凭证保存到配置的付费凭证文件，两者均由 Provider 持有，
权限 0600 或更严。不能继续用旧 staging 覆盖新凭证。admitted 启动检查
绑定和两份凭证的一致性；服务管理器不能自行绕过独立登记/资格步骤。

普通 Provider 自备配置时继续使用 provider-host.mjs CONFIG；无需读取平台
的文件或数据库。[实现和证据边界](../records/managed-provider-startup-2026-10-08.md)。
