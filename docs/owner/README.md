# FMI owner command centre

Local review: **http://127.0.0.1:5173/akay**. Sign in as **AkayAdmin** with the initial password supplied by the owner. The password is not part of source or this document.

## Running and boundaries

`npm run dev` starts React/Vite and the real server handlers. Node 24 is required for the local private SQLite store. The owner account has been provisioned in this worktree. On a fresh machine run `node scripts/provision-owner.mjs --local` and enter a password at the hidden prompt.

Owner records live in ignored `work/owner/private.sqlite`; OAuth credentials are encrypted using ignored `work/owner/vault.key`. Keep both private and back them up together. Existing FMI orders, invitations, analytics, catalogue and production records are read from the configured FMI source. Changes through the old CMS/production/research endpoints are blocked in local owner mode because those endpoints still target production. New owner tickets, leads, expenses, articles, preferences and test API reports are local. No production migration or deployment is performed by starting the app.

Do not enter fictitious income into the main review database. Automated integration tests use independent disposable databases under `work/owner-tests` and mock external providers.

## Workspaces

The sidebar contains all twenty approved workspaces. Orders expose capture/publication timelines and customer details. Finance separates GST, refunds, recorded expenses, legacy monthly costs and payment-date reconciliation. Offline/custom/video sales support immutable partial-payment and refund entries. Templates embed the existing version/form/release CMS. Traffic separates shopping activity from known guest invitation visits. Projects support persistent Kanban movement, keyboard stage selection, checklists, comments and resource assignment. Calendar combines deadlines, scheduled articles and hosting renewals.

Marketing and search have provider authorization, account selection, synchronization and structured report imports. They remain **not connected** until authorized accounts exist. Organic Leads accepts account/day snapshots and optional individual inquiry records. Search & Content includes search performance, bounded technical audits, competitors, fixed AEO benchmarks, editorial revisions, scheduled articles and the existing topic queue. Watch Mode supports fullscreen, optional 30-second rotation, pause, view selection and privacy masking. Visible operational views refresh every 30 seconds; other reports every 60 seconds; hidden tabs suspend polling.

## Reporting rules

The dashboard opens on Today in Asia/Kolkata. Yesterday, rolling periods and custom dates apply to dated activity. Today’s online collections are compared with yesterday through the same time. Each section shows its last successful refresh and identifies sources serving cached data.

Sales rows use permanent order numbers. If numbering is unavailable, the original order ID identifies the row. Open a row for its full timeline. The table displays the reporting activity in IST. For a DIY video, FMI records the unlock time after verifying payment. The design name comes from the storefront definition or the historical video catalogue.

- Money is stored in integer minor units. INR is the default. Other-currency orders and production USD spend remain separate. No exchange rate is invented.
- Collections, refunds, recorded GST and net sales are distinct. Operating result is an estimate based on recorded costs. Verified capture dates take priority. Older captured website payments with a recorded payment-applied timestamp use that timestamp for dated reporting, labelled “Payment applied to invitation”; the original capture date remains unknown. Orders lacking both timestamps or verified GST remain flagged for reconciliation. Order creation time is never substituted.
- Manual payment/refund entries are immutable; corrections require a compensating entry with a unique source reference.
- Imported ad costs use `ads:PROVIDER:ACCOUNT:YYYY-MM-DD`; externally reported run costs use `run:RUN_ID`. Use those same source references when reconciling an itemised expense to avoid duplicate cost recognition.
- Website visitors, guest visits, inquiries and purchases are separate overlapping populations. No combined “total customers” metric exists.
- Attribution is last non-direct within 30 days only after the visitor enables discovery attribution through **Analytics choices** in the public footer. Personal invitation answers are never collected.
- Query-level Search Console rows may omit anonymized/top-row-limited data. Property totals are fetched independently. Reporting dates retain Pacific time and incomplete-period flags.
- AEO comparisons apply only to a fixed benchmark, engine/surface/locale and observed date. API experiments are separate from consumer observations. Evidence is retained; no universal AI rank is claimed.

## Grok integration

### Read captured sales and template performance

In Settings & connections, open **Read captured sales** or **Read named template performance** using the signed-in owner session. For an agent, issue a separate key with only `sales:read` in the existing External agent keys panel. Send it in the `Authorization: Bearer` header.

- `GET /api/owner?action=sales-report&view=captures&period=today` returns online captures with their amount, GST, currency, product name, recorded payment date and date basis. Refunded captures carry their current status.
- `GET /api/owner?action=sales-report&view=templates&days=7` returns named design performance, including DIY videos. Revenue is in INR paise. Journey counts use recorded sessions.
- Use `period=yesterday` or `period=custom&from=YYYY-MM-DD&to=YYYY-MM-DD` for other IST business dates. To detect new captures across midnight, poll an overlapping window such as `days=7` and deduplicate by `orderId`. Retry the same window on HTTP 503. Each successful response identifies its oldest contributing source read.

### Submit operational updates

1. Add Grok as an **Agent** in Team & Agents. Create a separate key for the intended scope in Settings. Copy the key once into Grok's secret store.
2. POST JSON to `/api/owner?action=ingest`, with `Authorization: Bearer <key>` and `Content-Type: application/json`.
3. First send `dryRun: true`. This validates without saving business data; it still consumes the request rate allowance.
4. Inspect **every** entry in `results`. HTTP 200 can include rejected records. Successful entries include FMI `id`, `revision`, and daily `reportRevision`; the envelope includes `receivedAt`.
5. For non-daily updates send the last accepted FMI `revision`. A 409 means the source changed; refresh the record/revision with the owner instead of overwriting blindly.

Schemas: [OpenAPI 3.1](grok-openapi.json), [daily dry-run example](daily-report.example.json), [lead dry-run example](lead.example.json). Regenerate after schema changes with `node scripts/generate-owner-openapi.mjs`.

| Scope | Accepted kinds | Restrictions |
|---|---|---|
| `sales:read` | Captures and template performance | Read-only reporting via GET |
| `organic:write` | `daily`, `lead` | Inquiries only; no DM transcripts by default |
| `research:write` | `observation` | Dated source/evidence; benchmark references must match |
| `content:draft` | `article` | Idea, Brief, Draft or Review only |
| `tickets:write` | `ticket` | Existing tickets assigned to that agent within selected projects |
| `runs:write` | `run`, `time` | Stable external IDs; the same assigned resource/project |

Keys do not grant owner access, public publishing, messages, ad spending or financial edits. Revoke a key in Settings. The default request allowance is 300 requests/minute/key, 100 records/batch, 500 KB/batch.

Daily reports use **Asia/Kolkata business dates**, one replacement snapshot per platform/account/date. `sourceRevision` must increase when a report changes. Exact retries are idempotent; an older revision or different payload at the same revision is rejected. Account totals and per-post breakdowns are separate views. Comments + DMs count inquiries, not unique people; `uniqueInquirers` is optional. Individual lead records enrich totals and are never added to them. Contact matching uses reliable account/contact IDs or an explicit owner merge, never display names.

Configure expected organic accounts in Settings. Missing reports mean unknown activity; complete zero reports mean no inquiries. Today is “so far” until complete. Yesterday becomes overdue after 10:00 IST without a complete report. Trends compare fourteen complete calendar days. Default alerts: three complete zero days or a 30% seven-day decline with at least ten preceding inquiries. Thresholds are editable.

## Search, ads and publication

Server configuration (keep values in the environment, never browser code):

- `FMI_OWNER_VAULT_KEY`: random 64-character hexadecimal encryption key in production.
- `FMI_GOOGLE_CLIENT_ID`, `FMI_GOOGLE_CLIENT_SECRET` for Google OAuth.
- `FMI_GOOGLE_ADS_DEVELOPER_TOKEN`, optional `FMI_GOOGLE_ADS_MANAGER_ID` for Google Ads.
- `FMI_META_APP_ID`, `FMI_META_APP_SECRET` for Meta read access.
- Optional pinned `FMI_GOOGLE_ADS_API_VERSION`, `FMI_META_API_VERSION`.
- `CRON_SECRET` for the hourly scheduled-sync endpoint.

Register the exact callback shown in Settings (`/api/owner?action=oauth-callback`). Authorize, select a verified property/account, verify its timezone/currency, and sync. Ads reconcile seven recent days hourly; Search Console reconciles daily. Initial sync requests 28 days. Provider failures retain previously committed reports. Technical audits run daily and on demand, capped at 40 same-origin discovery pages and 1 MB/page; redirects are not followed. Customer invitations and private routes cannot enter the crawler.

The owner alone approves/schedules article publication. Markdown is sanitized, article pages render server-side with canonical metadata/BlogPosting data, and public articles enter the sitemap. Private drafts do not. Editing a published article preserves its last public revision and original address until a new publication. Due schedules become public at the scheduled time; the scheduler records the Published transition.

## Review and deployment

Run `node --test tests/server-owner*.mjs` and relevant payment/publication/auth tests, then `npm run build`. Review desktop/mobile layout, real-data source labels, keyboard task movement and Watch Mode. Checkout and renewal continue to quote **₹1.18**.

Only after owner review: apply `supabase/migrations/20261104074410_owner_command_centre.sql` and deploy the application together. This migration creates private RLS tables, service-only transactional writes, and future payment transition timestamps; it does not rewrite historical prices or dates. Provision the production owner through the same hidden-password script using the production environment, without `--local`. Never set `FMI_OWNER_LOCAL` in production. Configure encryption and scheduler secrets before enabling providers.

Local owner records are intentionally isolated; decide which real operational records to migrate during release. Do not copy fixture data, sessions or local OAuth state. All old operator cookies are rejected by the new gate. Production rollout and real provider authorization remain pending local approval.
