# FindMyInvite — Admin catalogue visualisation (`/akay`)

**Audience:** Development team  
**Operator surface:** `/akay` on findmyinvite.com  
**Supabase:** `findmyinvite` (`qqvcptjkfcjkwbkookcm`)  
**Ops loop:** Explore → Find → Review → Shortlist → Replicate  
**Doc type:** Requirements for admin-panel visualisation of catalogue ops data  
**Not in this doc:** Implementation

---

## 1. Goal

Visualise catalogue ops data so Ashok and Product Ops can see competitors, design queues, shortlist decisions, replication handoff, and live catalogue — without inventing URLs/titles and without marking anything approved except via Ashok’s Approve action.

## 2. Product rules (from Catalog Approvals)

| Rule | Detail |
| --- | --- |
| Ayozan | `competitors.relation` / `is_direct` = **direct**; queue seeds = `free_basic_*` |
| Riwaaz | **indirect** (video competitor); we recreate as **webpage**; seeds = `variation` |
| Classic vs Royal | `design_code` and/or `intended_use` suffixes / `suggested_tier` |
| Approval | Only Ashok Approve/Reject (room or `/akay/shortlist`) marks approved |
| Verified only | Never invent URLs, prices, titles; show `source_url` |
| Gaps | Surface claim vs verified (e.g. Ayozan 500+ claimed / 246 titled; Riwaaz video 800+ / 0 SSR titles) |

### Live baseline (ops snapshot)

| Dataset | Count | Notes |
| --- | --- | --- |
| `upcoming_design_queue` Ayozan | 246 | 140 Classic + 106 Royal (`free_basic_*`) |
| `upcoming_design_queue` Riwaaz | 115 | all `intended_use=variation`; 78 Classic / 37 Royal via `design_code` |
| `shortlist_candidates` | ~25 | Batch A still `proposed` |
| `replication_queue` | 0 | fills on Approve |
| `template_catalog` | 13 | all published (5 Classic + 8 Royal hygiene target) |
| `competitors` | ~20 | includes Ayozan direct, Riwaaz indirect |

---

## 3. Screens (nav under `/akay`)

| # | Route | Purpose |
| --- | --- | --- |
| 1 | `/akay` or `/akay/pipeline` | KPI funnel + alerts |
| 2 | `/akay/competitors` | Scout Explore inventory |
| 3 | `/akay/upcoming` | Design seed board (Ayozan + Riwaaz) |
| 4 | `/akay/shortlist` | Approve/Reject (mirrors Catalog Approvals) |
| 5 | `/akay/replication` | Designer handoff after approve |
| 6 | `/akay/templates` | Live `template_catalog` (read-heavy) |

Shared chrome: status chips with counts, sticky filters, row → detail drawer. Admin session only; privileged server APIs.

---

## 4. Data sources

| Screen | Primary table | Joins / notes |
| --- | --- | --- |
| Pipeline | aggregates | shortlist + replication + upcoming + template_catalog |
| Competitors | `competitors` | shortlist counts by status; show `is_direct`, `relation`, `catalogue_urls`, category |
| Upcoming | `upcoming_design_queue` | filter `source_competitor` (ayozan/riwaaz), `intended_use`, `design_code`, `status` |
| Shortlist | `shortlist_candidates` | JOIN `competitors`; LEFT JOIN `replication_queue` |
| Replication | `replication_queue` | JOIN candidate → competitor |
| Templates | `template_catalog` | LEFT JOIN `template_variations` counts |

### Status enums (DB checks)

- Shortlist: `proposed` \| `approved` \| `rejected`
- Replication: `queued` \| `in_progress` \| `shipped`
- Upcoming: `queued` \| `in_progress` \| `shipped` \| `dropped`
- Upcoming `intended_use`: `free_basic` \| `free_basic_classic` \| `free_basic_royal` \| `classic` \| `royal` \| `variation`
- Template `collection`: `classic` \| `royal`

---

## 5. Screen requirements

### 5.1 Pipeline

**KPIs:** Proposed · Approved awaiting queue · In replication · Shipped · Upcoming backlog · Live templates  

**Funnel:** Competitors → Proposed → Approved → Queued/In progress → Shipped → Live templates  

**Alerts:**

- Approved shortlist with no `replication_queue` row  
- Claim vs verified gap callouts (config or notes field — do not invent numbers in UI)

### 5.2 Competitors

**Columns:** name · category · relation / is_direct · geography · catalogue_urls · shortlist counts (proposed/approved/rejected) · homepage  

**Filters:** category, direct/indirect, search name  

**Rules:** Verified URLs only; Direct badge for Ayozan-class direct competitors.

### 5.3 Upcoming (priority visualisation for current queue load)

**Columns:** name · slug · design_code · intended_use · source_competitor · source_url · status · updated_at  

**Filters:** source (ayozan / riwaaz / …), intended_use, design_code (Classic/Royal), status, search name/slug/design_code  

**Chips:** counts by source × intended_use × design_code  

**Detail drawer:** full notes, source_url (external), status transitions later (v1 can be read-only status display if mutations deferred)  

**Empty / gap banner:** optional “verified N of claimed M” when product supplies claim constants — never invent.

### 5.4 Shortlist (Approve/Reject)

See also detailed file `akay-shortlist.md` if present.

**Default:** `status=proposed`  

**Actions:** Approve → set approved + insert `replication_queue` (`queued`) idempotent on `candidate_id`; Reject → rejected, no queue row  

**Filters:** status, suggested_tier, competitor, batch, direct-only, q  

**Bulk:** max 50 ids  

### 5.5 Replication

**Columns:** candidate title · competitor · tier · assignee · status · fmi_template_id · updated_at  

**Actions:** set assignee; `in_progress`; `shipped` requires `fmi_template_id` ∈ `template_catalog.id`  

**Empty:** “No approved items yet — clear Shortlist first.”

### 5.6 Templates (live catalogue)

**Columns:** id · name · collection · badge · sort_order · published · variation count · updated_at  

**Filters:** collection, published  

---

## 6. API sketch (admin-only)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/akay/pipeline/summary` | grouped counts |
| GET | `/akay/competitors` | list + filters |
| GET | `/akay/upcoming` | list + facet counts |
| GET/PATCH | `/akay/shortlist` (+ `/:id`, `/bulk`) | see shortlist spec |
| GET/PATCH | `/akay/replication` | assignee/status/template id |
| GET | `/akay/templates` | catalog list |

All mutations: server privileged client; never anon.

### Shortlist approve (transaction)

```sql
UPDATE shortlist_candidates
SET status = 'approved', updated_at = now()
WHERE id = $id AND status = 'proposed'
RETURNING id;

INSERT INTO replication_queue (candidate_id, status, assignee, notes)
VALUES ($id, 'queued', '', '')
ON CONFLICT (candidate_id) DO NOTHING;
```

---

## 7. Acceptance criteria (admin viz v1)

1. Pipeline KPIs match SQL aggregates within one refresh.  
2. Upcoming shows Ayozan 246 and Riwaaz 115 distinctly; Classic/Royal visible via `design_code` / intended_use.  
3. Competitors show Ayozan as direct and Riwaaz as indirect when data says so.  
4. Shortlist Approve creates exactly one replication_queue row; re-approve → 409 / no duplicate.  
5. Reject never creates replication_queue row.  
6. Replication empty state until first approval.  
7. Templates list shows 13 published with Classic/Royal collection.  
8. No UI invents URLs, titles, or prices; external links open verified `source_url` / `url` only.  
9. No “approved” state without Ashok Approve path.  
10. Admin auth required for all `/akay/*` reads that expose ops tables (or equivalent privileged BFF).

## 8. Out of scope (v1)

- WishnWed / new scout cards in UI until Ashok opens them in Catalog Approvals  
- Channel sync (Slack/chat)  
- Thumbnail scraping / asset theft  
- Public Data API for ops tables  

## 9. Suggested build order

1. Upcoming + Competitors (read-only viz of current 361 queue + competitor map)  
2. Shortlist mutations (unblocks Batch A + room mirror)  
3. Replication + Pipeline KPIs  
4. Templates read view  

## 10. Developer agent prompt (paste)

```
Implement FindMyInvite /akay admin catalogue visualisation against Supabase project findmyinvite (qqvcptjkfcjkwbkookcm). Spec: screens Pipeline, Competitors, Upcoming, Shortlist, Replication, Templates. Use existing tables only — competitors, upcoming_design_queue, shortlist_candidates, replication_queue, template_catalog. Product rules: Ayozan=direct free_basic seeds; Riwaaz=indirect variation seeds (webpage recreate); Classic/Royal via design_code/suggested_tier/collection; never invent URLs/titles; never mark approved except Ashok Approve on shortlist which inserts replication_queue (queued) ON CONFLICT DO NOTHING. Admin-only privileged APIs. Match existing /akay auth and layout. Ask before any migration. Build order: Upcoming+Competitors read-only → Shortlist Approve/Reject → Replication → Pipeline KPIs → Templates.
```

---

*End of document.*
