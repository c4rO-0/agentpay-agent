# Run the reference Provider on your own server

You can install this repository and connect it to an AgentPay platform without
its private Deploy, Market or Settlement source. Protocol is installed from npm.
User and Wallet are client software, not requirements for running the Provider.

You still need a Linux server with Node.js 22.22.3 or newer, a dedicated MySQL
execution database, and a public service URL that the platform and buyers can
reach. Use a dedicated service account for the commands and private data below;
keep it separate from unrelated applications. A receiving address needs no private
key on this server. Registration transactions are submitted by the platform.

## Prepare local service and public routing

1. Clone or download this repository, then follow [local installation](provider-installation.md).
   Prepare the [dedicated database](provider-database.md) first. Keep the generated
   installation file, execution database and private data when updating code.
2. Give the service a stable public HTTP or HTTPS URL. HTTPS protects transport;
   public HTTP service endpoints are supported. Platform login and credential APIs
   require HTTPS except on loopback. DNS, certificates and reverse-proxy installation
   are host prerequisites, not actions performed by the connection guide.
3. Forward only the following service-scoped routes to your local Provider listener.
   Replace `SERVICE` with the exact installation service name. If your public URL
   includes a prefix, strip that prefix at the proxy before forwarding. Preserve
   the request body, Content-Type and Authorization header on the paid endpoint.

| Method | Local route | Purpose |
| --- | --- | --- |
| GET | `/services/SERVICE/mcp/.well-known/agentpay/provider-binding/CHALLENGE_ID` | Endpoint verification; must work before paid admission |
| POST | `/services/SERVICE/agentpay/invoke` | Price declaration and authenticated paid invocation |
| GET | `/services/SERVICE/agentpay/display` | Public service description |
| GET | `/services/SERVICE/agentpay/service-reference` | Public registered identity |
| GET | `/services/SERVICE/agentpay/skill-package` | Reference identity metadata |
| GET | `/services/SERVICE/agentpay/skill-bundle.zip` | Reference Skill ZIP |

Keep `/internal/`, `/run`, `/random`, the local health/control listener, database
and all other paths private. Do not forward the entire application indiscriminately.
The MCP URL entered in the guide ends in `/services/SERVICE/mcp/invoke`; it is the
canonical service identity. Native paid calls use the separate `/agentpay/invoke`
route. The reference flow does not require exposing the legacy MCP execution routes.

The first local smoke server has no binding or paid routes. After the guide issues
its credential, run its displayed application configuration command to load the
native runtime. Then endpoint verification can reach the challenge route. A missing
challenge normally returns 404; that alone does not establish that the proxy works.
The guide's real challenge is the endpoint-control check.

## Connect using public platform settings

Open your Market's **Connect a Provider** page and create your Market account.
Download its public Provider settings from that page. For a platform using the
standard website routes, the link is:

```text
https://YOUR_MARKET_HOST/market/web/onboarding/provider-config
```

This is public network/token/API information, not a private environment file.
The guide accepts either the downloaded file or this HTTPS URL. Run the connection
command printed by local installation, replacing its `/PATH/TO/provider-deployment.json`
placeholder. Keep the `--installation` argument: it lets the guide print the exact
application command to run at each handoff.

Follow [connection stages](provider-onboarding.md#connection-stages): sign in,
load the credential, verify the endpoint, load the verified declaration, register,
wait for Registry/Quote, and run application configuration once more to enable
local paid admission. At each handoff, use the same installation and connection
files. Do not create another service to recover a failed step.

If Registry is pending or the platform has paused new Orders, contact the platform
operator with the displayed status. You cannot fix platform signer funding or
registration-worker configuration by changing your service or paying again.

## Operate and publish

After the guide confirms readiness, download the ZIP from your Provider and
[publish the Skill](skill-publishing.md). Skill publication and service registration
are separate. Keep the service online and preserve its execution database so it
can answer original requests after a restart.

The reference Linux launcher runs in the background but does not install a boot
service or configure your host's firewall/proxy. After a machine restart, resume
using the saved installation command and inspect its state. If using your own
supervisor, choose one process owner rather than starting two copies on one port.

## Review scope

The public paths, configuration inputs and application handoffs have been reviewed
statically for independent use. No private Deploy checkout, operator home directory
or fixed platform domain is required. This review does not claim a fresh-server
execution or a paid transaction. A separate independent-host rehearsal is not a
requirement for this stage.
