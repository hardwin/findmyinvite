---
name: FindMyInvite catalogue scale
description: >-
  use this when scaling FindMyInvite templates via competitor scout, Catalog
  Approvals, and designer replication queue
---
# FindMyInvite catalogue scale pipeline

## When to use
Scaling the digital invitation template catalogue via competitor scouting and designer replication.

## Operating model
Explore → Find → Review → Shortlist → Replicate

Positioning: recreate high-demand trending digital invitation webpage styles as low-cost (sometimes free) SKUs. USP is pricing.

## Roles
- **Catalog Scout** — Explore/Find: competitor sites, catalogue URLs, categories, candidate designs (metadata + URLs only; no asset theft).
- **Product Ops** — Review: quality, Classic vs Royal fit, replication specs.
- **Catalog Approvals** channel — Ashok views shortlisted candidates and **Approve** or **Reject**.
- **Replication Queue** channel — Approved items only; designers recreate and ship into catalogue.
- Support Ops / Launch Ops — parked unless Ashok reopens them.

## Shortlist card (post to Catalog Approvals)
For each candidate include:
1. Competitor name + catalogue/template URL
2. Occasion / style tags
3. Suggested FindMyInvite tier (Classic / Royal)
4. Why it is high demand (one line)
5. Screenshot or live demo link if available
6. Clear ask: Approve or Reject

## After Ashok approves
1. Post the same card to Replication Queue with status `approved`
2. Add/update row in Supabase competitors + replication_queue tables
3. Designer recreates (original work inspired by trend — do not paste stolen assets)
4. When live in catalogue, mark queue item `shipped` and note new template id

## Supabase (when connected)
Store at minimum:
- `competitors`: name, homepage, catalogue_urls, category, geography, price_notes, product_type, notes
- `shortlist_candidates`: competitor_id, title, url, reason, suggested_tier, status (proposed|approved|rejected)
- `replication_queue`: candidate_id, status (queued|in_progress|shipped), assignee, fmi_template_id

## Rules
- Never invent URLs or prices — verify.
- Never treat a design as approved without Ashok in Catalog Approvals.
- Competitor intel = URLs + structured notes; designers recreate, they do not drop in ripped files.
