# Deferred stabilization — thumbnail previews

Saved September 18, 2026. The owner explicitly authorized launching the existing previews now and deferring stabilization until credits are available. This supersedes the release hold below, but does not mark its checks as passed.

Known outstanding checks: browser working set grew from approximately 723 MB at 120 seconds to 852 MB at 300 seconds in the corrected stress run; synthetic LCP, CLS and interaction targets were missed; physical iPhone Safari and Android Chrome checks remain pending. Build and automated catalogue interaction checks passed. See `CATALOGUE-MOTION.md` and `catalogue-verification/` for measurements. Roll back to posters with `VITE_CATALOGUE_MOTION=false` and redeploy if the live check reveals a functional failure.

The previous stabilization plan is preserved verbatim below.

---

# Stabilize animated previews before release

## 1. Diagnose memory growth

- Compare posters-only and animated versions under identical, isolated conditions.
- Measure renderer, GPU and browser-process memory separately during five minutes of scrolling, then after catalogue cleanup.
- Check source attachment churn, decoder retention and event cleanup. Stable JavaScript heap alone is insufficient evidence.
- Keep the agreed four-mobile/six-desktop playback limits and two prepared slots.

## 2. Reduce unnecessary work

- Use Intersection Observer to maintain a nearby-card shortlist instead of measuring every loaded card on every scroll frame.
- Make unchanged player states no-ops; avoid repeated cleanup, state notifications and source reloads.
- Preserve immediate offscreen pausing, distant unloading and remembered playback position.

## 3. Fix measured page-performance problems

- Capture a performance trace to identify the actual sources of layout shift, slow largest-content rendering and delayed clicks.
- Reserve space for loading catalogue content and correct any confirmed font/image sizing shifts.
- Prioritize visible posters and defer nearby video preparation until the initial catalogue layout is rendered.
- Keep template links, editing choices and original invitation media unchanged.

## 4. Verify and release

- Repeat three isolated cold-cache runs at both agreed viewport sizes using the same network/CPU profile. Report individual results and medians.
- Require the agreed LCP, CLS and interaction targets, plus stable memory across repeated scroll cycles and cleanup.
- Recheck playback limits, resume, failures, background tabs and Form/Editor selection.
- Complete actual Android Chrome and iPhone Safari checks; desktop emulation does not replace these.
- Merge PR #17 and deploy only after the gates pass. Retain the build-time poster-only rollback flag.

## Defaults and boundaries

No new APIs, database changes, replacement recordings or catalogue redesign. If memory still grows, keep production unchanged and report the isolated cause and proposed remedy rather than weakening the release criteria.
