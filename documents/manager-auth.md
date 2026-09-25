# Photographer Co-Pilot — manager auth

FindMyInvite `/manager` is the Event Planners & Photographers desk (formerly `/assembly`). Product story: Chat → Single Image → Website. Platform generation credit: **₹999** per invite build; photographers keep private templates and set their own client prices.

## Routes

| Path | Purpose |
|------|---------|
| `/manager/login` | Email + password sign-in / create account / forgot password |
| `/manager` | Co-Pilot chat (after session) |
| `/manager/pipeline` | Kanban for cloud Template 1 jobs |
| `/assembly` | Permanent redirect → `/manager` |

`/akay` stays the private operator desk (access code). Unlinked from public nav.

## Auth model (Supabase)

1. **Sign-in / sign-up** — `POST /api/auth?action=signin|signup` with email + password (8–72 chars).
2. **Remember me** (default on) — access + refresh tokens in `localStorage` (`findmyinvite-auth-v1`). Unchecked → `sessionStorage` only (clears when the tab closes).
3. **Silent re-entry** — `managerFetch` attaches `Authorization: Bearer <access_token>` and refreshes via `action=refresh` on 401.
4. **Forgot password** — `POST /api/auth?action=recover` calls GoTrue `/recover`. Always returns 200 (no email enumeration). Requires working Auth SMTP.
5. **Email confirm (optional)** — set `MANAGER_EMAIL_CONFIRM=1` (and/or `AUTH_SMTP_READY=1`) so signup uses public `/auth/v1/signup` + confirm mail instead of admin auto-confirm.

Akay cookie (`fmi_akay`) still unlocks assembly APIs for operators (`requireManager` accepts either cookie or bearer).

## Hostinger mailbox + Supabase SMTP

Auth emails (confirm, reset, magic link) are sent by **Supabase Auth**, not by our Vercel functions. Configure custom SMTP in Supabase Dashboard → Authentication → SMTP:

| Field | Typical Hostinger value |
|-------|-------------------------|
| Host | `smtp.hostinger.com` (no leading space) |
| Port | **587** (STARTTLS) — prefer over 465 |
| User | full mailbox, e.g. `noreply@findmyinvite.com` |
| Pass | mailbox password |
| Sender | same address / brand name “FindMyInvite” |

Also set Auth URL allow-list redirect: `https://findmyinvite.com/manager/login`.

### Best-practice notes (2025–2026)

- Supabase built-in mail is ~2 emails/hour — unusable for production photographers; custom SMTP is required.
- Hostinger SMTP has **known intermittent failures** with Supabase Auth (DNS / dial errors → `500 Error sending confirmation email`). If Hostinger fails after correct credentials + SPF/DKIM, switch to a transactional provider on the free tier (**Resend**, **Brevo**) and keep Hostinger only for human inbox — do not reinvent mail in our API.
- Enable SPF, DKIM, DMARC for the domain; use a dedicated `noreply@` mailbox.
- Keep rate limits on `/api/auth` (signup/signin/recover).
- Do **not** disable email confirmation under bot pressure; prefer CAPTCHA later if needed.
- Payment gateway for ₹999 stays Launch 2.0 locked until Ashok opens item 11 — UI copy only for now.

## Env

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=          # needed for public signup + recover when confirm is on
MANAGER_EMAIL_CONFIRM=0     # set 1 once SMTP delivers reliably
AUTH_SMTP_READY=0           # optional alias that also enables confirm path
SITE_ORIGIN=https://findmyinvite.com
```

## Credits stub

Login and Co-Pilot chrome mention ₹999 generation credits (Higgsfield-style platform fee). Ledger + checkout ship with Launch 2.0 payment items — not in this slice.
