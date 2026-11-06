# Contributing

Start with the [developer guide](doc/develope.md), [architecture](doc/architecture.md)
and [current tasks](doc/TODO.md). Explain the user-visible behavior and scope of a
change. Include a focused behavioral test and relevant documentation.

The random-number application is a reference implementation, not a rule for every
Provider. Keep application validation/execution separate from credentials, online
service authorization, durable request identity and receipt recovery. Do not weaken
those boundaries to make an example or test pass.

Use disposable fixtures, never live credentials or private operational records.
Tests must not silently access production services or databases. Mocked upstream
success does not prove funds moved or work survived a process crash.

Report security issues privately through [SECURITY](SECURITY.md). Contributions use
the repository's MIT license; preserve third-party copyright and license notices.
