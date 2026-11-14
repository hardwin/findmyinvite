# Video playback and download follow-up — 15 November 2026

The catalog now starts media playback synchronously inside the customer's click, rather than from a later loaded-data callback. All 39 released designs have separate 360×640, H.264 constrained-baseline, fast-start catalog files. Original masters, full render quality, content, prices and purchased render bindings remain unchanged.

Render creation acknowledges the persisted job before cloud sandbox startup. Startup failure settles that same job; status polling permits only one outstanding request. Downloads use a fifteen-minute, GET-only signed URL restricted to the authorized result. Customer authentication is never forwarded to storage. One-MiB ranges, two concurrent transfers, idle rather than total-transfer timeouts, and final SHA-256 verification handle slow delivery without accepting incomplete files. The authenticated proxy remains available for existing clients and private editor media.

The local server had stale imported API handlers and a retired catalog-release registry. It was restarted from the current worktree and the retired local registry was moved out of the active path. Development enables the released video catalog unless explicitly disabled, and refuses an occupied port rather than silently moving away from 5173.

Verification: build and 78 targeted tests pass; all 39 catalog videos play/stop in official Chrome for Testing 157. Every play call retains user activation. No video is requested before Play. Cold 390-pixel playback at 1.6 Mbps/150 ms latency started in 1,182 ms. A 65-MiB cross-origin private browser download matched its SHA-256; unsigned access was denied and the temporary object was removed. Direct-storage CORS does not expose Content-Range, so authenticated size metadata is used with whole-file digest verification.

Installed Edge exits during automated launch. Windows Computer Use stopped because it could not establish the browser URL; no further UI actions were attempted. Native Edge and physical iPhone/Instagram verification are therefore not claimed. Evidence is retained under `work/video-catalog/`.
