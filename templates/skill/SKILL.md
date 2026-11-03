---
name: my-skill
description: Replace with the task this Skill performs using a paid service.
---

# My Skill

Replace this introduction with when to use your Skill and what it returns.

## Requirements

Node.js >=22.22.3 and completed AgentPay User/Wallet setup. The local Wallet must
be unlocked with bounded spending permission. The service must implement the AgentPay JSON invocation/result contract.
Never ask for private keys, unlock secrets or caller credentials in conversation.

## Instructions

Resolve commands from this installed Skill's directory, not the current workspace.
Check the local Runtime and service identity without paying:

    node scripts/call-runtime.mjs --check

Read the current price and maximum delivery duration without creating an Order:

    node scripts/call-runtime.mjs --quote

Evaluate these against the user's task. If unacceptable, stop before invoking.
Amounts are atomic token units; serviceWindowSeconds is seconds from Order creation.
To bind an accepted offer, add --accept-terms with a JSON object containing
baseAmountAtomic, unitPriceAtomic and serviceWindowSeconds from the quote.
Normal eligible purchases still use the existing bounded Wallet permission.

To make a paid call, provide your service’s business input as JSON:

    node scripts/call-runtime.mjs --invoke '{"text":"hello"}' --units 1

Retry the same command after interruption. The client resumes a matching unfinished
request automatically, or reuses its verified result without paying again.
Do not change the input or add --force to recover a failure.
Only when the user explicitly wants another independent purchase with the same
input, use --force. It can cause another payment; it never bypasses spending limits.

The output is JSON. Read result.output only on success; adapt its interpretation to your service. Explain failure and
ask the user to complete local setup/unlock if needed; never invent a result.
Price is checked at purchase time under the existing Wallet permission.
