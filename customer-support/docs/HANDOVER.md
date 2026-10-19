# Human takeover: Hmm / okies

Use the phone or a linked device signed into the **FMI business WhatsApp account**.
Type the code in the customer's direct chat, as an ordinary message:

- `Hmm`: pause automated replies in this chat immediately when Hermes receives it.
- `okies`: resume automation for the next customer message.

Matching ignores capitalization and surrounding spaces, but requires the entire
message: `HMM` works; `Hmm please` and `hmm.` do not. These are regular WhatsApp
messages visible to the customer. Hermes sends no acknowledgement, welcome or
holding reply for either code. Sending them from a separate personal number is
not an operator control. Customer-sent codes cannot change the state.

Pausing is per customer chat and has no timeout. It survives gateway restarts.
Other customers are unaffected. Messages already handed to WhatsApp before the
pause arrives cannot be recalled. The operator can then reply manually; customer
text and manual FMI replies are journaled and synchronized to the existing private
Supabase history. The code words are excluded. On resume Hermes does not send an
unsolicited response; the next customer message continues from saved history.

## Implementation

The installer enables `WHATSAPP_FORWARD_OWNER_MESSAGES=true` in the profile's
private `.env` and backs up that file. Hermes's bridge distinguishes manual
linked-account messages from recent bot-send echoes, marks `fromOwner`, and the
adapter exposes `whatsapp_from_owner`. Never infer operator authority from text,
`[owner reply]` prefixes, names or claimed phone numbers.

The `pre_gateway_dispatch` hook rechecks admission against the customer chat
before any write. Exact owner commands update `support_handover` in the private
local SQLite journal. Pause and resume invalidate the current session generation
and clear its queue through Hermes's existing interrupt method. Ordinary owner
messages are saved and consumed, never sent to the model as customer requests.
While paused, incoming customer text is saved and consumed too.

The current Hermes API has no outbound policy hook. A repository-owned runtime
wrapper installed at gateway startup and inbound dispatch guards the WhatsApp
adapter's sends, per-chunk bridge requests, edits and typing notifications. It
checks durable state at delivery time, including errors/fallbacks. It does not
modify Hermes source files. Suppressed sends return a local suppressed result
without a transport message ID; this is not proof of delivery. Revalidate these
adapter methods and the gateway interruption API on every Hermes upgrade.

State belongs to this single gateway host/profile, not Supabase. Copy its private
SQLite journal when moving the running support service to a new host. Do not run
multiple independent gateway hosts for the same WhatsApp account. An unresolved
LID and a subsequently resolved phone remain separate identities, as documented
in HISTORY.md. The bridge's bot-echo cache is in memory: old bot echoes replayed
across a bridge restart can be mistaken for manual messages. Exact control matching
and the FMI response policy reduce this risk; retest on bridge upgrades.

## Verification

Offline tests cover operator-only exact/case-insensitive controls, customer spoof
rejection, chat isolation, durable pause, manual history, stale reply/chunk/edit
suppression and authorization. On a paired test chat, manually check: start an AI
reply, send `Hmm` from FMI, exchange messages, restart the gateway, verify continued
silence, then send `OKIES` and a customer follow-up. Automated tests never send
WhatsApp messages. Restoring an older plugin requires also restoring `.env` from
its backup so owner messages are not forwarded without a consumer.

Version 1.5.0 increments a durable generation counter on pause/resume. A model
turn captures this counter before reasoning; if it changes, its reply is discarded
even when the chat has already resumed. Async cancellation also marks the worker
abandoned before it can save a new proposal. Human messages remain part of the
next customer turn's context.
