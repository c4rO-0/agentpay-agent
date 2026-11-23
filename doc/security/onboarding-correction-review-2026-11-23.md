# Provider onboarding correction review

Date: 2026-11-23. Baseline `4344590` plus the reviewed onboarding corrections.
This supplements the November 16 review; it does not repeat a whole-program audit.

The reference installation and connection programs import only this repository and
its npm dependencies. Protocol is pinned to public npm 0.14.4. They do not require
private platform source, database credentials or the platform's Deploy toolkit.
An optional managed-host adapter consumes scoped configuration over stdin; it is
not a prerequisite for independent operators.

| Area | Result |
| --- | --- |
| R1 Design | Installation owns SQL/process/prices; connection owns platform registration; the managed adapter reuses application identity preparation. |
| R2 Flow | install → configure → B1 → verified declaration → B2 → qualification/quote → configure admission traced. Public proxy and database prerequisites are explicit. |
| R3 Recovery | missing identity, mismatched saved config, unavailable APIs and interrupted reload preserve original records. Pending credential reissue is an explicit action. |
| R4 Security | temporary Market login is memory-only; ordinary mode retains private session file; redaction includes memory token; paid admission still requires live readiness. |
| R5 Dependencies | public package lock, platform JSON and registered profile checked. User/Wallet are not Provider runtime dependencies. |
| R6 Maintainability | shared admission verifier explains validation before config write; terminal code preserves prior raw mode. |
| R7 Interaction | passwords hidden, visible input immediate, platform pause distinguished from Registry/Quote wait. External manager handoff no longer points at a nonexistent command. |
| R8 Tests | onboarding, installation and managed preparation regressions passed, including process invocation, private files and controlled platform responses. Independent hosting is statically reviewed; separate live acceptance is outside this stage. |
| R9 Documentation | public-hosting guide added, installation linked, Skill source version corrected to 1.2.2. No private host inventory or credentials in public examples. |
| R10 Operations | managed-host registration/admission and Skill publication reported successful. Independent DNS/proxy/SQL provisioning is not performed by the guide; launcher does not install boot supervision. |
| R11 Compatibility | existing saved connections retained; temporary sessions are opt-in; no alternate registration or transaction path added. |

## Findings and limits

1. The public guide previously assumed a public endpoint without listing which
   routes to expose or where to obtain platform settings. The new hosting guide
   documents the service-scoped routes, prefix handling and public download URL.
2. Skill publishing documentation still called the source 1.2.1. It now reflects
   1.2.2; historical packages and immutable ZIP digests were not changed.
3. `--temporary-session` is suitable for an external service manager. Reference
   installation's pending-credential replacement can read the saved Market session;
   use its normal session mode. This limitation is now explicit rather than claiming
   all combinations have been exercised.
4. A dedicated database, publicly reachable service endpoint and process management
   remain operator responsibilities. There is no private Deploy dependency, but
   the example is not a one-command cloud hosting product.
5. The agreed independent-host scope is static review, not another deployment.
   Checked tracked scripts, examples, public routes and configuration handoffs.
   Found a systemd example containing a private operator account, checkout and Node
   paths; replaced them with generic example locations. No fixed platform domain is
   required. The public security-report mailbox remains intentionally documented.
   This does not establish fresh-host execution or paid-request acceptance.

No payment, chain write, release tag or repository push was performed by this review.
