# FindMyInvite — Admin Shortlist (`/akay/shortlist`)

**Product:** FindMyInvite (India-first digital invitation webpages)  
**Surface:** Operator admin at `/akay/shortlist` on findmyinvite.com  
**Supabase project:** `findmyinvite` (`qqvcptjkfcjkwbkookcm`)  
**Owner:** Tech Architect → engineering handoff  
**Related ops loop:** Explore → Find → Review → Shortlist → Replicate (Catalog Approvals → Replication Queue)  
**Document type:** Requirements + developer AI agent prompt  
**Implementation in this doc:** None — spec only

---

## 1. Goal

Give Ashok a durable admin UI to review `shortlist_candidates`, Approve or Reject one-by-one (and bulk), and on Approve enqueue exactly one `replication_queue` row for designers — mirroring Catalog Approvals in the database.

---

## 2. Out of scope

- Screenshot storage / thumbnails
- Editing Scout-owned fields (title, url, reason, tier, batch) in admin
- Undo / re-open rejected or approved
- Syncing decisions back to chat channels
- Pipeline, Replication, Upcoming, Competitors screens (separate specs)
- Public / anon Data API access to these mutations
- Schema migrations for v1 (optional audit columns later)

---

## 3. Actors and auth

| Actor | Capability |
| --- | --- |
| Admin (`/akay` session) | List, filter, Approve, Reject, bulk |
| Catalog Scout / Product Ops | Write candidates elsewhere; not this UI |
| Public / anon | No access |

Mutations MUST run server-side with a privileged client (service role or admin JWT claim). Do not expose PATCH via anon key. Keep existing RLS on ops tables locked for public.

---

## 4. Data model (existing — no migration for v1)

### 4.1 `public.shortlist_candidates`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `competitor_id` | uuid FK → `competitors` | |
| `title` | text | |
| `url` | text | competitor template URL |
| `reason` | text | demand rationale |
| `suggested_tier` | text | check: `classic` \| `royal` |
| `batch` | text | may be `''` |
| `status` | text | `proposed` \| `approved` \| `rejected` (default `proposed`) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 4.2 `public.competitors` (join)

Relevant fields: `name`, `slug`, `homepage`, `catalogue_urls` (text[]), `category`, `is_direct` (bool), `relation` (`direct` \| `indirect` \| null).

### 4.3 `public.replication_queue`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `candidate_id` | uuid UNIQUE FK → `shortlist_candidates` | one queue row per candidate |
| `status` | text | default `queued`; `queued` \| `in_progress` \| `shipped` |
| `assignee` | text | default `''` |
| `fmi_template_id` | text nullable | not set on approve |
| `notes` | text | default `''` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### 4.4 Baseline (at time of spec)

- ~25 `shortlist_candidates`, all `proposed`
- `replication_queue` empty
- Top competitors by candidate count examples: Varumo, Nimantran, SuPraKu, Dreams Invite

---

## 5. Functional requirements

| ID | Requirement |
| --- | --- |
| FR-1 | Route `/akay/shortlist` lists candidates joined to competitor + optional `replication_queue` |
| FR-2 | Default filter `status=proposed`; status chips with counts (All / Proposed / Approved / Rejected) |
| FR-3 | Filters: tier, competitor_id, batch, direct-only, free-text `q` on title/url; sort default `updated_at DESC` |
| FR-4 | Table columns: select, title, competitor (+ Direct badge), tier chip, batch, reason truncate, external url, status, updated (IST), actions |
| FR-5 | Row click opens right drawer with full reason, competitor links, `catalogue_urls`, timestamps, replication status if any |
| FR-6 | Approve only when `proposed`: set `approved`, bump `updated_at`, insert `replication_queue` (`queued`) idempotent on `candidate_id` |
| FR-7 | Reject only when `proposed`: set `rejected`, bump `updated_at`; do not create/alter `replication_queue` |
| FR-8 | Non-proposed: hide/disable Approve/Reject and row checkbox |
| FR-9 | Bulk approve/reject up to 50 ids; return per-id ok/fail; approve path still enqueues |
| FR-10 | Empty states for no matches and for Approved/Rejected with zero rows |
| FR-11 | Mutation failure keeps prior status; show error toast |
| FR-12 | Second approve on same id → 409; queue row count unchanged |

---

## 6. UI wireframe

```
┌─ Shortlist                                    [↻ Refresh]
├─ Status chips:  All  Proposed  Approved  Rejected  (with counts)
├─ Filters: [Tier ▾] [Competitor ▾] [Batch ▾] [Direct only] [Search title/url]
├─ Bulk bar (when ≥1 selected): [Approve selected] [Reject selected]  · n selected
├─ Table — sort: updated_at DESC
│  ☐ │ Title │ Competitor │ Tier │ Batch │ Reason │ Link │ Status │ Updated │ Actions
└─ Drawer (right, ~420px) on row click — detail + Approve/Reject
```

### 6.1 Table columns

| Col | Source | Render | Notes |
| --- | --- | --- | --- |
| ☐ | — | checkbox | disabled if status ≠ `proposed` |
| Title | `sc.title` | text, 2-line clamp | |
| Competitor | `c.name` | text + optional Direct badge | badge if `c.is_direct` OR `c.relation = 'direct'` |
| Tier | `sc.suggested_tier` | chip Classic / Royal | |
| Batch | `sc.batch` | text or `—` | empty string → `—` |
| Reason | `sc.reason` | 1-line truncate + tooltip | full text in drawer |
| Link | `sc.url` | external icon | `target=_blank` `rel=noopener` |
| Status | `sc.status` | chip | proposed / approved / rejected |
| Updated | `sc.updated_at` | relative or absolute IST | Asia/Kolkata |
| Actions | — | Approve · Reject | only when `proposed` |

Default page size: 25.

### 6.2 Filters (query params)

| Param | Type | Maps to |
| --- | --- | --- |
| `status` | enum \| `all` | `sc.status` — default `proposed` |
| `tier` | `classic` \| `royal` \| omit | `sc.suggested_tier` |
| `competitor_id` | uuid \| omit | `sc.competitor_id` |
| `batch` | string \| omit | `sc.batch` exact; treat `''` as “Unbatched” option |
| `direct` | `1` \| omit | `c.is_direct = true OR c.relation = 'direct'` |
| `q` | string \| omit | `ilike` on `sc.title` OR `sc.url` |
| `sort` | `updated_at` \| `created_at` \| `title` | default `updated_at.desc` |

Competitor dropdown: only competitors with ≥1 shortlist row; label = `c.name`, value = `c.id`.

### 6.3 Detail drawer

**Header:** title · status chip · close  

**Body:**

1. Competitor name · category · Direct/Indirect · homepage link  
2. Candidate URL (primary CTA: Open template)  
3. Catalogue URLs from `c.catalogue_urls[]`  
4. Suggested tier — read-only in v1  
5. Batch — read-only  
6. Full reason  
7. Timestamps created / updated (IST)  
8. If approved: replication queue status (or “In queue · queued”)  
9. If rejected: status only (no queue)

**Footer (proposed):** [Reject] [Approve] — Approve primary  
**Footer (terminal):** “Decided · {status}” — no buttons in v1

### 6.4 Empty / error states

- **Approved/Rejected, 0 rows:** “Nothing approved yet. Clear Proposed first.” / equivalent for rejected  
- **Filters miss:** “No candidates match — reset filters.”  
- **Mutation fail:** keep prior status; error toast

---

## 7. List query (read)

```sql
SELECT
  sc.id, sc.title, sc.url, sc.reason, sc.suggested_tier,
  sc.batch, sc.status, sc.created_at, sc.updated_at,
  sc.competitor_id,
  c.name AS competitor_name, c.slug AS competitor_slug,
  c.is_direct, c.relation, c.category, c.homepage, c.catalogue_urls,
  rq.id AS replication_id, rq.status AS replication_status
FROM shortlist_candidates sc
JOIN competitors c ON c.id = sc.competitor_id
LEFT JOIN replication_queue rq ON rq.candidate_id = sc.id
WHERE ($status::text IS NULL OR sc.status = $status)
  AND ($tier::text IS NULL OR sc.suggested_tier = $tier)
  AND ($competitor_id::uuid IS NULL OR sc.competitor_id = $competitor_id)
  AND ($batch::text IS NULL OR sc.batch = $batch)
  AND ($direct::boolean IS NOT TRUE OR c.is_direct OR c.relation = 'direct')
  AND ($q::text IS NULL OR sc.title ILIKE '%'||$q||'%' OR sc.url ILIKE '%'||$q||'%')
ORDER BY sc.updated_at DESC
LIMIT $limit OFFSET $offset;
```

- Chip counts: same filters except `status`, `GROUP BY sc.status`.  
- Competitor facet: `GROUP BY c.id, c.name HAVING count(*) > 0`.

---

## 8. API contract (admin-only)

### 8.1 `GET /akay/shortlist`

**Query:** `status`, `tier`, `competitor_id`, `batch`, `direct=1`, `q`, `sort`, `limit`, `offset`  

**Response:**

```json
{
  "items": [],
  "total": 0,
  "status_counts": {
    "proposed": 0,
    "approved": 0,
    "rejected": 0,
    "all": 0
  }
}
```

Each item includes candidate fields plus `competitor_name`, `competitor_slug`, `is_direct`, `relation`, `category`, `homepage`, `catalogue_urls`, `replication_id`, `replication_status`.

### 8.2 `PATCH /akay/shortlist/:id`

**Body:** `{ "status": "approved" | "rejected" }`

#### Approve

Precondition: row exists and `status = 'proposed'` (else 409).

```sql
UPDATE shortlist_candidates
SET status = 'approved', updated_at = now()
WHERE id = $id AND status = 'proposed'
RETURNING id, competitor_id, title, suggested_tier;

-- only if UPDATE returned a row:
INSERT INTO replication_queue (candidate_id, status, assignee, notes)
VALUES ($id, 'queued', '', '')
ON CONFLICT (candidate_id) DO NOTHING;
```

**Response:** `{ "candidate": {…}, "replication_queue": { "id": "…", "status": "queued" } }`

#### Reject

Precondition: `status = 'proposed'` else 409.

```sql
UPDATE shortlist_candidates
SET status = 'rejected', updated_at = now()
WHERE id = $id AND status = 'proposed'
RETURNING *;
-- do NOT touch replication_queue
```

**Errors:** 404 missing, 409 not proposed / invalid transition.

### 8.3 `POST /akay/shortlist/bulk`

**Body:** `{ "ids": ["uuid", …], "status": "approved" | "rejected" }`  

**Rules:**

- Max `ids.length` ≤ 50  
- Per-id success/failure: `{ "ok": ["uuid"], "failed": [{ "id": "uuid", "reason": "…" }] }`  
- Approve path must still upsert `replication_queue` per successful id

---

## 9. Non-functional requirements

- Privileged server mutations only  
- Display timestamps in Asia/Kolkata (IST)  
- External links: `target=_blank` `rel=noopener`  
- Page size default 25  
- Optimistic UI optional; server is source of truth on conflict  
- Match existing `/akay` auth, layout, and code style in the repo

---

## 10. Acceptance criteria

1. Default view shows only `proposed`; chips match SQL counts.  
2. Approve → status `approved` + exactly one `replication_queue` row (`queued`, empty assignee).  
3. Re-approve → 409; queue row count unchanged.  
4. Reject → `rejected`; queue untouched.  
5. Bulk approve of N proposed → N approved + N queue rows.  
6. Filters compose; Direct = `is_direct OR relation = 'direct'`.  
7. Drawer shows full reason + `catalogue_urls`.  
8. Actions / checkboxes disabled for non-`proposed`.  
9. Approve and queue insert are the same transaction (no orphan approved without queue attempt).  
10. All writes bump `updated_at`.

---

## 11. Optional later (not v1)

Add audit columns if needed: `decided_by`, `decided_at`, `reject_reason` — separate migration and spec.

---

## 12. Developer AI agent prompt

Paste the following block as the instruction to a coding agent:

```
You are implementing FindMyInvite admin Shortlist at /akay/shortlist. Requirements only below — implement against the live Supabase schema; do not invent tables/columns.

## Context
- Product: India-first digital invitation site; catalogue scale via Explore→Find→Review→Shortlist→Replicate.
- Admin exists at /akay on findmyinvite.com.
- Supabase project: findmyinvite, ref qqvcptjkfcjkwbkookcm.
- This screen mirrors Catalog Approvals (Ashok Approve/Reject). On Approve, designers pick up work from replication_queue.

## Existing schema (use as-is; no migration for v1)
shortlist_candidates:
  id uuid PK, competitor_id uuid FK→competitors, title text, url text, reason text,
  suggested_tier text CHECK (classic|royal), batch text, status text CHECK (proposed|approved|rejected) DEFAULT proposed,
  created_at, updated_at timestamptz

competitors (join): name, slug, homepage, catalogue_urls text[], category, is_direct bool, relation text NULL|direct|indirect

replication_queue:
  id uuid PK, candidate_id uuid UNIQUE FK→shortlist_candidates,
  status text CHECK (queued|in_progress|shipped) DEFAULT queued,
  assignee text DEFAULT '', fmi_template_id text NULL, notes text DEFAULT '',
  created_at, updated_at timestamptz

## Build
1. Route: /akay/shortlist (admin-only).
2. List UI: status chips (All/Proposed/Approved/Rejected with counts), filters (tier, competitor_id, batch, direct-only, q on title|url), table, row drawer.
3. Default filter: status=proposed. Sort: updated_at DESC. Page size 25.
4. Table cols: checkbox (proposed only), title, competitor (+ Direct badge if is_direct OR relation=direct), tier chip, batch (show — if empty), reason truncate, external url, status, updated (Asia/Kolkata), Approve|Reject actions (proposed only).
5. Drawer: full reason, competitor homepage + catalogue_urls, tier/batch read-only, timestamps, replication status if joined; footer Approve/Reject only when proposed.
6. APIs (server privileged client only — never anon):
   - GET /akay/shortlist — filters + status_counts + join competitor + left join replication_queue
   - PATCH /akay/shortlist/:id { status: approved|rejected }
   - POST /akay/shortlist/bulk { ids: uuid[], status } max 50, partial success ok/failed
7. Approve transaction:
   UPDATE shortlist_candidates SET status='approved', updated_at=now()
     WHERE id=$id AND status='proposed' RETURNING …;
   if updated: INSERT INTO replication_queue (candidate_id, status, assignee, notes)
     VALUES ($id, 'queued', '', '') ON CONFLICT (candidate_id) DO NOTHING;
   If not proposed → 409.
8. Reject: UPDATE … status='rejected' only if proposed; do NOT touch replication_queue.
9. Empty states: no filter matches; zero rows for approved/rejected views.
10. External links: target=_blank rel=noopener.

## Do NOT
- Add screenshot columns, undo, edit title/reason/tier in admin, channel sync, or other /akay screens.
- Expose mutations to anon/public.
- Change Scout write paths.

## Done when
- Manual or automated checks cover: approve creates one queue row; re-approve 409 and no second queue row; reject leaves queue empty; bulk approve of N proposed → N queue rows; filters compose; actions disabled when not proposed; updated_at bumps on write.
- Match existing /akay auth, layout, and code style in the repo.

Implement only /akay/shortlist + the three admin APIs above. Ask before any schema migration.
```

---

*End of document.*
