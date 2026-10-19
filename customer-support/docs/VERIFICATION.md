# Verification — 2026-10-18

## Environment

- FMI repository: `hardwin/findmyinvite`; support changes are in this checkout.
- Existing Supabase project: `qqvcptjkfcjkwbkookcm`, name `findmyinvite`, region
  `ap-south-1`; healthy when checked. No second project was created.
- Hermes source: `d923a5eb487a17c0a68801bba9ef0f56c81040a8`.
- Gateway: user systemd `hermes-gateway.service`, default FMI profile.
- Local model: `qwen3.5:4b-hermes`, Ollama base `http://127.0.0.1:11434/v1`.
- Inspected model digest: `c727d70306002e9d13bd0ad52e9da8d890ed532d9a75ffafa21ce2ac9ddec6ca`.
  Base `qwen3.5:4b` digest: `2a654d98e6fba55d452b7043684e9b57a947e393bbffa62485a7aac05ee4eefd`.
  Portable model parameters are captured in `config/Modelfile`; weights stay out of Git.
- Offline tests: Python 3.13.9; installer PyYAML 6.0.3. Live hook smoke also ran
  through the installed Hermes runtime. Website build used the available Node
  26.7.0; repository/CI instructions continue to require Node 22.

## Checked

1. All 13 support behavior tests passed: identity normalization, LID handling, group rejection,
   metadata-only payloads, durable restart, coalescing, backoff, concurrent enqueue
   during flush, customer-safe replies, installer preservation/backups, private
   HTTP headers, and sanitized transport errors.
2. Hermes Plugin Doctor passed for `fmi-support 1.1.0`, two hooks, zero model tools.
3. Live schema migration `customer_support_intake` applied successfully. Its
   recorded version is `20261018153245`; the CLI-generated source filename was
   aligned with that applied history version. No existing tables were modified.
4. Database transaction test (`tests/database.sql`) passed as `service_role` and
   rolled back: duplicate contacts/sessions reused IDs, a new session created a
   second conversation, and out-of-order times merged correctly.
5. Live REST smoke used the **installed Hermes HookRegistry and event handler**
   in an isolated temporary profile with a synthetic LID. It exercised the
   durable outbox/background worker and real RPC: one customer, two conversations.
   All synthetic records were removed and cleanup verified. No WhatsApp messages
   were sent by the test.
6. Database privilege checks: RLS true on both new tables; `anon` and
   `authenticated` have no table access or RPC execution; service role has access.
   The RPC is `SECURITY INVOKER`, not definer.
7. Actual Hermes toolset resolution returned `[]` for WhatsApp.
8. `npm run build` passed (existing bundle-size warning).
9. Repository-managed module installed into the existing FMI profile; gateway
   restarted, the `fmi-customer-intake` hook loaded, WhatsApp connected, and local
   outbox pending count was zero after activation. No real customer history was
   backfilled. Source changes have not been committed or pushed by this task.

`npm run test:server` is not fully green: 23 of 29 existing test files passed;
failures are `server-assembly-chat`, `server-assembly-cloud`,
`server-assembly-template1`, `server-assembly`, `server-storyboard-astra`, and
`server-storyboard-workflow`. These server/test files are unchanged by support
work. A direct run of the Assembly chat test shows its pre-existing expectation
for “Pinterest” no longer matches the current prompt. These failures remain
outside this module; a passing support test run does not imply a green website suite.

Supabase advisors report only the intentional “RLS enabled, no policy” info for
the new backend-only tables. Browser grants are revoked; do not add permissive
policies to silence it. The pre-existing project warning for disabled leaked
password protection remains unrelated to this module. See
[RLS advisor](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)
and [password protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Repeat checks

```sh
python -m unittest discover -s customer-support/tests -v
hermes plugins doctor "$HOME/.hermes/plugins/fmi-support" --ci
python customer-support/scripts/outbox.py status --home "$HOME/.hermes"
```

The opt-in live smoke requires Hermes Python dependencies/imports, an installed
support module, configured credentials, and an authorized database target:

```sh
PYTHONPATH="$HOME/.hermes/hermes-agent" python customer-support/scripts/smoke_live.py \
  --home "$HOME/.hermes" --allow-live-write
```

Run with the Hermes runtime environment if the normal Python environment cannot
import `gateway.hooks`. The script does not install dependencies or send messages.
Normal CI never runs this live test or receives Supabase credentials.

Still requiring a human end-to-end check: send a fresh WhatsApp greeting after
the install and confirm that exact customer's row appears. The live smoke proves
the hook-to-database path; it does not claim to have sent/received a real new
WhatsApp message. No approved RAG, account tools, or human follow-up workflow has
been implemented in this phase.

## Conversation continuity update

- Applied `20261018155337_customer_support_history`: private text history and
  service-role-only save/read RPCs; checked invoker rights and browser-role denial.
- All 22 support tests pass, including replay/update deduplication, scoped legacy
  import, cross-session recall, customer isolation, long messages, revision-safe
  synchronization, and safe behavior when history is unavailable.
- Installed Plugin Doctor passes for `fmi-support 1.2.0`: three hooks, zero tools.
- Live synthetic test saved messages, deleted the local test state, and recovered
  the customer's history from Supabase in a new session. Local Qwen correctly
  recalled “November 7th in Jaipur” and continued the invitation-link question.
  The successful test mirrored Hermes's user-message context injection and used
  an 8,192-token completion budget. An initial 2,048-token test did not produce
  the required answer; production generation limits were left unchanged.
- Generic restart greetings are replaced with the approved holding sentence.
  History context is bounded below the configured hook-spill threshold.
- Synthetic records were removed and cleanup verified. No test sent WhatsApp
  messages. Real end-to-end WhatsApp behavior still needs a customer-side message.
- History import occurs only for the returning identity on its next message;
  there was no bulk backfill. Current source changes remain local and uncommitted.

## Manual handover update

- Installed `fmi-support 1.3.0`; Plugin Doctor passes with four hooks and zero tools.
- All 29 offline support tests pass, including exact/case-insensitive owner
  controls, rejected customer controls, authorization/group boundaries, pause
  persistence, customer isolation, retained manual conversation, suppressed late
  sends/chunks/edits/typing, resumed delivery and failed-interruption safety.
- The gateway is active and the WhatsApp bridge reconnected. Its running process
  has `WHATSAPP_FORWARD_OWNER_MESSAGES=true`; no secret values were printed.
- No WhatsApp messages were sent by tests. A manual paired-device test remains
  necessary to verify the complete phone-to-bridge control flow. See HANDOVER.md.
- Code changes remain in this local checkout; no commit or GitHub push was made.

## Customer notice and holding-reply correction

- Version 1.3.1 removes the first-contact home-channel locale notice and blocks
  blank/setup notices at the WhatsApp delivery boundary. No customer is assigned
  as an operator home channel.
- History lookups were succeeding; the policy was too broad about missing details.
  It now asks a relevant question for greetings, design requests and acknowledgements
  instead of treating missing information as a service outage. Previous AI promises
  are explicitly not verified business facts.
- Local Qwen reasoning is disabled via `agent.reasoning_effort: none` to avoid
  long internal generation on ordinary support turns. Context/history stays enabled.
  Ollama's OpenAI compatibility supports this field:
  https://github.com/ollama/ollama/blob/main/docs/api/openai-compatibility.mdx
- All 30 offline tests pass; Plugin Doctor passes with four hooks and no tools.
  `scripts/smoke_replies.py` exercises synthetic messages through local Qwen;
  it sends no WhatsApp messages and does not read customer records.

## Akay workflows — 2026-10-19 IST

- Applied migration `20261018192430_customer_support_sales`, adding a private
  video catalog, revision-checked cases, idempotent events and operator verification.
  Seeded the owner-provided Church Christian Wedding Template v1 reel with
  99900/149900 paise prices; no full-custom price was invented.
- Version 1.4.0 Plugin Doctor passes: five hooks, zero model tools. All 51 offline
  support tests pass. The build passes with its existing bundle-size warning.
  The server test suite retains the six pre-existing Assembly/storyboard failures
  documented above; those source/test files were not changed.
- Live synthetic Supabase test passes: catalog quotes, stored stage, replay
  deduplication, payment claim versus verification, paid detail collection, stale
  write rejection, message persistence and cascading cleanup. No WhatsApp test
  messages were sent.
- All three new tables have RLS and no anon/authenticated reads. All three RPCs
  are security-invoker with browser execution revoked. Advisors report intentional
  backend-only RLS-without-policy info and the unchanged leaked-password warning;
  remediation links are in the earlier verification section.
- Real checkout, automatic payment verification, production, media collection,
  refunds and team notifications remain operator/integration responsibilities.
  Test identities are empty by default; live customers never receive dummy links.
- Source and documentation remain local/uncommitted; no GitHub push was made.

## Public demo payment update — 2026-10-19

The operator explicitly authorized dummy links for all customers, superseding
the earlier test-identity restriction. Version 1.4.1 sends the dummy URL followed
by `(TEST — cannot accept payment)` after scope/price confirmation and payment
intent. All 51 support tests pass. Payment verification remains separate; dummy
links cannot collect money or mark a customer paid.

## Photo-personalization fix

Version 1.4.2 adds the reported “our pics” conversation as a regression test,
including confirmation and the labelled demo payment at ₹1,499. Separate-photo
insertion and negative photo requests are tested independently. All 55 offline
support tests pass. No customer messages or stored cases were edited by this fix.

## Owner-approved photo scope — version 1.4.3

The owner corrected the photo interpretation: all groom/bride appearances, both
individual and couple scenes. The installed business knowledge is consumed by
the workflow and included in the persona. The unnecessary clarification is removed.
All 56 support tests pass, including compatibility with previously pending photo
clarifications. Prices continue to come from Supabase.

## Reasoning-led workflow — version 1.5.0 (2026-10-19)

- Admitted customer turns now call local Qwen with workflow instructions, scoped
  history, approved photo knowledge, catalog and verified case facts. The legacy
  phrase matcher no longer composes these replies.
- Verified actual reasoning output from this model. Unbounded thinking exhausted
  the generation budget, so each turn now uses up to 1,024 thinking tokens then
  continues after a closed thinking segment via the native local generate API.
  The final structured decision has a separate 1,536-token limit. Reasoning is
  ephemeral and excluded from customer history/logs.
- An eight-second minimum includes processing time. Synthetic four-turn
  conversations took roughly 11–31 seconds per generation (a validation repair
  can extend a turn to about a minute): standard template,
  semantic photo replacement, labelled test checkout, and unverified payment claim.
- All 74 support unit tests pass. Regression coverage includes trusted catalog rendering, invalid amounts,
  placeholder normalization, semantic details confirmation, history/isolation,
  deduplication, pacing and cancellation across pause/resume.
- The live Supabase persistence smoke used synthetic model decisions and cleaned
  up its own synthetic contact/case/messages. No WhatsApp test messages were sent.
- Website build passed. The server suite retains six failures in the same
  unrelated Assembly/Storyboard files recorded before this change.
- The actual WhatsApp conversation still needs an operator/customer acceptance
  test; passing synthetic cases is not a guarantee for every phrasing.

## Reasoning-led activation — 2026-10-19 16:18 IST

- Price-guard fix is active: catalog context sends display rupees (`₹999` /
  `₹1,499`); integer paise stay authoritative in the database and validators.
- Live `smoke_qwen.py` passed on this host: quote_standard → personalize_photos →
  request_payment → payment_claim (≈17–37s per turn; prices correct).
- Installed `fmi-support 1.5.0` into `$HOME/.hermes` (backup
  `fmi-support-20261019T104802896110Z`). Plugin Doctor OK: 5 hooks, 0 tools.
- Model config: `reasoning_effort: medium`, `minimum_reply_seconds: 8`.
- Gateway restarted; WhatsApp bridge on business number connected; outbox pending
  contacts/messages = 0. Operator should send one test DM to confirm paced Qwen
  replies on +91 97401 03028.

## Payment-first catalog funnel — version 1.6.0 (2026-10-19)

- Owner rule: team does not confirm listed or custom catalog prices. Amounts
  come from `video_templates` (`standard_price_paise` as shown, `personalized_price_paise`
  as listed custom; optional `custom_price_paise` if later added).
- Funnel start is the payment link. A matched listed SKU now quotes and sends
  the labelled demo checkout in the same turn. Details stay post-payment.
- Live table at activation: Church Christian Wedding Template v1, ₹999 / ₹1,499.
  No third custom amount was invented.
- Knowledge installed in `business_knowledge.json` and the Qwen workflow prompt.
- Live `smoke_qwen.py` on this host: listed quote ₹999 + payment link → photo custom
  ₹1,499 + payment link → unverified “I paid”. Turns ~6–17s.
- Installed `fmi-support 1.6.0` (backup `fmi-support-20261019T111324881060Z`).
  Plugin Doctor OK. Gateway restarted; WhatsApp connected; outbox empty.

## Operator `/new` gate — version 1.6.1 (2026-10-19)

- Secret gates catalog: `hermes/plugin/fmi_support/secret_gates.json`.
  Not injected into the model. `/new` from any DM resets that identity and
  replies with the first-contact greeting.
- Applied `support_conversation_reset` on project `qqvcptjkfcjkwbkookcm`.
  Service-role only; browser roles revoked.

## `/new` no longer uses Hermes slash — 1.6.2

Hermes treated `/new` as its session command and leaked a confirm prompt plus
model/endpoint banner. `pre_gateway_dispatch` now consumes `/new` first, resets
the FMI case, and sends only the first-contact greeting. Other WhatsApp slashes
(`/approve`, `/model`, `/help`, …) are swallowed. Technical reset banners are
filtered if they still appear.

## Customer-facing video chat — 1.6.3 (2026-10-19)

- `video_templates` now has `customer_name`, `instagram_views`, `instagram_page`.
  Church row speaks as Christian Church Wedding, 100k-view floor, reel
  `Dd9nJFRTWpB`, shop page https://www.instagram.com/findmyinvite.ai
- Context orders videos by views descending. The model catalog omits the
  internal Template v1 name.
- Customer chat says video, never template. Opening asks the name first.
  Exclusive personalised video is unpriced until `custom_price_paise` exists.
- Replies send as 1–3 WhatsApp bubbles; the reel URL is its own message.

## Hermes skill owns WhatsApp — 1.7.0 (2026-10-19)

- Normal DMs go to the Hermes agent. The plugin no longer writes the sales reply.
- Skill: `hermes/skills/fmi-whatsapp-sales/SKILL.md` (installed under
  `~/.hermes/skills/`). Prices are blank until filled in that file.
- Opening: `Your name please?` Hold line is `still here — say that again?`
  instead of “we will get back to you”.
- `/new`, Hmm/okies, and slash swallow stay in the plugin.

## OpenAI default and a blank /new — 1.9.2 (2026-10-19)

- OpenAI is the default backend. `/new` does not flip it back to Ollama.
- After `/new`, only messages newer than that reset stay in the prompt. Older names on the same number stay out.

## Workflow on every turn — 1.9.1 (2026-10-19)

- Listener, sales, and reviewer each receive `references/WORKFLOW.md` before they generate.
- Chat history stays as memory. The workflow is the plan. No new canned matchers.

## Sales desk and /switch — 1.9.0 (2026-10-19)

- Customer turns go through a listener agent, a sales agent, then a reviewer agent. Tight canned replacements are off the live path.
- `/switch`, `/switch ollama`, `/switch openai` are operator-only. OpenAI uses `OPENAI_API_KEY` from env.

## Price after the pick — 1.8.3 (2026-10-19)

- A collections or faces question does not say “pay first”.
- Text change quotes ₹999. Text change with face quotes ₹1499. Then the test payment link.
- Full custom still has no amount. Other rupee amounts stay blocked.
- “How much” before a pick lists the two prices and does not send the link.

## Collections, then pay — 1.8.2 (2026-10-19)

- “Yes show” is not a name. It sends the shop and the reel.
- “For me” asks to see the collections. It does not become full custom.
- A liked video asks about bride and groom faces, then text change, text change with face, or a full custom creative invite.
- A date before payment is not locked in. Pay first. The designer collects details after.

## Regression chat loop — 1.8.1 (2026-10-19)

- Suites live in `customer-support/regression/chat_cases.json`.
  `payment-loop-1` is the first ten. `payment-loop-2` is the next ten.
- `python customer-support/scripts/regression_chats.py` replays a suite
  and appends pass/fail to `regression/learning.jsonl`.
- A passed suite is not rewritten. New chats go in a new suite.

## Blank price still pays — 1.8.1 (2026-10-19)

- A reply with a rupee amount is stripped while Pricing is blank. If they have
  a video and an offer and ask to pay, the reply must be the TEST link.
- “I paid” cannot be confirmed. The fallback asks what time they paid.
- Paying before a video and an offer does not force the link.

## Agent layers, no name list — 1.8.0 (2026-10-19)

- The boy-name list is gone. A gender tool returns boy, girl, or unknown.
  The main reply is told that result and cannot reclassify the name.
- Layers on a customer turn: Instagram data, policy, gender tool, main reply,
  quality check. A failed quality check is discarded.
- Hermes already has a learning journey (`agent.learning_graph`: skills and
  MEMORY.md). Customer memory stays off. FMI writes an operator retrospective
  without the customer’s name. A subagent may propose a new tool; that
  proposal is stored and not executed.
- Test chats: Ashok +916362260992, Supriya +918050284700. Lookup:
  `python customer-support/scripts/last_conversation.py Ashok`

## Name does not skip to full custom — 1.7.3 (2026-10-19)

- A name-only message is not an offer. Replies that mention full custom,
  exclusive, a reel, or payment are rejected.
- Fallback is one bubble: boy name asks bride or a relative of the bride;
  any other name asks who the video is for.
- That turn’s instruction is only the next question. Opening sits above
  the full-custom paragraph in the skill and persona.

## Listen, no loop — 1.7.2 (2026-10-19)

- Persona is a cool local Indian editor bro, not CRM.
- Invented assistant history (Valakapou, the 5th, team brief) is dropped
  before generation. Repeated or invented replies are rejected and retried;
  last resort acknowledges what they just said.
- Markdown links are stripped so WhatsApp does not send broken `[text](`.
- Full custom stays on the exclusive path; do not re-dump a listed reel.

## One-shot skill reply — 1.7.1 (2026-10-19)

- Customer DMs no longer enter the Hermes 150-iteration thinking agent. That
  path hung “Albert” for minutes on thinking-only continue.
- `handle_sales` now does one local `/api/chat` with `think: false`, 25s
  timeout, 256 tokens, skill + last 8 turns. Then 1–3 WhatsApp bubbles.
- `/new`, Hmm/okies, and the payment tunnel stay in the plugin.
