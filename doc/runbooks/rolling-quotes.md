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

The [private verification record](../records/provider-rolling-quote-2026-10-06.md)
documents the completed existing-host run. External onboarding CLI rollout,
Settlement timestamp correction and public/live-network qualification remain
separate work. No routine per-order owner signature is introduced.
