# Data Engineers — v0.9 handoff to v1.0

**Data owner: TO ASSIGN.** Own data integrity, retention operations and recovery evidence. Start with [architecture](../ARCHITECTURE.md) and [current status](../STATUS.md).

## Data inventory

| Table | Purpose | Main handling concern |
| --- | --- | --- |
| `invitations` | Unique slug, capability hash, JSON details, publication/expiry | Personal event data; never expose ownership hash |
| `responses` | Guest RSVP, email, attendance and message | Owner-only PII; invitation deletion cascades |
| `rate_limits` | Atomic request counters | Cleanup and abuse-control correctness |
| `template_catalog` | Approved renderer metadata | Publication rights and availability |
| `template_variations` | Stored variation settings | Runtime variation application is deferred |
| `product_skus` | INR list prices | No order/payment ledger exists |
| `blog_posts` | Plaintext editorial content | Published and time-eligible rows only |

Uploaded media lives in private Blob, not inside SQL. All seven tables have RLS enabled and browser-role grants revoked; privileged server access still requires correct application authorization.

## Before release

The SQL and seeds were manually applied. Inspect the live schema before any migration command; do not assume a populated Supabase CLI migration history. The core SQL file is not safely rerunnable against an existing installation.

Development, preview and production share database and media resources. Maintain a test-slug inventory and remove synthetic data after checks. Verify a backup/export and restore procedure with secure storage and named access. No automatic backup or point-in-time recovery capability has been certified in this handoff.

## After release

Expiry currently restricts public reads; it is not automatic physical deletion. Implement and approve retention cleanup separately, covering SQL, Blob, rate counters and backup copies. Coordinate policy language with the operator rather than promising deletion that no job performs.

The inbox returns only the latest 1,000 responses and indicates more exist; pagination/export is deferred. Measure record growth and reconcile cleanup failures without exporting raw guest PII into general dashboards. **Completion:** documented restore evidence, data dictionary, synthetic-record cleanup and an accepted retention owner. Refer to [15 tests](../PREDEPLOY-15.md) and [risks](../DECISIONS-AND-RISKS.md).
