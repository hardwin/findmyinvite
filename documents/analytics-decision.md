# Analytics direction — 2026-09-15

Standing decision for the next agent. Research vs Gemini’s OpenPanel suggestion.

## Analytics call (2026-09-15 21:52 IST)

Ashok rejected PostHog Cloud and OpenPanel Cloud. Keep the current `/akay` desk. Do not run a third-party analytics product unless he reverses this. Production ship of this desk is authorized.

**Gemini’s product instinct is right. The proposed architecture is not.**

- Do **not** grow the custom `/akay` Mixpanel clone.
- Do **not** self-host OpenPanel on this Vercel app or write events into FindMyInvite Supabase `qqvcptjkfcjkwbkookcm`.
- **Do** adopt **PostHog Cloud (free tier)** as the analytics system. Open-source company, 1M events/month free, funnels + journeys + web analytics + optional replay. One snippet on the storefront. `/akay` stays unlinked; PostHog has its own login (stronger than a 4-digit code in git).

## What Gemini got wrong

OpenPanel is a real Mixpanel-style OSS tool (AGPL). It does funnels, profiles, and timelines.

It does **not** “deploy the dashboard on Vercel and store events in our existing Supabase.” Official self-host is **Docker Compose**: Postgres + **ClickHouse** + Redis + API + dashboard + worker. Events live in ClickHouse, not the invitations Postgres. You *can* point `DATABASE_URL` at an external Postgres for *app config*, not as the event warehouse.

Putting that stack on Hobby Vercel + the shared guest DB would compete with RSVPs, photos, and the free-creation API.

## Comparison (for this stack)

| Option | Fits Vercel+FMI? | Funnels / journeys | Ops | Cost now | Call |
| --- | --- | --- | --- | --- | --- |
| Custom `/akay` | Already written | Thin, we maintain charts forever | Low now, high later | $0 | Stop expanding |
| **PostHog Cloud** | Script + optional reverse proxy | Full product analytics | Almost none | **$0 to 1M events/mo** | **Use this** |
| OpenPanel Cloud | Script | Mixpanel-like | Almost none | From ~$2.50/mo | Plan B if Ashok rejects PostHog UI |
| OpenPanel self-host | Needs a VPS, not Vercel | Same | High (ClickHouse) | VPS | Only when we want zero vendor and have a box |
| Umami | Light; Cloud or small VPS; Postgres-only | Basic funnels, no Mixpanel profiles | Low | Free Cloud tier / cheap VPS | If we only wanted pageviews |
| Plausible | Web analytics | Weak product funnels | Low | Cloud from ~$9/mo | Marketing traffic only |
| Vercel Analytics | Native | Pageviews, not journeys | None | Paid on Pro | Not enough |

## Recommended plan (do not implement until Ashok YES)

1. Ashok creates a PostHog Cloud project (EU if he wants data in Europe). No card required.
2. Akay adds the official snippet (and later a first-party `/ingest` proxy if ad blockers bite).
3. Autocapture pageviews; add 5 product events: `template_selected`, `create_started`, `invitation_published`, `rsvp_submitted`, `manage_opened`. Never send recovery keys, emails, or guest names.
4. In PostHog UI, save funnel: Home → Templates → Create → Published.
5. Do **not** run `supabase/002_analytics.sql` on prod invitations. Leave the local `/akay` prototype unshipped or delete it after PostHog is live — do not dual-write.
6. Optional later: OpenPanel Cloud or self-host on a VPS if PostHog free-tier or vendor becomes a problem.

## What to keep from `/akay`

The hidden-URL idea is good. Use PostHog’s own dashboard (unlinked from the storefront). Do not advertise analytics on Home/Header/Footer.
