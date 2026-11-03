# Prepare your Skill package

Official template revision: {{TEMPLATE_VERSION}} (Agent repository).
This is not your Skill packageVersion.

This template includes a local Runtime call example. Edit it before submitting.

## Files

- SKILL.md: instructions the user's Agent will read. Describe the purpose,
  requirements, usage and expected output. Replace the example text.
- agentpay.json: package identity and public service reference. Keep it next to SKILL.md.
- scripts/call-runtime.mjs: bootstrap for the installed User shared client.
  It contains no credentials and does not implement payment logic.
- README.md: package preparation notes; adapt these notes for your users.
- Supporting files are optional. Add only files referenced by your Skill.

## What to change in the script

Start at the block labelled BEGIN BUSINESS INPUT in scripts/call-runtime.mjs.

| Change | Where | What it controls |
| --- | --- | --- |
| Required | validateBusinessRequest(input, alias) | Validate your fields and return the private JSON your Provider accepts. The text field and 8192-character limit are example rules; replace them. |
| Required | agentpay.json: packageName, packageVersion, author | Your package identity and release metadata. |
| Required | agentpay.json: services.main | Copy the Provider's complete registered reference, including profile and profileHash. |
| Required | SKILL.md: instructions and examples | Tell the Agent when to call, what JSON to pass and how to interpret result.output. |
| Optional | agentpay.json: more services aliases | Use --service <alias> and branch on alias in validateBusinessRequest if the input contracts differ. |
| Optional | declareInputFiles | Explicitly select local files or URLs to snapshot before payment. Never scan unrelated folders. |
| Optional | prepareBusinessRequest | Adapt saved copies to your Provider format; keep any upload idempotent using requestId/fileKey. Never start payments here. |
| Optional | declareOutputFiles | Select result files to cache after verified delivery; retries download only. |
| Optional | runSkill: write(value) callback | Customize result presentation while retaining errors and recovery requestId. The default prints Runtime JSON. |
| Usually keep | Local discovery and private-file checks | Find the user's installed shared client without shipping their credentials. |
| Usually keep | Shared runSkill call and CLI arguments | Preserve authorization checks, request identity, retry/result reuse and spending limits. |

For example, if your Provider accepts a message field instead of text, change
the validator to check input.message and return {message: input.message}. Change
the invocation examples in SKILL.md to match. Do not send that shape to the echo
example without also selecting a Provider that actually supports it.

The returned request is part of the saved call identity. Preserve the package and
input for an unfinished request. --resume restores the saved input; it does not
rerun it through newly edited validation. Do not use changed input or --force
to work around an uncertain paid response.

## Package identity and versions

Change packageName to your package name. Use letters, digits, dots, underscores or
hyphens, starting with a letter or digit (maximum 96 characters).
Set packageVersion yourself, for example 1.0.0 (maximum 64 characters).
Market does not increment the version. Replace author with the package creator's
name or organization. It is descriptive metadata; Market identifies the publisher
from the signed-in account. When ZIP contents change, use a new version before
publishing. The same publisher/package/version cannot identify different ZIP bytes.
Editing only the Market introduction or images creates a publication record without
changing the ZIP package version. A draft does not replace your public version.

## Create and publish the ZIP

Keep exactly one non-empty SKILL.md and one adjacent agentpay.json. All files must
stay inside this Skill directory. From the my-skill directory, create the archive:

    zip -r ../my-skill-1.0.0.zip .

Use your actual package name and version in the filename. Market reads the version
from agentpay.json, not from the ZIP filename.
Maximum ZIP size: 2 MiB; expanded size: 8 MiB; individual file: 1 MiB; entries: 256.
Include only intended package files. Exclude credentials, private keys, .env,
node_modules and unrelated build output. Upload the ZIP, complete your introduction
and submit it. Market applies its required checks before publication.

## Connect your service

1. Change packageName, packageVersion and author; rewrite SKILL.md for your task.
2. Obtain the Provider's registered service-reference JSON (the reference Provider
   exposes /services/<serviceId>/agentpay/service-reference). Copy that whole JSON
   object into this package's services.main field. Keep the profile and its hash together;
   do not invent skillId, profileHash, seller, network or asset values.
3. Complete local AgentPay User/Wallet setup using a User release with the shared
   Runtime client. It saves runtime/connection.json in the user's private data
   directory. Keep the installed User repository available. For another directory,
   set AGENTPAY_USER_DATA_DIR locally. Never package the connection file or token.
4. Edit validateBusinessRequest in scripts/call-runtime.mjs, the SKILL.md instructions,
   JSON arguments and result.output interpretation for your
   service. --units is the requested upper limit, not actual metered usage or a
   trusted price; Settlement bounds it by the Quote and Wallet enforces spending.
   Use --force only for a deliberate additional purchase with the same input.
5. Run the non-paying --check command from this Skill's directory. This validates the public reference without paying. Then test a deliberate paid invocation under
   your existing spending limits. Matching input resumes work or reuses its verified
   result without paying again. --force
   explicitly starts another purchase; preserve old request records.
6. Add each additional reference under services with its own alias. Call it with
   --service <alias> before --invoke (main is the default). Adapt validateBusinessRequest
   for each alias. Runtime routes by the reference
   supplied in each call; do not change a global selected Skill or restart Runtime
   to switch services. Different calls can use different qualified Providers under
   the same bounded Policy. A multi-step Skill must retain each call's input and
   reuse earlier results when continuing later steps.

The agentpay.json default values are placeholders; --check refuses an invalid
profile hash. Providers implementing a different wire API need an integration
adapter agreed separately; Runtime never downloads or runs arbitrary adapter code.
The current common transport is json.v1; business validation belongs to your Skill
and Provider.
Actual DeepSeek Harness/Claude Code discovery and execution still need verification.

The Market structural check validates the ZIP layout and package metadata, not
Runtime compatibility. The User ZIP installer saves bounded packages without
executing them; harness discovery is separate. Install this template through
the chosen harness's Skill discovery mechanism, whose exact steps need verification.
Do not claim harness compatibility or service support you have not tested.

## License

This template is MIT licensed; see LICENSE. Keep that notice when distributing
code derived from it. Your own additions may use your chosen license.
