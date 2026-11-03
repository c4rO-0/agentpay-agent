# Install and operate the reference random-number service

Installation proves that your machine can run the service and generate random
numbers. It does not create a Market account, bind a Provider or register a paid
service. [AgentPay connection](provider-onboarding.md) is the separate next flow.

## 1. Prepare and install

Use Linux with Node 22.22.3 or a later compatible version. From the Agent repository:

```bash
npm ci
node scripts/provider-install.mjs --new "$HOME/.local/share/agentpay/provider/random"
```

Choose a service name and free local port (default `6584`). The guide then asks
for your application execution database and hidden password, initializes the
existing native execution schema, and saves private `storage.env`. See
[database preparation](provider-database.md) if you need your administrator to
provision a database/login first. Choose `continue` to start and check generation. The program keeps a background service on Linux,
shows a short pass/fail result, and explicitly ends the installation guide.
No Market or Settlement information is requested in this installation flow.
Storage and schema readiness are required before it can report installation complete.

An interrupted questionnaire saves non-secret answers. Repeating the command
reuses the existing installation and healthy process. It does not reset identities.

## 2. Return or stop

From the Agent repository:

```bash
node scripts/provider-install.mjs "$HOME/.local/share/agentpay/provider/random/installation.env"
node scripts/provider-install.mjs "$HOME/.local/share/agentpay/provider/random/installation.env" check
node scripts/provider-install.mjs "$HOME/.local/share/agentpay/provider/random/installation.env" stop
```

Only a process created by this installation can be stopped/reloaded automatically.
Process ownership is verified before signalling. A different process occupying the
port is reported and left running. An admitted paid service requires draining and
explicit confirmation before a restart or stop.

For macOS, background management is not implemented. Use `INSTALL_CONFIG start`
in one terminal and `INSTALL_CONFIG check` in another. The guide prints those
commands and reports verification as pending until you run the check. The same
foreground command can run the paid reference mode after its configuration is saved.

The local installation listener binds only `127.0.0.1`. `/random` is a local smoke
test, without paid routes; do not publish it through a proxy. Configuring paid
mode replaces this local test server with the existing native runtime, where
unpaid `/random` testing is disabled.

## 3. Application configuration during AgentPay connection

Start [the connection flow](provider-onboarding.md) with `--installation`. The
printed connection command uses this installation's
own `connection` subdirectory so a second service does not reuse the first
service's session, binding or credential files. Existing installations keep
their saved paths.

At each credential/declaration/readiness handoff, the guide prints this application command with
your actual paths:

```bash
node scripts/provider-install.mjs /ABSOLUTE/PRIVATE/installation.env configure /ABSOLUTE/PRIVATE/connection.env
```

Run it in another terminal, then return to the connection guide. It operates the
reference application, not generic AgentPay certification.

On the first application connection configuration it asks for:

- **Receiving account and prices:** the account on the selected network; base and
  unit price in the displayed token. Each random request uses one usage unit.
Execution storage is loaded from the completed installation. This command does
not ask for SQL inputs or prepare missing storage. If installation is incomplete,
it stops and points back to the installation guide.

Public platform/network/token values and connection credential paths come from
`connection.env`. The program checks SQL connectivity, prepares its own stable
service identity and loads the native runtime. Execution tables are initialized during installation and checked again on application startup; it never creates a database/user or accesses
platform SQL. No Order or payment is created by configuration.

Run the **same command** at each displayed handoff:

1. Load the newly issued credential before endpoint verification.
2. After endpoint verification, refresh the canonical profile using the verified
   Provider identity. `skillId` is preserved; the changed declaration gets a new offer.
3. After service registration and Registry qualification/fresh Quote, prepare local
   paid admission. Unknown API state never enables it. Normal requests still require
   online Settlement service authorization; local admission is not payment proof.

Saved prices/database settings are reused. API or reload failure preserves B1/B2
and local identity. Rerun the same command; never delete state to retry. Qualified
Registry with failed local preparation is reported as partial success.

To change application prices or payout deliberately:

```bash
node scripts/provider-install.mjs /ABSOLUTE/PRIVATE/installation.env configure /ABSOLUTE/PRIVATE/connection.env --edit
```

A payout/profile change may require new qualification. An admitted application's
execution database location is preserved; moving it needs a separate recovery
procedure. Connection account/endpoint changes are not application edits.

## Private files

| File | Purpose |
| --- | --- |
| `installation.env` | Local service name and port |
| `installation.env.draft.json` | Unfinished local questionnaire |
| `installation.env.process.json` / `.process.log` | Owned Linux process identity / private output |
| `storage.env` | Installation-owned SQL settings; schema initialized before completion |
| `storage.env.draft.json` | Unfinished non-secret database answers |
| `runtime.env` | Reference application's private SQL, pricing and native runtime settings |
| `runtime.env.pricing-draft.json` | Unfinished price/payout answers; no SQL inputs |
| `service.json` | Stable service identity and prepared declaration |

Directory mode is `0700`, files `0600`. Lock files serialize operations; inspect an
unexpected/stale lock before removing it. None of these files belong in Git.

Source and temporary process/terminal checks have passed. Real SQL/schema access,
real platform/Registry handoffs and the full human journey still require private
acceptance; they are not proved by injected API tests.
