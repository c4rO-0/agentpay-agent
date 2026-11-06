# Retained backlog scope

[TODO](../TODO.md) is the current Provider queue. Historical task snapshots and
private experiment records were preserved outside the public repository during
cleanup. This does not mark unresolved acceptance complete.

Retained Provider work includes independent-host installation/connection, multiple
endpoints, credential rotation, quote expiry/outage recovery, original-result and
receipt recovery, controlled third-party Skill access, maintenance responses,
contract-generation compatibility and multi-instance durability. Timestamp/state
changes require their own migration evidence; prior private success does not
establish independent installation or public-network acceptance.

Platform SQL/table retirement, Market publication storage and platform schema-test
failures belong to their owning projects. They are not tasks for a community Provider
checkout and must not require access to private platform source or databases.
Legacy route retirement still needs consumer review; do not restore or delete it
solely because an old document lists it as pending.
