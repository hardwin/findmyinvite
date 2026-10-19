# Support operations and rollback

## Human takeover

See [HANDOVER.md](HANDOVER.md): send `Hmm` from the linked FMI account to pause
a customer chat; send `okies` to resume. State survives restarts without expiry.

Operator test gates live in `hermes/plugin/fmi_support/secret_gates.json`.
Do not tell customers they exist. See [SECRET_GATES.md](SECRET_GATES.md).

## Monitor

- `hermes gateway status`: process and WhatsApp connection.
- `python customer-support/scripts/outbox.py status --home <profile-home>`:
  pending contact and message counts, no phone numbers or message text printed.
- `python customer-support/scripts/outbox.py flush --home <profile-home>`:
  retry currently due records manually. Backoff remains in force.
- Search local operator logs for `FMI support`; errors deliberately omit phone
  numbers, message text, and credentials. Hermes's own existing logs/history can
  contain conversations; restrict host access and include them in retention work.
- If pending stays nonzero, check host networking, the private Supabase config,
  project health, migration/RPC existence, and service-role grants. Then retry.
  Do not ask customers to run `/retry`, `/model`, or other technical commands.

The queue survives model/provider failures and restarts. It is not a human-support
ticket queue: a fallback reply does not create an assignment or notification.
If the machine is off, neither model replies nor outbox draining run.

## Update from Cursor/GitHub

Change repository files, run tests, review the diff, then reinstall to the intended
profile and restart Hermes. The installed files are copies: editing this checkout
alone does not change a running gateway. The installer records file hashes so an
uncommitted checkout can still be distinguished from a release commit. Release
through the team's normal GitHub review process; this task does not auto-push.

No general-purpose model tools are enabled for WhatsApp in the baseline. Add
scoped customer-support tools only with ownership checks, tests, and a documented
authorization model. Never give a public customer conversation a service key or
unrestricted terminal/filesystem access. Keep the Assembly/Grok desk separate.

## Privacy and corrections

This is a support contact record, not marketing consent or an authenticated FMI
account. Do not automatically subscribe contacts to marketing. No inferred names,
emails, account links, transcript embeddings, or commercial profiling are saved.
Define the business retention period and privacy request owner before expanding
the stored data; this module does not invent either.

For a verified deletion request, stop intake for the relevant identity while the
request is processed; remove its pending outbox records, text journal, cached
history, turn bindings and then its exact `support_customers.id` (conversations
and messages cascade). Include Hermes's local history,
logs, backups, and any later systems in the process. Deleting only the database
row while an outbox entry remains will recreate it. Never delete by ambiguous
display name or bulk-delete all support tables. Remove matching pre-upgrade
Hermes history too, otherwise the customer-scoped legacy importer can restore it.

If an opaque LID later resolves to a phone, investigate using verified adapter
mapping before merging rows. Do not assume a numeric LID is a phone number.

## Rollback

1. Stop the intended gateway to avoid a partially restored runtime.
2. Use the exact backup printed by the installer. Restore its `.env`, config, SOUL,
   locale, plugin, hook and `fmi-support-model.json` files. If a plugin/hook did not exist in the backup,
   remove only that newly installed directory. Restore the prior secrets file
   when applicable; do not display it.
3. Keep `state/fmi-support/outbox.sqlite3` until pending data is drained or a
   deliberate privacy/data-removal decision is made.
4. Start the gateway and verify the model/WhatsApp connection.

Application rollback does not require dropping support tables. Preserve existing
customer records. A database rollback/destructive migration needs a separate
review, backup, and explicit scope. Do not reset unrelated FMI tables.

## Upgrading Hermes

Check the installed version and source revision. Validate the plugin with
`hermes plugins doctor`, confirm `agent:start` still contains the same identity
fields, and verify namespace/phone handling and admission ordering. Test normal
greetings, busy follow-ups, provider outage, empty response, and restart notices
in a test profile. New built-in error messages may require locale coverage.
Do not patch Hermes core as the primary implementation; use the supported hooks.

## Reasoning workflow diagnostics

The model settings are in the private profile file `fmi-support-model.json`.
The installer regenerates it from the repository defaults. Look for `FMI Qwen
workflow generation completed` to check duration, finish reason, requested effort
and whether a separate reasoning field was returned. These logs exclude reasoning
text and customer messages. A holding reply indicates a failed dependency or a
proposal rejected twice; investigate locally instead of enabling technical notices.
