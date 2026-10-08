# FindMyInvite (FMI) — Cursor handoff (snapshot 2026-10-08 ~14:45 IST)

> **⚠️ This zip contains live API keys. Keep it private and rotate the keys if it is ever shared.** (They are in `secrets/.env`; see `secrets/README.md`.)

Built by Grok Bot for Ashok on Thu 8 Oct 2026 so that Cursor (or any coding agent) can pick up the FindMyInvite wedding-invitation-video work with no access to Grok Bot. Everything below comes from real files on the Grok Bot box; anything uncertain is marked **(uncertain)**.

## 1. What FMI is
FindMyInvite (https://findmyinvite.com, repo `hardwin/findmyinvite`) sells digital wedding/event invitations. Since 1 Oct 2026 the main work has been **AI-generated 9:16 invitation videos**: a JSON *template* holds 12 storybook-3D scenes (stills with in-image lettering for names, dates, venue, families, hosts, save-the-date) and 11 connecting clips. Per client, only the `parameters` block is filled, the `{{placeholders}}` are re-resolved into the prompts, then:

1. **Stills**: Replicate `openai/gpt-image-2.5-flare`, text-only (never a reference image), 9:16, padded to 720×1280.
2. **Clips**: xAI `grok-imagine-video-1.5`, 720p 9:16, chained: clip-n's first frame is the *actual decoded last frame* of clip-(n-1), and its last frame is still n+1.
3. **Stitch**: hard-cut concat (no crossfades), silent, and/or a **speed-ramped cut** (~28 s); re-encoded to 1080×1920 for delivery.
4. **Delivery**: Telegram (Eventsblr bot → Ashok's chat 2002649357). Ashok handles clients himself; bots never message clients.

## 2. Folder map (zip root)
| Folder / file | What it is |
|---|---|
| `README_FOR_CURSOR.md` | this file |
| `PIPELINE.md` | multi-agent pipeline, roles, gates, approvals, and how it got simpler over time |
| `RECREATE_CHRISTIAN_CHURCH_V1.md` | **step-by-step recipe to make the Christian church v1 video for a new couple** |
| `STITCHING_AND_SPEED_RAMP.md` | exact ffmpeg/python recipes (concat, 1080 re-encode, speed ramp, handoff frames) |
| `SPATIAL_CONTINUITY.md` | what the Spatial Continuity bot does, inputs/outputs, examples |
| `TIMELINE.md` | dated log, 1 Oct → 8 Oct 2026 |
| `URLS.md` | every site, repo, API endpoint, storage host used |
| `MANIFEST.md` | every file in every zip part, with a one-line purpose and which part it is in |
| `secrets/` | `.env` with live keys + README (what each key is for, where it is used) |
| `templates/` | clean copies of the reusable templates + client-fill blanks |
| `scripts/` | canonical working scripts (stills, video chain, speed ramp, Telegram, fill) copied from the latest good productions |
| `process-docs/` | PROCESS_CHANGELOG, Orchestrator process locks, briefs, storyboards, deliverable notes |
| `productions/` | **full mirror of `/workspace/fmi-productions/`** (every production, packet, log, still, clip, video, attempt, superseded file). Paths inside JSON files say `/workspace/fmi-productions/...` → that is `productions/...` here |
| `workspace-extras/` | other FMI work from `/workspace`: `icc_work/` (Islam-Christian finals/Instagram builds), `speedramp/` (original speed-ramp prototype), `review/` sheets, root-level generator scripts, old image-job temp logs |
| `bot-personas/` | each FMI bot's profile (its system prompt/role) + files shared in its chat |
| `skills/` | FMI-related Grok Bot skills (headless assembly, catalogue scale) |
| `transcripts/` | **chat transcripts were NOT available** — see `transcripts/README.md` |
| `repo-status/` | `hardwin/findmyinvite` PRs + commits since 30 Sep |
| `legacy-fmi/` | older FMI catalogue/assembly work (Kaatrukulle Template 1, KTM couple, website research, Akay admin docs, SEO audits) — date uncertain, mostly pre-30 Sep |

Each top-level folder has its own short README.

## 3. Zip parts and how to rejoin
The full set is too big for one download, so it is split into **independent** zips (not a multi-volume archive). Every part has the same root folder `FindMyInvite_Cursor_Handoff_2026-10-08/`, so:

```bash
mkdir fmi && cd fmi
for z in ../FindMyInvite_Cursor_Handoff_2026-10-08*.zip; do unzip -q -o "$z"; done
# Windows: right-click each zip -> Extract All -> same destination folder (merge folders)
```
- `FindMyInvite_Cursor_Handoff_2026-10-08.zip` = **core** (all docs, secrets, templates, scripts, personas, skills, repo status, legacy, and every non-media file — JSON/MD/TXT/PY/SH/logs — from all productions). It is enough on its own to understand and re-run the pipeline.
- `FindMyInvite_Cursor_Handoff_2026-10-08_media-NN-of-MM.zip` = images/videos/frame dumps, packed in path order (the media parts list in `MANIFEST.md` says which file is in which part).
- `ZIP_PARTS.sha256` (next to the zips, not inside) lists each part's sha256.

**Symlinks:** 5,590 symlinks under `*/work/speedramp/seq/`, `icc_work/*/seq*` were not stored (Windows can't extract them and they only point to frame PNGs that are included). Their link→target list is in `process-docs/SYMLINKS_NOT_STORED.txt`; the speed-ramp scripts regenerate them.

## 4. How to continue in Cursor
1. Extract all parts into one folder. Recreate the box layout so the absolute paths in scripts work:
   ```bash
   sudo mkdir -p /workspace && sudo ln -s "$PWD/FindMyInvite_Cursor_Handoff_2026-10-08/productions" /workspace/fmi-productions
   mkdir -p /home/box/shared/secrets  # or edit TOKEN path in send_*telegram*.py
   ```
   (Or search-replace `/workspace/fmi-productions` with your path.)
2. `set -a; source secrets/.env; set +a` (REPLICATE_API_TOKEN, XAI_API_KEY, …). Telegram scripts read the token from `/home/box/shared/secrets/telegram-eventsblr.token`; either recreate that file from `TELEGRAM_EVENTSBLR_BOT_TOKEN` or change the path.
3. Requirements: Python 3.10+, `requests`, ffmpeg/ffprobe ≥ 6 (box had ffmpeg 7.1.x; `tpad` was dropped from the speed-ramp recipe because of it), matplotlib (spatial boards).
4. Follow `RECREATE_CHRISTIAN_CHURCH_V1.md` for a new Christian church couple; copy the newest production folder's `scripts/` (`productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261007-181228-akhil-sarah/scripts/`) into a new production folder.

## 5. Ashok's standing rules (from bot personas + changelog)
- **Cost-sensitive**: generate each still/clip ONCE. No automatic paid retries. Never resubmit while a prediction/request id exists — keep polling it. Retry only on outright job failure or garbled lettering (max 1). Stop and tell Ashok on HTTP 402/403.
- Stills first → send to Ashok → wait for approval → then clips. After a revision regenerate only affected stills and only clips whose start/end frame changed; move old files to `superseded-<reason>/`.
- Template fills: values ONLY in `parameters`, re-resolve placeholders, never change style/character/camera text unless Ashok asks; back up before every edit; keep a `PARAMETER_DIFF_REPORT.md`; grep for leftover names from earlier clients.
- Locked-template client fills run with **no QC and no continuity/spatial checks** (Ashok, 3 Oct onward). New templates/new venues still use the Spatial 16:9 board gate.
- Video prompts < ~3,900 chars; never name an object not in the clip's start/end frame; say explicitly when a frame has no people; exactly one bell tower whenever a church is visible.
- Looks: storybook/Pixar-style 3D, tall adults with real adult proportions (never chibi). Marketing text goes **into the image via Flare**, never PIL/ffmpeg overlays (note: the Islam-Christian Instagram v2 promo did use a PIL overlay before this rule — see `workspace-extras/icc_work/insta2/`).
- Telegram: media to chat 2002649357; finals as `sendVideo` (width/height/duration/supports_streaming) + `sendDocument` (disable_content_type_detection=true); 50 MB limit (two-pass ~6.2 Mb/s if bigger).
- Never message clients. Projects close when Ashok says the client accepted; then optionally make a reusable template with fictional names + Instagram showcase, and send ReCreate a closing summary.

## 6. Open work right now (8 Oct 2026, ~14:45 IST)
| Project | Bot | Folder | State |
|---|---|---|---|
| **Dubai church wedding** — Luke Ashwin Joy & Ridhineka Ne'paul | Dubai-Church-Wedding | `productions/dubai-church-wedding/productions/luke-ridhineka-20261008-143619/` | Started 14:36 today. christian-v3 base stills copied; **Spatial Map + 16:9 board v1 drafted 14:41, awaiting Ashok's approval**. Still to confirm with Ashok: Holy Matrimony date/time/church (St. Mary's Catholic Church, Oud Metha?), where devotional_line_1 goes. Then stills (Flare, text-only), Ashok-designed camera moves, clips, speed ramp. Full brief in `bot-personas/Dubai-Church-Wedding/profile.json`. |
| **Maniraj engagement** (Tamil nichayathartham + christian-v1/v2/v3 remix stills) | Maniraj-Engagement | `productions/tamil-engagement-nichayathartham/productions/maniraj-engagement-20261007-130625/` | Rev 6 Tamil spelling fixes sent 8 Oct ~00:25 (Telegram 982–984); christian-v3 13 stills generated 8 Oct ~13:25 (the Dubai base). No final video found **(uncertain whether Ashok approved stills)**. |
| **Benjamin** — Mike Benjamin & Esther (Christian church v1) | Benjamin | `productions/kerala-christian-vtv-mood/productions/benjamin-20261007-182345/` | `DELIVERED_SPEEDRAMP_FINAL` 7 Oct 20:36. Waiting on client acceptance (closure). Normal-speed final not built. |
| **Sarah** — Akhil & Sarah (Christian church v1) | Sarah | `.../kc-v1-recreate-20261007-181228-akhil-sarah/` | `DELIVERED_SPEEDRAMP_REV6` 7 Oct 21:12 (priest removed). Waiting on client acceptance. |
| Rahul & Mounika (Christian church v1) | (ReCreate) | `.../kc-v1-recreate-20261006-211129/` | Speed-ramp delivered 7 Oct 13:08 after "Lunch" update; normal-speed finals are STALE (Ashok: "No need of normal"). |
| Islam groom + Christian bride template | (ReCreate) | `productions/wedding-template-islam-christian-church/` | Reusable `Wedding_Template_Islam_Christian_v1.json` (sha ca81cc40…) + Hamza & Angel showcase delivered 6 Oct. Anusha & Rishad production `icc-v1-20261005-234500` phase `CHUBBY_BRIDE_V5_DELIVERED` (7 Oct 20:04). |
| Mosque courtyard mc-v1 | — | `productions/mosque-courtyard-v1/` | Stills only (Ashok said stills only), 4 Oct. Parked. |
| Nandini–Karthik remake nk-v1 | — | `productions/nandini-karthik-remake/` | HELD by Ashok 2 Oct 19:27 (stills-v6, clips-v5 preserved). Parked. |
| kc-v1 original (Alex & Anna) | — | `.../kc-v1-20261001-230532/` | Final delivered 1 Oct 23:46. Later clip-01 "order v2" experiment ended STOP_HOLD (not in the delivered final). |
| GitHub | — | `repo-status/` | Open PRs #40 and #32 (royal-prestige-15/-7 assembly previews) and drafts #27, #25, #24, #20, #19, #7. Only one commit since 30 Sep (1 Oct). |

Bots Ashok removed on 8 Oct (idle): StoryBoard Manager, Process Architect, Assembly Editor, Template Compiler, Image Director and group rooms FMI Pre-Production / Video Floor / Image Floor / Finish. Visual QC Supervisor, Final QC Delivery and Continuity Director were already gone. Their roles are described in `PIPELINE.md`; their profile files no longer exist on the box.
