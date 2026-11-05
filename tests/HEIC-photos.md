# HEIC photo regression checks

Run `node --test tests/server-template-image.mjs tests/server-template-forms.mjs tests/server-template-cms.mjs` and `npm run build`.

Run the dev server, open `/tests/browser-template-heic.html`, and choose a real HEIC file. The page verifies automatic decoding and resizing with native APIs, with both native HEIC decoding and WebP encoding unavailable, and with missing/generic MIME and no filename extension. It checks the resulting signature, MIME, size and dimensions and displays the converted image. No files are uploaded.

Public upstream fixtures used for manual verification (download locally; do not deploy the original photos):

- https://raw.githubusercontent.com/MikeKovarik/exifr/master/test/fixtures/heic-iphone.heic
- https://raw.githubusercontent.com/MikeKovarik/exifr/master/test/fixtures/heic-iphone7.heic
- https://raw.githubusercontent.com/strukturag/libheif/master/examples/example.heic

Also select the original HEIC through the actual invitation form, verify the preview and Continue button, and repeat on the production build after deployment. A simulated unsupported browser does not replace a physical iPhone/Instagram check: verify the Photos picker, orientation, progress, successful preview, and Continue inside Instagram's in-app browser when that device is available.

The decoder is `heic-to/csp` 1.6.7, loaded only after native decoding fails for an HEIC/HEIF photo. Its code and worker run on the same device. Server upload signature checks and the 1 MB output limit remain enforced. The original source limit is 50 MB; decoded output is resized to at most 1800 pixels on its longest edge. Converted photos do not retain the original EXIF metadata.
