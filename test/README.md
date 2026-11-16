# Local Provider tests

Run `npm ci`, then `npm test` from Agent. The suite runs sequentially, using local
files, disposable process/socket fixtures and controlled platform/database responses.
It does not require sibling repositories, a real MySQL service or a live chain.
Application installation itself still requires the database described in the runbook.

Examples of focused checks:

```sh
node --test test/provider-two-flows.test.mjs
node --test test/native-admission-write.test.mjs test/native-alternate-orchestration.test.mjs
node --test test/skill-template.test.mjs test/protocol-artifacts.test.mjs
```

The two-flow suite checks installation/connection coordination against simulated
platform APIs. Native execution tests mock database/authorization responses; they
protect execution ordering and rejection boundaries but do not prove real SQL
transactions, chain funding or exactly-once external work. Template integrity and
public dependency provenance are packaging checks, not paid-service acceptance.

Fixture configuration must declare its network explicitly. Input prompts should
cover current decisions, including service duration. Do not restore production
defaults to make old tests pass. Check required storage behavior rather than a fixed
number of SQL statements. Never use real credentials or platform SQL for this suite.

HTTP boundary regressions launch the normal server and verify malformed routes,
body limits and shutdown without touching live services. Transport tests use local
HTTP endpoints for response-body timeout and redirect refusal. Generic-template
checks execute its script with a controlled installed client and missing/full
capability sets; they do not invoke payment. Retired runtime probe environment
variables must not alter execution, receipts or output hashes.
