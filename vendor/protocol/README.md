# Protocol dependency

Agent installs `@c4roa0/agentpay-protocol` 0.14.3 from npm through `npm ci`.
`package.json` declares the version and `package-lock.json` pins package integrity.
No Protocol checkout or local archive is needed. Historical files on an existing
workstation are ignored and are not used during installation.

Protocol owns the public hashes, schemas and ABI definitions. Updating this package
does not change a Provider identity, active contract deployment or saved Order.
Review and test dependency updates before changing the pinned version.
