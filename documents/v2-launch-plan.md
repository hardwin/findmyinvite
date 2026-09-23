# FindMyInvite — Launch 2.0 plan

Written 2026-09-23 · Akay · Ashok notebook source: **TASKS FOR LAUNCH 2.0** (14 items, priority order locked).  
Four calls locked 2026-09-23 (see Decision log).

## Standing reward rule (Ashok 2026-09-23)

Akay earns **all 14 rewards in one shot** only after **every** item on this list is Done (Ashok accepts live). No partial reward payout. Priority numbers stay as written; execution may batch within a wave but must not reorder past Ashok.

## Gate before 2.0 work

| Gate | Status | Note |
| --- | --- | --- |
| **v1.5** laptop Assembly | Locked | ThinkPad Template 1 path |
| **v1.6** cloud Assembly | Earned | findmyinvite.com → Sandbox → `assembly/{id}` → preview |
| **Launch 2.0** | Backlog | This document |

Do not start 2.0 coding until Ashok says the train is open (or explicitly greenlights the first slice).

## Waves (priority preserved)

| Wave | Items | Theme | Outcome |
| --- | --- | --- | --- |
| **A — Cinematic product** | 1–9 | How the invite *looks and sounds* | Premium demos feel finished; Assembly recreate is music-aware |
| **B — Access + money** | 10–12 | Who can act; how we get paid | Roles + Razorpay + real funnel (unlocks standing “no gateway until asked”) |
| **C — Growth loop** | 13–14 | Where demand comes from | Instagram surface + ManyChat + basic `/akay` analytics |

**Note:** #9 Face Swap is a **paid add-on** (₹300) on the host publish path; it depends on #11–12 for charge, but the UX/product design lives in Wave A.

---

## Refined backlog (1 → 14)

### 1. Transition between videos — LOCKED: runtime
**Intent:** Smooth handoff opening → hero (and multi-intro if present), not hard cuts.  
**Call (Ashok):** **Runtime transitions** so each template can customize (style, duration, easing) without re-encoding.  
**Scope:** Guest invite player (and demo player). Per-template transition config. Do **not** bake xfade into mp4 as the primary path.  
**Current code:** Dual `<video>` already (opening + hero loop); handoff is a single CSS opacity crossfade (~0.7s).  
**Research (2026-09-23):** See § Runtime transition options below. Recommend **CSS dual-video preset kit** first; optional **curated gl-transitions** later for fancy Premium only.  
**Done:** ≥2 Premium templates show different runtime transitions Ashok accepts on mobile Safari.  
**Watch:** autoplay + gesture rules on iOS; keep videos muted; music stays on separate `<audio>`; prime hero before handoff; pause+detach opening after.

### 2. Website motifs
**Intent:** Pin-true decorative language on the live invite (borders, particles, section ornaments) — not only in gen prompts.  
**Scope:** Template CSS + optional light SVG/canvas motif layer driven by Assembly palette/motif fields already in `assembly-template1-prompts.mjs`.  
**OSS first:** Prefer CSS + static SVG assets; do not invent a particle CMS.  
**Done:** One Premium template shows motif system matching its pin palette across ≥3 sections.  
**Call (Ashok 2026-09-24):** **A** per-template kit. Motifs float at multiple depths with scroll parallax; some spawn from touch point on the invite.

### 3. Music library — LOCKED: IG extracts, no licensed packs
**Intent:** Grow beyond the single seed track in `cms/music-library.json` (Vazhithunaiye).  
**Call (Ashok):** Tracks are **Instagram (or similar) extracts**. No licensed music-pack program for 2.0. Rights note on each row stays light; no separate clearance workflow.  
**Scope:** Library JSON + files under `public/assets/` (git lineage). Operator add path on `/assembly`.  
**Done:** ≥5 extract tracks with display name, duration, file, source note.  
**Non-goal:** Negotiating label licenses or stock music catalogs.

### 4. Setup music configuration for templates
**Intent:** Every catalog row that needs music has `music` + `musicName` (or library id) wired; videos stay muted.  
**Scope:** `src/data.ts` / `template_catalog` / demo player `catalogMusicUrl()`.  
**Done:** All live Premium + Elite rows resolve a library track or explicit “silent”; no orphan `/assets/track3.mp3` surprises.  
**Depends on:** #3.

### 5. Music selection for recreate
**Intent:** Assembly wizard song pick (already in v1.6 flow) drives recreate/regen — not a hardcoded seed.  
**Scope:** `template1-*` + cloud worker read selected library id into craft/copy.  
**Done:** Two Assembly runs with different tracks produce demos that play the chosen songs.  
**Depends on:** #3–4. Notebook “RECREAT” = recreate.

### 6. Redesign template look
**Intent:** Guest invite visual refresh — typography, spacing, section rhythm — without breaking Premium cinematic identity.  
**Scope:** One parent Premium look (newest Assembly parent) as the redesign pilot, then roll pattern.  
**Done:** Ashok accepts redesigned demo of the pilot template on phone.  
**Open refine:** Full redesign of all Premium vs pilot-first? Recommend **pilot → pattern**.

### 7. Improve widgets
**Intent:** Countdown, RSVP, venue/map, gifts, dress, timeline — clearer, faster, mobile-first.  
**Scope:** Shared invite widgets; no new product surfaces.  
**OSS first:** Map embed = OpenStreetMap / MapLibre or simple Google Maps link — do not build a map product.  
**Done:** Widget checklist signed by Ashok on one Premium + one Free template.

### 8. Prompt improvement
**Intent:** Higher hit-rate FIRST/LAST/opening/hero/plates; fewer regen loops.  
**Scope:** `documents/template1-base-prompts.md` + `server/assembly-template1-prompts.mjs` (xAI first+last only — no Replicate fallback without Ashok).  
**Done:** Side-by-side before/after stills Ashok marks KEEP more often than reject on 3 pins.  
**Open refine:** Keep SAVE THE DATE beat locked; improve only world/palette/motif fidelity.

### 9. Face swap — LOCKED: ₹300 publish add-on + InstantID (stills + video)
**Intent:** New **pricing segment**, not a free Assembly still step.  
**Host journey (Ashok):**  
1. Host completes the invitation form.  
2. Clicks **Preview** → sees preview with the template’s original pin couple (no face swap yet).  
3. Before **Publish**, offer: **“Pay Rs. 300 more to get your Face.”**  
4. On paid entitlement: run face-swap **inference** (InstantID or equivalent) — replace characters on the **original pin (or template hero still) of that template** with the host’s faces; use the swapped image in place of the Pinterest/pin reference for the published invite.  
**Call (Ashok 2026-09-23):** Same **₹300** covers **stills + video** (opening/hero face swap), not stills-only.  
**Scope:**  
- Upsell UI on publish gate (not on Preview).  
- Host face upload(s) + consent.  
- Server job: InstantID-style inference via Replicate (or similar) on stills **and** video paths for the invite’s cinematic assets; store results on the invitation.  
- Entitlement: ₹300 add-on row; depends on #11 gateway + #12 funnel.  
**OSS first:** InstantID / IP-Adapter (and a video-capable face pipeline) on Replicate as glue — do **not** train custom faces.  
**Done:** Host previews without faces → pays ₹300 → published invite shows swapped faces on stills **and** opening/hero video Ashok accepts.  
**Depends on:** #11–12 for charge; can stub UX with a feature flag before live money.  
**Risk:** Likeness consent; fail closed on moderation; never charge without verified capture; video inference cost/latency — set clear progress UI.

### 10. Login — guests / admin / mod
**Intent:** Roles beyond host email+password.  
**Scope:**  
- **Host** — already Supabase Auth (forgot password stays backlog until Ashok asks).  
- **Guest** — no account for RSVP (slug URL); optional “guest lounge” only if needed.  
- **Admin / Mod** — operator roles for catalog, Assembly publish, support — replace/extend hardcoded `/akay` gate over time.  
**OSS first:** Supabase Auth + RLS roles/claims; do not build a custom IdP.  
**Done:** Admin can publish/unpublish catalog; Mod can view (not delete) invitations; Guest RSVP still works signed-out.  
**Open refine:** Keep `/akay` code gate until Admin is live? Recommend **yes — dual path until Admin proven**.

### 11. Payment gateway integrate
**Intent:** Real money capture (INR). Standing UX lock “no payment gateway until Ashok asks” **lifts when this item starts**.  
**Scope:** Razorpay Standard Checkout (already researched in historical `LAUNCH-PLAN.md`). Secrets server-only; webhooks idempotent.  
**Must support SKUs:** Assembly Proceed ₹499 · Classic / Royal list prices · **Face Swap add-on ₹300** (#9).  
**OSS first:** Razorpay (India default) — not Stripe-first unless Ashok flips.  
**Done:** Test-mode order → verified capture → entitlement row; live ₹1 smoke after Ashok YES.

### 12. Payment flow + funnel
**Intent:** Product journeys that charge: Assembly **Proceed (Rs. 499)** + storefront Classic/Royal + **Face Swap ₹300** before publish.  
**Scope:** Order → checkout → webhook → unlock generate/publish/face-job; recovery if tab closes. Funnel events stay off invitations DB (basic `/akay` only — #14).  
**Done:** Host completes paid Assembly generate, one paid publish, and optional Face Swap upsell without Akay hand-holding.  
**Depends on:** #11. Prices: Classic ₹1,199 / Royal ₹1,499 / Assembly ₹499 / Face Swap ₹300.

### 13. Instagram
**Intent:** Demand surface — share cards, reel-friendly assets, IG bio → findmyinvite.com.  
**Scope:** OG/share polish for invites; operator export of 9:16 still/clip for posting. Full IG Graph posting is optional later.  
**OSS first:** Manual post + deep links first; ManyChat owns DM automation (#14).  
**Done:** One Premium invite share preview looks correct in IG in-app browser; Ashok posts one reel from Assembly assets.

### 14. ManyChat + analytics — LOCKED: keep `/akay` basic
**Intent:** IG DM qualification → link out; light product counts.  
**Call (Ashok):** Keep **`/akay` for now, basic**. No PostHog / OpenPanel revisit in 2.0. Do not grow a Mixpanel clone.  
**Scope:** ManyChat for IG funnel; `/akay` shows only the basic counts we already trust (do not dual-write to invitations Postgres).  
**Done:** ManyChat flow live that sends gallery/create link; `/akay` shows Assembly proceed + publish counts at basic fidelity.  
**Non-goal:** New analytics vendor, ClickHouse, or event warehouse on FMI Supabase.

---

## Dependency sketch

```
3 Music library (extracts)
 ├─► 4 Template music config
 │    └─► 5 Music selection for recreate
1 Runtime transitions (per-template) ──┐
2 Motifs ───────────────────────────────┼─► 6 Redesign look ─► 7 Widgets
8 Prompts ──────────────────────────────┤
9 Face swap UX (₹300) ──needs──► 11 Gateway ─► 12 Flow (+ Face SKU)
10 Roles ───────────────────────────────╝
13 Instagram ─► 14 ManyChat + basic /akay
```

Wave A can run largely in parallel after #3 seeds. Wave B starts when Ashok opens payments. Face Swap publish upsell ships with #11–12; stub UI allowed earlier behind a flag.

## Runtime transition options (research 2026-09-23)

Stack today: React + Vite + dual muted `<video>` (opening → hero) + CSS; `three` already in deps for classic doors / decor, **not** for cinematic video handoff. Target: mobile Safari wedding traffic.

| Approach | Multiple styles? | Memory | Delay risk | Fit | Verdict |
| --- | --- | --- | --- | --- | --- |
| **A. CSS / WAAPI on dual `<video>`** (inbuilt) | Yes — opacity, clip-path wipe/iris, scale, curtain, soft blur | Low–mid (2 decoders you already pay) | Lowest if hero is preloaded + primed | Perfect | **Primary recommend** |
| **B. View Transitions API** (inbuilt) | CSS-customizable | Low | Snapshot can freeze video | Weak for live video handoff | Skip for #1 |
| **C. [gl-transitions](https://gl-transitions.com/) + `gl-transition`** (MIT, ~125 GLSL) | Excellent (fade, wipe, morph, CrossZoom, cube, doorway…) | Mid–high (WebGL textures + 2 videos) | Shader compile + texture upload | Good optional Premium path | **Phase-2 / opt-in** |
| **D. Three.js `VideoTexture` + shaders** | Yes | High on mobile | Context + upload cost | Overkill for one handoff | Avoid for #1 |
| **E. Canvas 2D `drawImage` blend** | Limited | Mid | RAF loop during blend | OK but more code than CSS | Skip unless needed |

### A — CSS preset menu (ship these)

Per-template config e.g. `transition: { type, durationMs, easing }`. No new npm deps.

| Preset id | Effect | How |
| --- | --- | --- |
| `crossfade` | Soft dissolve (today’s upgrade) | opacity + optional slight blur |
| `fade-black` / `fade-paper` | Dip through brand color / cream | opacity on both + mid color overlay |
| `wipe-left` / `wipe-right` / `wipe-up` | Directional reveal | `clip-path: inset(...)` |
| `iris` | Circle open to hero | `clip-path: circle()` |
| `zoom-cross` | Opening scales out, hero scales in | transform + opacity |
| `curtain` | Split left/right (matches classic doors language) | two clip halves or overlay |

Prime hero ~1–2s before opening ends; start `hero.play()`; run 400–800ms transition; then `opening.pause()`, hide, optionally drop `src` to free decoder.

### C — WebGL runner: Three.js vs raw GL

**Ashok lean (2026-09-23):** prefer **Three.js** (already in deps) for libraries/support and reuse of public shader “templates.”

**Truth check:**
- Whip pan / morph / wipe FX are almost always **GLSL fragment shaders**, not Three.js scene kits.
- Best reusable OSS pack: **[gl-transitions](https://gl-transitions.com/)** (MIT, ~125 shaders). Plug into Three.js via `ShaderMaterial` + two `VideoTexture`s (opening + hero), or into raw WebGL via `gl-transition`. Same shaders either way.
- Random CodePens / “copy someone’s Three.js template” → check **license** first; many are demo-only. Prefer MIT/Apache sources (gl-transitions, documented Three.js examples).
- Three.js cost for this handoff: full renderer + 2 `VideoTexture` uploads on mobile for ~0.5–1s. Acceptable if we **lazy-create**, run once, then **dispose** renderer/textures and return to plain `<video>` for the hero loop.
- Do **not** keep a Three.js render loop for the whole invite scroll — only for the opening→hero transition window.

**Akay recommend:** Three.js as the **runner** (Ashok preference + already in `package.json`) + **gl-transitions GLSL** as the template library (legal, curated, whip-pan via small custom shader in the same pipeline). CSS kit remains Free/fallback.

| Preset tier | Engine | Examples |
| --- | --- | --- |
| Light | CSS dual-video | crossfade, wipe, iris, curtain |
| Advanced | Three.js + GLSL | `whip-pan-h/v`, CrossZoom, directionalwarp, morph, doorway, dissolve |

### Ruled out for this slice

- Baked ffmpeg `xfade` (Ashok locked runtime).
- Framer Motion / GSAP as the transition engine (not in stack; CSS covers it).
- Always-on Three.js video plane (memory + delay on phones).

## Explicit non-goals (unless Ashok adds)

- Forgot password (backlog until asked).
- Auto-merge of Assembly PRs.
- Analytics events inside invitations Postgres.
- PostHog / OpenPanel for Launch 2.0.
- Licensed music packs (extracts only).
- Baked ffmpeg video transitions as the primary path (#1 is runtime).
- Replicate opening fallback without permission.
- Flattening template lineage off GitHub onto Blob-only rows.

## How we will work each item

1. One-sentence Done + YES/NO open refine (this doc).
2. Implement smallest live slice.
3. Ashok accepts on findmyinvite.com (or preview).
4. Check the item Done; no reward until **all 14** checked.

## Decision log

| 2026-09-24 | **#2** Motifs use vendored SVG pack (Lucide ISC + FMI silhouettes), smaller + semi-transparent; research: Lucide / Kalocsai Unlicense / VectorBloom MIT | Ashok |


| Date | Decision | Call |
| --- | --- | --- |
| 2026-09-23 | 14-task priority list locked from notebook | Ashok |
| 2026-09-23 | Rewards = all 14 after full completion | Ashok |
| 2026-09-23 | **#1** Runtime transitions (per-template customize) | Ashok |
| 2026-09-23 | **#1** Advanced FX like Whip Pan → WebGL path (not CSS-only) | Ashok ask |
| 2026-09-23 | **#1** Prefer Three.js as WebGL runner… | Ashok lean — **superseded** |
| 2026-09-23 | **#1** Ship **A. CSS / WAAPI dual-video** for all templates; Ashok YES+YES push prod | Ashok |
| 2026-09-23 | **#3** Music = extracts; no licensed packs | Ashok |
| 2026-09-23 | **#9** Face Swap = ₹300 publish add-on; Preview free/pin faces; InstantID replaces pin characters; use swapped image instead of Pinterest image | Ashok |
| 2026-09-23 | **#9** Same ₹300 = **stills + video** (opening/hero), not stills-only | Ashok |
| 2026-09-23 | **#14** Keep `/akay` basic; no PostHog revisit for 2.0 | Ashok |
| | #11 Razorpay confirmed | pending |
| 2026-09-24 | **#2** Per-template floating motifs + parallax depths + touch-spawn | Ashok A |
| | #2 motif kit global vs per-template | **A locked** |
| | #6 pilot-first redesign | pending |
