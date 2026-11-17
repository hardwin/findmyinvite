# Wedding Bells full-film tracking release — 17 November 2026

The owner approved the complete comparison and requested production publication. This release applies that motion to all nine scenes: six board planes and three rigid floating titles. It retains the red invitation-board calibration, original character footage, original font assets, typography/material settings, lighting and soundtrack. Prices and form questions are unchanged.

## Version and delivery binding

- Public catalog: Wedding Bells, FMI#0109, `wedding-bells-v1`, master version 2. Catalog preview and 320/640/960 posters use new immutable filenames.
- `manifest-v1.json` preserves the previous production master. Unversioned saved drafts resolve to version 1. New editor drafts explicitly bind version 2; the server rejects attempts to change a saved binding.
- Unversioned config requests retain version 1 for older cached browser bundles. Updated editors explicitly request their saved or current version. Export jobs carry that master through to the worker and include it in their private cache identity.
- The updated worker contains both versions. The cloud export of version 1 is byte-identical to the previous production proof: SHA-256 `b90ef2e756ca7e09536479645195362d1dab410f59bea7e0ececf4438498c839`.
- Public catalog posters and preview are generated from the qualified version-2 default cloud export, not from the earlier local comparison.

## Verification

The reference and personalised four-vCPU Linux exports each contain 832 frames at 720×1280 and 30 fps. They completed in 116.682 and 117.725 seconds respectively. Every original AAC packet, timestamp and duration matches (600 packets). All nine scene holds from both exports were visually inspected. Machine-readable asset, worker and export evidence is in `wedding-bells-tracking-release.json`.

The trial's new motion tracks and visibility movie were retained exactly. The release uses the production UTF-8 reference strings: the trial copy had four apostrophes misdecoded during a prior file conversion. Deep equality now confirms that removing `motionTracks` yields the original production surfaces, including every style and content value. No customer wording was changed.

Local browser checks cover dynamic names, saved-draft reload, full playback with unmuted original sound, and the expanded mobile preview at 390×844. A playback-end regression was found and corrected: a native decoder can settle at frame 831 without advancing to frame 832. The editor now stops at the final displayable frame, keeping sound from continuing beyond the visual endpoint. The export timeline is unchanged.

The production build and 135 targeted video/draft regression checks passed. The payment HTTP test required a rerun with localhost access because the execution sandbox denied its loopback connection. Physical iPhone Safari and Instagram are not verified. Original characters remain fixed; this release adds no character generation.

## Rollback

Previous production commit: `0f65bb48d0417d14a205c7bb78fe7d17a80cbeb1`. Previous worker: `snap_KGDyxEbWzxKbCRe5OizmnsD9nb3d`. Version 1's previous poster and preview references remain in `manifest-v1.json` and all old files are retained.

After customers create version-2 drafts, retain the two-version loader and qualified worker even if the catalog is rolled back. Repoint the current catalog manifest and current-new-draft version to 1 together; keep `manifest-v2.json`, its assets and existing saved version bindings. Reverting the entire renderer or worker would strand version-2 drafts.
