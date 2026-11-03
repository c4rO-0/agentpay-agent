# Connect an existing Provider service to AgentPay

This flow connects your Market account, verifies endpoint control, registers the
service declaration and checks Registry/Quote status. It assumes your service is
already fully installed and running, including its implementation storage. It never reads its database or manages its process.
A Market client-Skill listing is separate and is not required for trading.

For local reference installation, start with [installation](provider-installation.md).
The two flows, automatic Registry qualification and local paid preparation have
private same-host execution evidence. Independent-host acceptance and broader
recovery remain open. Later guide corrections have focused source tests;
those tests do not replace a human walkthrough.

## What you need

- An existing Market account.
- Public deployment configuration from the Market/operator. It supplies
  Market/Settlement addresses and network/token metadata, without secrets.
- Your running service's name, MCP invoke endpoint and local control origin.
- An AgentPay-capable implementation that supports endpoint-control challenges,
  can load its own credential, and publishes its own canonical 402 declaration.

SQL, prices, payout address, identity generation and process management belong
to the service implementation. They are not inputs to this connection wizard.
Provider accesses Market and Settlement APIs; it does not read their files or SQL.

From the Agent repository:

```bash
node scripts/provider-setup.mjs --new "$HOME/.local/share/agentpay/provider/random/connection" --deployment /PATH/TO/provider-deployment.json --installation "$HOME/.local/share/agentpay/provider/random/installation.env"
```

For this reference installation, `--installation` supplies the local service name/control
port and saves a command handoff. In the private Anvil mode, its MCP URL is also
derived automatically. In normal deployment, enter your actual public HTTP or HTTPS endpoint. HTTPS protects transport privacy;
HTTP is supported but provides no such protection. Market login and Settlement
credential connections still require HTTPS outside local loopback.
Other Provider implementations omit `--installation` and supply their running endpoints.
The connection program reads only installation name/port, not private runtime SQL.
Each reference installation gets its own `connection` directory beside its
`installation.env`. Reusing an existing directory with another installation,
service, control port or supplied platform is rejected. Existing connections
stay at their current paths; use their saved commands to resume them.

Use the real public file supplied by the operator; `config/provider-deployment.example.json`
is only a format example. The wizard saves non-secret answers as a resumable draft.
For return visits:

```bash
node scripts/provider-setup.mjs "$HOME/.local/share/agentpay/provider/random/connection/connection.env"
node scripts/provider-setup.mjs "$HOME/.local/share/agentpay/provider/random/connection/connection.env" --status
```

`--status` inspects API and local connection facts. It does not issue credentials,
register a service or change application configuration. Authenticated API reads
may update server-side credential/session last-use audit metadata.

## Connection stages

1. **Sign in:** the status shows the service name and the Market account whose
   saved session was validated. A valid session is reused; otherwise enter your
   hidden Market password. Market login expiry does not stop paid service,
   which uses a separate Provider M2M Credential.
2. **Verify endpoint control (B1):** issue a credential only when no binding or
   local credential exists. Give your service administrator the displayed protected
   credential path, binding-state path and Settlement URL. The application must
   load that credential. For the reference server, run the displayed application
   `provider-install.mjs ... configure ...` command in another terminal. Then type
   `ready` here to complete the control challenge. The wizard
   does not restart it. Never paste the credential into chat or logs.
3. **Register service (B2):** your application publishes its own service identity,
   payout and price declaration. After B1, its profile must match the verified
   Provider identity. If it still exposes the earlier temporary profile,
   choose `configure` and run the displayed application command in another terminal.
   Enter `ready` when it finishes; the guide rechecks the declaration before B2.
   The wizard reads and validates the live 402, then sends the
   canonical profile to Settlement. A mismatch preserves B1 and requires fixing
   your application's declaration; it does not create replacement identifiers.
4. **Check qualification and Quote:** the guide reads Settlement's objective
   qualification checks and the independent on-chain Registry result. It shows
   the current blocker. When checks pass, Settlement's background worker
   registers the exact tuple automatically; normal connection does not need
   manual Registry approval. Keep the service online, wait about a minute,
   then enter `check`, or quit and return later. If pending persists for a few
   minutes, contact the platform operator. A conflict needs investigation;
   it is not automatically overwritten. Repeated status checks do not write Registry.
   Once qualified, a missing/stale Quote
   has its own waiting state. Settlement observes prices in the background,
   by default once every 60 seconds. Keep a fresh price declaration online,
   wait about a minute, then enter `check`. This reads status without forcing
   a new observation. The platform may configure a different interval.
   If blockers persist after a few minutes, use `details` and contact the
   platform operator.
   Binding, registration, qualification and fresh Quote are distinct statuses.
5. **Check local readiness:** the reference runtime exposes credential and paid
   admission facts. A qualified service can still be locally unprepared; this is
   reported explicitly. Run the displayed reference configuration command again
   after qualification: choose `configure`, run the application command, then enter
   `ready`. This prepares local admission and rechecks completion; it does not
   repeat binding or registration.
   Other implementations use their own local operational
   checks; completion of platform registration does not prove local paid readiness.

Successful stages are reused. API outages are not interpreted as absent state.
No Order or payment is created by this guide. On completion, prepare and publish
(or otherwise distribute) your client Skill using [the publishing guide](skill-publishing.md).

## Private files and recovery

`connection.env`, its public metadata copy, Market session, Provider credential and
binding record live in the chosen owner-only directory. Optional
`connection.env.reference.json` contains only the installation-path handoff. Files are `0600`, directory
`0700`. Installation files remain separate. No platform file is loaded.

To correct a connection input, quit and edit this connection file only. Restore
matching public metadata when changing the platform. Changing account or endpoint
with existing credentials needs explicit identity/recovery review; no automatic
rotation or overwriting occurs. Preserve saved state after errors.

Missing/revoked credentials require the established explicit Provider binding
recovery commands; see `node scripts/provider-bind.mjs` and the developer guide.
These commands receive connection fields as environment values, not the application
SQL configuration. Do not use a new identity to mask a lost credential.

The existing `provider-host.mjs CONFIG start|check|service prepare` commands are
reference application operations using its private runtime configuration. They
are not prerequisites imposed on other Provider implementations.

## Pending credential expired or unavailable

If the account remains valid but the pending credential has expired or no longer
matches, the guide recommends `reissue`, rather than repeated `continue`.

1. Choose `reissue`, then `confirm`. This replaces the remote pending credential;
   the previous local file is retained. The connection configuration records a
   new private credential file. Cancelling does not change credentials.
2. Choose `continue`. Load the new credential using the application's displayed
   configuration command, then return and enter `ready` to verify endpoint control.
   The reference application reuses its installed database, pricing and identity.
   If it already has pre-admission runtime settings, confirm loading the matching
   replacement credential when asked.
3. If signing/issuance or saving fails, recheck status and use explicit `reissue`
   again when recommended. The destination is saved before the request, so
   restarting the guide does not silently revert to the expired file.

This action applies only to pending endpoint bindings. Verified/admitted credential
rotation and recovery require their separate procedures. Neither service
installation nor database provisioning needs to be repeated for credential expiry.

## Optional service introduction

Expose GET /services/:serviceId/agentpay/display with JSON
`{ "ok": true, "result": { "name": "My service", "summary": "What it does", "usage": "How to use it" } }`.
Limits are 120/500/4000 characters respectively. The reference registration client
reads it and sends display separately during service registration. You may also
send that optional field through your own authenticated registration client.
Changing this copy does not change the canonical payment profile or its hash.
Do not add it to the strict 402 payload. Missing copy uses the service identifier
in Market and does not block payment qualification. Market labels it Provider-supplied,
not reviewed for content. Keep secrets and private request/output out of this text.

## Public prefix and local control

Your service MCP URL may be `https://platform.example/provider/services/random/mcp/invoke`.
Use the exact public URL reached by Agents and Settlement. The connection guide
asks for this address even for a locally installed example. Local control remains
a separate loopback origin, for example `http://127.0.0.1:6571`; do not enter the
platform `/provider` URL as the control origin.

The reference process serves `/services/...` locally; nginx removes the public
prefix. Declarations and downloaded Skills retain the public prefix. Changing
this URL changes the service profile hash. Use a separate connection/service
state and complete endpoint verification and service registration; existing
state deliberately refuses a silent endpoint replacement. A matching Skill must
be published for the changed service. Prepared dependency version is types
0.11.1; install it during a coordinated stopped-service update, not underneath
a running Provider.

## Delivery duration and disputed results

Price declarations may include optional `serviceWindowSeconds` (canonical positive
integer-seconds string; at most 365 days under current Settlement policy). The
reference application reads `AGENT_NATIVE_SERVICE_WINDOW_SECONDS`; omission uses
Settlement default. Quote expiry is separate. Duration starts at Order creation,
including payment and acceptance waiting. No extension after creation is supported.
Changing the offer affects only new Orders; fixed offer IDs cannot reuse changed
content. Rolling reference offers include duration in their derived identity.

The reference service checks the protected case inbox about once a minute. From the Agent repository, use the default saved connection or add
`--connection /your/private/connection.env` immediately after the script name:

```bash
node scripts/provider-case.mjs list
node scripts/provider-case.mjs ORDER_ID read
node scripts/provider-case.mjs ORDER_ID access
node scripts/provider-case.mjs ORDER_ID evidence evidence.json
```

`access` provides a one-hour, one-Order code for Market Account → Order support.
`evidence.json` contains `text`, optional HTTPS `links`, and optional bounded image
attachments (`name`, `mimeType`, `dataBase64`). The page is simpler for image upload.
Resubmit the same file after a timeout: identical evidence for the same Order
reuses its operation ID, including after a process restart. Editing the evidence
creates a new submission. Each party has eight submissions and 3 MiB of serialized
evidence; one party cannot consume the other's allowance.
Neither command reads Settlement SQL/configuration or grants operator authority.

Original-result retrieval is read-only, verified online by Settlement and does not
rerun the business handler. Preserve the original result or queryable delivery
proof through the relevant Order/dispute period. Failure to return another copy
is not itself breach; failure to establish delivery can lead to refund. Evidence
is service-defined and assessed in context, not a mandatory business output shape.
New-policy windows are delivery +7d filing, +10d evidence, +11d latest human handoff,
+14d decision and +15d ordinary payout; public refund is no earlier than latest
permitted delivery +16d. The Order's actual frozen policy is authoritative.

## Administrative restrictions on new Orders

Settlement restrictions stop new Orders for a Provider (all its services), a
server-side service skillId or a Buyer Safe. Already-created Orders, including
prepared but unpaid Orders, keep payment, delivery, refund, dispute and recovery
under their original rules. Matching retries recover the same Order. Provider
credentials, Registry qualification and Safe spending Policy are not revoked by
this control. Public Market status uses Suspended and excludes private operation
reasons; after unblock, normal readiness must still pass. Unknown status requires
fresh checks. Source verification is complete; current progress distinguishes
pending SQL/deployment/participant acceptance from source tests.
