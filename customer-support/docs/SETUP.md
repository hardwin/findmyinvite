# Install on a support host

## 1. Prerequisites

Use a persistent Linux/WSL host with Python 3.11+, Hermes, and Ollama. Install
Hermes using its official setup; do not assume a cloned FMI repo installs it.
Run `hermes --help`, `hermes gateway --help`, and `hermes plugins --help` on the
installed version before using changed commands. The tested host is recorded
in VERIFICATION.md. Create or select the Hermes profile **dedicated to FMI**.

Configure and pair WhatsApp with `hermes gateway setup`. Pairing/QR material
remains on that host. Review `WHATSAPP_ALLOWED_USERS` in that profile's `.env`:
the current FMI host already accepts all WhatsApp senders (`*`), but the installer
does not widen this list. For public support, explicitly choose that policy;
for development, allow only your own test number. No new-account signup is
required for a customer to be recorded once admitted by Hermes.

Do not run the same paired WhatsApp gateway on two cloned developer machines.
Use a separate test number/profile when experimenting.

## 2. Local model

```sh
ollama list
```

The current host has `qwen3.5:4b-hermes`. It is a local custom tag, not a public
model download. Its inspected parameters are in `config/Modelfile`. On a new host:

```sh
ollama pull qwen3.5:4b
ollama create qwen3.5:4b-hermes -f customer-support/config/Modelfile
```

The recipe inherits the base model's template, renderer, parser, and license,
and sets the inspected 65,536-token context and sampling parameters. Model tags
can change upstream; compare the digests in VERIFICATION.md if exact weight
reproduction matters. No model weights or host-specific blob paths are committed.

The API base must be `http://127.0.0.1:11434/v1`, **one** `http://` and the `/v1`
suffix. `/v1` itself is not a webpage and can return 404. Check `/v1/models` or
POST `/v1/chat/completions`. Keep Ollama on loopback.

## 3. Supabase schema

Reuse the existing FMI project `qqvcptjkfcjkwbkookcm` for the live integration.
Apply `supabase/migrations/20261018153245_customer_support_intake.sql` once using
an authorized migration tool/SQL editor. It creates only the support tables/RPC.
Check the migration history and table existence first; don't apply it twice.
Then apply the `*_customer_support_history.sql` migration for private messages
and the history read/write RPCs. Existing installations need only that second
migration. Install version 1.4.0 after the history migration is ready.

Historical FMI scripts live in `supabase/*.sql` and were not originally tracked
as one CLI migration chain. **Do not blindly run `supabase db push` against
production** or reset its migration history. Use the reviewed additive migration
only. For new development migrations discover CLI syntax with `--help`, create
the filename with `supabase migration new`, and test on a local/test database.

## 4. Credentials and installer

Activate `.venv-support` from the module README. If this checkout already has the
correct ignored FMI `.env.local`, reuse only its two Supabase values:

```sh
python customer-support/scripts/install.py --home "$HOME/.hermes" --env-file .env.local
```

Otherwise copy `config/supabase-secrets.example.json` to the ignored
`config/supabase-secrets.json`, fill it privately, and run:

```sh
python customer-support/scripts/install.py --home "$HOME/.hermes" \
  --secrets-file customer-support/config/supabase-secrets.json
```

A separate profile should use its actual home path. Use a test Supabase URL/key
for test profiles. Never use a browser/publishable/anon key for intake, never
prefix a service secret with `VITE_`, and never paste keys into chat or commit them.

The installer:

1. Backs up affected files under `<home>/backups/fmi-support-<timestamp>/`.
2. Copies the plugin and gateway event hook from this checkout.
3. Merges the config overlay, installs SOUL and customer-safe English messages,
   and enables the plugin. YAML comments are normalized; the original is backed up.
4. Copies only the Supabase URL/service key to `<home>/fmi-support-secrets.json`
   with private permissions. It does not copy other website provider credentials.
5. Records source revision and file hashes in `<home>/fmi-support-install.json`.
6. Records a one-time pre-upgrade local-message cutoff in
   `<home>/fmi-support-history.json`. On each customer's next message, only their
   visible earlier text is imported; the new hooks own subsequent messages.

It does not apply SQL, install model weights, pair WhatsApp, change allowlists,
restart services, or send customer messages.

```sh
hermes plugins doctor "$HOME/.hermes/plugins/fmi-support" --ci
hermes gateway restart
hermes gateway status
python customer-support/scripts/outbox.py status --home "$HOME/.hermes"
```

A graceful restart waits for active turns. On the known systemd host the service
is `hermes-gateway.service`; an operator can use
`systemctl --user restart hermes-gateway.service` when a stalled request must end.
Do not kill unrelated processes or assume this service exists on other hosts.

## 5. Verify

Send a test greeting from an allowed test phone. Expect a simple FMI reply. Within
roughly 30 seconds, inspect only that test customer's support row in Supabase.
Send another message: the customer count should not increase. Start a new Hermes
session: the existing customer should get a second conversation row.
Give a harmless test detail, then ask about it in that new session. The reply
should use the saved detail without a generic welcome. Check `support_messages`
for both sides of the exchange. Do not use real secrets as test messages.

Check `outbox.py status`; pending should return to zero. Simulate outages only in
an isolated profile/test project, then restore credentials and confirm draining.
Do not interrupt production Supabase or send automated messages to real customers
for a test. Normal CI uses mocks and temporary directories, with no cloud access.

Human takeover configuration and upgrade checks: [HANDOVER.md](HANDOVER.md).

Apply `20261018192430_customer_support_sales.sql` before installing Akay sales
workflows; see [WORKFLOWS.md](WORKFLOWS.md) for operator facts and test-only payments.

## Reasoning adapter (1.5.0)

The support host must expose both Ollama's OpenAI-compatible
`/v1/chat/completions` and native `/api/generate` locally. The model first reasons
privately, then the native endpoint continues the bounded thinking segment into a
schema-constrained decision. The text template is specific to Qwen3.5; changing
models requires adapting and testing it. No new packages or cloud inference
credentials are needed. Run `python customer-support/scripts/smoke_qwen.py` before
installing; this uses only synthetic text and never sends WhatsApp messages.
