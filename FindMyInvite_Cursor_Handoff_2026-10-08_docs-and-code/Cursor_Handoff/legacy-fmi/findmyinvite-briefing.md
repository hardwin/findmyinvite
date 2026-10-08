# FindMyInvite — Co-founder Business Briefing

**Prepared for:** Ashok (co-founder review)  
**Site:** https://findmyinvite.com/  
**Researched:** 16 Sep 2026 (IST)  
**Method:** Homepage + all major nav/footer routes; SPA JS bundle analysis; live `/api/invitations?action=config`; headless Chrome DOM dumps (site is a React SPA on Vercel, so static fetch alone is thin).

---

## 1. Company

| Field | Finding | Evidence |
|---|---|---|
| **Name** | FindMyInvite | Site title, footer, schema.org `WebApplication` name |
| **What they do** | Digital invitation **webpages** (animated online invites with RSVP), not printed cards | About, shipping policy, footer |
| **Positioning** | “Premium Digital Invitations” — create an invitation webpage “in minutes”; Classic animated vs Royal cinematic | Homepage hero + pricing section |
| **Legal / entity name** | **Not found on site** — terms say “Business identity… awaiting confirmation” | `/terms` |
| **Location / HQ** | **Not stated** as a city/office. Strong India-market signals: INR pricing, IST clocks, WhatsApp share, demo copy (Udaipur / Taj), English↔Urdu toggle on demos | Pricing API, FAQ, create form, demo UI |
| **Market** | India-first B2C celebration hosts (inferred from currency, IST, WhatsApp, occasion mix) | Pricing currency INR; launch window in IST |
| **Stack (public)** | Vercel hosting + media; Supabase for invitation/RSVP records | Privacy notice |
| **Domain / host** | Live on Vercel (`server: Vercel`). Very new product (launch ceremony / free window from 14 Sep 2026) | HTTP headers; FAQ launch dates |
| **Tagline / footer** | “© 2026 FindMyInvite. Crafted with love” · “Digital invitation service • No physical products shipped” | Footer (all pages) |

**Key quotes**
> “FindMyInvite helps you create a digital invitation with animated designs, event details, photos and guest RSVP.” — `/about`  
> “Business identity, support contact and final service terms are awaiting confirmation.” — `/terms`

---

## 2. Product

**What it is:** A **web application** that lets hosts create a **personalized, shareable invitation webpage** (link) for life events. Guests open the public URL; hosts manage via a separate **private management / recovery link**. Digital-only — **no physical products**.

| Aspect | Detail | Source |
|---|---|---|
| Product type | Digital invitation webpage / micro-site | About, shipping |
| Physical goods | Explicitly none | Shipping policy, footer |
| Platform | Browser-based SPA; guest access (v1); no required signup | About, FAQ, `/create` |
| Delivery | Instant digital link after publish (`findmyinvite.com/{slug}`) | Create form, shipping |
| Sharing | WhatsApp, email, or any platform (copy link) | Homepage |
| Guest features | Animated opening, scratch-to-reveal date, countdown, gallery, timeline, venue/maps, dress code, pre-events, transport, accommodation, gifts, RSVP + messages, optional music, calendar download; demo has English/Urdu toggle | Features section; invite sections in app; demo UI |
| Host management | Private management link; edit details; view RSVPs (latest 1,000 shown; earlier retained — contact support for export); delete invitation | FAQ, manage UI strings, dashboard |
| Drafts | Local drafts on device; publish to get cross-device guest link | `/create`, `/dashboard` |
| Accounts | Version 1 = **guest access**, not registered accounts. `/login` and `/signup` resolve to the same “My Invitations / restore recovery link” dashboard UX | FAQ, `/login`, `/signup`, `/dashboard` |
| Media limits | Personal photos: up to **4**, max **1 MB** each (create form) | `/create` |
| Slug | Public path 3–48 chars; lowercase letters, numbers, hyphens; availability checked on publish | `/create`, API error copy |

**Demo / ceremony extras**
- Live demos: `/invite/demo?template=…` (e.g. `rose-gold-blush-royal`, `emerald-noir`, `royal-prestige`)
- Grand launch experience: `/grand-launch` (scratch-card ceremony for 14 Sep 2026; post-ceremony copy notes premiere ended 3:00 AM IST 15 Sep 2026)
- Internal operator UI exists at `/akay` (not linked from public nav; not researched as a customer surface)

---

## 3. Services

Listed / implied **productized services** (not agency/consulting):

1. **Invitation webpage creation** — form → animated invitation site  
2. **Template catalog** — Classic + Royal design collections  
3. **Guest RSVP + messages** collection  
4. **Photo slideshow** hosting  
5. **Background music** options  
6. **Venue directions / maps** + calendar download  
7. **Interactive features** — scratch reveal, countdown, timeline, dress, pre-events, transport, accommodation, gifts  
8. **Publish & share** — public guest link + private host link  
9. **Local draft / restore** via recovery link on dashboard  

**Not offered (on site):** print/shipping, white-glove design studio service, WhatsApp Business consult sales channel, B2B event-planner portals, paid checkout (during launch).

---

## 4. Value proposition

**Why customers buy (as the site sells it):**

- Stunning **animated / cinematic** invitation webpages without hiring a designer  
- **Fast:** “Fill a simple form… share it with your guests instantly” / “in Minutes”  
- **All-in-one event page:** details, photos, music, maps, RSVP — not just a static image  
- **Easy share** via WhatsApp (critical for India)  
- **No account friction** (guest access)  
- **Launch offer:** free creation for 30 days, no card, both collections  
- Clear tiering: elegant Classic vs immersive Royal cinematic openings  

**Key quotes**
> “Fill a simple form, get a stunning animated invitation webpage — share it with your guests instantly.” — Homepage  
> “Choose a template, fill in your event details, and get a personalized invitation webpage you can share via WhatsApp, email, or any platform.” — Homepage  
> “Every invitation comes packed with interactive features that make your event announcement unforgettable.” — Features  

---

## 5. Customers

| Dimension | Finding | Evidence |
|---|---|---|
| **Model** | **B2C** (hosts creating invites for personal events) | Occasion list, guest RSVP, copy |
| **B2B** | **Not found on site** (no planner/venue packages) | — |
| **Personas** | Couples / families hosting weddings & receptions; also hosts of engagements, birthdays, anniversaries, housewarmings, parties, baby showers, opening ceremonies, custom events | Occasion chips / `Bo` types |
| **Occasions (SKU-like types)** | Wedding; Engagement; Wedding & Reception; Reception only; Birthday; Opening Ceremony; Anniversary; Housewarming; Party; Baby shower; Custom | Homepage + `/templates` filter |
| **Geography** | India-primary (INR, IST, WhatsApp, Urdu option, Indian demo venues/names) | Multiple pages |
| **Customer proof** | **No testimonials, case studies, or customer logos found** | Blog empty; homepage has no social proof section |

---

## 6. Sales motion

| Dimension | Finding | Evidence |
|---|---|---|
| **Primary** | **Self-serve** product-led growth: browse templates → create → publish | CTAs “Create My Invitation”, “Get Started”, `/templates`, `/create` |
| **Checkout** | **No paid checkout in current guest launch version** | Terms, refund policy |
| **Payment capture** | Does **not** collect cards during launch offer | FAQ |
| **WhatsApp sales** | Sharing invites via WhatsApp is a **product feature**, not a documented sales channel to buy from FindMyInvite | Homepage / invite UI |
| **Consultative / human sales** | **Not found** — Contact page has no phone/email/WhatsApp for sales | `/contact` |
| **Auth funnel** | Guest + recovery link; login/signup routes don’t present a traditional account wall | `/login`, `/signup` |
| **Marketing moments** | Launch banner + `/grand-launch` ceremony; free 30-day window | Homepage, FAQ, API config |

**Conversion path (public):**  
Home / Templates → choose Classic or Royal design → `/create` → Save draft or **Publish Free Launch Invitation** → share public link; save private management link.

---

## 7. Catalogs / collections / categories

### Collections (2)
| Collection | Positioning | Count |
|---|---|---|
| **FindMyInvite Classics** (`collection=classic`) | “Elegant animated invitations for every occasion” | **5** designs |
| **FindMyInvite Royal** (`collection=royal`, default on `/templates`) | “Cinematic Royal invitation designs” | **8** designs |

**Total designs marketed:** **13 premium invitation templates** (homepage: “13 Premium Invitation Templates”).

### Invitation types (filters / event categories)
Wedding · Engagement · Wedding & Reception · Reception only · Birthday · Opening Ceremony · Anniversary · Housewarming · Party · Baby shower · Custom  

These appear as filters on `/templates` and occasion chips on the homepage — they are **event-type labels**, not separate priced SKUs.

### Blog / content catalog
`/blog` — “The FindMyInvite journal” — **“No articles have been published yet.”**

---

## 8. SKUs / product types / variants

Treat **plans × templates × invitation type** as the visible catalog.

### A. Plans (priced tiers) — primary commercial SKUs
| SKU / Plan | Listed price | Differentiator |
|---|---|---|
| **FindMyInvite Classic** | **₹1,199** | Animated invitations |
| **FindMyInvite Royal** | **₹1,499** | Everything in Classic **+ Royal cinematic opening** |

Confirmed by live API: `{"prices":{"classic":1199,"royal":1499}}` — https://findmyinvite.com/api/invitations?action=config  
Schema.org homepage offer also lists `"price":"1499","priceCurrency":"INR"`.

### B. Template SKUs (design variants)

**Royal (`royal: true`) — 8**
| ID | Display name | Badge | Description |
|---|---|---|---|
| `rose-gold-blush-royal` | Royal Imperial | Cinematic | Cinematic rose-gold opening with luxurious motion storytelling |
| `royal-majesty` | Royal Majesty | New | Porcelain blue ballroom romance with painterly cinematic grandeur |
| `modern-minimal-royal` | Royal Elegance | Premium | Velvet cream and crimson cinematic experience with palace motifs |
| `royal-prestige` | Royal Prestige | New | Prestigious cinematic opening with refined elegance and grandeur |
| `royal-heritage` | Royal Heritage | New | Timeless cinematic opening with regal heritage storytelling |
| `royal-grace` | Royal Grace | New | Sage garden serenity with pearl drapes and graceful cinematic reveal |
| `royal-crest` | Royal Crest | New | Warm ivory florals, antique burgundy wax seal, and lakeside cinematic romance |
| `royal-legacy` | Royal Legacy | New | Burgundy velvet curtains, antique gold ornament, and a timeless cinematic reveal |

**Classic (`royal: false`) — 5**
| ID | Display name | Badge | Description |
|---|---|---|---|
| `emerald-noir` | Emerald Noir | Limited Edition | Deep green and gold with ornate corner accents and luxury door opening |
| `ivory-elegance` | Crimson Royale | Most Liked | Dark charcoal base with gold and deep red accents, luxury card reveal |
| `rose-gold-blush` | Rose Gold Blush | — | Blush pink and rose gold with ornate floral door animation |
| `modern-minimal` | Modern Minimal | New | Deep navy and gold with geometric patterns and book-style opening |
| `royal-elegance` | Majestic Love | New | Classic ivory and gold with palace motifs and velvet curtain reveal |

### C. Add-ons / options (not separately priced on site)
- Background music: **No music**, **Beautiful Dream**, **Chill** (create form); homepage preview mentions “Soft Sitar Melody”  
- Optional invitation sections: welcome, scratch, gallery, countdown, timeline, venue, dress, pre-events, transport, accommodation, gifts, RSVP  
- Language on demos: English / Urdu  
- Custom public slug  

**No per-template price deltas** visible — pricing is by Classic vs Royal plan only.

---

## 9. Offer / packages / tiers

### Launch offer (active at research time)
| Item | Detail |
|---|---|
| Window | **14 Sep 2026, 11:59 PM IST → 14 Oct 2026, 11:59 PM IST** |
| Price during offer | **₹0 creation** — “No card required” |
| Scope | **Both Classic and Royal** included |
| Billing | No subscription, no auto-charge after offer |
| CTA | “Publish Free Launch Invitation” on `/create` |
| API | `"promotion":{"active":true,...}` as of research |

### Regular packages (post-launch list prices)
| Tier | Price | Includes |
|---|---|---|
| **Classic** | ₹1,199 | One personalized invitation webpage; editable details/sections; guest RSVP & messages; photo slideshow & available music; calendar download & venue directions |
| **Royal** | ₹1,499 | Everything in Classic **plus** Royal cinematic opening |

Homepage note: “No automatic billing. Both collections are included in the 30-day launch offer.”

---

## 10. Pricing (exact)

| Item | Amount | Currency | Notes |
|---|---|---|---|
| Classic (listed) | **1,199** | **INR (₹)** | Homepage + FAQ + API |
| Royal (listed) | **1,499** | **INR (₹)** | Homepage + FAQ + API + schema.org |
| Launch creation | **₹0** | INR | 14 Sep–14 Oct 2026 IST; no card |
| Subscription | **None** during launch; no auto-billing | — | FAQ / refund policy |
| Taxes / GST | **Not found on site** | — | Gap |
| Payment methods | **Not found** (paid checkout not live) | — | Refund policy |
| Refunds | Future paid purchases “must show… refund terms before you confirm”; current launch = no purchase charge | — | `/refund-policy` |
| Contact for custom pricing | **Not found** (Contact awaiting configuration) | — | `/contact` |

**What’s included (Classic):**  
One personalized invitation webpage · Editable event details and sections · Guest RSVP and messages · Photo slideshow and available music · Calendar download and venue directions  

**Royal adds:** Royal cinematic opening  

---

## 11. How it works (product flow)

From homepage “How It Works”:
1. **Fill Details** — simple create form (template, names, date, venue, events, music, photos…)  
2. **Get Invitation** — generated animated invitation webpage  

Then: share **public** link with guests; keep **private management link** to edit / view RSVPs.

---

## 12. Site map (important URLs crawled)

| URL | Role | Status / notes |
|---|---|---|
| https://findmyinvite.com/ | Homepage (hero, occasions, how it works, features, pricing, FAQ, CTA) | Live |
| https://findmyinvite.com/templates | Catalog (Royal default) | Live |
| https://findmyinvite.com/templates?collection=classic | Classics catalog | Live |
| https://findmyinvite.com/templates?collection=royal | Royal catalog | Live |
| https://findmyinvite.com/create | Self-serve editor / publish | Live |
| https://findmyinvite.com/dashboard | My Invitations / restore recovery link | Live |
| https://findmyinvite.com/about | Company blurb (short) | Live |
| https://findmyinvite.com/contact | Contact — **awaiting configuration** | Live |
| https://findmyinvite.com/blog | Journal — **empty** | Live |
| https://findmyinvite.com/privacy-policy | Privacy — “launch draft” | Live |
| https://findmyinvite.com/terms | Terms — “launch draft” | Live |
| https://findmyinvite.com/refund-policy | Payments & refunds | Live |
| https://findmyinvite.com/shipping-policy | Digital delivery | Live |
| https://findmyinvite.com/grand-launch | Launch ceremony experience | Live |
| https://findmyinvite.com/invite/demo?template=… | Template demos | Live |
| https://findmyinvite.com/login · `/signup` | Effectively dashboard / guest restore | Live |
| https://findmyinvite.com/api/invitations?action=config | Prices + promotion state | Live JSON |
| https://findmyinvite.com/akay | Operator admin (not public nav) | Exists in app routing |
| `/pricing` as standalone page | **No dedicated route** — pricing is homepage `#pricing` section | SPA still returns shell for `/pricing` |

Nav anchors on home: Features · How It Works · Pricing · My Invitations · Get Started  

Footer: About · Contact · Terms & Conditions · Privacy Policy · Refund Policy · Shipping & Delivery · Blog  

---

## 13. Key quotes (selected)

1. “Create All Events Invitation Webpage Online in Minutes” — Homepage H1  
2. “Premium Digital Invitations” — Homepage eyebrow  
3. “Guest access · No account required · Keep your private management link safe” — Homepage  
4. “Regular listed prices are ₹1,199 for Classic and ₹1,499 for Royal.” — FAQ  
5. “FindMyInvite provides digital invitation webpages. No physical product is shipped.” — Shipping policy  
6. “Support contact details are awaiting configuration.” — Contact  
7. “No paid checkout is offered in this guest launch version.” — Terms  
8. “30 days of free invitation creation · Classic & Royal · No card required · 14 Sep – 14 Oct 2026, 11:59 PM IST” — Launch banner  

---

## 14. Gaps / unclear (not on public site or incomplete)

| Gap | Detail |
|---|---|
| Legal entity / founders / company address | Explicitly “awaiting confirmation” |
| Support email / phone / WhatsApp for customers | Contact unconfigured |
| Paid checkout & payment rails | Not live; GST/tax not shown |
| Post-launch purchase & refund process | Placeholder only |
| Data retention / deletion SLA | Privacy says must be confirmed before launch |
| Team / About depth | Two short paragraphs only |
| Customer proof | No testimonials, metrics, press |
| Blog / SEO content | Empty |
| B2B / planner offerings | Not present |
| Per-template pricing or add-on prices | Not present (plan-level only) |
| Subscription vs one-time after launch | Listed as one-time plan prices; no subscription SKU defined |
| Validity duration of a published invite after paid purchase | **Not found** |
| SLA, uptime, custom domains | **Not found** |
| App store / native apps | Web only |
| Exact HQ city | **Not found** (India-inferred) |
| Sales team / partner channel | **Not found** |
| Operator metrics / revenue | Admin exists (`/akay`) but not a public source |

**Overall read:** Product-led **v1 launch / grand-launch** storefront for Indian celebration hosts. Commercial packaging is clear (Classic ₹1199 / Royal ₹1499), but company ops, support, and paid billing are still marked as pre-confirmation drafts while a free 30-day publish window runs.

---

## 15. Sources

- https://findmyinvite.com/  
- https://findmyinvite.com/templates  
- https://findmyinvite.com/templates?collection=classic  
- https://findmyinvite.com/create  
- https://findmyinvite.com/dashboard  
- https://findmyinvite.com/about  
- https://findmyinvite.com/contact  
- https://findmyinvite.com/blog  
- https://findmyinvite.com/privacy-policy  
- https://findmyinvite.com/terms  
- https://findmyinvite.com/refund-policy  
- https://findmyinvite.com/shipping-policy  
- https://findmyinvite.com/grand-launch  
- https://findmyinvite.com/api/invitations?action=config  
- App bundle: `https://findmyinvite.com/assets/index-BsWD6Jpc.js` (template catalog, FAQ, policies, routes)  
- Research artifacts on box: `/workspace/fmi-research/` (rendered HTML dumps, API JSON, JS copies)

---

*End of briefing.*
