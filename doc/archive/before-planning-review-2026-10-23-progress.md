> Historical snapshot before the 2026-10-23 planning review. Dates, pending labels
> and “next” instructions describe their original checkpoint. Use current progress
> and TODO for scheduling. Unresolved tasks remain retained, not cancelled.

# AgentPay Provider Server Progress

## Private deployment and paid verification — 2026-10-22

See [deployment evidence](../records/business-neutrality-private-cutover-2026-10-22.md).
The running Provider switched to types 0.12.0 and the common JSON handler.
The existing execution table gained usage_units and text output storage; older
rows were retained without guessed usage. One official paid request completed
through authorization, execution and receipt, followed by verified payout.
The isolated MySQL fixture table was removed after reconciliation.
Earlier source-gate entries below describe prior checkpoints and are superseded
by this private acceptance where scopes match.

## Real MySQL fixture passed — 2026-10-21

The operator-run isolated scratch-table fixture passed schema conversion,
two-unit output/hash roundtrip, same-Order locking across two processes, and
process recovery at completed/executing boundaries. Settlement responses were
simulated. Existing execution-table schema/count/update aggregate and live
Provider PID were unchanged; fixture table and diagnostics remain retained.
Live table alteration, coordinated deployment and paid acceptance remain open.


## Schema metadata correction — 2026-10-21

Operator preflight exposed MySQL metadata column-name casing. Output type
inspection now selects an explicit alias so an existing JSON column is detected
before the planned text-storage change. Two regression tests plus authorization
and alternate-orchestration checks passed (four total). Source only; the operator
must rerun the read-only schema inventory before any schema execution.


## Alternate business orchestration fixture — 2026-10-21

A controlled JSON business traversed claim, accept, persisted output/usage and
receipt through the actual Provider handler. A lost receipt reply reused the
saved output; an interrupted execution entered its application recovery hook.
Provider targeted checks passed 17/17. This used mocked MySQL and Settlement;
real MySQL locking, serialization and process recovery remain open.


## Business-neutrality correction — source verified, 2026-10-21

Current source separates common service invocation from application behavior.
See [implementation and validation](../records/business-neutrality-source-2026-10-21.md).
Deployment, existing-request review and actual official paid acceptance remain
pending. Prior candidate/selected-random entries below are earlier checkpoints,
not the current interface. No live service, database or chain state changed.


## Reference reuse review — correction pending, 2026-10-21

[Review](../records/reference-provider-reuse-review-2026-10-21.md) found native
paid orchestration coupled to random validation/execution/usage/output, a separate
service dispatcher, and missing general execution recovery guidance. The example
may remain random, but copying a different business must not require rewriting
AgentPay control logic. Static review only; fixes and verification remain pending.


## Random Skill shared-client candidate — 2026-10-21

Newly generated source ZIPs use package 1.0.2 and a thin wrapper that loads the
installed User client through private local connection discovery. SKILL.md documents
identity check, default recovery/verified-result reuse and explicit --force for
another matching purchase. User owns transport,
authentication and retry checkpoints; Provider/payment authority is unchanged.
The coordinated User/Agent targeted batch passed 42 tests, including execution of
the installed ZIP wrapper. Existing public ZIPs, active packages and services were
not changed. Release updated User first, then review/publish the new ZIP; actual
DeepSeek Harness/Claude Code and paid acceptance remain pending.

## Public service prefix verified — 2026-10-20

Host/configure and runtime derive public URLs including `/provider`, while local
handlers retain rewritten `/services` routes. Proof validation, 402 declaration,
readiness inspection and Skill packages agree. Agent suite, negative/state checks
and actual temporary Provider/nginx verification pass. Types 0.11.1 is pinned;
live dependencies/services/registrations remain unchanged. See
[evidence](../records/provider-public-prefix-2026-10-20.md).

## Platform URL prefixes — 2026-10-20

Market account/session and binding clients retain configured API prefixes;
Settlement credential, service and readiness calls do likewise. Deployment and
connection/host checks accept safe HTTPS or loopback HTTP service bases. Local
control requires a loopback origin. Targeted tests pass, including prefixed
service registration/status and temporary CLI checks. No live config changed.
Provider public service prefix still needs Protocol/profile/proof/Skill alignment;
this change does not silently replace registered endpoints.

## Three-stage release responsibilities — 2026-10-19

Current stage: **1 — Private end-to-end acceptance**. Stage 2 (real-network
integration) and Stage 3 (limited invitation test) remain open. A stage label does
not authorize live funds, chain deployment, public ingress or deletion/reset.

### Stage 1 — Private end-to-end acceptance

Complete independent-host installation/connection, automatic qualification, rolling Quotes and local paid admission; verify multiple-service isolation, stale/offline recovery and selected withdrawal/drain behavior.

### Stage 2 — Real-network integration

Configure the selected network/asset/profile and compatible service implementation; verify credentials, gas-independent service availability, endpoint control and real small-value delivery/payment evidence.

### Stage 3 — Limited invitation test

Verify external Providers follow published guides without platform SQL/files, receive useful status/support and keep services online under invitation load; publish only explicitly supported integration behavior.

These stage responsibilities determine current sequencing. Earlier dated work
below retains its evidence and unresolved backlog; it is not an instruction to
repeat superseded deployments or old registration flows.

## Earlier component checkpoints


## Optional public service display — source complete 2026-10-18

The reference server exposes GET /services/:serviceId/agentpay/display for minimal
name/summary/usage text. The registration client optionally reads and forwards it
outside the canonical payment profile; missing metadata preserves registration.
402 response fields and offer/profile hashes are unchanged. Registration-client
and rolling-Quote regressions passed. Existing Provider processes were not restarted;
previously registered services retain fallback serviceId text until metadata is supplied.


Updated 2026-10-16. Audience: maintainers and AI assistants planning work.

## Completed baseline

Provider B1/B2, rolling quotes, qualification and local admission have private execution evidence. Skill publication and one subsequent paid purchase were verified. This does not prove a clean independent-host guided installation or every recovery case.

[Private terminal evidence](../records/fresh-purchase-terminal-2026-10-09.md). Source checks, private execution and human usability are distinct evidence levels.

## Current work

Private follow-up on 2026-10-16: the separate `random-registry-test` installation
passed execution-schema preparation, local startup and random generation on
loopback 6585. The existing `local-random` connection independently returned
fresh Quote, qualified Registry and verified local paid readiness after its
application configure command. These are separate installations; first-time
automatic qualification of the new service subsequently passed. Quote waiting copy
now explains the default one-minute observation interval and read-only `check`.
The shared example connection directory in the install handoff was found to
be ambiguous for multiple installations; the source correction is verified below.
[Private evidence and scope](../records/private-registry-test-installation-2026-10-16.md).

The participant subsequently completed the new instance's independent account,
endpoint-control and service-registration flow. A read-only API status check
confirmed a fresh Quote and passing objective checks. The operator then enabled
Settlement's worker, which automatically qualified the new service; a further
independent API check returned Registry qualified, Quote fresh and platform
complete. The participant then loaded the new instance's saved application
settings; the final status returned local admission `admitted` and reference
paid readiness `Verified`. This closes this instance's preparation path, not a
new paid purchase or restart recovery. The subsequent guide source correction
replaces the manual-registration wait and preserves the Provider-owned
configuration handoff. It does not claim another participant run.

Guide follow-up: each installation now prints its own connection subdirectory;
reentry rejects mismatched installation/service/port/platform, and status shows
the service and the validated Market session's account. Twenty-two targeted
tests passed, including CLI file-preservation and two-coordinator handoffs.
Both existing private reference configurations passed constructor-only checks
with network disabled. No service/SQL/Registry/Order change was performed by
this source follow-up. [Evidence](../records/provider-guidance-followup-2026-10-16.md).

The 2026-10-14 Provider objective-qualification change replaces the earlier
LLM/manual review proposal. The terminal status source now shows Settlement's
read-only qualification check and blockers separately from actual Registry
qualification. At that source checkpoint a passing check still waited for the
operator-controlled chain step; private automatic registration is now verified
as described above. Targeted Settlement
planner/API source checks passed; Provider process and private chain were not
changed in development. The full guided run remains open.

The User approved two independent flows: local reference installation and
AgentPay connection. The connection wizard now rejects SQL/process/pricing
settings, does not own the supplier process, and reads canonical declarations
from the running application. B1/B2 are reusable; platform qualification and
local readiness are reported separately.

Both source flows and the reference application handoff are complete on Linux:
local install/storage/schema preparation → owned background start → generation check → separate connection;
connection → credential-loading command → B1 → application canonical refresh → B2
→ automatic qualification/Quote wait → application paid admission → final API/local
readiness. The connection coordinator does not run the application command.
Other implementations retain their own storage, identity and process choices.

Current gate: interrupted Registry transaction recovery and corrected-guide
human/independent-host acceptance. The participant's completed-task Settlement
restart check passed without duplicate registration or lost qualification.
The recorded guide copy
and multi-installation handoff source fixes passed targeted tests. Broader
recovery remain open. macOS supports foreground operation; Linux process
management is not claimed as macOS support. Actual private writes are recorded
separately from source development checks.

42 targeted tests passed, including the combined two-coordinator API/state journey
and actual temporary local processes; one additional focused partial-success test
passed during final review. Actual CLI/PTY checks passed for local installation,
reentry, connection inputs and hidden password/SQL failure recovery.
[Implementation and evidence](../records/provider-two-flows-complete-2026-10-09.md).

## Later / release gates

- Keep C2 packaged request-ID minimum validation deferred until the agreed package update.
- Before multiple contract generations, verify each Order contract version against service requirements.
- Review legacy runtime routes, multi-instance execution and receipt recovery as separately scoped work.

## Documentation checkpoint

Role/function navigation and current status were reorganized on 2026-10-09. No application behavior or service state changed. Concrete implementation and state writes follow the agreed scope.

## History

[Earlier progress](before-doc-organization-2026-10-09-progress.md) · [Evidence index](../records/README.md) · [Current TODO](../TODO.md). Old “next step” entries are historical, not instructions to repeat completed work.

## Guided entry source review — 2026-10-09

After the User guide commit, source review confirmed that B1/B2 primitives exist but combined status/resume, valid-session reuse, credential/profile reload and local admission handoff remain disconnected. The review was followed by the User-authorized full guided implementation below. The review itself made no Provider program or service-state changes. Full participant operation remains separately pending.

[Review and implementation order](../records/provider-guided-onboarding-review-2026-10-09.md).

## First-use review — participant blocked at Market URL

The actual participant did not know the platform URL requested by the wizard.
Review found 12 first-use/operation gaps: platform information delivery, new/existing
endpoint/port, database/account/qualification prerequisites, pricing units, config
resume/edit, unknown local status, concrete reload/stop recovery and publishing handoff.
The original combined coordinator was superseded by the installation/connection separation; its historical tests do not prove the new journey.
Pause participant progression while resolving the entry prerequisites. No service or
business state was changed by this review.

[First-use findings and acceptance](../records/provider-first-use-review-2026-10-09.md).

## First-use corrections — 2026-10-09

Public platform file/URL input now supplies URLs/network/token metadata; new-service
port/origin, payout/token pricing, own-DB preparation/check and operator qualification
handoff are explicit. Non-secret draft resume and safe edits are connected; unknown
local state, explicit stop and package-download handoff were corrected. 34 targeted
tests and an actual temporary PTY wizard run passed. Current platform/Provider/DB
state is unchanged. Participant acceptance and real DB/API handoff remain pending.

[Corrections and verification](../records/provider-first-use-fixes-2026-10-09.md).

## Random reference quantity prompt — 2026-10-09

Participant confused maximum usage units with a fractional price. Fresh reference
configuration now sets maxUsageUnits=1 automatically, matching actual execution;
only the base/unit prices are entered. Existing configurations and protocol fields
retain their semantics. No runtime or business state was changed.

## Local installation human execution — 2026-10-09

The User completed local installation/start/random-generation verification on the
private Linux host. Subsequent read-only health confirmed random-guided in local
installation mode on loopback 6584. AgentPay connection and paid readiness remain
pending; restart/recovery was not repeated by the participant.
[Human installation evidence](../records/provider-local-installation-human-2026-10-09.md).

## Installation prerequisite correction; rehearsal paused — 2026-10-09

The participant found that a running local random stub was reported as installed,
while execution storage was deferred into connection. That was a workflow defect.
The User paused rehearsal and authorized correction. Installation now prepares its
own SQL configuration and native execution schema before startup/generation pass;
connection application configuration loads that storage and asks no SQL inputs.
The existing stub and pending credential/binding files were not changed or restarted.
Previous local-generation evidence proves the stub only; full installation acceptance
is reopened. Rehearsal remains paused until the User resumes it.
26 focused tests passed with temporary files/injected schema and API responses;
real SQL schema and corrected installation human acceptance remain pending.

## Rehearsal resumed — installation prerequisite, 2026-10-09

The User resumed rehearsal. Next: confirm/provision the reference application's
own execution database/login, run corrected installation/schema/generation checks,
then resume the existing connection files. No database provisioning, service restart
or connection reset has been performed by preparing this handoff.

## Dedicated rehearsal database provisioning prepared — 2026-10-09

The User confirmed no application database exists. Prepared an operator-only command
for new `provider_random_guided` database/scoped login on the existing private MySQL.
Password is generated and saved in the installation owner's private storage file,
never logged. Existing role databases/accounts and connection state are not changed.
The command is prepared, not executed; schema initialization/install verification
will follow the User's execution result. This administrator step is not Provider
access to platform files or a platform certification requirement.

## Provider SQL provisioning host mismatch — 2026-10-09

Read-only operator results: root TCP login succeeds; the new schema and account
exist. Application login is rejected from `10.255.0.1`, while the created account
allows only `127.0.0.1`. Docker forwarding changes the server-observed client host.
Prepared an exact-host scoped grant using the saved password; no password reset,
existing data/account alteration or service restart is included. Repair execution
and successful connection are pending the User's next run.

## Dedicated Provider database/login verified — 2026-10-09

User-executed repair added the exact MySQL-observed `10.255.0.1` host account for
`provider_random_guided`, scoped to its own database; application connectivity
passed. Saved password, original account/data and connection progress were
preserved. SQL endpoint is loopback 6474; storage configuration is owner-held
0600 under the existing local installation directory. Next prepared original
installation command initializes execution schema and verifies local generation;
those checks and complete installation are not yet recorded as passed.

## Corrected installation human verification passed — 2026-10-09

User execution completed at 17:29:55 Asia/Shanghai. Original installation guide
reported execution schema ready, local random generation passed and installation
verified. First-run corrected storage/schema/generation installation is now
verified on the private Linux host; AgentPay connection and paid readiness are
separate pending steps. Prepared the existing connection-file entry to resume,
without replacing issued credential/binding or repeating installation.

## Pending credential expired; connection retry guidance blocked — 2026-10-09

Role API inspection: Market session valid, binding pending, local credential file
present, credential self-check UNAUTHORIZED. The remote pending credential expired
at 1791538060507 ms (2026-10-09 17:27:40.507 Asia/Shanghai). Repeating continue cannot
recover it. The terminal incorrectly keeps recommending endpoint verification
without an explicit recovery action; record this as a guidance defect. Pending
credential reissue must be explicit and retain old local files/account/installation;
no reissue, revocation, reset or program change was performed by diagnosis.

## Pending credential recovery guide corrected — 2026-10-09

The approved source fix replaces ineffective endpoint `continue` with explicit
`reissue` when a pending binding lacks a matching usable credential. Authoritative
expiry uses epoch milliseconds; display uses the terminal's local timezone.
Confirmation requests a new pending credential through the existing Market API,
preserves the previous credential file and persists a unique new file destination
before the remote write. Failure remains an explicit retry state. No SQL, account,
installation or verified/admitted credential lifecycle is reset. Reference reload
accepts only a confirmed matching pending credential path change in pre-admission;
other connection changes are rejected. Focused tests: 12 connection, 9 installation
and 1 two-flow coordinator passed (22 total). Real pending reissue and endpoint
verification remain pending User execution; no live credential was issued by tests.

## Post-binding application declaration handoff unclear — 2026-10-09

Read-only public 402 inspection confirmed live profileHash still equals the
unbound declaration, rather than the saved verified binding's canonical profile.
Runtime configuration was saved at 20:24:09 Asia/Shanghai and binding at 20:24:25;
the observed configuration preceded verification. The guide's continued retry
recommendation does not adequately explain the required post-binding application
reload. Prepared original installation configure command for User execution;
no credential, database or process write was performed by diagnosis.

## Post-binding declaration reload verified — 2026-10-09

User configuration completed at 20:27:35 Asia/Shanghai. Log reports application
loaded in pre_admission. Read-only role API inspection now confirms valid account,
verified binding and no service declaration error. Paid service is not registered;
next step is register_service. This resolves the observed stale unbound profile;
Registry/Quote and local paid admission are not yet complete. Prepared original
connection guide to reuse binding and the refreshed running declaration.

## Guided registration passed; operator qualification pending — 2026-10-09

Human guide log at 20:31 Asia/Shanghai reports endpoint verified and paid service
registered. Subsequent recheck reports Quote fresh, Registry not_qualified and
REGISTRY_QUALIFICATION_INVALID; local mode remains pre_admission. Service skillId:
0x8648f48392f9b093b204467bd37af941ce035615a9fab6458bcf16c74ac6f372.
This is an operator qualification handoff, not a blocked network request. No
qualification write was performed by diagnosis. Guide should prominently show
waiting for operator review instead of recommending repeated continue as progress.

## Guided service operator qualification preview passed — 2026-10-09

User agreed to the operator handoff. Read-only role API and private chain preview
verified matching verified binding, registered canonical profile and live 402;
current Registry entry is empty. Exact target skillId ends 6f372, profileHash ends
39ed2, seller 0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc on chain 31337.
Prepared a private diagnostic operator command for explicit human-confirmed
setSkill and receipt/event/isQualified verification; execution remains pending.
Legacy deploy rehearsal qualification entry hardcodes Provider 6571 and old root
private declaration/session state; it cannot operate this guided 6584 service.
This temporary operator command is not a production administrator interface.

## Human operator Registry qualification completed — 2026-10-09

User-executed administrator command completed at 20:40:02 Asia/Shanghai. Registry
setSkill transaction 0x7212d89bec552b1ed1e97b3dbe98ba30b56613fadb57f8d8a2f6fcd86db315c9
mined at block 59 on private chain 31337; command verified success receipt,
matching SkillUpdated event and isQualified for the exact guided service. This
human operation wrote Registry qualification only, without Order/payment or
local paid admission. Provider application admission remains to be completed.

## Qualified service local admission prepared — 2026-10-09

User chose administrator approval for now; automatic approval is deferred.
Read-only role inspection confirms verified binding, registered service, qualified
Registry, fresh Quote and no purchase-readiness blockers. Platform connection is
complete but local admission is still pre_admission. Prepared original application
configure command to reuse identity/prices/storage and load admitted mode; human
execution and authenticated local readiness verification remain pending.

## Human guided Provider connection and local admission verified — 2026-10-09

User application configuration completed at 21:05:33 Asia/Shanghai, reporting
qualified Registry and admitted mode. Subsequent read-only authenticated role API
inspection confirms valid Market account, verified endpoint binding, registered
service, qualified Registry, fresh Quote, no blockers, loaded control credential,
matching paid credential and admitted runtime with canonical identity. Both
platformComplete and complete are true. The existing guided Provider's local
installation and platform connection are now verified within this private Linux
host and administrator-approved Registry scope; this is not independent-host,
public-release or paid-purchase evidence. No Order/payment was created by this
admission step. Guide handoff and waiting-state usability defects remain in TODO.
Prepared original connection entry to display completion without re-registration.

## Provider guidance retry/handoff correction verified — 2026-10-09

User approved fixing exposed guidance defects. After B1 the wizard reinspects
before attempting B2 and exposes configure/ready when the declaration needs the
verified identity. Registered services waiting for administrator qualification
show a review handoff and read-only check menu. Qualified services waiting for
Quote use separate status checks. Qualified local pre-admission offers application
configuration, with ready returning to status verification. Completed binding and
registration are not repeated or reported as new writes. Administrator approval
remains manual; the guide never grants Registry qualification or owns application
process/SQL. Application completion wording now follows the guide's recommended
action instead of always saying continue. Focused source verification: 16 guide,
9 installation and 1 two-flow coordinator tests passed (26 total). No live state
was modified by these tests; revised intermediate human menus remain to be reviewed.

## Revised guide completed-state human recheck passed — 2026-10-09

User reran the original connection guide at 22:59:56–57 Asia/Shanghai. It displayed
verified binding, registered service, qualified Registry, fresh Quote, admitted
local runtime and complete platform connection, then Connection complete and an
explicit finished message. No input, repeated continue, verification or
registration was requested. This verifies the revised completed-state experience;
intermediate configure/review/Quote waiting menus still have source-test evidence
only and remain pending human usability review.

## Guidance accepted — 2026-10-10

User accepts revised guidance and cancels additional intermediate-menu human review. This is acceptance, not fresh execution evidence. Current private Provider installation/connection remains complete; next work is Market publication/distribution. Independent-host and broader recovery gates remain open.

### Skill archive ZIP loop — 2026-10-10

Current source uses ZIP only across Provider packaging/route, Market private upload,
mirror/download and User installation/active selection. Archive version 1.0.1 avoids
changing released 1.0.0 bytes; the nested service declaration stays 1.0.0. Bounded
structure/CRC/digest checks remain enforced. Standard ZIP and adversarial fixtures,
installation/selection and download tests passed; 38 tests plus mirror smoke, API/Web
typechecks and syntax/whitespace checks. See [source record](../records/skill-zip-format-2026-10-10.md).
No existing service, release, selection, SQL or chain state was updated. Next private
execution must install/publish/select the new ZIP and refresh guide metadata/digest;
old tar.gz state is preserved, with no automatic fallback or migration. Upload-based
publication enforcement/page integration and generic User Skill consumption remain open.

## Uploaded ZIP handoff — 2026-10-10

Market Web publication/download is wired in source; protected deployment and human
acceptance remain open. Publishing tutorials now describe this path and retain that
gate. User's obsolete JSON-only installer and retired endpoint test were removed;
the current reference ZIP installer is the handoff. No existing service/state changed.
