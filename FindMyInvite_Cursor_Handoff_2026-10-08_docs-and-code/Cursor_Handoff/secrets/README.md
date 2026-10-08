# secrets/ — LIVE credentials (keep private; rotate if this zip is ever shared)

`secrets/.env` holds live values (KEY=value). Load with `set -a; source secrets/.env; set +a`.

| Key | Service | Used by |
|---|---|---|
| `REPLICATE_API_TOKEN` | Replicate — still generation with `openai/gpt-image-2.5-flare` (also image edits) | every `generate_stills.py`, `edit_still.py`, `recover_prediction.py`, `generate_kc_*.py`, `run_fmi_image.py`; templates' `models.image.credentials_env` |
| `XAI_API_KEY` | xAI — video generation with `grok-imagine-video-1.5` | every `run_video_chain.py` / `run_recreate_video_chain.py` / clip regen scripts; templates' `models.video.credentials_env` |
| `OPENAI_API_KEY` | OpenAI — "prompt writer" in the older FindMyInvite Assembly lane | referenced in `legacy-fmi/assembly-publish.md`; not used by the current video scripts (included because it was in the box environment) |
| `TELEGRAM_EVENTSBLR_BOT_TOKEN` | Telegram bot "Eventsblr" — sends stills/videos to Ashok | all `send_*telegram*.py` scripts, which read it from `/home/box/shared/secrets/telegram-eventsblr.token` (original file copy: `secrets/original-files/home/box/shared/secrets/telegram-eventsblr.token`) |
| `TELEGRAM_CHAT_ID` | Ashok's Telegram chat (not secret) | hard-coded `2002649357` in send scripts |

Where they came from: `REPLICATE_API_TOKEN`, `XAI_API_KEY`, `OPENAI_API_KEY` were injected into the Grok Bot box environment (no `.env` file existed); the Telegram token is the file above. No secret value is hard-coded in any script, log or JSON in this zip (scan result in `MANIFEST.md`).

Not included: Grok Bot platform files (`box-secrets.json`, `host-secrets.json`, gateway/webhook keys, browser profile/cookies, `store.db`) — they are not FMI pipeline keys. GitHub, Supabase, Vercel access was through Grok Bot connectors; no tokens for them exist on the box.
