# Production update · 14 September 2026

The founder explicitly requested production deployment instead of leaving the new experience only on preview. This update supersedes earlier statements that the production alias still serves the old 9 PM candidate.

- **Public homepage:** https://findmyinvite.vercel.app/
- **Separate launch ceremony:** https://findmyinvite.vercel.app/grand-launch
- **Production code commit:** `6db0d12c2b0f9e97ebc82f78420bd54e25b90796`
- **Vercel deployment:** `findmyinvite-4lfpu24bb-hardwins-projects.vercel.app`, READY, production.
- **Successful CI:** https://github.com/hardwin/findmyinvite/actions/runs/34865690780
- **Automatic production deployment gate:** reset to `false` after successful deployment. This controls later deployments, not live access.

The ceremony supports unlimited scratch/replay/refresh attempts until **15 September 2026, 03:00 AM IST**. Its cutoff uses the device clock. At that point it displays a premiere-ended message and Home button; `/` remains the storefront. Public-browser checks passed for two consecutive replays, refresh reset, availability immediately before 3 AM, cutoff at 3 AM, and Home navigation. The clock-boundary checks used an emulated browser clock and did not change server time.

The preceding production deployment was verified with unauthenticated HTTP 200 homepage and ceremony access, three chapters, Home navigation and no browser runtime errors. Production offer configuration now starts at **14 September 23:59 IST**, ending **14 October 23:59 IST**. This is distinct from the ceremony's 3 AM recording cutoff.

**Still outstanding:** `findmyinvite.com` DNS was last verified pointing to Hostinger parking (`2.57.91.91`); use the public Vercel URLs until DNS is connected. All 13 template catalog rows remain unpublished, so new customer invitation publishing is not yet enabled. Original rights, business/support, hosting suitability and other product-release gates are not marked completed by this deployment. The ceremony is a presentation, not a CI or catalog-publishing button.

The frozen `v0.9.0` tag remains the original handoff baseline. Newer production code and documentation are on `main`; do not redeploy the old tag unintentionally. Follow [recording instructions](GRAND-LAUNCH.md) and [release runbook](RELEASE-RUNBOOK.md) for further changes.
