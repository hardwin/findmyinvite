# Spatial Continuity — what it does, inputs, outputs, examples

Bot: **Spatial Continuity** (`06fd7f86-587e-4d98-95f7-f17100e5280f`), still active on 8 Oct. Full role text: `bot-personas/Spatial Continuity/profile.json`. Added to the pipeline on 2 Oct 2026 (`process-docs/PROCESS_CHANGELOG.md`).

## Why it exists
Early stills and "maze" camera moves failed because every frame reused the same backdrop (water / temple / hills). Spatial Continuity invents the **adjacent 3D space of ONE venue** so the camera can weave left/right/push/pull into *different* facets of the same place (entrance, porch, side court, aisle, altar, garden, gateway…) — same materials, decor, light and palette, never the same background twice.

## Its one job / rules
- Same place, different facets; **no two shots in the same room/facet**.
- Continuity of materials/decor/light/palette; object counts locked (e.g. exactly ONE bell tower, ONE bride, ONE groom, ONE date board).
- The couple **stands**; the camera moves (nobody walks).
- Meaningful camera per shot (angle + move intent), and the next edge (how the camera moves to the next shot).
- It never generates final stills or video and never sees the full `template.json` — only an extract packet.

## Inputs
- `packets/spatial_extract.json` (from Orchestrator/ReCreate): production id, couple, template name + sha, continuity bible path (or `null` when waived), aspect (final 9:16; blueprint 16:9), identity locks for bride/groom, per-scene text copy, venue text.
- Or, for project bots, a written brief (Dubai: "each scene shot in a place ADJACENT to the previous one; upright standing cross in every scene; lots of depth").
- `packets/ORCHESTRATOR_CUE_SPATIAL.json` (cue).

## Outputs (every time)
1. `continuity/SPATIAL_MAP.json` — structured map. Keys seen: `architecture_lock`, `maze_graph` (rooms A…K with labels, north-up layout), `world`, `character_lock`, `object_count_rules`, and `beats[]`, each with `id, shot, room, name, zone, facet, generate_still, arrival, turn_from_prior, character_stands, camera_pose{framing,height,look,aim,fov_hint,move_intent,lighting}, visible_set, offscreen_neighbors{north,east,south,west,not_in_frame}, next_edge{to,move}, text, object_counts, forbidden_reuse`. Newer map (Dubai) uses `place_sentence, style_lock, wardrobe, hard_rules, zones, zone_links, path, path_string, lighting_progression, scenes`.
2. `continuity/SPATIAL_MAP.md` — human summary (plan, who stands where, rules, forbidden list).
3. **ONE 16:9 shot-board blueprint image** `continuity/SPATIAL_SHOT_BOARD_16x9_vN.jpg` (+ `.png`, `.svg`), 2560×1440, drawn with matplotlib (`scripts/draw_spatial_board_v1.py`, `draw_board.py`): ordered shot numbers, distinct room/facet per shot, camera angle/move, character placement, text callouts. This is the artifact Ashok approves.
4. Delivery packet `packets/SPATIAL_16X9_BLUEPRINT_DELIVERY_vN.json`; approval recorded as `SPATIAL_16X9_ASHOK_APPROVE_SIGNAL_vN.json` / `ORCHESTRATOR_SPATIAL_APPROVED*.json` with `spatial_blueprint_16x9_status=approved_by_ashok`.
5. Downstream: Asset Producer folds `image_prompt_constraints` / facet / forbidden_reuse into IMAGE_JOBs; Video Director uses facet + camera rules in VIDEO_JOBs.

## Gate
`SPATIAL_16X9_BLUEPRINT_GATE` (`process-docs/ORCHESTRATOR_PROCESS_LOCK_SPATIAL_16X9.json`): no image/video generation until Ashok approves the board. Iterate the board with Ashok until he confirms. Client fills of a locked template have since skipped this step (Ashok, 3 Oct onward); new venues still use it (Dubai, 8 Oct).

## Examples in this zip
| Production | Files | Notes |
|---|---|---|
| Nandini–Karthik nk-v1 (Hindu mantap remake) | `productions/nandini-karthik-remake/continuity/` | Evolution: top-view blueprints v1/v2 → `MANTAP_BLUEPRINT_TOPVIEW.png` (spatial-v2, approved 2 Oct 08:37) → 16:9 maze maps v3–v9 + shot boards v1–v9 + `shot-plan-v*`; **spatial-v9 approved 2 Oct 10:51** (stills-v6 path A>B>C>F>E>D). |
| Swaroop & Smiley (kc-v1 recreate) | `productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-003016/continuity/SPATIAL_*` | First Christian-church board, approved 3 Oct 00:41. |
| Theresa & Isaac | `.../kc-v1-recreate-20261003-071403/continuity/SPATIAL_*`, `scripts/draw_spatial_board_v1.py` | Bride/groom stands swapped vs Swaroop (bride at E sunlit arch S4, groom at D shaded aisle S5); empty pedestal, no floral cross on scene-02; visit A→B→C→E→D→F→G→H→I→J→K; approved 3 Oct 07:44. |
| kc-v1 board swap draft | `productions/kerala-christian-vtv-mood/spatial-drafts/kc-v1-board-swap-20261004/` | 4 Oct draft (uncertain whether used). |
| Mosque courtyard mc-v1 | `productions/spatial-drafts/muslim-courtyard-board-20261004/`, `productions/mosque-courtyard-v1/.../packets/ORCHESTRATOR_SPATIAL_APPROVED.json` | Board approved 4 Oct; stills only. |
| **Dubai church wedding** (open) | `productions/dubai-church-wedding/productions/luke-ridhineka-20261008-143619/continuity/` | v1 drafted 8 Oct 14:41, **awaiting Ashok**. One cream-stone Catholic compound in Dubai; palm forecourt with plinth cross → arched nave/south aisle → altar cross → cloister → SE courtyard → garden terrace (skyline) → floral-arch avenue → gateway + bell tower; every cross upright. |

## Files the bot itself has
`bot-personas/Spatial Continuity/assets/` and `attachments/` (images shared in its chat — boards and references).
