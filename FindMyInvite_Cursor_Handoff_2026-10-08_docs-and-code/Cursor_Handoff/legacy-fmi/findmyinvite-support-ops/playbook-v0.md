# FindMyInvite — Support Ops Playbook (v0 draft)

**Owner:** Support Ops  
**Audience:** Ashok / Co-founder / whoever handles host tickets  
**Product:** https://findmyinvite.com/  
**Status:** Draft for mark-up — do **not** invent or publish support contacts until confirmed  
**Based on:** Co-founder briefing + site dumps (16 Sep 2026 IST)

---

## 0. Operating rules

1. **Confirmed contacts only.** Until `/contact` is configured, do not tell customers an email, phone, or WhatsApp that is not explicitly approved.
2. **Never ask a host to paste a private management / recovery link into an unverified channel.** Site copy already warns against this.
3. Prefer **self-serve recovery** (`/dashboard`) before any manual restore.
4. Tone: warm, clear, practical; India-first (WhatsApp share is normal for guests; support channel TBD).
5. Launch window (site): free Classic + Royal creation **14 Sep – 14 Oct 2026, 11:59 PM IST** — no card; listed prices Classic ₹1,199 / Royal ₹1,499 after.

---

## 1. Contact / support channel readiness (BLOCKER)

| Item | Current state | Needed |
|---|---|---|
| Public Contact page | “Support contact details are awaiting configuration.” | Confirmed channel(s) + copy live on `/contact` |
| Legal / business identity | Terms: awaiting confirmation | Confirmed entity line (ops does not invent) |
| Intake path | None public | Where tickets land (email inbox, form, WhatsApp Business, etc.) |
| SLA / hours | Not published | Internal response target (even if unpublished) |
| Escalation | — | Who owns ops vs product vs billing when paid checkout goes live |

**Go-live checklist for Contact**
- [ ] Confirmed support address / number approved by Ashok
- [ ] `/contact` updated (no “awaiting configuration”)
- [ ] Footer / FAQ cross-check so they don’t contradict Contact
- [ ] Script: what hosts should **not** send (full recovery URLs in open WhatsApp groups, etc.)
- [ ] Backup owner if primary is offline

---

## 2. Playbook A — Lost recovery / dashboard restore

**Symptoms:** Host can’t edit invite or see RSVPs on a new phone/browser; “My Invitations” empty; lost private management link.

**Product facts (public):**
- v1 is **guest access** — no traditional account wall; `/login` / `/signup` behave like dashboard restore.
- Private access keys remembered **on this device**.
- Restore on another device: paste **private recovery link** on `/dashboard` → “Restore invitation”.
- Local drafts stay on device until publish.

**Agent steps**
1. Confirm they mean the **private management / recovery** link (not the public guest URL `findmyinvite.com/{slug}`).
2. Guide: open https://findmyinvite.com/dashboard → paste recovery link → Restore.
3. If they only have the **public guest link**: explain it cannot manage the invite; ask whether they saved recovery at publish, email to self, notes, or another device that still shows the invite under My Invitations.
4. If still stuck: **hold** for manual restore — do not invent a support inbox; escalate to Ashok with slug + approximate publish time + what they still have (no recovery URL in chat unless on a confirmed private channel).

**Reply skeleton (self-serve)**  
> Your guest link is for sharing. To edit or see RSVPs, open My Invitations and restore with the private recovery link you got when you published. If that link is on another phone, open FindMyInvite there under My Invitations first.

**Open product/ops questions**
- [ ] Can ops restore by slug/email from admin (`/akay`) without the recovery link?
- [ ] What proof do we need before a manual restore?

---

## 3. Playbook B — RSVP & guest messages

**Symptoms:** Host doesn’t see RSVPs; guest can’t submit; messages missing; “latest 1,000 shown” confusion.

**Product facts (public):**
- Guests RSVP + message on the public invitation page.
- Host views via private management link / dashboard.
- FAQ: latest **1,000** RSVPs shown; earlier retained — contact support for export (Contact not ready → flag as gap).

**Agent steps**
1. Confirm host is on **manage** view (recovery restored), not only the public page.
2. Ask guest to hard-refresh / try another browser; check they’re on the correct slug.
3. Confirm invitation still published (not deleted).
4. Export / >1,000 history: note Contact gap; escalate internally — don’t promise an unverified email.

**Reply skeleton**  
> RSVPs show on your private management view after you restore access on My Invitations. Guests use the public link only. If you’re restored and still see none, tell us the public link slug and roughly when guests replied (we’ll check from our side).

---

## 4. Playbook C — Publish / share friction

**Symptoms:** Publish fails; slug taken; draft only on one device; WhatsApp share “broken”; photos rejected.

**Product facts (public):**
- Drafts = local until publish; publish → public guest link + private management link.
- Slug: 3–48 chars, lowercase letters/numbers/hyphens; availability checked.
- Photos: up to **4**, max **1 MB** each.
- Share: copy link / WhatsApp / email (any platform).

**Agent steps**
1. **Slug error:** suggest alternate slug (shorter, hyphenated names + year).
2. **Photo fail:** resize under 1 MB; max 4 images.
3. **Draft missing on new device:** expected — drafts don’t sync; recreate or publish from original device.
4. **Share:** confirm they’re sending the **public** URL, not the recovery link; recovery must stay private.
5. **After publish:** remind them to save / download recovery link immediately.

**Reply skeleton**  
> After Publish you’ll get two links: the public one for guests (safe to WhatsApp), and a private recovery link — keep that offline or in a password manager. Drafts stay on the phone/browser where you wrote them until you publish.

---

## 5. FAQ starters (customer-facing, Contact TBD)

| Q | A (draft) |
|---|---|
| Do I need an account? | No for v1 — keep your private recovery link safe. |
| I lost my recovery link | Try My Invitations on any device that still has access; otherwise we need a confirmed support path before we can help restore. |
| Classic vs Royal | Classic ₹1,199 animated; Royal ₹1,499 adds cinematic opening. Launch: both free in the published window. |
| Physical cards? | No — digital invitation webpages only. |
| How do guests RSVP? | Open your public invitation link; submit RSVP / message there. |
| Where do I contact you? | **Blocked until Contact is configured.** |

---

## 6. Internal ops checklist (weekly during launch)

- [ ] Spot-check `/contact` still accurate
- [ ] Spot-check publish + restore on one Classic + one Royal demo path
- [ ] Note top ticket themes (recovery / RSVP / share / other)
- [ ] Flag any FAQ contradiction with live site
- [ ] Sync with Co-founder on Contact / legal confirmation status

---

## 7. Needs from Ashok (fill in)

| Field | Value |
|---|---|
| Confirmed support channel | _TBD — do not invent_ |
| Manual restore possible? (admin) | _TBD_ |
| Preferred first reply channel for hosts | _TBD_ |
| Who owns Contact page update | _TBD_ |
| Operations channel for Support Ops ↔ Co-founder | _TBD_ |

---

*v0 — Support Ops. Mark up freely; replace TBD before any customer-facing send.*
