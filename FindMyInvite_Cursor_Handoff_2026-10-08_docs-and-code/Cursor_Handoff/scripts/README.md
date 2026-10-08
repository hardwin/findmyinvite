# scripts/ — canonical working scripts (copies)
- `kc-v1-recreate/` — from `kc-v1-recreate-20261007-181228-akhil-sarah/scripts/` (latest, pure-template flow): `build_client_fill.py`, `generate_stills.py`, `edit_still.py`, `recover_prediction.py`, `build_video_prompts.py`, `run_video_chain.py`, `build_speedramp.py` (720×1280), `build_speedramp_1080.py` (Benjamin's 1080×1920 copy), `send_telegram.py`, `send_speedramp_telegram.py`, plus `send_final_telegram.py` (Rahul & Mounika, normal-cut 1080 delivery) and `edit_clips_aisle.py` (Benjamin).
- `icc-showcase/` — Islam-Christian showcase `build_speedramp.py` (12-clip variant) and its other scripts.
- `speedramp-prototype/` — original `plan.py` + `fc.txt` (ffmpeg select/tpad filtergraph; superseded).
- `kc-v1-template/build_template.py` — generator of the Kerala Christian v1 template.
Paths inside scripts are absolute (`/workspace/fmi-productions/...`, `/home/box/shared/secrets/...`): see README_FOR_CURSOR.md §4. Keys come from env vars (`secrets/.env`).
