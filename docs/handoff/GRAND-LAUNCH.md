# Grand-launch ceremony · recording guide

**Now live:** https://findmyinvite.vercel.app/grand-launch — public production, no Vercel sign-in required. Homepage: https://findmyinvite.vercel.app/. Use these until custom-domain DNS is connected. See [production update and verification](PRODUCTION-UPDATE.md).

**Hosted rehearsal:** [Open the grand-launch preview](https://findmyinvite-5umqoipue-hardwins-projects.vercel.app/grand-launch). Vercel reports READY for code commit `d65ae855137cf63e98e81dfcb35818578783e7c4`. This is a preview deployment; Vercel sign-in may be required. [GitHub verify/deploy run](https://github.com/hardwin/findmyinvite/actions/runs/34862816209). Verify phone access before leaving the laptop.

Open **`/grand-launch`** on the newest preview deployment to rehearse. Once the approved v1.0 release is live, open **`https://findmyinvite.com/grand-launch`**. The older production candidate does not include this route until redeployed. Use latest `main`, which contains this addition after the frozen `v0.9.0` handoff tag.

## Three chapters

1. **The invitation:** emerald and gold doors, animated FindMyInvite.com wordmark, embossed FMI seal. Tap the seal to open the Three.js doors. Original background music starts with the gesture when the browser permits it.
2. **The golden moment:** scratch the gold foil with a finger or mouse. After about 38% is cleared, the rest fades, gold confetti bursts and the card reveals **“LAUNCHED AT · 11:59 PM · 14 SEPTEMBER 2026 · IST”**. A keyboard/tap alternative is available. Press **Let the celebration begin** when ready for the next shot.
3. **The celebration:** the brand fills the center, another confetti burst, the launch date, **Home** to the real storefront, and **Experience a full invitation** to the existing Emerald Noir demo.

**This is a ceremonial presentation with the founder's fixed announced date.** The animation does not invoke CI, change the offer window, publish templates, verify operational readiness or process payments. Record the public “launched” reveal after the actual production release is verified. Rehearsal before then is a preview of the ceremony, not evidence of a live product.

## Record from the phone

**Recording window:** unlimited replays until **15 September 2026 at 03:00 AM IST** (`2026-09-14T21:30:00Z`), end exclusive. There is no completion lock, usage counter, or saved one-time flag. After that time the separate ceremony route shows a premiere-ended message and Home button; the storefront stays at `/` and is unaffected. This presentation cutoff uses the device clock and is not a backend publication gate.

- Open the production ceremony only after following the release runbook. Verify the URL and fresh deployment first.
- Use portrait orientation for social stories/reels. Close notifications and start the phone's screen recorder; test whether it captures browser audio on that device. Browser/audio capture policies vary, so do one short rehearsal.
- Keep the first screen visible briefly, tap the seal, then scratch in broad strokes across the gold. Pause on the revealed date to capture confetti. Continue to the finale, pause on the brand, and press **Home** to show the product.
- The sound button sits at top right. **Replay the magic** resets the three chapters without reloading or altering data. Refresh also starts from chapter one during the recording window. The ceremony does not remember completion, so every take is repeatable until the 3 AM cutoff.
- For a longer demo, use **Experience a full invitation** and its opening, scratch, calendar, slideshow and RSVP controls. This is the pre-existing demo/local flow; do not describe a demo RSVP as live cloud publication.

## Implementation / handoff

`src/GrandLaunch.tsx` and `src/grand-launch.css` are loaded only on the ceremony route. They reuse the existing Emerald Noir Three.js scene, `/assets/emerald-hero.jpg`, original fonts and `/assets/track1.mp3`. Foil, glitter and confetti are coded canvas/CSS effects; no new image/video assets were generated. The new slug `grand-launch` is reserved server-side and covered by the existing reserved-route test. Existing invitation formats and routes remain intact.

Verified locally at **390 × 844** and **1440 × 900**: all three stages, real scratch strokes, tap alternative, foil removal, replay, no horizontal overflow, controls in view and no browser runtime errors. Reduced-motion flow and Home navigation passed. The production build and 13 server tests passed. See [browser evidence](evidence/grand-launch-checks.json). Music controls are implemented, but recording internal audio still needs a short check on the actual phone.

The shared [release gates](RELEASE-RUNBOOK.md), original asset-rights gap, DNS and catalog readiness still apply. Preview-only deployment is appropriate for rehearsal; it must not bypass the final production decision.
