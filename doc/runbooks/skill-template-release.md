# Official Skill template tags

Agent owns the editable template in `templates/skill/`. Its release version comes
from Agent's `package.json` and follows the Provider tag `vMAJOR.MINOR.PATCH`.
`templates/skill-release.json` lists required User-client capabilities; it has no
independent version. An author's new Skill `packageVersion` is separate.

## Build and publish

1. Update Agent's package version and lockfile together. Never move an existing tag.
2. Run from the Agent repository:

   ```bash
   node scripts/build-skill-template.mjs
   node --test test/skill-template.test.mjs
   ```

3. Review both the editable source and generated `templates/release/` contents for
   private information. Commit `release.json` and its versioned ZIP with the source.
   ZIPs include the MIT notice. No local credentials, inputs or connection files
   belong in the package. Verify shared User-client interoperability before tagging.
4. Tag that reviewed commit with the Agent version and push the commit and tag.
   GitHub Releases/attachments are not required. The build script never publishes.

Initial remote-tag candidate: Agent `v0.1.1`. The earlier independent 0.1.0 candidate
is superseded. Generated filenames and manifest version follow Agent automatically;
the builder refuses to overwrite an existing same-version ZIP with different bytes.
Market checks remote tags only; it never reads a sibling checkout or executes source
from this repository. It downloads the prebuilt manifest/ZIP at the resolved commit.

The manifest includes filename, size, SHA-256 and required client capabilities.
Those checks detect corruption, not a malicious repository owner. The configured
repository and its release permissions are the template trust boundary.

Shared transport, file snapshots, payment and recovery remain in User. Deploy a
compatible User client before offering a template that requires new capabilities;
the template refuses unsupported installed clients before any paid call.
