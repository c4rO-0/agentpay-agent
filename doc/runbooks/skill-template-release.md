# Official Skill template releases

The Agent repository owns the generic official Skill template, independently of
its random-number Provider example. Template source is in `templates/skill/` as
ordinary editable files. `templates/skill-release.json` owns the template version
and required installed User-client capabilities.

The initial candidate is 0.1.0. No Git tag or remote release has been published by
this source change. The example `agentpay.json` packageVersion (1.0.0) is the author's
new Skill version, not the official template version.

## Build and verify

From the Agent repository with supported Node installed:

```bash
node scripts/build-skill-template.mjs
node --test test/skill-template.test.mjs
```

Output is `artifacts/skill-template/` (ignored by Git):

- `agentpay-skill-template-VERSION.zip`
- `release.json`: version, required capabilities, ZIP filename, byte length and SHA-256

The README inside the ZIP identifies the template revision. ZIP creation is
deterministic for identical sources/toolchain; the script refuses to overwrite a
same-version artifact with different bytes. Version changes belong in
`templates/skill-release.json`, not in Market source. Do not modify published assets
in place. Retain earlier releases for traceability.

## Publish from Agent

1. Edit template source and increment its independent version for the next release.
2. Build and verify the ZIP, including shared User-client interoperability. Check
   the required capabilities against the User release being offered to users.
3. Commit the Agent sources. Use an independent tag such as
   `skill-template-v0.1.0` for the reviewed commit, and attach the generated ZIP and
   `release.json` to that Agent repository release. Tagging/pushing/publishing is a
   deliberate release operation; the build command does none of these.
4. Supply those exact artifacts to Market for its pinned download copy. Market must
   not regenerate the template or import this repository's source at runtime.

The shared transport, snapshot implementation and payment/recovery engine continue
to live in User; the template contains only editable business glue. Credentials,
local connection metadata and user inputs never belong in a template release.
