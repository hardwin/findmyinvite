# URLs used by FindMyInvite work (from files in this zip)

## Product / site
- Site: https://findmyinvite.com (also https://www.findmyinvite.com) — pages: /templates, /create, /dashboard, /login, /about, /blog, /contact, /grand-launch, /privacy-policy, /refund-policy, /shipping-policy, /terms, /invite/demo, /robots.txt, /sitemap.xml
- Operator/admin: https://findmyinvite.com/akay (shortlist: https://findmyinvite.com/akay/shortlist), Assembly UI: https://findmyinvite.com/assembly
- Site API seen: https://findmyinvite.com/api/invitations (config dump in `legacy-fmi/fmi-research/api-config.json`)
- Site music asset example: https://findmyinvite.com/assets/royal-heritage-9-music.mp3
- Vercel: https://findmyinvite.vercel.app ; preview example https://findmyinvite-git-cursor-assemble-kaatr-3b527a-hardwins-projects.vercel.app/invite/demo
- Supabase project (site backend, from scraped site bundle): https://qqvcptjkfcjkwbkookcm.supabase.co (no Supabase key was found on the box; Grok Bot used it through its Supabase connector)

## Code
- GitHub repo: https://github.com/hardwin/findmyinvite (default branch `main`) — PRs/commits in `repo-status/repo-status.md`
- Open PRs: https://github.com/hardwin/findmyinvite/pull/40 , https://github.com/hardwin/findmyinvite/pull/32 (+ drafts #27 #25 #24 #20 #19, open #7)

## Generation APIs (video pipeline)
- Replicate (stills, model `openai/gpt-image-2.5-flare`):
  - create: `POST https://api.replicate.com/v1/models/openai/gpt-image-2.5-flare/predictions` (header `Prefer: wait=60`)
  - poll: `GET https://api.replicate.com/v1/predictions/{id}`
  - files: `https://api.replicate.com/v1/files` ; billing page: https://replicate.com/account/billing
  - outputs are served from `https://replicate.delivery/xezq/...` (temporary; every output URL is recorded in `logs/image/*.status.json`)
- xAI (clips, model `grok-imagine-video-1.5`), base `https://api.x.ai/v1`:
  - `POST /v1/files` (purpose=image_input), `POST /v1/videos/generations`, `GET /v1/videos/{request_id}`
  - outputs served from `https://vidgen.x.ai/xai-vidgen-bucket/xai-video-<uuid>.mp4` (temporary; recorded per clip in `logs/video/VID-clip-NN.status.json` → `video_url`)
- Telegram Bot API (delivery to Ashok): `https://api.telegram.org/bot<TELEGRAM_EVENTSBLR_BOT_TOKEN>/sendMediaGroup | sendPhoto | sendVideo | sendDocument`, chat_id `2002649357`

## Storage
- No cloud bucket is used by the video pipeline: all assets live on disk under `/workspace/fmi-productions/` (= `productions/` in this zip). Replicate/xAI delivery URLs expire.
