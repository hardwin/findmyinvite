# v0.9 status · authoritative release baseline

Prepared 14 September 2026. Infrastructure inspected **14:42 UTC / 20:12 IST**; see [machine-readable snapshot](evidence/handoff-state.json). This is a **pre-deployment handoff, not v1.0 approval**. Replace dated observations with fresh evidence in [RELEASE-RECORD.md](RELEASE-RECORD.md) as work proceeds.

## Release identity

| Item | Recorded value |
| --- | --- |
| Repository / branch | [hardwin/findmyinvite](https://github.com/hardwin/findmyinvite), private / `main` |
| Handoff version | `0.9.0`; annotated tag `v0.9.0` identifies the final handoff commit after push |
| Planned v1.0 time | 14 Sep 2026 **23:59 IST = 18:29 UTC** |
| Free offer end | 14 Oct 2026 **23:59 IST = 18:29 UTC**, end exclusive |
| Vercel project | [hardwins-projects/findmyinvite](https://vercel.com/hardwins-projects/findmyinvite) |
| Project / team identifiers | `prj_ZPOw3XYQTehO9AVbkp8JyZEhke76` / `team_xFQvLGR6rRhSUyAtItzx8b24` (identifiers, not secrets) |
| Current production alias | [findmyinvite.vercel.app](https://findmyinvite.vercel.app) |
| Production candidate | `dpl_D3AXQwNR2EtRUaRJaXQAFStQVH9x`, commit `309662f929f8dbf00bb9d43c0261f8cf91b3d257` |
| Historical CI preview | `dpl_HcvePisRCop2EMkoS4Tj8K8iZmQh`, commit `6a6a61df04e073291c61e648ce38adec162b321e` |
| Passing historical CI run | [34833371861](https://github.com/hardwin/findmyinvite/actions/runs/34833371861), verify and preview deploy |

## Delivered and observed

| Area | What exists | Limit / remaining action |
| --- | --- | --- |
| Storefront / invitation UI | React/TS/Vite/Three.js; 8 Royal + 5 Classic designs; four examples refined | Full reference indistinguishability is not certified; original branding remains in media |
| Guest publishing | Server validation, durable drafts/publication, unique slugs, private recovery, edits, RSVP, deletion | Fresh public creation during an active offer still needs live acceptance |
| Database | Supabase Free, Mumbai; 7 application tables, RLS enabled, browser-role grants revoked | Development/preview/production share this database; migration history not registered in Supabase CLI |
| Photos | Private Blob `findmyinvite-photos`, Mumbai; four slots; authorized API delivery | Shared across environments; expired files are not automatically reclaimed |
| CMS | Templates/variations/SKUs/blog tables + operator dashboard workflow | **0 of 13 templates published**; rights clearance pending; no standalone CMS application |
| Deployment | GitHub CI secrets stored, verify/build/preview proven | Production variable currently `false`; protection rules and independent auto-deploy settings require inspection |
| Domain | Apex and www attached to Vercel, www redirects to apex | DNS still resolves to `2.57.91.91` parking; custom-domain TLS not accepted |
| Commercial/support | List prices ₹1,199 / ₹1,499; no payment collection | Hobby plan review, operator name, support mailbox and policy drafts unresolved |

## Schedule mismatch — resolve before catalog release

This handoff changes source defaults, UI copy, `.env.example`, the boundary test, local ignored configuration and Vercel project variables to the postponed **23:59** time. **No production deployment was performed for this handoff.** Existing deployments retain their old environment snapshot; the current production API still reports 21:00.

Keep the shared CMS catalog unpublished until at/after 23:59 and verification of the new production runtime. After 21:00, a published template would allow old-production new creation before the postponed launch. Updating project settings or setting the GitHub deployment variable to false does not disable an already running API. Older deployment URLs may remain reachable after an alias switch. The [runbook](RELEASE-RUNBOOK.md) describes isolated staging and the guarded release sequence.

## Evidence and its scope

- [Historical live cloud checks](evidence/live-cloud-checks.json), 10:26 UTC: creation rejected before the then-scheduled 9 PM; seeded draft management, private/public photo behavior, real Supabase RSVP, wrong-key denial, unpublish/delete and anonymous DB denial passed. Temporary records/files were cleaned up. **Seeded-draft testing does not prove public creation.**
- [Historical live browser checks](evidence/live-browser-checks.json): homepage at 390 × 844 and 1440 × 900 had no horizontal overflow, broken images or runtime errors; removed countdown/pause text stayed absent. This evidence is not an all-pages or accessibility certification.
- Server/API tests use mocked provider responses. They cover validation/security/lifecycle logic but cannot certify actual DB grants, Blob credentials, DNS or a deployed runtime.
- [Current infrastructure snapshot](evidence/handoff-state.json) is sanitized and portable. It confirms the new project settings and old runtime mismatch; it contains no raw management keys or service credentials.
- The full v1.0 [15-case acceptance suite](PREDEPLOY-15.md) is **NOT RUN for the final release** at handoff. Record results individually; historical evidence is supporting context only.

## Changes intentionally not made

No catalog publication, DNS edit, paid plan purchase, payment activation, migration re-run, production deployment or Cursor authentication is implied by the v0.9 commit. The final v1.0 tag and announcement belong to the release owner after the release record is complete.
