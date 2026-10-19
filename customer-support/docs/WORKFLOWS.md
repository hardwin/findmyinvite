# Akay: invitation sales and service workflows

The live WhatsApp desk injects `hermes/skills/fmi-whatsapp-sales/references/WORKFLOW.md`
into the listener, sales, and reviewer on every turn. That file is the plan.
Conversation history is only memory. Do not replace that document with
tighter reply matchers.

## Runtime and source of truth

The system instruction is `hermes/plugin/fmi_support/persona.md`, installed as the
profile's SOUL.md. The business catalog lives in the existing FMI Supabase project.
`video_templates` is separate from the website's `template_catalog`. WhatsApp
speaks `customer_name` (Christian Church Wedding) and never the word template.
The seeded row has the owner-supplied Instagram reel, 100k-view floor, and
₹999 text-change / ₹1,499 face-outfit-theme prices. Exclusive personalised
video is high-ticket and stays unpriced until `custom_price_paise` exists.

Admitted direct WhatsApp messages use Qwen to interpret the whole conversation,
choose a workflow action and compose a short reply. The active executable prompt
is `hermes/plugin/fmi_support/model_workflow.md`, alongside the persona and approved
business knowledge. `qwen_workflow.py` applies typed transitions, verifies detail
provenance, and renders catalog prices and approved links. Raw customer words are
not routed through the old phrase matcher. Add synthetic model evaluations when
customers reveal misunderstood wording; unit tests alone cannot prove model quality.

The model cannot write operator-verified payment or production facts. JSON shape,
allowed actions, template IDs, grounded details, payment prerequisites and monetary
placeholders are checked in code. A literal amount is accepted only if it exactly
matches the selected catalog tier and is then normalized. A standard quote may
also explain the approved personalization price with that scope. The model sees
formatted rupee values, never raw integer paise requiring arithmetic. If an otherwise valid
quote/payment reply omits its mandatory amount or test link, trusted rendering
adds that fact; conversational wording and action choice still come from Qwen. Prose filters are defense in depth, not a proof
against every possible hallucination. Never enable real checkout by merely editing
the prompt: the active 1.5 runtime only renders the explicitly labelled dummy link.

Each customer has one active case in `support_sales_cases`: state (stage, goal,
selected template/tier, quoted price, collected details, missing field, next
 action and team-review reason), separately maintained verified facts, and revision.
Messages remain in support_messages. `support_sales_events` deduplicates inbound
message IDs. Transactional revision checks prevent a stale AI turn overwriting
operator verification. No browser role can access these tables or RPCs.

## Routes and completion criteria

| Case | Workflow / completion condition |
| --- | --- |
| New / undecided | Ask their name first; then who the video is for. Boy names ask bride or relative. Highest-view video is offered first. |
| Known reel | Use Christian Church Wedding, send the Instagram reel as its own bubble, quote text-change `standard_price`, and send the payment link. |
| Unknown reel | Save reference and request team review; never borrow a different video's price. |
| Text change | Quote the listed catalog price and send the payment link. The team does not confirm this amount. |
| Face/outfit/theme/photos | Quote `personalized_price` and send the payment link. |
| Exclusive personalised video | High ticket for the bride/groom. Quote `custom_price` only when present. Otherwise say the price is shared separately and send no payment link. |
| FAQ / discount | Answer only a matching operator-approved policy answer; otherwise record team review. No invented discount. Catalog prices do not need team confirmation. |
| Ready to pay | First conversion: send the labelled dummy link as soon as the SKU and catalog price are known. Real checkout mode still requires the operator-approved payment facts below. |
| Payment claimed | Save claim and request verification; never mark paid from text or a screenshot. |
| Payment failed/pending | Save issue, advise against duplicate payment, collect payment time for review. |
| Payment verified | Collect missing names, date, venue and wording; ask customer to confirm the summary; record production review task. |
| Progress | Report only operator-verified queued/in-progress/preview-ready/delivered status and appropriate URL. |
| Revision | Save exact request for team scope/charge review. No automatic fee, revision allowance or production work. |
| Approval | Record customer approval only against a verified preview-ready status; team prepares delivery. |
| Delivery issue | Use verified delivery link if available and ask what fails; otherwise record team review. |
| Urgent deadline | Save requested deadline; team must approve capacity before payment/delivery promises. |
| Cancellation/refund/complaint | Record request and team-review task; no refund or cancellation is executed. |
| No response | Preserve case indefinitely; no reminders or outbound chasing are scheduled. |
| Human takeover | Existing trusted Hmm/okies pause remains in force. Manual messages stay in history; operators update structured facts when agreeing business actions. |

A recorded team-review task is visible in the case record; it is not a notification,
assignment SLA, rendered video, refund, or completed payment. The conversation
state's control field describes the automated workflow; actual pause authority
remains the durable handover table. Do not infer pause state from sales JSON.

## Operator commands

Use the support host's private credentials. These commands are not model tools.
Inspect the exact customer identity from the support record, then:

```sh
python customer-support/scripts/sales_case.py show --identity 'lid:YOUR_CUSTOMER_LID'
python customer-support/scripts/sales_case.py verify --identity 'lid:YOUR_CUSTOMER_LID' \
  --expected-revision 3 --facts-file /private/verified-facts.json
```

The revision must match the inspected case. On a conflict, inspect again and
reconfirm the change. A verified-facts file may contain:

```json
{
  "payment_status": "paid",
  "production_status": "queued"
}
```

Set paid only after checking the real payment system. Supported payment states:
unverified, pending, paid, refunded. Production states: not_started, queued,
in_progress, preview_ready, delivered. Preview/delivery URLs must be HTTPS.
No payment-provider/webhook integration is implemented in this version.

To approve an eventual live checkout, the operator must supply all of:
`approved_template_id`, `approved_tier` (standard/personalized),
`approved_changes` (exact requested_changes string, empty for standard),
`approved_price_paise`, `scope_approved: true`, `delivery_terms`, and `payment_url`.
These facts must match the current selection. Payment links are never generated
or guessed. Approvals should be reviewed after any changed requirement.
`policy_question` plus `policy_answer` provides an approved answer to that exact
question; there is no universal invented FAQ policy.

The real human team still owns production, media/photo handling, revisions,
refunds, delivery and commercial policy. Another order for the same customer and
multiple simultaneous orders need a future order entity; do not silently overwrite
an existing verified order to create a new one.

## Demo payments and outages

The operator authorized dummy payment links for all customers on 2026-10-19.
After the template, scope and price are confirmed and the customer is ready,
Akay sends `https://example.invalid/fmi-demo-payment` followed immediately by
`(TEST — cannot accept payment)`. No identity allowlist is required. The URL is
intentionally nonfunctional; it cannot collect money or mark an order paid.

Demo mode currently takes precedence over real payment links. To restore real
checkout, change the runtime's `demo_payments` argument to false, run the tests,
reinstall and restart. Real checkout then requires the verified facts above.

Catalog/case retrieval must succeed before a commercial reply. Failed reads or
writes produce the approved holding sentence, without guessing a price or state.
Incoming text is saved locally before cloud requests. Message-history retries
remain durable; stage writes require an online revision-checked transaction.
A crash after recording a reply but before delivery may leave it unsent; replays
are suppressed rather than risking duplicate checkout messages. Generated message
records are not proof of delivery. Delivery receipts/reconciliation remain future work.

## Testing and deployment

Run `python -m unittest discover -s customer-support/tests -v`. The opt-in
`python customer-support/scripts/smoke_qwen.py` tests actual local Qwen decisions
using a synthetic conversation, without database writes or WhatsApp messages.

`python customer-support/scripts/smoke_sales.py --allow-live-write` uses synthetic
model decisions to test persistence independently of model variability. It creates one
synthetic customer, verifies cloud pricing/stages/replays/operator verification,
and deletes the fixture with cascading history. It sends no WhatsApp messages.
Apply the sales migration before installing version 1.4.0. Install from this
checkout and restart the existing gateway. Preserve secrets, private histories
and WhatsApp pairing outside Git; Cursor clones need SETUP.md. Revalidate the
post_gateway_admission callback contract when upgrading Hermes.

## Pricing authority and payment-first funnel — 1.6.0

Owner rule, 2026-10-19: the team does not confirm catalog prices. Akay quotes
`standard_price_paise` for text change on a listed video and
`personalized_price_paise` for face, outfit and theme. Exclusive personalised
video uses `custom_price_paise` only when present; otherwise the price is shared
separately and no payment link is sent.

WhatsApp funnel research used: engage, offer a priced SKU, convert in-chat, then
onboard. Opening asks the name first. FMI treats the payment link as the first
conversion. Date, venue and wording stay after verified payment. Unknown reels,
separate-photo insertion, discounts, refunds and production remain team work.

## Photo personalization knowledge

Owner-approved rule, 2026-10-19: "our pics/photos" means replacing the bride and
groom wherever they appear, in all individual and couple scenes. Version 1.4.3
loads this fact from `business_knowledge.json`, quotes the catalog personalization
price, and asks whether to proceed. It no longer asks the face-versus-insertion
question. Explicit slideshow/separate-photo requests remain a different scope.
Existing cases awaiting the obsolete clarification migrate on the next affirmative
response. No customer records are bulk-rewritten.

## Reasoning and pacing (1.5.0)

The installer writes private `fmi-support-model.json` with the local model URL,
medium reasoning, a 180-second HTTP timeout, a 1,024-token private thinking budget and 1,536-token final-answer budget and
an eight-second minimum response time. The gateway callback budget is 450 seconds;
the runtime abandons generation at 400 seconds and suppresses cancelled workers.
After bounded deliberation, Qwen receives its
private partial draft in a second finalization call with its thinking segment
explicitly closed. The local native `/api/generate` endpoint continues Qwen's
text-only chat template with `raw: true` and a JSON schema. Special role markers
in untrusted content are escaped. This model-specific continuation follows
[Qwen's thinking-budget approach](https://github.com/QwenLM/Qwen3/blob/main/docs/source/getting_started/thinking_budget.md)
and the [Qwen3.5 chat template](https://huggingface.co/Qwen/Qwen3.5-4B/blob/main/chat_template.jinja).
Revalidate the template adapter when changing model families. This is
still a reasoning-led turn; the draft is not trusted business evidence and never
enters history or logs. `medium` is the requested setting; this installation returns reasoning but does not
advertise named effort levels, so it is not a calibrated model-specific tier. There is at
most one model-validation repair. An optimistic database conflict can
rerun the decision against fresh verified facts within the same overall budget.

To change behavior in Cursor: edit the persona, workflow or approved knowledge,
add a regression in `tests/test_qwen_workflow.py`, run the synthetic local-model
smoke test, then reinstall and restart. Changes to Markdown affect every model
turn after installation. Changes to the typed action contract also require code
and tests. Thinking and pacing improve deliberation and readability; Akay must
still be honest about being the virtual assistant if asked.
