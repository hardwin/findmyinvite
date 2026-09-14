# Decisions, launch gates and risk register

**Owner names and approvals are unassigned until entered in [RELEASE-RECORD.md](RELEASE-RECORD.md).** The 23:59 target does not override release gates. Status derives from [STATUS.md](STATUS.md); timestamps and evidence take precedence over assumptions.

## Architecture / product decisions

| ID | Decision | Reason / consequence |
| --- | --- | --- |
| D01 | Vercel + private Blob, Supabase, GitHub CI | Existing provisioned stack; avoid a launch-night rewrite |
| D02 | Guest capability management, no accounts | Fast host entry; recovery key custody is essential and no email reset exists |
| D03 | Public `/<slug>` URLs | Single domain and ordinary routing; no wildcard DNS needed |
| D04 | Supabase tables/dashboard as v1 CMS | No extra CMS vendor; rendering stays versioned code; variations deferred |
| D05 | 30-day free creation; ₹1,199/₹1,499 regular list prices | No checkout or automatic charge; paid commerce must be implemented separately |
| D06 | Launch postponed to 14 Sep 23:59 IST | Code/project settings aligned; old deployed runtime requires replacement |
| D07 | Reuse reference media; generate none | Visual continuity; public/commercial permission is still unresolved |
| D08 | GitHub-hosted release and cloud/mobile takeover | Laptop state is not an operational dependency; access proof remains required |

## Blocking gates

| ID | Risk / current evidence | Required action | Accountable role |
| --- | --- | --- | --- |
| G01 | Old production still starts at 21:00; shared catalog currently hides all templates | Replace/contain old runtime before any shared catalog publication; verify `/api/invitations?action=config` | Release Manager / DevOps |
| G02 | Apex/www still point to parking | Hostinger DNS update, Vercel domain validation, external HTTPS/redirect proof | DevOps / domain owner |
| G03 | Reference asset rights unresolved; embedded Zareqia branding | Record provenance and distribution permission per released design; remove/replace unauthorized assets only through approved work; leave catalog closed meanwhile | CEO / Risk & Audit / Design |
| G04 | Vercel Hobby plan | Confirm a commercially suitable plan; authorized billing owner handles purchase if needed | Finance / CEO |
| G05 | No operator identity/support mailbox; policy drafts | Supply actual details, test mailbox, approve data/retention/support language | Product Owner / Risk & Audit |
| G06 | Fresh public-create + full 15-case release evidence incomplete | Exercise a safely isolated active preview or complete the guarded staging route in runbook; final production smoke after deploy | QA / Engineering |
| G07 | Mobile provider access, fallback operator and backup restore not proved | Complete access checklist; record backups and tested restore path | Release Manager / DevOps / Data |
| G08 | CI token was previously pasted into chat | Coordinate replacement, update GitHub secret, prove preview, revoke old credential; never put either in docs | Cybersecurity / DevOps |

Vercel describes Hobby as personal/non-commercial. The application has a commercial product intent even during a free offer; plan suitability must be resolved rather than assumed. [Official Hobby guidance](https://vercel.com/docs/plans/hobby).

## Operational risks requiring an explicit disposition

| ID / priority | Failure mode | Control or bounded mitigation | Remaining work |
| --- | --- | --- | --- |
| R01 / High | Shared staging data damages live invitations | Unique synthetic slugs; no broad SQL changes; use isolated staging | Separate DB/Blob and least-privilege team access |
| R02 / High | Lost/leaked bearer recovery key | Download recovery before sharing; private storage; no secret URLs in logs/support | Account claim/recovery and key rotation design |
| R03 / High | Failed backups or unmanaged deletion | Verify export/restore for SQL and private Blob; named incident operator | Scheduled backup, restore exercises, documented retention |
| R04 / High | Service-role or Blob token leaks | Server-only env, CI secret storage, redacted evidence, RLS/revoked grants | Token rotation process and ongoing scanning |
| R05 / High | Traffic or media costs exhaust quota | Rate limits, staged marketing, usage alerts and founder-approved spend cap | Measured capacity and cost per invitation |
| R06 / Medium | Interrupted upload leaves data/bytes inconsistent | Retained recovery key, explicit error, retry and inspect only owned records | Versioned media/publish transaction pattern and orphan cleanup |
| R07 / Medium | Expired files/rate rows accumulate | Public expiry enforcement; conservative policy language | Scheduled cleanup and deletion audit |
| R08 / Medium | Shared-network guests hit limits | Clear retry messaging, observe real 429s | Tune measured limits; do not disable protection to pass tests |
| R09 / Medium | Guest inbox >1,000 appears incomplete | `hasMore` warning; restricted operator assistance | Pagination/export with access checks |
| R10 / Medium | New pushes cancel an active release | Freeze main during release; record exact SHA; one release operator | Stronger release concurrency/environment protection |
| R11 / Medium | Old rollback reopens wrong offer / CMS | Check rollback runtime, catalog and schema compatibility first | Current-config maintenance candidate and rehearsed recovery |
| R12 / Medium | Empty gallery or reused media undermines launch | Publish only cleared supported designs; describe limited launch honestly | Complete remaining template fidelity/brand replacement |
| R13 / Medium | Origin move loses local host keys | Recover using saved key on custom origin; recheck after domain cutover | Migration UX and account-based recovery |
| R14 / Medium | Acquisition claims or SEO promises lack evidence | No invented visitors, customers, testimonials or revenue; generic social previews disclosed | First-party consent-aware measurement and SEO improvements |

A risk acceptance entry must name the risk, scope, person, expiry/review date, mitigation and evidence. Acceptance cannot turn an unperformed test into a pass or authorize spending/asset rights on someone else's behalf.

## Deferred scope and revenue transition

Accounts, payment gateway/orders/webhooks, subscriptions, personalized social previews, full translation, remaining detailed template matching, arbitrary CMS rendering, ML features and automatic retention are outside tonight's scope. Before the free period ends, choose and implement an authorized payment provider, server-verified purchase entitlements, idempotent webhooks, settlement/refund procedures and appropriate terms. Until then, offer expiry blocks **new creation** and never charges existing users.

No launch campaign, email broadcast, purchase or HR action has been sent/performed by this documentation task. Owners use their own approved channels after actual release evidence is available.
