# Rolling Quotes for the reference random Provider

This describes the server's Quote policy. It does not register or qualify a
service and does not change an existing Order.

## Continuous service

In the Provider process's own configuration, set:

```dotenv
AGENT_NATIVE_QUOTE_TTL_SECONDS=600
```

Remove `AGENT_NATIVE_VALID_UNTIL` from that process configuration. Both settings
at once are rejected. Restart your Provider using its process manager. Without
either setting, the reference implementation defaults to rolling TTL 600.
Keep your existing service declaration, identifiers and prices.

The unpaid endpoint still returns HTTP 402 with mandatory `validUntil` in Unix
seconds. With TTL 600, it uses 300-second windows and returns more than 300 and
at most 600 seconds of remaining validity. Retries and restarts in one window
keep the same content and offerId; a new window renews expiry and offerId.
The configured offerId is a stable seed in this mode. Other Provider developers
can choose their implementation while preserving immutable offer content.

## Intentional cutoff

Remove the TTL setting and configure `AGENT_NATIVE_VALID_UNTIL` with a positive
Unix-seconds string. That fixed deadline is preserved, including after expiry;
it will never be silently extended. Update offerId when changing fixed Quote
content, as required by the protocol.

## Verification and limits

Check the unsigned HTTP 402 response, expiry, service/pricing fields, renewal
across a window and same-window behavior after restart. Settlement must also
successfully observe the Quote. Its freshness/admission checks still apply.
An online endpoint alone is not sufficient to establish purchase readiness.

The private rolling-quote verification (not distributed)
documents the completed existing-host run. Independent-host onboarding has a static review; outage recovery and paid-network
verification are separate evidence. No routine per-order owner signature is introduced.

## Upgrading older saved service state

If startup reports `PROVIDER_STATE_UPGRADE_REQUIRED`, the saved record did not
bind delivery duration. This does not mean the configuration was necessarily
edited. Review `AGENT_NATIVE_SERVICE_WINDOW_SECONDS` in your host configuration,
then, from the Agent directory, run:

```sh
node scripts/provider-host.mjs /path/to/host.env service prepare
```

For a managed deployment using injected Provider environment, its operator runs
`node scripts/provider-runtime.mjs prepare` with that same environment. Do not run
it with an empty shell environment or delete the state file. Restart through the
usual process manager after preparation, then check service status.

Preparation preserves the Skill identity and existing execution/Order records.
Because the old duration cannot be proven from the saved signature, it creates a
new offer for future orders and records the updated signature format. Repeating
preparation without changes reuses that offer. An old record with omitted duration
that already matches can still load; preparation stamps the format without changing
its offer. Neither path bypasses subsequent duration/price/profile checks.
