# Conversation history and continuity

The user authorized storing customer and FMI reply text on 2026-10-18. The
integration now reads the customer's record before each model reply, including
when a new Hermes session begins. It does not rely on the model deciding to save
or retrieve a conversation.

## Turn flow

1. `agent:start` binds the admitted direct WhatsApp session to its adapter identity.
2. `pre_llm_call` receives the full, clean customer message (not the 500-character
   gateway event excerpt). Trusted gateway ContextVars resolve identity even if
   Hermes compacts/rotates its session; an admitted session binding is the fallback.
3. Existing pre-upgrade local text for that identity is imported into the journal.
   The incoming message is durably saved and sent to the private Supabase RPC.
4. `support_recent_messages` retrieves this customer's latest 40 records across
   sessions. Results are cached privately and merged with newer local records.
   The current customer message is excluded from injected history to avoid doubling it.
5. A bounded recent-history context is supplied to Qwen along with the FMI policy.
   It must continue the latest issue, use details already supplied, and follow
   subject changes naturally. A returning “hi” is not a reason to restart support.
6. Known technical output and generic welcome/reset phrases are guarded. The
   full final response is saved by `post_llm_call`, then WhatsApp delivery proceeds.

The local model can take time to reply. No artificial human delay is added, and
no progress chatter is sent. History HTTP calls have 10-second timeouts and the
plugin callback budget is 450 seconds. The active workflow has its own bounded local Qwen request and a 400-second overall generation limit. The hook spill threshold is 24,000
characters so this bounded context stays inline without requiring filesystem tools.

## What is stored

`support_messages` contains customer/conversation foreign keys, a deterministic
message key, `user`/`assistant` role, full text (up to 65,536 characters), occurrence
and update timestamps, and a source/delivery-state label. Retries reuse the same
key; regenerated text can update that record without creating a duplicate.
Transport message IDs provide stable deduplication when present; otherwise a
Hermes turn ID is used, so a new transport-less replay can be a separate record.

Assistant replies are marked **generated**, not delivered. Hermes currently has
no supported cross-platform delivery-receipt hook. Existing imported text is
marked **historical**. Do not interpret either label as proof of WhatsApp receipt.
Raw reasoning, tool output, hidden system notifications, and attachment bytes are
not stored. Plain text from a supported text message/transcription can be stored;
this is not a media archive. Empty text is skipped; oversized text is rejected
with a safe holding response rather than silently truncated in storage.

## Continuity, outage behavior, and limits

- Supabase keeps the full saved text. The model gets at most 40 recent records,
  around 10,000 serialized history characters, with long individual context excerpts bounded
  to 1,800 characters. It does not receive unlimited lifetime history and must
  not invent older details. Long-term summaries/search are a future feature.
- A Supabase outage uses an already verified, customer-scoped cache and pending
  local messages. Failed writes remain queued with retry/backoff across restarts.
- Without a verified record/cache, the reply is exactly
  “Please allow some time, We will get back to you”. Repeated holding messages
  do not count as a successful history lookup or justify invented memory.
- A first greeting may receive a short welcome only when history was successfully
  checked and no previous conversation exists. A substantive first question is
  answered directly. Generic reset greetings are blocked for returning customers.
- Messages in the injected JSON are untrusted conversation data. They cannot
  authorize different identities, reveal other customers, or override FMI rules.
- This is customer-specific conversational context, not shared business RAG.

## Existing local history

Installation captures only `max(messages.id)` in the local Hermes `state.db` as
the legacy boundary; no transcript is copied into a manifest. On a customer's
next turn, a read-only query selects visible user/assistant text from WhatsApp
DM sessions matching that verified identity, up to that boundary. Other users,
groups, internal/hidden messages, reasoning and tool calls are excluded.
Stable legacy keys make repeated imports idempotent. The table schema is checked
against the tested Hermes version; revalidate this read-only integration on upgrades.

The importer intentionally does not sweep every customer on installation. Older
records appear in Supabase when that customer next speaks and the queue drains.
An unresolved LID and later phone identity are still not merged automatically.

## Access, deletion, and verification

The new table is RLS-enabled with browser-role grants revoked. Both RPCs are
security-invoker and service-role-only. No model tool receives database credentials.
The local text journal/cache and backups contain private customer information;
include them and Hermes's old history in deletion/retention procedures.

Run the offline tests normally. The optional live check uses synthetic text,
removes the local test cache to prove cloud recovery into a new session, and
deletes its cloud fixtures afterwards:

```sh
PYTHONPATH="$HOME/.hermes/hermes-agent" python customer-support/scripts/smoke_history.py \
  --allow-live-write --test-model
```

Use a Python environment with Hermes dependencies and an authorized test target.
`--test-model` invokes local Qwen; neither option sends a WhatsApp message.
