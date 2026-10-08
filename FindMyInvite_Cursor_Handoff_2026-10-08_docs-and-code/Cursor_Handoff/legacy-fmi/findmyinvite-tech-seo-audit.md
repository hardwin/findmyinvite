# FindMyInvite — Free technical SEO audit
**Site:** findmyinvite.com  
**Date:** 17 Sep 2026 (Asia/Kolkata)  
**Scope:** Free signals only (no Search Console). No invented rankings.

## Executive one-liner
The public site is currently **unreachable** from crawl/audit vantage points (Vercel **403 Forbidden — “This request was blocked”**), so Google cannot reliably index robots/sitemap/content until firewall/bot rules are fixed.

## Scope checklist

| Area | Status | Notes |
|------|--------|-------|
| robots.txt | **Blocked — cannot check content** | URL returns 403 HTML challenge page, not robots text |
| sitemap.xml | **Blocked — cannot check** | Same 403 |
| noindex / canonicals | **Blocked — cannot check** | No HTML body of real app served |
| Homepage / templates meta | **Blocked — cannot check** | Title observed: `403: Forbidden` |
| Status codes / redirects | **Verified (partial)** | HTTPS apex + www → **403**; header `x-vercel-mitigated: deny`; server Vercel |
| DNS / hosting | **Verified** | Apex resolves; `www` → `*.vercel-dns-017.com` (Vercel) |
| Mobile basics | **Blocked** | Cannot load real UI |
| CWV (PageSpeed) | **Needs verification** | Free PSI API quota exhausted (429); retry later after unblock |
| Google visibility | **Verified (negative)** | `site:findmyinvite.com` / `cache:` returned no useful hits; brand queries surface competitors, not FMI |

## Findings (prioritized)

### Critical
1. **Vercel WAF hard-deny on public URLs** — Chrome + curl get 403 “This request was blocked” on `/`, `/robots.txt`, `/sitemap.xml`, key paths. Evidence: `x-vercel-mitigated: deny`, Vercel `cle1::…` request ids. **Impact:** crawlers and many clients never see the product; SEO content work is useless until fixed.
2. **No observable Google index footprint (free check)** — `site:` / brand search did not surface findmyinvite.com. Treat as non-indexed until GSC proves otherwise.

### High (blocked until Critical cleared)
3. **Cannot validate robots allow rules** — may be fine or may disallow; unknown while 403.
4. **Cannot validate sitemap presence/quality** — unknown URL count, lastmod, template coverage.
5. **Cannot validate canonical host (apex vs www)** — both 403 today; need single preferred host + redirect after unblock.
6. **Cannot validate meta titles/descriptions on homepage & templates** — needed for SERP CTR once indexed.

### Medium / Needs verification
7. **CWV / mobile** — re-run PageSpeed (mobile+desktop) after 200 responses.
8. **India user access** — confirm whether real India phones see 200 or also 403 (datacenter IP vs global block).
9. **/akay vs public routes** — deferred until public HTML is crawlable (per Co-founder P1 scope).

## P0 fixes (ordered)
1. **Tech Architect / Vercel owner:** inspect Firewall, Attack Challenge Mode, bot protection, IP/geo rules. Public marketing + catalog routes must return **200** to browsers and **Googlebot**. Do not leave robots/sitemap behind a deny.
2. **Ashok:** smoke-test from India phone + laptop; screenshot if still blocked.
3. **After 200s:** prefer one host (apex or www), 301 the other; ship valid `robots.txt` + XML sitemap; ensure no sitewide noindex.
4. **Verify in GSC** (next phase per Ashok: after this free audit): property, URL inspection, sitemap submit, coverage.
5. **SEO Lead re-audit:** meta, canonicals, template indexability, CWV, then unlock SEO Content briefs.

## Owners
| Item | Owner |
|------|--------|
| Unblock Vercel | Tech Architect |
| India smoke-test | Ashok |
| Re-audit after unblock | SEO Lead |
| GSC (later) | Ashok + SEO Lead |
| Keyword/LP briefs | SEO Content (after unblock + keyword lock) |
| Plain English for Ashok | Product Owner |

## What we still need
- Vercel project access / firewall change confirmation  
- Ashok: does the site load in India right now?  
- Search Console (deferred by Ashok until after this free audit) for true coverage/indexing counts  

## What we cannot know without GSC
- Exact indexed URL count, coverage errors, crawl stats, enhancement issues, query impressions  

---

## Addendum (aligned with Co-founder audit, same day)

### Verified via WebFetch (alternate egress — not box IP)
- `/robots.txt` returns **homepage SPA shell** (title + JSON-LD WebApplication), **not** robots text → **P0 missing/soft robots**
- `/sitemap.xml` returns **same SPA shell**, **not** XML → **P0 missing/soft sitemap**

### DNS (verified dig @8.8.8.8)
- Apex NS: `nebula.dns-parking.com` / `aurora.dns-parking.com` (**Hostinger parking**) → **P0 DNS**
- `www` CNAME → `*.vercel-dns-017.com` (Vercel)
- No www↔apex consolidation observed under HTTPS

### Implication
Even after WAF allowlists for Googlebot, indexability stays broken until real robots + sitemap ship and apex NS points at Vercel (or www is the sole canonical with redirects).
