> Historical snapshot, captured 2026-10-09 before documentation organization.
> Statements of "current", pending tasks and commands describe earlier checkpoints.
> Use the repository README, progress and TODO for current scope. This is not an execution runbook.

# agent

[Current private loop: passed](../records/fresh-purchase-terminal-2026-10-09.md) — fresh
Provider/Skill connection, one paid purchase, same-key User restart recovery and
terminal funds reconciled. Settlement Orders are open; public release is not
qualified. Earlier dated checkpoints below describe their historical states.


[新 Provider 接入准备已通过](../records/fresh-provider-qualified-admitted-2026-10-08.md)：账号/B1/B2、Registry 资格及本地 admitted 已完成，新单关闭；新 Skill 分发与购买验收待执行。

[Managed native Provider preparation/startup](../records/managed-provider-startup-2026-10-08.md): source verified; private configuration execution pending.

[Actual MySQL timezone matrix passed](../records/time-sql-roundtrip-2026-10-08.md);
service restoration and end-to-end acceptance remain open.

[Verified fresh timestamp schemas](../records/time-schema-initialized-2026-10-08.md):
SQL initialized; real timezone matrix and service/state restoration remain pending.

[Database reset result and schema initialization](../records/time-database-reset-and-schema-init-2026-10-08.md).

[Completed read-only time inventory](../records/time-storage-inventory-2026-10-08.md):
legacy structure confirmed; historical conversion and runtime migration are pending.

[Current timestamp source review](../records/participant-interface-time-review-2026-10-07.md):
source tests pass; coordinated database migration and runtime acceptance are pending.

[Identity/Market timestamp source checkpoint](../records/identity-market-time-source-2026-10-07.md) — source verified; coordinated migration remains pending.


[Current timestamp source review](../records/quote-time-boundary-review-2026-10-07.md) — verified source scope and
remaining storage/API/deployment gates.


Provider server for developers who run paid services.

## Installation and first use

[Rolling Quote operation and private verification](../records/provider-rolling-quote-2026-10-06.md)

[Configure rolling Quotes](../runbooks/rolling-quotes.md)

[Provider onboarding](../runbooks/provider-onboarding.md) · [Private operation](../usage.md) · [Service development](../develope.md)

Standalone source entry: `npm ci`, then
`node scripts/provider-host.mjs /absolute/provider.env service prepare`，然后 `check|start`。
Copy `config/provider.example.env` into a private owner-held file first;
the guide covers binding, service registration and user-level process supervision.
Actual independent-host installation remains **[待演练 B2]**.

Current implementation supports a completed private Anvil rehearsal. The
role-specific guide states which steps are runnable today and which require
release work. [Progress](../../progress.md) records the current status.


Provider admission is independent of Skill publication. A publisher can be
another person or team. The current executable package covers one random
service; multi-service and third-party publication remain future work.

`agent` is the supplier-operated Provider server. Its native random service
returns price requirements, forwards payment to Settlement, checks online
Service Authorization, and durably stores execution/result/Receipt state.
The downloaded Skill runs separately in `user`; Wallet owns the Session Key.

It has no custody or signing authority and does not decide payout policy.
Forwarding a Wallet payment envelope does not grant it the User's Session Key.

## Documentation

- [Progress](../../progress.md)
- [Architecture](../architecture.md)
- [Design](../design.md)
- [Usage](../usage.md)
- [Developer guide](../develope.md)
- [TODO](../TODO.md)
- [Skill publishing boundary](../runbooks/skill-publishing.md)

## Native operation entry

Start with [Provider onboarding](../runbooks/provider-onboarding.md) and [usage](../usage.md).
The private profile starts this server in `pre_admission`, completes
Settlement-backed Account–Server Binding through Market, then checks Registry
qualification and the observed Quote before admitting service. These steps and installed-Skill purchases were completed in the guided private
rehearsal. The [current progress](../../progress.md) records the tested scope.
The B1 account-to-server binding source commands are in
`scripts/provider-market-login.mjs` and `scripts/provider-bind.mjs`; see the
[Provider guide](../runbooks/provider-onboarding.md). They have local focused
tests but are not yet deployed or accepted on an independent Provider host.
Service registration and later admission remain separate stages.

Native routes are `POST /services/:serviceId/agentpay/invoke` and
`GET /services/:serviceId/agentpay/skill-package`. The first returns the
Provider-owned `agentpay.service-payment-required.v1` HTTP 402, accepts the
unchanged Wallet payment envelope, or executes with Service Authorization.
The legacy package route serves the declarative manifest. The additional
`GET /services/:serviceId/agentpay/skill-bundle.tar.gz` route serves a complete archive
with `SKILL.md`, manifest and the random invocation script. Market mirrors the
archive; User installation does not automatically execute its code.

Enable native mode with `AGENTPAY_NATIVE_PROVIDER_ENABLED=true`. Configure
`AGENTPAY_NATIVE_PROVIDER_ADMISSION_STATE`, the `AGENT_NATIVE_*` public offer,
`AGENT_PROVIDER_DB_*` persistence and, after binding,
`AGENT_PROVIDER_BINDING_CREDENTIAL_FILE` for endpoint control and service
registration. Commercial admission separately stages
`AGENT_PROVIDER_CREDENTIAL_FILE` for paid runtime operations. The staged deploy
commands prepare these values. The Provider M2M Credential is reused for native
Gateway requests; legacy Ticket signer keys are not a native requirement.

## Current Compatibility Boundary

This repository implements the native Provider-server path and still retains
the **legacy Execution Ticket boundary** for regression and migration. The two
paths are explicitly separate; new AgentPay work uses Settlement's online
Service Authorization rather than an Execution Ticket.

The current `GET /services/:serviceId/mcp/_agentpay_challenge` endpoint belongs
to the retired Market-owned ownership-token flow and remains only for legacy
regression until its consumers are removed. It must not become the native
verification API. The Provider server now completes Settlement's one-time
Endpoint Control Challenge through the scoped
`/.well-known/agentpay/provider-binding/<challengeId>` path using its Provider
M2M Credential; the plaintext credential remains on this server. The private
The private endpoint challenge was verified in the rehearsal.
Standard x402 `/verify` is unrelated.
For native AgentPay payment, the admitted Provider server now reuses this
verified M2M Credential at Settlement's Gateway; it does not need a second
Gateway credential. The rehearsal also covered restart recovery and installed-Skill purchase.

Legacy signer policy for this closed repo:

- paid execution requires a Settlement-signed, user-carried execution ticket;
- `agent` does not configure or own Wallet, Session Key, Safe Module,
  Settlement signer, Authority executor, relayer, or facilitator credentials;
- provider metadata is declarative; Settlement resolves commercial service,
  seller, and pricing facts, while the independent Registry supplies
  qualification;
- avoid behavior that accepts caller-supplied trust or money fields; and
- private request/output stays between the caller and Skill runtime.

## Current Legacy Skill Developer Workflow

A Skill developer uses the old Market endpoint/Seller proof, publishes a
versioned profile, deploys this runtime, and configures the
trusted Settlement ticket keys. Per order, the runtime verifies ticket key ID,
signature, service/order/Vault bindings, request hash, expiry, usage cap, and
one-time claim before execution. It returns private output directly and submits
only `outputHash` and `usageUnits` to Settlement.

The developer never handles user Session Keys, Safe policies, x402
commitments, facilitator credentials, or Vault funding. Publishing a newly
Registry-qualified Skill makes it automatically eligible for policies that
authorize AgentPay's dynamic Registry list. Qualification comes from the
independent public Registry, not self-declared runtime metadata or Settlement
commercial admission, and it does not guarantee Skill quality.

Legacy service modules:

- `random`: random-number reference service
- `serper`: paid web search service backed by Serper

The M7 random participant contract is owned by the open sibling User Runtime:
[random Skill package](../../skills/random/SKILL.md).
For C6 Stage 2, the Provider server supports a native `pre_admission` state:
it can start with its own execution database and return the declared native
`402` before any Provider credential is issued, but rejects payment and
Service Authorization requests with `403 PROVIDER_NOT_ADMITTED`. The
private Stage 2 record
shows this across process restart. This does not qualify the Skill, admit a
Quote, or prove Provider account binding.

## Legacy Config Model

The historical integrated host deployment injected runtime values from
`/etc/agentpay/agentpay.env` through `deploy/agentpay`. The current Provider
service instead loads only `/etc/agentpay/provider.env`; use
[Provider usage](../usage.md) for current operation.

Required env:

- `SETTLEMENT_BASE_URL`
- `AGENT_PROD_SERVICE_ID`
- `AGENT_PROD_KIND` (`random` or `serper`)
- `AGENT_PROD_PORT`
- `AGENT_PROD_MCP_SAFE`
- `AGENT_TRUSTED_SETTLEMENT_SIGNERS`

Common optional env:

- `SETTLEMENT_ASSET`
- `SETTLEMENT_TOKEN_ADDRESS`
- `AGENT_PROD_NAME`
- `AGENT_PROD_PROVIDER`
- `AGENT_PROD_TOKEN`
- `AGENT_PROD_METADATA`
- `AGENT_PROD_ENDPOINT_URN`
- `AGENT_PROD_PRICE_BASE`
- `AGENT_PROD_PRICE_USAGE_PER_UNIT`
- `AGENT_PROD_PRICE_HIGH_PRIORITY_SURCHARGE`
- `AGENT_SUPPORTED_SETTLEMENTS`
- `AGENT_SERPER_API_KEY`
- `SERPER_API_KEY`
- `AGENT_SERPER_RESULT_COUNT`
- `AGENT_SERPER_MAX_RESULT_COUNT`

## Legacy Endpoints

- `GET /health`
- `POST /run`
- `POST /services/:serviceId/mcp/invoke`
- `POST /services/:serviceId/mcp/execute`
- `GET /services/:serviceId/mcp/provider-profile`
- `GET /services/:serviceId/mcp/_agentpay_challenge`

Legacy MCP payment tools are removed from this runtime. `order.*`,
`quote.get`, `delegation.*`, `payment.*`, and `result.get` are not supported.

## /run Behavior

`POST /run` validates the requested service input and returns a
`settlementIntent`. It does not execute paid service work or ask a user wallet
to sign a per-order transaction.

The legacy caller receives a signed Execution Ticket after the old Settlement
flow and carries it with the private request to
`/services/:serviceId/mcp/execute`. Native AgentPay does not issue this Ticket:
Wallet receives a one-time Service Authorization after verified Vault funding,
the local Skill forwards it with the private request, and the Provider server
claims it online from Settlement. M7 proved that native path through success,
restart recovery, negative cases, and the persistent deployment.

Agent pricing metadata is a provider declaration only. Payable unit price,
fees, token, endpoint, and seller/payout identity come from Settlement
commercial policy; Skill qualification comes from the independent Registry.
Legacy `mcpSafe` metadata is not a payment authority.

## Legacy Ticket Execution

`POST /services/:serviceId/mcp/execute` is the user-carried ticket execution
endpoint.

```json
{
  "ticket": {},
  "ticketSignature": "0x...",
  "request": {}
}
```

The agent verifies the ticket signature against
`AGENT_TRUSTED_SETTLEMENT_SIGNERS` and checks that
`sha256(stableJson(request))` matches `ticket.requestHash`.

The runtime sends only `outputHash` and `usageUnits` back to Settlement; business
request and output payload stay between the user and agent.

Current limitations:

- used ticket nonces are process-local
- receipt retry behavior should be hardened before multi-instance production use
- settlement finality must be read from settlement deal/job status

## Legacy Local Example

```bash
cd agent
SETTLEMENT_BASE_URL=http://127.0.0.1:6472 \
AGENT_PROD_SERVICE_ID=service.agentpay.random-prod \
AGENT_PROD_KIND=random \
AGENT_PROD_PORT=6471 \
AGENT_PROD_MCP_SAFE=0x2000000000000000000000000000000000000002 \
AGENT_TRUSTED_SETTLEMENT_SIGNERS=0x... \
npm start
```

## Persistent Service Entry

For integrated deployments, prefer the centralized deploy installer:

```bash
cd /home/workspace/agentpay
deploy/agentpay status
```

Follow the staged [usage](../usage.md) to start the current
`agentpay-provider.service`. This repo also keeps a legacy standalone template:

- [`deploy/systemd/agent.service.example`](../../deploy/systemd/agent.service.example)

## Smoke

```bash
cd agent
AGENT_SMOKE_USER_SAFE=0x... npm run smoke
```

Optional:

- `AGENT_PROD_BASE_URL`

## Notes

- payment, trust, provider policy, x402 order, and Vault finalization are
  Settlement responsibilities
- adding a new module should only require a new file under `src/services/`
- legacy regression work covers wrong signer, wrong service, expired/duplicate
  Ticket, and request-hash mismatch; native work follows `doc/TODO.md`
- implementation work is tracked in [TODO.md](../TODO.md)

## Secrets

- Do not commit real runtime env, API keys, private keys, or generated key material.
- If a token or private key was ever committed or pushed, rotate it immediately.

- [Finalization timestamp source evidence](../records/finalization-time-ingress-2026-10-07.md).

- [Provider Order timestamp source evidence](../records/provider-order-timestamp-wire-2026-10-07.md).

- [Order deadline timestamp source evidence](../records/order-deadline-timestamp-wire-2026-10-07.md).

- [Service Authorization timestamp source evidence](../records/service-authorization-timestamp-wire-2026-10-07.md).

- [Notice and delivery timestamp source evidence](../records/notice-delivery-timestamp-wire-2026-10-07.md).
