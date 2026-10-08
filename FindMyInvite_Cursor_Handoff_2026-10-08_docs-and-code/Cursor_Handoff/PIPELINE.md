# FMI multi-agent pipeline — roles, order, gates

Sources: bot profiles in `bot-personas/`, `process-docs/PROCESS_CHANGELOG.md`, `process-docs/ORCHESTRATOR_*.json`, packet files in `productions/**/packets/`. Roles of deleted bots are reconstructed from packets and changelog **(their own profile files no longer exist; wording is inferred)**.

## Three eras
1. **Full hierarchical pipeline (1–3 Oct)** — many specialist bots exchanging JSON *packets* through the Orchestrator (kc-v1 original, nk-v1, first recreates).
2. **ReCreate / NO-QC mode (3–6 Oct)** — Ashok waived Continuity and all QC for client fills of locked templates ("No Continuity QC", "NO QC generate+stitch", 3 Oct 00:45–00:52). FMI ReCreate filled templates and drove Orchestrator → Asset Producer, auto-unlocking each clip on its decoded handoff, then stitching.
3. **One bot per project (6 Oct →)** — each client project gets its own bot (Benjamin, Sarah, Maniraj-Engagement, Dubai-Church-Wedding) that does everything itself (fill, stills, clips, stitch, delivery) with ReCreate as an adviser and Spatial Continuity on request. This is the current model; on 8 Oct Ashok removed the idle specialist bots.

## Locked order (era 1, per PROCESS_CHANGELOG 2 Oct)
```
Template Compiler → Continuity Director → Spatial Continuity → [Ashok approves 16:9 shot-board]
   → Asset Producer → Image Director (+ Image Floor) → Visual QC / Continuity veto → [Ashok approves stills]
   → Video Director (+ Video Floor) → Visual QC → Assembly Editor → Final QC Delivery
StoryBoard Manager shows stills/clips to Ashok. Orchestrator owns template.json and packets only.
```

## Roles
| Role | Status 8 Oct | Job |
|---|---|---|
| **FMI Orchestrator** (`5cf7e3d9…`) | active | Executive producer. Only agent allowed to read the full `template.json`. Assigns `production_id`, owns `STATE.json`, emits small packets (`ORCHESTRATOR_GO_*`, `_HOLD_*`, `_STOP_*`, `_DELIVERY`), enforces gates and retry limits (default max 2 paid image + 2 paid video attempts, then `NEEDS_INTERVENTION`), never generates. Approved assets are immutable and referenced by sha. |
| **Template Compiler** (`9328ca28…`) | removed 8 Oct | Validates a filled template (`TEMPLATE_COMPILER_VALIDATION_RECEIPT.json`: placeholders resolved, `prompts_mutated_by_compiler=false`, sha recorded). |
| **Continuity Director** | removed earlier | Writes `continuity/CONTINUITY_BIBLE.json/.md` (world, materials, palette, character identity, object counts), amends (`CONTINUITY_AMEND_*`), vetoes stills/clips (`continuity_veto/`, `CONTINUITY_VETO_RESULTS.json`). Waived for client fills from 3 Oct. |
| **Spatial Continuity** (`06fd7f86…`) | active | See `SPATIAL_CONTINUITY.md`. Builds Spatial Map JSON+MD and ONE 16:9 shot-board blueprint; hard gate before any IMAGE/VIDEO job. |
| **Asset Producer** (`8291ea3c…`) | not on box 8 Oct (profile missing) | Turns Orchestrator GO packets into `packets/IMAGE_JOB/*.json` and `packets/VIDEO_JOB/*.json` (folding Spatial Map constraints), dispatches, records receipts (`ASSET_PRODUCER_*`), auto-unlocks the next clip on decoded handoffs in NO-QC mode (`scripts/ap_auto_unlock_next.py`). |
| **Image Director** (`2f62e62e…`) + FMI Image Floor room | removed 8 Oct | Generates stills from IMAGE_JOB packets only (Replicate Flare, text-only), returns path/generation_id/prompt hash. Never self-approves. |
| **FindMyInvite Video Director** (`57f50238…`) | active | Generates *connections* between physical state A → B from VIDEO_JOB packets: first frame, last frame, motion prompt, continuity rules, duration, camera. Must use the actual decoded previous frame. Also relayed many of Ashok's process rules on 2 Oct. |
| **Visual QC Supervisor** | removed earlier | Judges assets against the job spec and Continuity Bible (`QC_*.json`, decisions PASS/RETRY/VETO). Creates nothing. |
| **Assembly Editor** (`ee97153e…`) + FMI Finish room | removed 8 Oct | Preflight + hard-cut concat (`manifest/assembly_preflight.json`, `concat_list.txt`). |
| **Final QC Delivery** | removed earlier | Last gate: full decode, order, duration, no black/corrupt frames, required text (`manifest/final_qc_report.json`). |
| **StoryBoard Manager** (`6f173f0c…`) | removed 8 Oct | Shows stills/clips to Ashok, collects approvals (`storyboard/STORYBOARD.md`, `STORYBOARD_INDEX.json`, `storyboard-ready.zip`). |
| **Process Architect** (`0a9a9f50…`) | removed 8 Oct | Writes process changes into `PROCESS_CHANGELOG.md` and Orchestrator locks. |
| **FMI ReCreate** (`aee10424…`) | active | Client-fill recreate agent: collects parameters, writes them into a template copy, re-resolves placeholders, diff-checks (`RECREATE_CLIENT_FILL.json`, `PARAMETER_DIFF_REPORT.md`), hands off to Orchestrator; now adviser to project bots and builder of reusable templates (Islam-Christian v1). |
| **Project bots**: Benjamin, Sarah, Maniraj-Engagement, Dubai-Church-Wedding | active | Own one client project end to end. Full briefs (client details, standing rules, Telegram rules) in their profiles. |

Group rooms (removed 8 Oct): FMI Pre-Production, FMI Video Floor, FMI Image Floor, FMI Finish.

## Gates and approvals
1. **SPATIAL_16X9_BLUEPRINT_GATE** (lock `process-docs/ORCHESTRATOR_PROCESS_LOCK_SPATIAL_16X9.json`, effective 2 Oct 09:36 IST): no IMAGE_JOB / VIDEO_JOB / GENERATING_SCENES / GENERATING_CLIPS until `spatial_blueprint_16x9_status=approved_by_ashok`. For new templates/venues. Client fills of a locked template skip it (Rahul & Mounika onward; Swaroop and Theresa still had a spatial board).
2. **Stills approval** by Ashok before any video (`ORCHESTRATOR_STILLS_APPROVED_VIDEO_GO`, or Ashok in chat).
3. **Paid-retry authorization**: no automatic paid retries (`generation_policy.automatic_paid_retries=false`); Orchestrator/Ashok must authorize each retry with a defect-targeted instruction.
4. **Final QC** before delivery (era 1 only).
5. **Client acceptance** closes a project (Ashok says so).

## State machine (Orchestrator)
`… → TEMPLATE_COMPILE → BUILDING_CONTINUITY_BIBLE → SPATIAL_MAP → AWAITING_SPATIAL_APPROVAL → GENERATING_SCENES → (stills approval) → GENERATING_CLIPS → ASSEMBLY → FINAL_QC → DELIVERED`, with `HOLD`, `STOP_HOLD`, `NEEDS_INTERVENTION` side states. Current phases per production are in each `STATE.json`.

## Packet naming (useful when reading `packets/`)
`ORCHESTRATOR_<VERB>_<TARGET>.json` (GO, HOLD, STOP, CUE, UNLOCK, WAIVE, DELIVERY…), `ASSET_PRODUCER_<…>.json` receipts, `IMAGE_JOB/scene-NN[.retry-2].json`, `VIDEO_JOB/clip-NN.json`, `VIDEO_QC_*.json`, `RECREATE_*` (ReCreate hand-offs), `SPATIAL_16X9_*` (Spatial deliveries/approvals).
