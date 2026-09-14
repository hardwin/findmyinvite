# Cursor takeover · read this first

**Read the newer [production update](docs/handoff/PRODUCTION-UPDATE.md) first.** The founder has now deployed code commit `6db0d12` to the public Vercel production alias. The homepage stays at `/`; `/grand-launch` supports repeat recording until 15 September at 3 AM IST. Earlier old-production/9 PM status in this handoff is historical; do not redeploy the old candidate.

**Grand-launch ceremony added after the v0.9.0 tag:** latest `main` includes `/grand-launch`, a three-chapter emerald/gold opening, scratch-to-launch, confetti, Home and full-invitation demo. Read [ceremony instructions](docs/handoff/GRAND-LAUNCH.md) for rehearsal and phone recording. This is presentation only; its button does not deploy or publish the catalog. Include it in the approved v1.0 production build.

You are taking over FindMyInvite from Codex at **v0.9.0**, before the intended v1.0 release on **14 September 2026, 23:59 IST (18:29 UTC)**. The founder will use a mobile phone and will not have this laptop or ChatGPT. GitHub is the durable handoff; do not depend on this conversation, Windows paths, `work/`, localhost, or a running desktop session.

## First actions

1. Read [status](docs/handoff/STATUS.md), [release runbook](docs/handoff/RELEASE-RUNBOOK.md), [15 tests](docs/handoff/PREDEPLOY-15.md), and [decisions/risks](docs/handoff/DECISIONS-AND-RISKS.md).
2. Check `git status`, `git remote -v`, and `git log -5 --oneline`. Fetch latest `main`; identify `v0.9.0`. Do not overwrite taskforce work. Cloud agents normally work on separate branches; merge reviewed fixes before releasing from `main`.
3. Prove mobile access using [ACCESS-AND-TAKEOVER.md](docs/handoff/ACCESS-AND-TAKEOVER.md). Repository access does not automatically grant Actions dispatch, variable administration, Vercel or Supabase access.
4. Use Node 22; run `npm ci`, `npm run test:server`, and `npm run build` for changes. CI runs these too. Inspect evidence for the exact release commit; old green runs are historical.
5. Assign release, engineering, QA, security/data, business and support owners in [RELEASE-RECORD.md](docs/handoff/RELEASE-RECORD.md). People can wear multiple roles; never invent approvals.

## Product vision and history

FindMyInvite makes an invitation a shareable event experience: an animated opening, personalized event information and photos, guest responses, and simple host management. Initial work matched the reference storefront and original assets, then polished four examples, then added the guest backend and GitHub/Vercel pipeline. Preserve working visuals and guest data; tonight is not another visual rebuild.

The founder selected Vercel hosting/private Blob, Supabase data/operator CMS, GitHub CI, the Hostinger-owned `findmyinvite.com`, and guest access for v1. Public paths use `findmyinvite.com/<slug>`; subdomains are deferred. Regular list prices remain **Classic ₹1,199 / Royal ₹1,499**. Free creation lasts 30 days from the planned launch. No payment checkout, cards, subscriptions or automatic later billing exist. Orders, verified payment webhooks, entitlements and refund operations are later work before paid selling. Free usage produces no sales revenue; see [Finance](docs/handoff/roles/finance.md).

## Critical facts

- Code and Vercel project variables now use **23:59 IST**, ending **14 October 23:59 IST**. Old production still uses **21:00** until redeployed. Never publish the shared catalog while that old deployment can accept creation at 9 PM.
- All 13 template rows are unpublished. Downloaded reference media rights and embedded branding are unresolved; prototype distribution also matters. Obtain actual rights decisions before catalog release.
- DNS still pointed to Hostinger parking at handoff inspection. Both domains are attached to Vercel. Follow the recorded DNS instructions and preserve mail records.
- Vercel team was Hobby; commercial-use suitability remains unresolved. No paid upgrade was performed in this handoff.
- Development, preview and production share Supabase and Blob. A preview URL is not an isolated database. Do not casually change shared catalog rows or run destructive tests.
- A successful fresh public create during an active offer is still unverified live. Historical cloud checks seeded a temporary draft, then exercised real management, photos, RSVP and deletion.
- Guest recovery keys are bearer credentials. There is no account, email recovery or key-reset UI. Do not request private management URLs in support tickets.
- Contact/policy drafts need actual operator identity, a working support mailbox, and accepted retention/support procedures.
- Actions production is gated by `ENABLE_PRODUCTION_DEPLOY=false`. A green workflow may have skipped deployment. Verify the deploy job and Vercel commit/target.

## Repository map

| Area | Read |
| --- | --- |
| Data flow / technical model | [ARCHITECTURE.md](docs/handoff/ARCHITECTURE.md) |
| Host editor / routing | `src/App.tsx`, `src/GuestPages.tsx`, `src/guest-api.ts` |
| Invitation rendering | `src/Invitation.tsx`, `src/ClassicOpening.tsx`, `src/three/` |
| Authorization / endpoints | `server/core.mjs`, `api/invitations.mjs`, `api/media.mjs`, `api/content.mjs` |
| Schemas / operator CMS | `supabase/001_guest_launch.sql`, `cms/schema.sql`, `cms/README.md` |
| Promotion | `src/launch.ts`, `src/LaunchBanner.tsx`, `src/ContentPages.tsx`, `server/core.mjs`, Vercel variables |
| Delivery | `.github/workflows/ci.yml`, `vercel.json`, `run.mjs`, `.env.example` |
| Stakeholder documents | [docs/handoff/index.md](docs/handoff/index.md) |

## Phone instructions

Start a **cloud** Cursor agent for `hardwin/findmyinvite` and paste:

> Take over from README_CURSOR.md on latest main. Read status, risks, runbook and all 15 pre-deployment cases. Work on a branch, preserve saved invitation formats and visuals, and complete launch blockers only. Report blockers and verified results with evidence. Do not use laptop paths or disclose secrets. Do not enable the shared catalog while the old 9 PM production runtime remains. Prepare the exact v1.0 commit and wait for my deployment instruction after all release gates pass. After authorization, use the GitHub Actions production procedure, verify deployment/domain and the guest journey, and record post-deploy results. Keep paid checkout and automatic charges disabled.

At release time:

> If the release record has all 15 checks passed and business/security/access gates signed, deploy the recorded main commit through the documented production workflow now. If a required gate remains open, report NO-GO and the next action. Verify READY, commit, custom domain, fresh creation, recovery and RSVP before announcing launch. Reset the deployment variable to false afterward.

There is **no scheduled launch job**. A deployment commanded at 23:59 finishes later after CI/build. Record the actual launch time; do not silently shift the offer end again.

## Working constraints

Retain React/TypeScript/Vite/Three.js and original assets where distribution is cleared. No backend rewrite, accounts, payment gateway, generated assets, broad dependency upgrade or speculative ML work tonight. Ask before new spending or substantial reconstruction. Focused fixes and affected tests can proceed. Keep evidence and code together; no force-push, production-data deletion to pass tests, or skipped checks reported as passed.

Never transfer `.env.local`, `.vercel`, cached CLI credentials or the chat-shared token into Git. GitHub CI secrets exist but cannot be read back. Replace the chat-shared Vercel token in the provider and GitHub secret, prove a preview deployment using the replacement, then revoke the old token. Do not revoke first and strand the mobile operator.

Codex prepared this handoff; it has not authenticated or messaged a Cursor session. Takeover is proven only when the founder can start this repository's cloud agent and inspect Actions/provider dashboards from the phone. Follow the [access checklist](docs/handoff/ACCESS-AND-TAKEOVER.md).
