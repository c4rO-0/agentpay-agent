# Provider installation and operation

## Local application installation

Follow [local installation and generation](runbooks/provider-installation.md).
The `provider-install.mjs` entry saves `installation.env` and runs a loopback
random-number service after preparing its own MySQL execution schema. It does not
access Market or Settlement during installation.

## AgentPay connection

Follow [connect an existing service](runbooks/provider-onboarding.md).
The `provider-setup.mjs` entry saves `connection.env`, handles API identity/control
and registers the live service declaration. It never owns the application's
process, database or pricing configuration. Your service must implement the
AgentPay protocol before this connection can succeed.

## Reference paid-runtime operations

The existing native reference uses MySQL for durable execution state. Its own
runtime configuration is illustrated by `config/provider.example.env`.
`provider-host.mjs CONFIG check|start|service prepare` operates this application;
these are implementation tools, not universal onboarding requirements. Database
preparation is described in [the reference database runbook](runbooks/provider-database.md).

Use the paths saved by your installation or chosen by your service administrator.
The connection wizard reads its own connection files, not platform configuration.
System-service paths are deployment choices, not Provider interface requirements.

The application-owned `provider-install.mjs INSTALL_CONFIG configure CONNECTION_CONFIG`
command now loads credentials, prepares the canonical declaration and checks local
paid admission. It uses its own SQL configuration; the connection coordinator
only displays the handoff. Human walkthrough, real SQL/platform handoffs and
independent-host acceptance are still pending. See [progress](../progress.md) and
[TODO](TODO.md). Existing private purchases do not prove those new flows.
