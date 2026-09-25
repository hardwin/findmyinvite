# FindMyInvite — post-handoff change log + next 5 iterations

Audience: the next agent picking up this Project.
Written: 2026-09-15 · coordinator Akay (Project FindMyInvite)
Repo: https://github.com/hardwin/findmyinvite.git (public) · branch `main` only
Live: https://findmyinvite.com (= findmyinvite.vercel.app)
Soul: [akay-soul.md](akay-soul.md) · standing facts: [project-context.md](project-context.md) · analytics: [analytics-decision.md](analytics-decision.md) · prod push: [prod-push.md](prod-push.md)

Read this before `docs/handoff/STATUS.md`. The v0.9.0 handoff is the frozen baseline; this file is the current truth after that tag.

## 2026-09-26 — Recovery release: photographer storyboard sheets
- Recovered the previous session's uncommitted storyboard work and image assets; incorporated the already-published royal-prestige-14 merge.
- Photographer writes shots → one storyboard sheet → sheet edits → Lock → First/Last frames → existing Face Swap / generation path.
- Reveal hooks accept photographer wording, including clouds; sheet edits preserve panels and frame extraction identifies the first/final panel.
- Updated stale regression expectations for the expanded catalogue, manager chat, stationery prompts, separate logistics slides, and face-swap file rewrite.
- Production uses the existing main → Vercel Git lane. No new SQL or payment enablement in this release. Live acceptance and paid generation verification remain separate from build checks.

## 2026-09-26 — First reveal is free (clouds, or anything they name)
- Tool enum had locked door / envelope / building_frame / arches / windows, so “cloud reveal” was forced into a stone arch.
- `revealType` is now their words. Presets stay suggestions. Clouds is a real type.

## 2026-09-26 — Generate Video: empty Sandbox + Chrome
- Failed jobs had `sandboxId: null` — `Sandbox.create({source: git})` never created a VM.
- Empty Sandbox, curl `main` tarball. Playwright `install chrome` dies on Amazon Linux (`amzn` only allows Ubuntu).
- Proven on live `sbx_rYdTJzp4DTqhSCg8xpf9gM9p20gl`: `dnf install nss gtk3…` then Sparticuz + puppeteer-core opens the invite.
- Assembly preview URLs hit Vercel SSO. Capture tries preview (bypass header if set), then findmyinvite.com.

## 2026-09-25 — Sandbox video capture: screenshots only
- Vercel Sandbox chrome-headless-shell dies on Playwright `recordVideo`. Capture is now hero + chapter screenshots (hero still → 6s clip), then Flare / Imagine as before.
- Generate Video card never shows npm/Playwright dumps — short retry line only.

## 2026-09-25 — Generate Video lives in Assembly chat, not the guest invite
- Guest footer no longer offers Video (that 404 was wrong). Letter PDF + Image only.
- After website Ready, `/manager` shows a **Generate Video** card (same layout as Generate) with percent, in-chat preview, and Download.

## 2026-09-25 — Export Video auto-starts after website preview
- After Template 1 Ready (preview URL live), `/manager` kicks Sandbox bake: capture that preview → Flare → 4s Imagine → Blob.
- New clones are valid export ids. Opening/Hero downloaded from the preview deploy when missing on main.
- Photographer session can start bake (no operator secret). Ready banner shows video progress + download.

## 2026-09-25 — Export Video = Flare + 4s Imagine chapters (₹400)
- Standard workflow: screenshot Bride / Groom / Date / Program Timeline / Venue / Pre-Wedding Events / Finale → **Flare** recreates (not a photocopy) with levitating 3D pastel-paint type → **xAI grok-imagine-video-1.5** 4s bullet-time (`image` + `last_frame` = Flare still).
- Stitch after Opening + live Hero-with-text. Playbook: [export-video.md](export-video.md). Price **₹400** add-on (gateway still Launch 2.0 locked).
- Live Playwright chapter recordings are no longer the video deliverable. PDF/Image still use site stills.

## 2026-09-25 — Walkthrough: full-frame 720p (no corner letterbox)
- Chapter cards were off-screen (`top: -7652`) because export CSS forced `height:100%` on the swiper stack — motifs stayed, content vanished. Removed that.
- Attempted `recordVideo` larger than viewport (780×1688 vs 390 CSS) painted the page in a tiny corner of a black canvas. Fix: **viewport = recordVideo = 720×1280**; mobile full-bleed via `.invitation-export` CSS. Intermediate `work/exports/*-pages/page-*.mp4` are trim clips only — deliverable is Blob `walkthrough.mp4`.

## 2026-09-25 — Walkthrough 720p on Vercel Sandbox (phone frame fix)
- Root cause: capture at 1080 CSS width left chapter cards at `min(640px)` → tiny content.
- Fix: Playwright viewport **390×844** (mobile layout) + export CSS full-bleed cards; deliver **720×1280** fill/crop (no letterbox).
- Bake on **Vercel Pro Sandbox** (not laptop): `POST /api/invite-export?action=bake` with `X-Walkthrough-Bake-Secret`.
- Live catalog: Blob `walkthrough/manifest.json` merged over shipped JSON (git stays code-only).

## 2026-09-25 — Walkthrough media = Vercel Blob only (not git)
- Git is for website + template code only. Walkthrough video/image/PDF never land in `public/assets/catalogue`.
- Deliver **720×1280** phone frame. Private Blob store → `/api/invite-export?action=file` streams downloads.
- Bake uploads to `walkthrough/{id}-walkthrough.{mp4,png,pdf}`; `walkthrough-manifest.json` + Blob live manifest store serve URLs.
- Temple Wedding cloud bake: `POST /api/invite-export?action=bake` body `{"template":"royal-prestige-12"}`.

## 2026-09-25 — Walkthrough v3: soft wedding motion
- No shake. Gentle zoom in/out on pages; fade / fadewhite between every beat.
- Opening trimmed (drop 3s hold) so open→hero fades early; opening 3% zoom, hero-with-names 5% zoom.
- Hero segment is webpage capture (Ashok & Supriya + details), not raw mp4 alone.
- Skip RSVP, Transportation, Accommodation, Gifts (+ Moments).

## 2026-09-25 — Walkthrough v2: real webpage sections + kinetic transitions
- Playwright full-viewport capture of invite slides (text, motifs, scratched date). Skips hero + Moments.
- No couple/poster stills (already in Opening/Hero videos).
- Stronger zoom/pan/shake per section; rotating fast xfade (slide/wipe/radial/dissolve/…) between pages.
- Rebake: `FORCE=1 CAPTURE_ORIGIN=https://findmyinvite.com node scripts/invite-walkthrough.mjs royal-prestige-12`.

## 2026-09-25 — Invite Download Pack (marketing walkthrough video)
- **Not AI video.** ffmpeg stitch: Opening → Transition (xfade) → Hero → pages @1.5s (gentle motion). Scratch revealed in export mode; Moments omitted.
- Prebaked Temple Wedding (`royal-prestige-12`) under `public/assets/catalogue/v1/*-walkthrough.{mp4,png,pdf}`.
- `/templates` card: **Export Video** beside Use This Design (manifest-gated).
- Guest invite footer + `/manage`: Video / Letter PDF / Image via `InviteDownloadMenu` + `/api/invite-export`.
- `?export=1` on invite: opened, scratch forced revealed, gallery off, chrome hidden.
- Bake: `node scripts/invite-walkthrough.mjs royal-prestige-12 --force`.

## 2026-09-25 — Form/Editor draft conflict unlock
- Catalogue `?new=1` was reopening an old draft for the same template → revision 409 “changed elsewhere” / stuck Retry.
- Fix: `?new=1` always creates a fresh draft; recovery reapplies local edits onto the latest online revision; save 409 re-reads + retries; Retry save never no-ops.

## 2026-09-25 — Chat "Forbidden" = xAI out of credits
- New `/manager` chats failed with bare **Forbidden** because xAI returned HTTP 403 (team spending limit / no credits) and the UI only surfaced statusText.
- `formatAssemblyChatError` + chat fetch now map 403/credit bodies to: top up https://console.x.ai.
- **Action for Ashok:** buy/raise xAI credits — chat cannot run without them.

## 2026-09-25 — Face Swap: split girl/boy then classic face place
- Cross-swap bug: bride slot was getting the groom face. Prompts now lock **Bride = girl/woman**, **Groom = boy/man**.
- Pipeline: split girl + boy from Last couple (2 Flare) → classic “face from Image 2 onto person in Image 1” singles → dual couple swap with Never-cross rules.
- UI copy: “Bride · girl/woman” / “Groom · boy/man”. Craft chapter solos also use girl/boy language.

## 2026-09-25 — Face Swap upload scroll jump fix
- After picking bride/groom face photos, mobile gallery return was inventing empty space and scrolling the Co-Pilot away (fake keyboard inset + file-input scrollIntoView + unconstrained preview `<img>`).
- Fix: contain preview imgs absolutely, full-card file input (no 1px clipped orphan), blur+restore scroll on change, clamp visualViewport keyboard inset, lock `html/body` overflow under `.asm-gpt`.

## 2026-09-25 — Sell Path creative iteration fix (mid-chat Flare)
- **Problem:** Generate dumped stills at the end; no First/Last previews in chat; pin re-asked after moodboard; details + Bride/Groom solos missing on clone.
- **Fix:** `craft_storyboard_stills` + `craft_chapter_solos`; lock_storyboard requires First+Last URLs; lock_final_image requires solos; details (date/venue/names) → `patchPreviewDefaults`; chat First/Last reused as opening stills.
- CREATIVE LAW in system prompt: every visual change generates a preview this turn until Lock. Never re-ask Pinterest after theme lock.
- UI: Generate First & Last previews CTA; Lock disabled until both stills exist; Skip Face Swap → craft chapter solos.

## 2026-09-25 — Photographer Sell Path (life-changing Co-Pilot)
- **Akay persona:** invitation-store sales guide — understand style → show options → confirm → next. Always names the step.
- **Orchestration:** `/manager` chat + **on-page Pinterest iframe** (right Theme desk). Paste pin to lock without leaving FMI.
- **Storyboard:** First = photographer-named reveal hook (clouds, curtain, door, or anything); Middle = opening-video journey; Last = happy romantic couple freeze. Edits via **`flare_edit`** (gpt-image-2.5-flare).
- **Close the sale:** Face Swap → lock hero → details widgets → **Generate** (~15 min ETA, credit stub) → Ready banner on return.
- Files: `server/assembly-sell-path.mjs`, `server/assembly-chat-agent.mjs`, `src/AssemblySellDesk.tsx`, `src/AssemblyChat.tsx`, prompt wiring in `assembly-template1-prompts.mjs` + `assembly-template1.mjs`.
- Tests: `tests/server-assembly-sell-path.mjs`.

## 2026-09-25 — Photographer Co-Pilot (/manager)
- Assembly rebranded for **Event Planners & Photographers**: landing CTA → `/manager`, permanent redirect `/assembly` → `/manager`.
- Login: painterly Co-Pilot page (`ManagerLogin` + `manager-login-bg.png`) — Modern Photographer Co-Pilot for Generating Invitation Websites · ₹999 platform credit copy.
- Auth: Supabase email/password via `/api/auth` (signin/signup/recover/refresh); Remember me → localStorage vs sessionStorage; `requireManager` accepts Akay cookie **or** bearer.
- Docs: [manager-auth.md](manager-auth.md) (Hostinger SMTP caveats → prefer Resend/Brevo if Hostinger 500s).
- Payment for credits still Launch 2.0 #11–12 locked.

## 2026-09-25 — Photographer Co-Pilot (/manager)
- Assembly rebranded for **Event Planners & Photographers**: landing CTA → `/manager`, permanent redirect `/assembly` → `/manager`.
- Login: painterly Co-Pilot page (`ManagerLogin` + Unsplash 4K meadow bg) — Modern Photographer Co-Pilot for Generating Invitation Websites · ₹999 platform credit copy.
- Auth: Supabase email/password via `/api/auth` (signin/signup/recover/refresh); Remember me → localStorage vs sessionStorage; `requireManager` accepts Akay cookie **or** bearer.
- Docs: [manager-auth.md](manager-auth.md) (Hostinger SMTP caveats → prefer Resend/Brevo if Hostinger 500s).
- Payment for credits still Launch 2.0 #11–12 locked.

## 2026-09-25 — Face Swap before Lock (Assembly craft)
- **Bride/Groom chapters:** Face Swap solos now flow into Template 1 — lock chip carries `brideImageUrl`/`groomImageUrl`, chat injects a FACE SWAP LOCK hint, solos cache recovers if the agent only locked the couple, assemble stages `/assets/{id}-bride.jpg` + `-groom.jpg` into `previewDefaults.photos` + `faceSwap`.
- **Swap prompt:** Identity (face details / shape / skin) from bride+groom refs; head pose, neck length, and attachment locked to Image 1. Stops “swan neck” from pasting ref face angles onto the base body.
- **Template 1 plate1 fix (2):** Replicate Files URLs (`api.replicate.com/v1/files/….jpg`) are auth-gated — xAI grok-imagine fetches them bare and returns `Invalid image format ''`. Pins now use public `/api/face-swap/file.jpg?url=` (ext on path). Never hand Replicate Files URLs to xAI.
- **Template 1 plate1 fix:** `preferPublicImageUrl` falsely accepted Face Swap proxy URLs (`.jpg` only in query). Replicate then saw path `/api/face-swap` → `Invalid image format ''`. Now reject `/api/face-swap` + private Blob; require ext on pathname so pin re-uploads to Replicate Files. Face upload cards keep local object URL for preview.
- Face Swap Blob: store is **private** — client upload uses `access:"private"` (public caused CORS-masked 400). Same-origin `action=file` proxy for Replicate + previews.
- Face Swap faces: **Blob client upload → https URL → start** (no base64 body; no compress). Upload cards fixed.
- **Prod ship:** `2727bf9` → Vercel READY · live bundle `/assets/index-CR7En7My.js` · `FACE_SWAP_STUB=1` (redeployed).
- Launch 2.0 #9 path for Assembly: after `mix_image`, offer Face Swap → confirm → bride+groom faces → `gpt-image-2.5-flare` swap on refined hero → Lock swapped still → then video.
- API `/api/face-swap` (config / start wait / status). `FACE_SWAP_STUB=1` skips ₹300 until payment (#11–12).
- Preview→Publish Face Swap parked (template recreate later).
- Assembly client uses `wait:true` so serverless stays on one function.

## 2026-09-25 — ChoicePrompt + xAI fallback after Replicate timeout
- Radio + Submit alert for timeout / mix fail / lock-retry / still approve-iterate.
- Replicate timeout asks host before fallback: **xAI API** / **Retry Replicate** / **Wait**.
- `auto` mix stays on Replicate only; approved fallback hits direct `api.x.ai` Imagine edits.
- Agent waits for radio choice before `mix_image` with `provider: "xai"`.
- **Prod ship:** `2ea65ef` → Vercel READY · live bundle `/assets/index-CNjWu9PB.js`.

## 2026-09-25 — Assembly Chat UX: elapsed timer, image timeout, pin size, labels
- Live elapsed on every inference (`Thinking… 12s` / `Generating image… 1:32`).
- Image tools hard-stop at **2:00** with apology + **Try Now**; server mix timeout ~110s.
- `resolve_pin` preview sized to **80% of iPhone 17** (~322×699, 9:16).
- Friendly tool labels: `Editing Image - Using Reference Image`, `Importing from Pinterest - Done`.
- **Prod ship:** `b2660c2` → Vercel READY · live bundle `/assets/index-DdAwhfxg.js`.

## 2026-09-25 — Fix prod mix_image “Tool result is missing”
- Root cause: chat `mix` had fallen through to `gpt-image-2.5-flare`, blew the 120s chat limit, left a dangling tool call.
- Fix: route `mix` → `xai/grok-imagine-image`; always return a tool result on mix failure; `ignoreIncompleteToolCalls` on convert; chat `maxDuration` 120→300.
- **Prod ship:** `1104543` → Vercel READY · bundle still `/assets/index-P8NPzIOj.js` (API-only).

## 2026-09-25 — Still model → gpt-image-2.5-flare (speed)
- Door-First / last / hero stills switched from `openai/gpt-image-2` → **`openai/gpt-image-2.5-flare`** (faster). Plates stay on `xai/grok-imagine-image`.

## 2026-09-25 — Still model split (gpt-image-2.5-flare + xAI plates)
- Door-First, last, and hero stills → Replicate **`openai/gpt-image-2.5-flare`** (`STILL_MODEL`).
- Section frame / plate backgrounds → Replicate **`xai/grok-imagine-image`** (`PLATE_MODEL`).
- Routing: `imageModelForRole(role)` inside `runReplicateImage` (no caller changes required beyond role).
- **Prod ship:** `aaa75e1` → Vercel READY · live bundle `/assets/index-P8NPzIOj.js` (2026-09-24 20:00 UTC).

## 2026-09-25 — Door-First / last still iterate → Approve
- Local Template 1 review: iterate Door-First or last opening still (`regenTemplate1Still` / `template1-regen-still`), then Approve (`template1-proceed`).
- Assembly Chat job card + Pipeline drawer: per-still **Iterate** + **Approve**. Agent tools: `regen_opening_still`, `approve_stills`.
- Cloud Assembly still auto-continues past stills (iterate remains local-only).

## 2026-09-24 — Akay = Grok; Chat → Single Image → Website

- Standing lock: Akay brain is **xAI Grok only** (no OpenAI / Sol). Stored in `documents/akay_soul.md` + soul rules.
- Assembly Chat stays **agentic** (AI SDK tools); provider forced to xAI.
- Product north star for the desk: **chat → one locked hero → Template 1 website**.

## 2026-09-24 — Assembly Chat desk (operator)
- `/assembly` replaced the step wizard with a ChatGPT-like Akay-gated chat (`AssemblyChat` + `/api/assembly-chat`).
- OpenAI `gpt-6-sol` agent tools: resolve pin, upload refs/camera, list music/parents, mix image (Replicate/xAI/OpenAI), lock hero, start/status/cancel/retry Template 1.
- Template 1 accepts `heroImageUrl` so a locked mix can drive gen without re-resolving the pin.
- Live job progress card in-thread (%, stills, preview/GitHub). Pipeline kanban unchanged at `/assembly/pipeline`.
- Docs: `documents/assembly-publish.md` (Assembly Chat section). Tests: `tests/server-assembly-chat.mjs`.

## 2026-09-24 — Moments IG wall + fast reverse (`107463f`)
- Our Moments → Instagram 1:1 carousel (`MomentsWall` / ribbon / MIT chrome); forward photo-stall, reverse exits immediately.
- Bride + Groom person chapters; photo cap 4→8 (API slots `0-7`).
- Scratch leave-nudge forward-only; `slideNext(420)` / `slidePrev(260)`.
- Live: `/assets/index-XX-MX8Y3.js` (+ `MomentsWall-azEKjHTz.js`). No SQL.

## 2026-09-24 — Invite UX polish live (`c195193`)
- Golden Wish heart scratch + leave-nudge (first escape pulses, second allows).
- Motif wind + swipe impulse; back/mid/front canvases.
- Pager unlock on `opened || heroLive` (not mid-opening).
- Opening→hero: `HANDOFF_LEAD_S=3.5`, `VIDEO_TRANSITION_MS=250`, CSS `.25s` — covers opening still-tail.
- Live: `/assets/index-DD2EX4HT.js` on findmyinvite.com. No SQL.

## Immersive invite scroll — Boat hybrid (2026-09-24)

Below-hero invite body: Lenis + GSAP ScrollTrigger pinned chapters + Three.js depth stage (`InviteScrollStage`). DOM widgets stay interactive. Pilot feel for Premium (`royal-prestige-2`). Reduced-motion → static stack.

## Morning session lock — EOD 2026-09-24 (Ashok 02:56 IST)

Stop for sleep. Next sit finishes **three slices by EOD**:

1. **Redesign template + pages + widgets** (Launch 2.0 #6 + #7) — pilot Premium look, then pages/widgets
2. **Music library** (Launch 2.0 #3, unlocks #4) — IG extracts, ≥5 tracks
3. **Prompt improvement for videos** (Launch 2.0 #8) — FIRST/LAST/opening hit-rate

Do not start coding until Ashok opens the morning session. **Order locked YES** (Ashok 02:58 IST).

## Hero name blur-in (2026-09-24)

Couple names on the hero video overlay use Magic UI `TextAnimate` (`blurIn`, character stagger) when the overlay mounts after opening→hero handoff. Lazy-loaded; skipped for reduced-motion.

## Scratch reveal confetti + HyperText (2026-09-24)

On Scratch-to-Reveal clear: theme-colored side cannons (3s, `canvas-confetti`) + gold star/circle bursts. Colors from `--invite-color`. After reveal, Magic UI `HyperText` scramble draws attention to the date (lazy-loaded; skipped for reduced-motion).

## Launch 2.0 #1 — runtime CSS video transitions (2026-09-23)

Ashok locked **A. CSS / WAAPI dual-video** (not Three.js). Shipped on `main`:

- `src/video-transitions.ts` — per-template presets (crossfade, fade-black/paper, wipes, iris, zoom-cross, curtain, blur-dissolve, slides)
- `Invitation.tsx` primes hero ~1.6s before opening ends; applies `vt-*` on `.invitation-hero`
- All cinematic templates with `heroVideo` get a dual-video handoff; single-video royals fade opening when the couple overlay opens
- Classic door templates unchanged

## Launch 2.0 backlog locked (2026-09-23)

Ashok notebook **TASKS FOR LAUNCH 2.0** (14 items, priority order). Authoritative plan: [v2-launch-plan.md](v2-launch-plan.md). Reward rule: Akay earns all 14 rewards in one shot only after every item is Done. Waves: A cinematic (1–9) → B access+money (10–12) → C growth (13–14). Do not start coding until Ashok opens the train.

**Four calls locked same day:** #1 runtime per-template transitions · #3 extract music only · #9 Face Swap = ₹300 publish add-on (Preview free → InstantID on template pin) · #14 keep `/akay` basic.

## FMI v1.0 close (2026-09-23)

Ashok closed v1.0 on `main`. Next public train is 1.9 or 2.0 (see Launch 2.0 plan).

- Premium gallery: **Sita Kalyanam** (`royal-heritage-8`), **Velicha Poove** (`royal-heritage-9`), **Rosu Rosu Rosu** (`royal-prestige-2`) only. Retired cinematic iterations unpublished in prod `template_catalog`. Elite + Free unchanged.
- `/assembly` wizard: pin → song → first/last stills → **Proceed to generate (Rs. 499)** (no payment gateway yet) → preview. Newest Premium clone is always the default parent.
- FIRST still: frame-filling pin-true door; handle is the hero.

## v1.5 locked (2026-09-23)

Laptop-era Assembly is a **success**. Tag `v1.5` on `main` at lock time. Do not treat unpublished RH8–RH12 clones as a v1.5 failure.

- Premium clone desk + Template 1 run on the ThinkPad / Cursor / CloudAgent (`ffmpeg` + git tree writes).
- Several cinematic clones sit assembled locally and **not published** (no `main` push, no Supabase apply) until Ashok says Publish.
- **GTM blocker / v1.6:** `/assembly` on findmyinvite.com must run the same pipeline in a Vercel Pro Sandbox, push `assembly/{cloneId}` to GitHub, and open a Vercel preview — no ThinkPad.
- **Vercel is Pro** (Ashok 2026-09-23). Hobby notes in older MCP dumps are stale.
- GitHub `hardwin/findmyinvite` stays the template lineage (branch / fork / later vibe-code). GitHub Pro is optional, not a gate.
- v1.6 is Akay's first reward. Soul: [akay-soul.md](akay-soul.md).

## v1.6 cloud Assembly (live path + stall fix)

After the `v1.5` tag: `/api/assembly` starts Template 1 on Vercel when `ASSEMBLY_CLOUD=1`. A Pro Sandbox runs the existing Template 1 pipeline, then pushes `assembly/{cloneId}` (never `main`). Progress lives in `assembly_jobs` (`supabase/014_assembly_jobs.sql`). Playbook: [assembly-publish.md](assembly-publish.md).

**2026-09-23 stall fix:** first live Ponmaalai jobs stuck at “worker starting” because the boot used silent `nohup` with no heartbeats and the serverless launch had no failure path. Fix: bash heartbeats during ffmpeg/npm boot, verify the worker PID stays alive, early progress callbacks from `assembly-cloud-worker.mjs`, return the job id under `waitUntil` while the sandbox stays up for the detached worker (sandbox timeout 2h — not the 800s function limit).

**2026-09-23 ffmpeg boot:** Sandbox images have no `apt`/`xz`, so both the apt path and the `.tar.xz` extract failed. Boot now `npm ci`s `ffmpeg-static` + `ffprobe-static` and links them onto `PATH`.

**2026-09-23 resume push:** If gen/craft/assemble succeed but `git push` 403s, `POST template1-resume-push` reuses the live Sandbox tree (no re-spend) once `ASSEMBLY_GITHUB_TOKEN` can write.

**2026-09-23 pipeline desk:** `/assembly/pipeline` — live kanban of `assembly_jobs`, asset links on the assembly branch, prompt downloads (stored on new runs in `assets.prompts`), Resume push, **Merge to main (PR link)**, **Add to Catalog** (`template1-add-catalog` upserts `template_catalog` via Vercel service_role — no SQL paste).

**2026-09-23 v1.6 reward earned:** Ashok ran cloud Assembly end-to-end on findmyinvite.com (pin → gen → craft → assemble → GitHub branch → preview → pipeline Merge/Catalog). First reward locked. Next ships start from this train.

## /assembly — Premium intro clone desk (Approach B, local repo writes)

Operator-only desk at `/assembly` (same Akay gate cookie as `/akay`). Clones a Premium cinematic template with 1..N alternate intro videos into the git tree the same way `royal-heritage-1/2/3` were made by hand:

- Encodes `public/assets/{id}.mp4` + first-frame `{id}.jpg` + catalogue preview under `public/assets/catalogue/v1/`
- Patches `src/data.ts` (`premiumIds` + row), `server/core.mjs` allowlist, `server/share-card.mjs` stills, `cms/templates.json`, `cms/seed-templates.sql`, catalogue `manifest.json`, and a new idempotent `supabase/013_assembly_*.sql`
- Next ids stay on the lineage root integer sequence (`royal-heritage-4`, not nested `-4-1`)
- Writes only when local (`ASSEMBLY_FS=1` or non-Vercel). Never auto-pushes.
- CLI: `npm run assemble:premium -- --parent royal-heritage --videos a.mp4,b.mp4`
- Inbox: `work/assembly-inbox/` (gitignored except `.gitkeep`)
- Opening generate (2026-09-21): xAI REST `last_frame` (pin as **final** frame). Hero still Replicate. Needs `XAI_API_KEY` + `OPENAI_API_KEY` + `REPLICATE_API_TOKEN`.
- Template 1 programmable lane (2026-09-22, **not published**): `/assembly` "Template 1" card + `template1-start/status/cancel` + `music-library` actions. `server/assembly-template1*.mjs` = prompts (wire-proven Kaatrukulle defaults from PR #27 packs), gen (Replicate image + hero, xAI opening `image`+`last_frame` 12s, spend ledger, moderation stop), craft (mute, +3s hold, plates, palette extraction), theme (CSS block + registry patches), orchestrator (parallel fan-out, `work/assembly-jobs/` manifests, cancel). `cms/music-library.json` seeded with Vazhithunaiye. Reserved ids via `// reserved:` line in `src/data.ts` (fixes the `server-journey` id regex clash). Playbook section in `assembly-publish.md`.
- RH12 Kaatrukulle (2026-09-22, **not published**): clone of **royal-heritage-7** (read-only) as `royal-heritage-12`. Skipped RH10 (Spiderverse PR #24) and RH11 (KTM PR #25). Scratch opening + hero from inbox (video-only, ffmpeg `-an`, no RH9 video/still reuse, no AI gens). Separate tap-to-play `public/assets/vazhithunaiye.mp3` (copy of RH9 `DXFBDobiJoK` extract). Catalog `music:'vazhithunaiye.mp3'` → `/assets/vazhithunaiye.mp3`; song title `musicName:'Vazhithunaiye'`. Videos stay muted. Overlay uses Velicha magenta `#9B2158` / sage `#3F5C55` on cream paper, mid-sky `4svh 13% 50svh 13%`. Craft plates: plate1 → sections 1/2/3/5; plate2 → shared TAG plate-4. No frame on Welcome / Moments / Timeline / Dress / RSVP / footer. Preview couple Ashok & Supriya. STOPPED before Publish / no `main` push / no Supabase apply.
- RH9 Velicha Poove (2026-09-21, **not published**): clone of **royal-heritage-7** (read-only) as `royal-heritage-9`. Pin `https://pin.it/330nC70it` (Ethereal Connection watercolor). FIRST still = closed magenta-bougainvillea garden doors; LAST still = pin couple eye-contact; xAI `grok-imagine-video-1.5` 12s 9:16 with `image` + `last_frame`, then ffmpeg +3s hold on the last frame. Hero = one still as both frames, 6s static loop. Separate reel mp3 `royal-heritage-9-music.mp3` (Instagram `DXFBDobiJoK`); videos muted (`-an`). Overlay type sampled from pin magenta `#9B2158` / sage `#3F5C55` on cream paper, mid-sky `4svh 13% 50svh 13%`. Thin character-free plates 1–5; no frame on Welcome / Moments / Timeline / Dress / RSVP / footer; Transport+Accommodation+Gifts share plate-4. Preview couple Ashok & Supriya. STOPPED before Publish / no `main` push / no Supabase apply.
- Opening generate (2026-09-21): xAI REST `last_frame` (pin as **final** frame). Hero still Replicate. Needs `XAI_API_KEY` + `OPENAI_API_KEY` + `REPLICATE_API_TOKEN`.
- RH8 opening regen (2026-09-21, PR #22, **not published**): generated FIRST still (closed grand door) + LAST still (couple facing, eye contact) via xAI `grok-imagine-image-2.0` edits of pin `https://pin.it/6sh37rSvu`, then `grok-imagine-video-1.5` interpolate 12s 9:16 720p (`image` + `last_frame`). Encoded into `royal-heritage-8.mp4` / `.jpg` / catalogue. Hero reused. Parent-7 untouched. STOPPED before Publish.
- RH8 hero regen (2026-09-21, PR #22, **not published**): ONE wide 9:16 still (pin-style ornamental borders on all four sides, couple at the bottom, large empty center for site text) used as BOTH `image` and `last_frame` (identical `imgen.x.ai` URL). xAI `grok-imagine-video-1.5` 6s 9:16 720p with the exact loop prompt (static camera, no zoom). Encoded `public/assets/royal-heritage-8-hero.mp4` only. Opening + catalogue KEEP. STOPPED before Publish.
- RH8 display rename (2026-09-21, PR #22, **not published**): clone id `royal-heritage-8` display name → **Sita Kalyanam**. Opening KEEP. Hero KEEP. Videos/assets unchanged. STOPPED before Publish.
- RH8 music mux on mp4s (2026-09-21, PR #22): **not the product music path**. Videos stay muted. AAC already in opening/hero is ignored. STOPPED before Publish.
- RH8 **separate** demo music (2026-09-21, PR #22, **not published**): Instagram reel (`DS15ecUkpOA`) extracted to `public/assets/royal-heritage-8-music.mp3` and mapped on the Sita Kalyanam catalog row (`music` field + `catalogMusicUrl()`). Demo `/invite/demo?template=royal-heritage-8` tap/toggle plays that `<audio>` track, not parent `/assets/track3.mp3`. Videos remain muted. STOPPED before Publish.
- RH8 hero text overlay (2026-09-21, PR #22, **not published**): `.theme-royal-heritage-8` couple-overlay — larger mid-sky type, `justify-content:center`, equal 13% side padding, 10%/44% top/bottom so the stack is readable and centered without covering the couple. Parent-7 untouched. STOPPED before Publish.
- RH8 dress palette + section plates (2026-09-21, PR #22, **not published**): overlay type uses wine `#6E1A28` / peacock `#165A4A` sampled from the couple’s dress (cream glow shadow, not white). All invitation sections below the hero are scoped to `.invitation-page.theme-royal-heritage-8` with alternating cream/gold, wine-wash, and green-wash plates. Five character-free 9:16 stills at `public/assets/royal-heritage-8-section-1.jpg` … `-5.jpg` (xAI `grok-imagine-image-2.0`). Videos remain muted. Parent-7 untouched. STOPPED before Publish.
- RH8 overlay up + empty-sky plates (2026-09-21, PR #22, **not published**): couple-overlay padding `4svh 13% 50svh 13%` (viewport-height units so the stack sits in the upper sky and clears the couple). Section plates regenerated as unique ornamental borders with empty cream→gold→blush sky centers (no temple/architecture). Plate CSS uses a **thin** black→transparent edge vignette only (`rgba(0,0,0,.08)` falling to 0 by 10% — center sky stays clear). Parent-7 untouched. STOPPED before Publish.
- RH8 plate cleanup (2026-09-21, PR #22, **not published**): strip ornamental plates from Welcome, Our Moments, Timeline, Dress Code, RSVP, and footer (plain cream). Transport + Accommodation + Gifts share one `invite-cluster invite-plate-4` frame. Scratch, Countdown, Venue, Pre-Wedding keep unique empty-sky plates. Thin edge vignette only. Parent-7 untouched. STOPPED before Publish.
- RH8 TAG thin plate (2026-09-21, PR #22, **not published**): regen only `royal-heritage-8-section-4.jpg` as thin gold vine/flower filigree (wine + peacock leaf accents) on cream→peach sky — no curtains/pillars. Cluster keeps Transport + Accommodation + Gifts on that one frame, with `padding:40px max(28px,12%)` so copy stays in the text-safe center. Playbook rule in `assembly-publish.md`. Parent-7 untouched. STOPPED before Publish.

Done when Ashok assembles one clone locally, opens `/invite/demo?template=…`, then says **Publish** — Akay applies Supabase SQL + commit + push (see [assembly-publish.md](assembly-publish.md)). Assembly UI shows preview links only; editable display names are set before assemble.

## `/llm.txt` LLM discovery file (2026-09-21)

Same static-file pattern as `robots.txt` / `sitemap.xml` so crawlers do not get the SPA `index.html` shell:

- Source of truth: `public/llm.txt` (plain UTF-8; canonical URLs on findmyinvite.com)
- Alias: Vercel rewrite `/llms.txt` → `/llm.txt` (one body)
- `vercel.json` SPA catch-all and catch-all `X-Robots-Tag: noindex` exclude both paths; `Content-Type: text/plain; charset=utf-8` on both
- Share-card `/:slug` bot rewrite uses the same guest-slug regex so `llm.txt` cannot be treated as an invitation

After merge+deploy, curl:

```bash
curl -sI https://findmyinvite.com/llm.txt
curl -sI https://findmyinvite.com/llms.txt
curl -s https://findmyinvite.com/llm.txt | head
```

Expect 200, `text/plain; charset=utf-8`, body starting with `# FindMyInvite` — not homepage HTML.

## What this conversation changed after the v0.9.0 handoff

### Applied in production (real change)

| Change | Where | How | Code? | Deploy? |
| --- | --- | --- | --- | --- |
| All 13 `template_catalog` rows → `published = true` | Prod Supabase `qqvcptjkfcjkwbkookcm` | PostgREST PATCH with `service_role` (Ashok pasted key in chat) | No | No — API is `no-store`; live instantly |
| Ashok accepted the fix live | findmyinvite.com/templates + publish path | Human verification | — | — |

### `/akay` traffic desk — LIVE in production (verified 2026-09-15 18:10 UTC)

| Change | Where | Code? | Deploy? |
| --- | --- | --- | --- |
| Operator analytics dashboard at `/akay` | SPA + `api/analytics.mjs` | `09971d5` | Live — bundle `index-TRMUVIGW.js` byte-matches a clean build of `09971d5` |
| Anonymous pageview / dwell / journey events | `analytics_events` table (`supabase/002_analytics.sql`) | Yes | Table exists in prod `qqvcptjkfcjkwbkookcm`; `POST ?action=collect` returns 202 |
| Access code in server code only (`server/akay-gate.mjs`); HttpOnly cookie; no UI/DB password change | Gate | Yes | Live. Code is hardcoded in a public repo — **Ashok accepted this 2026-09-15; change later** |
| No `/akay` link on home, header, footer, or any public page | Storefront | Yes | Live |
| Helper line under the "Traffic & journeys" title removed | `src/AkayAdmin.tsx` | Yes | Pushed to `main` 2026-09-15 on Ashok's word |

Password is not in the frontend bundle. Tests cover gate, reserved slug, no public link, and journey summary. One probe row with path `/akay-smoke-probe` exists in prod `analytics_events` from Akay's live check; ignore or delete.

### Deploy path correction (2026-09-15)

The GitHub Actions `deploy` job for `09971d5` was **skipped** (`ENABLE_PRODUCTION_DEPLOY` false), yet production updated anyway. **Vercel's Git integration auto-deploys every push to `main`.** The GitHub variable does not gate production; only the push rule does. Ashok's word 2026-09-15: *"Push to main is prod, it's okay, leave it as is."* Treat every `git push origin main` as a production release.


### Discovered / verified (no write)

- v0.9.0 handoff SHA: tag `v0.9.0` → `84416179b8d85486eea0fcc0e219f994be9bf3ab`
- `main` tip: `5282ff075ce11b72120da7ed804c3e247b835920` (docs-only `[skip ci]` after grand-launch)
- Last Vercel Production deploy: `6db0d12…` — "Keep launch ceremony replayable until September 15 at 3 AM IST" — Ready, serves both domains
- Live bundle: `/assets/index-79Usa2fE.js` — byte-matches a clean build of `main`
- ~~Push ≠ auto-deploy today~~ — **superseded 2026-09-15**: Vercel Git integration deploys `main` to production on every push regardless of `ENABLE_PRODUCTION_DEPLOY` (still `false`; the Actions `deploy` job only matters for `workflow_dispatch` previews). See "Deploy path correction" above.
- `akayatgit` was briefly considered then dropped — Cursor bot cannot create repos under `akayatgit`; remote is `hardwin` only.
- Zareqia Supabase (`ganphjxofavzmxzsecij`) is **not** this product's DB. FindMyInvite prod = `qqvcptjkfcjkwbkookcm`.

### Git / Vercel / code changes in that conversation

None. No commits, no PRs, no branch pushes, no Vercel redeploys, no edits under `hardwin/findmyinvite` application source. Watch Tower checkout was never touched.

### Project-store artifacts (may not be in git)

These were created in the prior Project store, not necessarily this checkout:

| Path | Purpose |
| --- | --- |
| project-context.md | Standing facts — **now also** [project-context.md](project-context.md) in this folder |
| akay-soul.md | Soul — **now also** [akay-soul.md](akay-soul.md) |
| v0.9-deploy-plan.md | Deploy path + blockers |
| templates-publishing-fix.md | Catalog gate fix (applied) |
| launch-morning-checklist.md | 26-item live-verified readiness |
| test-cases-manual.md | All 15 cases as phone steps |

If those Project-store files are missing in a new session, use this changelog + `docs/handoff/PREDEPLOY-15.md` + `docs/handoff/RELEASE-RUNBOOK.md`.

## Manual test progress (Ashok on phone)

| Case | Result |
| --- | --- |
| 1 What is live is the right build | 4/6 PASS — config, 13 templates, GitHub Actions green, Vercel Ready/`6db0d12`. Open: Vercel plan (Pro vs Hobby), Settings → Git Production Branch |
| 2 Nothing private leaks | PASS 3/3 |
| 3 Domain, padlock, www | **PASS** — Ashok phone, 2026-09-15 ~23:02 IST (mobile data). Desktop re-check below is supporting, not the authority. |
| 4–5 | Written, not started (offer bounds + catalog; not on the money-path critical path) |
| 6 Create + publish (`akay-test-1`) | Needs explicit YES — writes real data |
| 7–15 | Written; Case 14 cleans up `akay-test-1` |

### Desktop Case 3 re-check (Akay, 2026-09-15 ~15:46 UTC) — not a phone PASS

From this Siemens Energy network, public DNS lookups are rewritten to `*.prod.sgre.one`; **Ashok's phone on mobile data is still the Case 3 authority**. HTTP to the public host did reach Vercel `bom1`:

| Check | Result |
| --- | --- |
| `https://findmyinvite.com/` | 200, `Server: Vercel`, HSTS, Mumbai (`bom1`) |
| `http://findmyinvite.com/` | 308 → `https://findmyinvite.com/` |
| `https://www.findmyinvite.com/` | 308 → `https://findmyinvite.com/` |
| `http://www.findmyinvite.com/` | 308 → https www → 308 → https apex |
| `/templates`, `/blog`, `/contact`, unknown slug | 200 SPA `index.html` (client routing) |
| `GET /api/content?kind=templates` | JSON, **13 templates** + Classic/Royal SKUs |
| `GET /api/invitations?action=config` | `configured: true`, `promotion.active: true`, uploads true, offer 14 Sep 23:59 → 14 Oct 23:59 IST |
| Vercel MCP `list_teams` | team `hardwins-projects` **plan = hobby** (P0 still open) |

## Outstanding Ashok actions

1. Confirm Vercel Billing = **Pro** (P0 — Hobby can pause commercial traffic). MCP still reports Hobby.
2. Rotate the `service_role` key that was pasted in chat (Supabase → API → Reset).
3. **YES** before Case 6 (create + publish `akay-test-1` on live). Case 3 phone PASS recorded 2026-09-15 ~23:02 IST.
4. Send support email/WhatsApp + business name before contact/policy copy can ship.
5. **Forgot password** — deferred. Email/password accounts have no reset flow yet.

## Admin shortlist + split desk (2026-09-16)

`/akay` is a mobile operator shell with bottom nav: Traffic, Journeys, Live, Shortlist, Competitors, Upcoming. Shortlist at `/akay/shortlist` approves/rejects `shortlist_candidates` and enqueues `replication_queue` on approve. Epic 1 adds read-only `/akay/competitors` (20) and `/akay/upcoming` (361; chips 140/106/78/37). Cards lead with WordPress mshots page previews of the existing http(s) links (no screenshot warehouse on the invitations DB). Missing list payloads no longer unmount the desk. Forgot password still backlog.

## Epic 2 — Shortlist Approve/Reject gap-fill (2026-09-17)

List, filters, and chips stay. Live main still PATCHed `shortlist_candidates` then POSTed `replication_queue` as two REST writes, so Approve could not satisfy “same transaction” and queue stayed at 0. API now calls privileged RPCs `approve_shortlist_candidate` / `reject_shortlist_candidate` (`service_role` execute only; already on prod as `shortlist_decide_rpcs`). Approve sets `approved`, bumps `updated_at`, and inserts one `replication_queue` row (`queued`, empty assignee) `ON CONFLICT (candidate_id) DO NOTHING`. Re-approve is 409. Reject sets `rejected` and never touches the queue. Bulk remains optional, max 50, per-id ok/fail. Card Approve/Reject stay visible (cropped preview; disabled when not `proposed`).

Prod baseline at this pass: 22 proposed / 3 rejected / 0 approved / `replication_queue` 0.

## P1 live FMI design landing pages (2026-09-17)

13 signed-off catalogue design LPs share the occasion `/invitations/{slug}` server HTML path (`/api/invitation-page`). Copy lives in `server/design-landings.mjs` and is merged into `occasionBySlug` so SPA `OccasionLanding` stays in sync. Primary CTA uses the existing editor pattern `/create?template={template_catalog id}&type=wedding` (Gallery "Use This Design"), not a collection browse link. SKU mismatches from the brief are wired as-is: Royal Imperial → `rose-gold-blush-royal`, Crimson Royale → `ivory-elegance`, Majestic Love → `royal-elegance`, Royal Elegance → `modern-minimal-royal`. Guest gate `/api/guest-page` and `robots.txt` Disallow `/akay` are unchanged.

## P1 +3 live FMI design landing pages (2026-09-18)

Three more published Royal catalogue LPs use the same `/api/invitation-page` + sitemap path: `/invitations/royal-temple` → `royal-temple`, `/invitations/royal-heritage-wedding` → `royal-heritage-wedding`, `/invitations/royal-sanctuary` → `royal-sanctuary`. `royal-heritage-wedding` is a separate slug and catalog id from existing `/invitations/royal-heritage` (`royal-heritage`). Unknown `/invitations/{slug}` still 404s. Guest `/api/guest-page`, `/akay` gate, and `robots.txt` are unchanged.

### Royal Heritage cinematic variants (local + catalog DML)

Three clones of cinematic `royal-heritage` with alternate intro videos only (`royal-heritage-1` ← temple_in_heaven, `royal-heritage-2` ← vdd09…, `royal-heritage-3` ← replicate-prediction…). Same poster/still, royal collection, native Invitation renderer. Assets under `public/assets/` + catalogue previews; DML `supabase/010_royal_heritage_variants.sql` applied to prod `qqvcptjkfcjkwbkookcm` with `published=true`. Total design LPs: 20; sitemap invitation URLs: 41. Code must be pushed before live demos use the new mp4s.

## /akay Blog queue + South Pulse (2026-09-20)

New operator tab **Blog queue** at `/akay/blog-queue` (bottom nav; still unlinked from public pages).

**South Pulse** runs 3× daily IST (08:00 / 14:00 / 20:00 → Vercel cron `30 2,8,14 * * *` UTC) via `GET/POST /api/akay-blog-queue?action=pulse` authenticated with `CRON_SECRET` or `BLOG_PULSE_CRON_SECRET`. **Target ≥50 novel topics per run** (`PULSE_TARGET_MIN=50`): multi-batch invent (≤4×~20), soft evidence + soft SEO (zero Ads volume kept with notes), DataForSEO keyword chunks of 20, function `maxDuration` 300s. Research adapts [hardwin/trend-to-blog](https://github.com/hardwin/trend-to-blog) evidence rules with South-India-only geography and lanes: occasion, Tamil cinema, songs, celebrity, entertainment, news. Novelty gate blocks duplicates/near-paraphrases against queue + `blog_posts`. Approve creates an unpublished `blog_posts` draft.

SQL: `supabase/010_blog_topic_queue.sql` (`blog_topic_queue`, `blog_pulse_runs`) — applied on prod 2026-09-20. Env: `OPENAI_API_KEY`, `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, `CRON_SECRET`. Manual **Run pulse now** on the desk (`action=run`, session gate, 3/hour, force re-run clears today’s slot record).

## /akay Inspirations + Style Pulse (2026-09-20)

New operator tab **Inspirations** at `/akay/inspirations` (bottom nav; unlinked from public pages). **Style Pulse** invents South-India design styles for future multi-SKU template variations. Allowed lanes only: hindu/spiritual/regional, romantic AI couple, movie-poster couple — **skips** creative_ai, modern_minimal, food/feast. Seeds from `blog_topic_queue`; soft DataForSEO SEO; **Pinterest Trends soft-skipped**. Target ≥25 styles/run. Cron **1 minute after Blog pulse** (`31 2,8,14 * * *` UTC). Manual **Run**. Approve marks ready for SKU spawn (phase 2).

SQL: `supabase/011_inspiration_queue.sql` + `012_inspiration_blog_backlink.sql`.

**2026-09-20 follow-ups:** Hallucinated `/pin/{id}` rejected; refs are clean Pinterest **search** only (no Unsplash — BotStopper blocks mshots). Desk is a **list + detail sheet** (no card previews). Query builder collapses doubled “wedding invitation” and strips “aesthetic”. Pulse skips non-romantic/non-traditional styles. JSON harden: smaller batches (8×4), `json_object` format, truncated-array recovery, compact prompts — fixes “Style research returned unusable JSON”.

## /akay light shadcn desk (2026-09-20)

Operator desk restyled to a **light shadcn-style** UI (Tailwind v4 + Radix primitives under `src/akay/ui`). Traffic uses Recharts; Blog/Inspirations use compact tables with icon Approve/Reject. Public site CSS unchanged.

## Backlog

- Forgot password / email reset (explicitly deferred 2026-09-16).

## Laws the next agent must keep

See [akay-soul.md](akay-soul.md). Short form:

- Soul: WAKEUP first reply; every Ashok reply ends with 🎯 YOUR ACTION + ❓ DECISION.
- Source safety: commit locally OK; ask twice before push; never force-push.
- Prod deploy: respect `ENABLE_PRODUCTION_DEPLOY`; do not flip it without Ashok's word.
- Catalog: `published` is the intentional CMS gate — do not remove it in code to "fix" emptiness.
- Done = Ashok accepts live, not "tests green."
- Keys: never store `service_role` / tokens in the Project store or the repo.

## Plan — next 5 iterations

### Iteration 1 — Close P0: prove the money path (Case 3 → Case 6 → 7 → 12 → 14)

Outcome: One full live create → publish → guest RSVP → delete on findmyinvite.com, recorded as PASS.

How: Continue Ashok phone walkthrough from Case 3. On Case 6 YES, use slug `akay-test-1`; Case 14 deletes it. Optionally Akay runs a synthetic smoke if Ashok says YES and is busy.

Exit: Case 1 plan = Pro (or Pro upgrade done); Cases 3, 6, 7, 12, 14 PASS; smoke row deleted.

**Status 2026-09-15 23:02 IST:** Iteration 1 in progress. Case 3 phone **PASS**. Case 6 blocked on YES. Hobby still reported.

### Iteration 2 — Trust surface (contact + policies)

Outcome: `/contact` shows a real channel; Privacy/Terms drop "launch draft" and say the real business name.

Needs from Ashok: support email or WhatsApp + legal business name (+ one retention sentence if he has it).

How: Code change on branch → draft PR → Ashok YES ×2 → flip `ENABLE_PRODUCTION_DEPLOY` for one `main` push → set variable back to `false`.

Exit: Live pages accepted by Ashok; MX optional if contact is WhatsApp/Gmail.

### Iteration 3 — Share + measure (og:image + analytics)

Outcome: WhatsApp/Instagram previews show a hero image; campaign traffic is countable.

**Status 2026-09-15:** Share loop in progress on branch `cursor/share-loop-7845`. Storefront `og:image` uses Royal Imperial still. Social crawlers hitting `/:slug` are rewritten to `/api/share`, which returns couple names + that invitation's template still (not guest photos). Host dashboard and published guest pages get **Share on WhatsApp**. Guest footer: **Made with FindMyInvite — create yours**. `/akay` already counts traffic. GA4/Vercel Analytics still not requested.

Exit: Link unfurl works on a real phone share; one pageview visible in `/akay`.

### Iteration 4 — Hygiene that protects the campaign

Outcome: Harder to lose data / get paused / get indexed wrong.

Items: Supabase backup/export or Pro backups; `robots.txt` + `sitemap.xml` as real static files (today they serve SPA HTML); rotate any chat-pasted Vercel CI token; one-line rights acceptance for Royal videos (G03).

Exit: Checklist P1 #10–14 closed or explicitly deferred with Ashok's word.

### Iteration 5 — First real user loop + retention

Outcome: One real customer journey observed end-to-end; one retention hook ready.

How: Watch first organic create after Cases pass; fix any live friction the same day; optional: publish one `blog_posts` row or hide `/blog` footer link; optional Classic vs Royal merchandising polish.

Exit: Ashok says the morning experience is usable with real traffic — not just "checklist green."

## 2026-09-24 — Immersive scroll fix (hero clean + section snap)

Ashok QA: overlays on hero video, sticky mid-section scroll, dense motifs, gritty motion.

- **Hero clean:** Removed `InviteScrollStage` WebGL overlay (fixed fullscreen planes sat on the hero loop). Immersion starts only below `.invitation-hero`.
- **Section snap:** Replaced GSAP pin/scrub with Lenis + mandatory Snap — one flick → one full-viewport chapter (`height:100svh`). Small sections fill the viewport; no mid-stuck pins.
- **Motifs:** Density halved in kits; smaller/thinner strokes; sparse third-grid spawn; draw skipped while hero owns the viewport.
- **Smooth preload:** Lenis/Snap modules warm while opening/hero videos play (`playing`); dropped backdrop-filter blur on chapter cards (mobile grit).

Pilot: `/invite/demo?template=royal-prestige-2`

## 2026-09-24 — TikTok-style invite scroll (Swiper)

Replaced Lenis+Snap document scroll with **Swiper** vertical full-viewport paging.

- Short or long flick → exactly one section (never multi-page, never deny/reverse past threshold)
- Height locked to `visualViewport` (address-bar safe; no next-section peek)
- Hero = slide 0 (clean, no WebGL overlay); nested inner scroll for tall RSVP/timeline
- Removed `lenis` / unused `gsap` from invite path

## 2026-09-24 — Swiper pager QA fixes
- Empty slide: `#invitation-details` moved outside `InvitePager`.
- Opening video: hard lock (no touch/wheel/inner scroll) until `opened`.
- Logistics: Transport / Accommodation / Gifts each own slide + plate-4; text stays inside chapter-inner cards.
- Countdown: compact Hrs/Mins/Secs labels, ellipsis-safe cells.
- Motifs: punch/gate only active Swiper slide; denser + higher alpha; z-index 25.

## 2026-09-24 — Motifs visible again on idle sections
- Particles were ~4–9px (invisible) and full `invite-plate-*` punches wiped every plate slide.
- Size ~14–34px, denser seed, punch only media + `.invite-chapter-inner` (margins keep drifting), soft-light blend, slide-class observer.
- Motifs still invisible on cream: soft-light + pastel wiped them. Switched to normal blend, darker rose/gold, larger particles (~22–50px), edge-biased spawn, canvas mounted after pager (z-index 30).
