# Compatibility retirement review — 2026-11-19

This is the bounded R11 supplement to the completed source review, not a repeated
whole-repository audit. Inspected current public entries, callers, persisted-state
readers and package exports. Public availability is not proof of zero external users.

| Surface | Disposition, evidence and exit condition |
| --- | --- |
| Duration-unaware service state | Retain explicit upgrade detection: `provider-service-state.mjs` checks old signatures, refuses unverified changed offers, and normal preparation preserves Skill identity. No automatic deletion/regeneration. Exit after a documented state migration window. |
| Binding expiry ISO adapter | Retain: `provider-binding-runtime.mjs` accepts old explicit-zone expiry but rejects conflicting epoch/ISO representations; invalid epoch fields cannot fall back to ISO. Exit with a coordinated binding API version change. |
| Legacy execution Ticket/profile/challenge routes | Retain pending explicit public-interface retirement. `index.mjs` still exposes these routes and the repository has published them; internal native callers not using them is insufficient evidence of no external users. Ticket execution requires configured trusted signers, scope/request hash/expiry checks and a successful claim before service execution. These routes are not native funding/authorization and must not be extended for new integration. |
| Random and Serper reference services | Retain as reference businesses; generic transport/cache/template interfaces remain service-neutral. A service alias in runtime configuration is not a protocol variant. |
| Removed failure-injection branches | Keep retired: prior review removed these from the serving runtime; controlled tests own fixtures. Do not restore production flags to simplify an acceptance run. |
| Skill release ZIP and remote template tag | Retain deterministic release/cache boundaries; a published version must not silently return different bytes. Old downloadable packages are not dead code. |

## Verification and closeout

Existing [static review](mainnet-static-review-2026-11-16.md) remains the R1–R10 evidence. Provider state and binding-time tests passed again with controlled state/HTTP dependencies. No live binding, registration, service restart or Order was changed.

R11 is complete with the dispositions above. No new unresolved source blocker or
transaction-design decision was identified. Retained adapters have named consumers
or public compatibility boundaries; they are not unconditional removal TODOs.
Source completion does not publish packages or prove mainnet/deployment acceptance.
