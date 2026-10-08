# FindMyInvite — Technical SEO Audit

| Field | Value |
|---|---|
| **Site** | https://findmyinvite.com / https://www.findmyinvite.com |
| **Audit time** | 2026-09-17 ~02:30 IST |
| **Method** | `curl` (headers/redirects/status), DNS `dig`, WebFetch (rendered/markdown content), WebSearch (`site:` + brand queries), headless Chrome (blocked) |
| **Hosting** | Vercel (`server: Vercel`; www CNAME `*.vercel-dns-017.com`) |
| **Do not invent** | Metrics below are evidence-backed only. Where raw HTML meta could not be read, that is stated explicitly. |

---

## Method limits (read first)

1. **Box egress is blocked by Vercel Attack Mitigation** for this IP: HTTPS responses return **HTTP 403** with `x-vercel-mitigated: deny` (plain text body `Forbidden`) for homepage, `robots.txt`, `sitemap.xml`, and key routes — including with a Googlebot User-Agent string. This is **IP reputation / bot mitigation**, not proof that Googlebot from Google’s IP ranges is blocked.
2. **WebFetch** (different egress) can retrieve page content. It returns **markdown-converted** views, so **`<link rel="canonical">`, `<meta name="robots">`, and Open Graph tags are not reliably extractable** unless present as visible text. Findings for those tags say “not observed in fetch evidence” when missing from converted output.
3. Headless Chrome on the box also received Vercel’s **“403: Forbidden / This request was blocked”** interstitial — same mitigation.

---

## Executive summary

The product homepage is reachable from some networks and has a clear title, H1, and JSON-LD. **Indexability plumbing is broken or missing:** `robots.txt` and `sitemap.xml` soft-serve the SPA shell (not real robots/sitemap documents), several public routes look **JS-shell-thin** to non-JS fetchers, apex DNS still uses **Hostinger parking nameservers**, and **Google WebSearch returned no `site:findmyinvite.com` results**. HTTP→HTTPS works; **www and apex are not consolidated** by redirect.

---

## 1. robots.txt

### Evidence

| Probe | Result |
|---|---|
| `curl` https://findmyinvite.com/robots.txt | **403** `x-vercel-mitigated: deny` (box IP) |
| `curl` https://www.findmyinvite.com/robots.txt | **403** same |
| WebFetch https://findmyinvite.com/robots.txt | Body is **HTML SPA shell**, not robots syntax: page title `Create Invitation Webpage Online for All Events \| FindMyInvite` + schema.org `WebApplication` JSON-LD (same signature as homepage shell) |
| WebFetch https://www.findmyinvite.com/robots.txt | **Same SPA shell** (not `User-agent:` / `Disallow:` text) |

### Contents

**Could not retrieve a real robots.txt.** Observed response content (via WebFetch) is the app shell / homepage metadata, which means either:

- there is **no** `robots.txt` and the SPA catch-all returns `index.html` for `/robots.txt`, or  
- bots that get past mitigation still see **HTML instead of `text/plain` robots**.

### Blocks important paths?

**Unknown from a valid robots file** (file not served).  
**Red flag:** if crawlers request `/robots.txt` and receive HTML with HTTP 200, that is invalid robots and can confuse crawling. No evidence of an intentional `Disallow: /` text rule — because no robots text was served.

### Severity

**P0** — Missing / soft-404 `robots.txt`.

### Fix

Serve a static or framework-generated plain-text robots at both hosts, e.g.:

```
User-agent: *
Allow: /

Sitemap: https://findmyinvite.com/sitemap.xml
```

In Next.js: `app/robots.ts` (or `public/robots.txt`) that returns `text/plain`. Ensure the route is **not** swallowed by the SPA fallback. Verify with `curl -I` → `200` and `content-type: text/plain`.

---

## 2. sitemap.xml (or sitemap index)

### Evidence

| Probe | Result |
|---|---|
| WebFetch https://findmyinvite.com/sitemap.xml | **SPA shell** (same title + JSON-LD) — **not** `<urlset>` / `<sitemapindex>` |
| WebFetch https://www.findmyinvite.com/sitemap.xml | Same SPA shell |
| `curl` sitemap.xml / sitemap_index.xml / /sitemap | **403** from box |
| URL count / sample `<loc>` list | **Not available** — no XML sitemap document retrieved |
| Submitted paths | **Not verifiable** without Search Console access; no sitemap URLs discoverable from robots (robots missing) |

### Exists?

**No valid sitemap document observed.** Soft HTML response for `/sitemap.xml` is a soft-404 pattern for crawlers expecting XML.

### Severity

**P0** — Missing sitemap.

### Fix

- Add `app/sitemap.ts` (or static `public/sitemap.xml`) listing at least: `/`, `/templates`, `/create`, `/about`, `/pricing` (if public), plus indexable template/demo URLs you want ranked.
- Reference it from robots.txt.
- Submit in Google Search Console once DNS/host is stable.
- Return `application/xml` and HTTP 200; do not fall through to the React shell.

---

## 3. Homepage — title, meta, canonical, robots, H1, OG, status, redirects

### Redirect chain (curl headers, box)

| Start URL | Observed chain |
|---|---|
| `http://findmyinvite.com/` | **308** → `https://findmyinvite.com/` → then **403** (mitigation on this IP) |
| `http://www.findmyinvite.com/` | **308** → `https://www.findmyinvite.com/` → then **403** |
| `https://findmyinvite.com/` | **403** (no `Location`; not redirecting to www) |
| `https://www.findmyinvite.com/` | **403** (no `Location`; not redirecting to apex) |

**HTTP→HTTPS:** yes (308 Permanent Redirect, Vercel).  
**www↔apex consolidation:** **not observed** (both HTTPS hosts answer independently).

### Status code (true production status for normal users)

- WebFetch retrieved full homepage content from `https://findmyinvite.com/` and `https://www.findmyinvite.com/` → **effective 200 for that egress**.
- Box/`curl`/headless Chrome → **403** mitigated.

### On-page signals (WebFetch markdown — when full render succeeded)

| Signal | Observed value | Notes |
|---|---|---|
| **Title** | `Create Invitation Webpage Online for All Events \| FindMyInvite` | Present |
| **Meta description** | Not seen as HTML meta in converter output | JSON-LD `description` present (see below) |
| **Canonical** | **Not observed** in fetch evidence | JSON-LD `"url":"https://findmyinvite.com"` prefers apex |
| **Robots meta** | **Not observed**; no `noindex` string in retrieved homepage markdown | Cannot confirm `index,follow` explicitly |
| **H1** | `Create All Events Invitation Webpage Online in Minutes` (whitespace split in markdown: “InvitationWebpage”) | Present |
| **OG tags** | **Not observed** in fetch evidence | Need raw HTML/`curl` from an allowlisted IP to confirm |
| **JSON-LD** | `WebApplication` — name `FindMyInvite`, url `https://findmyinvite.com`, description about digital invitation webpages, `offers.price` `1499` `INR` | Present in shell and homepage |

### Severity notes

- **P1** — No apex↔www canonical redirect (duplicate-host risk). Prefer one host (JSON-LD already points at apex) and 301/308 the other.
- **P1** — Confirm/add `meta name="description"`, `rel=canonical`, and `og:*` in SSR `<head>` (not only client-side).
- **P2** — H1 readability / spacing (“Invitation Webpage”) if raw DOM has missing spaces.

---

## 4. Key public routes — status + noindex?

Status from box `curl`: all tested HTTPS routes → **403** (mitigation).  
Status from WebFetch: content retrieved (implies success for that egress). **No `noindex` string observed** in any retrieved bodies.

| Route | WebFetch evidence | Indexability notes |
|---|---|---|
| `/templates` | **www** earlier: title `Invitation Templates \| FindMyInvite`; filters/copy present; **"Loading designs…"** (JS-dependent catalog). **apex** later fetch: thin shell only (title + JSON-LD) | Partial SSR / client-heavy. Risk of thin indexable HTML |
| `/create` | **www**: title `Personalize Your Invitation \| FindMyInvite`; H1 `Create Your Invitation`; full form UI. Apex sometimes thin shell | Page exists; consider `noindex` if you do not want the form utility URL ranking (product decision) — **not currently evidenced as noindex** |
| `/about` | Thin shell only (homepage title + JSON-LD) on apex and www | **Soft-thin / JS-only to fetcher** — high crawl risk |
| `/pricing` | Thin shell only on apex and www | Pricing appears **on homepage** in full render; dedicated `/pricing` looks undeclared to non-JS fetch |

**Noindex?** Not observed on these routes in available evidence.

---

## 5. Indexability red flags

| Red flag | Severity | Evidence |
|---|---|---|
| **Missing / soft HTML `robots.txt`** | **P0** | WebFetch returns SPA shell for `/robots.txt` |
| **Missing / soft HTML `sitemap.xml`** | **P0** | WebFetch returns SPA shell for `/sitemap.xml` |
| **SPA catch-all soft-404 pattern** | **P0** | robots, sitemap, and some routes share homepage title + same JSON-LD snippet |
| **JS-only / thin HTML on key URLs** | **P0** | `/about`, `/pricing` thin; `/templates` shows “Loading designs…”; intermittent thin shells on apex |
| **Vercel mitigation 403 from datacenter IPs** | **P1** | `x-vercel-mitigated: deny` on all box probes (including Googlebot UA spoof). Confirm Googlebot/Bingbot allowlisted in Vercel Firewall / Attack Challenge |
| **Apex DNS on parking NS** | **P0** | `dig NS` → `aurora.dns-parking.com` / `nebula.dns-parking.com`; SOA `dns.hostinger.com`. www correctly CNAMEs to Vercel. Unstable/incorrect apex DNS hurts crawl trust |
| **No www↔apex consolidation** | **P1** | HTTPS neither host redirects to the other |
| **No Google `site:` results** | **P0** (visibility) | WebSearch `site:findmyinvite.com` and `site:www.findmyinvite.com` → **no results** |
| **Meta robots noindex** | Not found | No `noindex` in retrieved content |
| **Disallow: /** | Not found | No real robots file |

---

## 6. Google-oriented WebSearch checks

| Query | Result (WebSearch tool) |
|---|---|
| `site:findmyinvite.com` | **No results found** |
| `site:www.findmyinvite.com` / `site:www.findmyinvite.com invitation templates` | **No results found** |
| `findmyinvite.com` | No live product page in top results; WHOIS/parking mentions; unrelated “Find Invite” domains |
| `"FindMyInvite"` | No official site result surfaced in tool synthesis |
| `"FindMyInvite Classic" OR "FindMyInvite Royal" OR "Premium Digital Invitations"` | **No FindMyInvite.com hit** in returned links |
| `"Create Invitation Webpage Online for All Events" FindMyInvite` | Tool pointed at **other** invitation brands; **did not return findmyinvite.com** |

**Indexed URL count:** cannot claim a Google exact count without Search Console; **tool evidence is consistent with ~0 indexed URLs** for `site:findmyinvite.com` at audit time.

Domain age signal (external WHOIS via search): registration ~**2026-09-14** — very new; indexing lag is expected, but broken robots/sitemap/JS shells will delay recovery.

---

## 7. DNS / host hygiene (extra P0 context)

```
findmyinvite.com.     NS  aurora.dns-parking.com. / nebula.dns-parking.com.
findmyinvite.com.     A   216.198.79.1
www.findmyinvite.com. CNAME add4a49499e0845e.vercel-dns-017.com. → A 64.29.17.65 / 216.198.79.65
TXT records             (none observed via dig +short)
```

**Fix:** Point apex nameservers (or at least apex A/ALIAS/ANAME + www CNAME) fully to Vercel/Hostinger DNS as documented for Vercel domains. Remove parking NS. Add Google Search Console verification TXT once NS is correct.

---

## Prioritized issue list

### P0 — fix immediately

1. **Serve a real `robots.txt`** (plain text; not SPA HTML).  
2. **Serve a real `sitemap.xml`** (XML urlset/index) and link it from robots.  
3. **Stop SPA soft-404s** for unknown/static SEO paths — correct status codes (404 for unknown; 200+XML/text for sitemap/robots).  
4. **SSR or prerender** public marketing routes (`/`, `/templates`, `/about`, `/pricing`) so title/description/H1/main copy exist in first HTML.  
5. **Fix apex DNS** — leave Hostinger parking NS; make apex+www authoritative on the intended DNS (Vercel).  
6. **Confirm Search Console / indexing** — after fixes, request indexing; currently `site:` shows no results.

### P1 — fix this week

1. **Pick one canonical host** (apex per JSON-LD) and **308/301** the other.  
2. **Add/verify** `rel=canonical`, meta description, `og:title` / `og:description` / `og:image` / `og:url` in server HTML.  
3. **Review Vercel Firewall / Attack Challenge** so Googlebot/Bingbot are not challenged; monitor crawl stats after allowlisting.  
4. **Decide index policy for `/create`** (utility) — often `noindex,follow` if thin/duplicative of homepage CTA.  
5. **Ensure `/about` and `/pricing` either redirect to homepage sections or ship real SSR content** (today they look like empty shells to fetchers).

### P2 — polish

1. H1 spacing/readability.  
2. Unique titles/descriptions per route (templates vs create vs about).  
3. Expand sitemap with public demo/template URLs worth ranking.  
4. Add `Organization` / `WebSite` JSON-LD alongside `WebApplication` if desired.  
5. Monitor Core Web Vitals after SSR work (not measured in this audit).

---

## Concrete fix checklist (engineering)

1. **DNS:** Hostinger → replace parking NS with Vercel nameservers **or** keep Hostinger DNS but set apex A/ALIAS to Vercel and www CNAME to `cname.vercel-dns.com` / project target; wait for propagation; re-`dig`.  
2. **Next.js (or equivalent):**
   - `app/robots.ts` → allow public paths; sitemap URL.
   - `app/sitemap.ts` → absolute HTTPS apex URLs.
   - Marketing pages as Server Components / static generation with full `<head>` metadata API.
   - Middleware: redirect `www` → apex (or reverse); keep HTTP→HTTPS (already on Vercel).
3. **Vercel:** Firewall — allow verified bots; disable overly aggressive “deny” for SEO paths if needed; ensure `/robots.txt` and `/sitemap.xml` bypass SPA fallback.  
4. **GSC:** Verify property (apex + www or domain property), submit sitemap, inspect `/` and `/templates`.  
5. **QA commands** (from a non-blocked network):

```bash
curl -sI https://findmyinvite.com/robots.txt          # 200 text/plain
curl -s https://findmyinvite.com/robots.txt | head
curl -sI https://findmyinvite.com/sitemap.xml          # 200 application/xml
curl -sI https://www.findmyinvite.com/                # 308/301 → https://findmyinvite.com/
curl -s https://findmyinvite.com/about | grep -i '<h1\|meta name="description"\|rel="canonical"'
```

---

## Evidence appendix (raw)

### curl redirect / mitigation (box IP)

- `http://` → `308` Location `https://…` (apex and www).  
- `https://` homepage, robots, sitemap, templates, create, about, pricing → **403**, header `x-vercel-mitigated: deny`, body `Forbidden` (~70 bytes).  
- Googlebot UA spoof → still **403**.

### WebFetch content fingerprints

- Homepage (full): title + H1 + features + Classic ₹1199 / Royal ₹1499 + FAQ (launch 14 Sep–14 Oct 2026 IST).  
- `/robots.txt`, `/sitemap.xml`: homepage title + JSON-LD only.  
- `/create` (www): full “Create Your Invitation” UI.  
- `/about`, `/pricing`: shell only in these probes.  
- `/templates` (www, one probe): “Invitation Templates” + “Loading designs…”.

### WebSearch

- `site:findmyinvite.com` → no results.  
- Brand queries → findmyinvite.com not surfaced as primary result.

---

*End of audit. Re-run after DNS + robots/sitemap + SSR fixes; re-check `site:` in 3–14 days.*
