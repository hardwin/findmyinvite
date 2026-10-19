# FMI customer support

Repository-owned integration for WhatsApp customer support through **Hermes +
local Ollama `qwen3.5:4b-hermes`**, using the **existing FMI Supabase project**
`qqvcptjkfcjkwbkookcm` (`findmyinvite`, Mumbai). This is independent of the
Grok-powered Assembly desk and the website's Vite/Vercel process.

Akay sales and service stages: [WORKFLOWS.md](docs/WORKFLOWS.md).

## What works now

- An admitted direct WhatsApp turn records a customer identity and a conversation.
  An unknown phone creates a customer; subsequent turns reuse that customer.
- `support_customers` stores the WhatsApp identity, available E.164 phone number,
  and first/last contact times. `display_name` is reserved and stays null: the
  current Hermes `agent:start` hook does not expose the sender's display name.
- `support_conversations` stores the customer link, Hermes session ID, open status,
  and first/last contact times. One session per customer creates one row. A Hermes
  session reset/rotation creates a new row, not a duplicate customer.
- A durable local SQLite outbox retries failed writes every 30 seconds, with
  per-item backoff capped at five minutes. Data survives a gateway restart.
- Short FMI replies in simple English. Technical progress is hidden; handled
  errors/busy notices stay in the chat (`still here — say that again?`). The
  Hermes agent plus the `fmi-whatsapp-sales` skill writes customer replies.
- Contact capture is code, not an AI tool: it does not rely on the model deciding
  to save a customer. Customers cannot use it to read other customers' records.
- Customer text and final FMI replies are saved in `support_messages`, with
  durable retries. Before every reply the integration retrieves that customer's
  recent history across Hermes sessions. Existing local text history is imported
  for the verified customer on their next message. Returning customers continue
  their issue instead of receiving a new welcome. See [HISTORY.md](docs/HISTORY.md).

The capture trigger is the first **admitted agent turn**, not merely a packet
arriving at WhatsApp. Rejected callers, groups, and unresolvable identities are
not captured. WhatsApp may expose an opaque `@lid` identifier; that is saved as
an opaque identity with a null phone number, never guessed to be a phone.
If WhatsApp later resolves that LID to a phone, reconciliation is future work;
do not merge people by display name.

This version does **not** implement attachment storage, a customer dashboard,
human notification, scheduled follow-up, account linking, business RAG, or a
complete support orchestration system. The holding reply is not proof that a
human was notified. Customer/assistant text is private history; model reasoning,
tool logs, and attachment bytes are excluded. Hermes also maintains local history.

Owner-only per-chat pause/resume is available: [Hmm / okies](docs/HANDOVER.md).

## Repository map

| Path | Responsibility |
| --- | --- |
| `hermes/plugin/fmi_support/persona.md` | Baseline FMI tone and boundaries |
| `hermes/plugin/fmi_support/policy.py` | Per-turn policy and final-response filter |
| `hermes/plugin/fmi_support/identity.py` | Adapter identity validation/normalization |
| `hermes/plugin/fmi_support/storage.py` | Private outbox and Supabase REST RPC |
| `hermes/plugin/fmi_support/intake.py` | Gateway event processing and retries |
| `hermes/plugin/fmi_support/conversation.py` | History lookup and full-message lifecycle hooks |
| `hermes/plugin/fmi_support/journal.py` | Durable text journal, cloud cache, legacy import |
| `hermes/hook/` | Hermes `agent:start` / startup event adapter |
| `config/hermes-overlay.yaml` | Quiet customer settings and local Qwen model |
| `scripts/install.py` | Back up and install this checkout into a Hermes profile |
| `scripts/outbox.py` | Operator-only pending count and flush |
| `tests/` | Offline behavior tests; no Supabase credentials needed |
| `../supabase/migrations/*_customer_support_*.sql` | Contact and message schemas/RPCs |
| `docs/` | Architecture, operations, installation, verification |
| `persona/`, `orchestration/`, `rag/` | Planned development boundaries |

## Start in Cursor from GitHub

```sh
git clone https://github.com/hardwin/findmyinvite.git
cd findmyinvite
python3 -m venv .venv-support
. .venv-support/bin/activate
python -m pip install -r customer-support/requirements-dev.txt
python -m unittest discover -s customer-support/tests -v
```

On Windows use `.venv-support\Scripts\Activate.ps1`; use WSL/Linux for the
always-on Hermes service. Website development additionally needs Node 22 and
`npm ci`. The support runtime uses Python standard-library HTTP and SQLite;
PyYAML is only needed by the installer/tests (Hermes already depends on it).

Then follow [SETUP.md](docs/SETUP.md). A Git clone supplies code and documentation,
**not** WhatsApp pairing, model weights, Supabase secrets, or a running service.
The machine running Hermes must stay online; Vercel deployment does not run
this integration or make a laptop's `127.0.0.1` reachable from another host.

Development instructions: [AGENTS.md](AGENTS.md). Design:
[ARCHITECTURE.md](docs/ARCHITECTURE.md). Operations and rollback:
[OPERATIONS.md](docs/OPERATIONS.md). Evidence: [VERIFICATION.md](docs/VERIFICATION.md).

## Model-led conversations

Version 1.6.3 uses local Qwen with reasoning enabled to read the workflow and
customer history, choose the next action and write each reply. Trusted code checks
prices, links, state transitions and human takeover. Customer chat says video,
uses `customer_name`, and sends the Instagram reel as its own bubble. Catalog
prices come from `video_templates` and do not wait for team confirmation. A new
customer's first conversion is the payment link. Responses have an eight-second
minimum pace, including model processing time. See [workflows](docs/WORKFLOWS.md)
and `hermes/plugin/fmi_support/model_workflow.md` for the active instructions.
