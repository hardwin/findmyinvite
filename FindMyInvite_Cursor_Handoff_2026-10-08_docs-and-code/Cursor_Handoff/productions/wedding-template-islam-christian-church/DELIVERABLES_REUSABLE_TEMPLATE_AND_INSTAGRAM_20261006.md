# Reusable template + Instagram cut (2026-10-06 ~18:30 IST)
- Wedding_Template_Islam_Christian_v1.json sha c46e39803346c03eac30bfff20783945b45dca58686d95595a2ade9be8c1aac9 (built by build_reusable_template_v1.py from template.json 075f842e...). 53 parameters; 23/23 prompts round-trip byte for byte.
- CLIENT_FIELDS_BLANK.txt sha 4ce57db0c84023328aef3a0a4eb46bcefe0e3c430dc52c65c665552bf1c088f7 (previous one kept as CLIENT_FIELDS_BLANK.before-reusable-v1-20261006.txt).
- Promo (Instagram only): productions/icc-v1-20261005-234500/assets/output/promo/ (promo-text.jpg ff390e8b..., promo-blank.jpg fe37034d... unused fallback, clip-12-promo.mp4 480398a5..., scripts generate_icc_v1_promo_still.py / generate_icc_v1_promo_clip.py)
- Instagram cut: assets/output/Anusha-Rishad-Islam-Christian-Instagram-1080x1920.mp4 sha a1e0e5f04c1e3c66b3c58a1fc808b63b2defe8babcbce8a69cc61bfad27a5e38, 802 frames, 33.417 s, 44.55 MB. Built by /workspace/icc_work/insta/build_insta.py.
- Telegram 2002649357: 848 JSON, 849 fields txt, 850 mp4 document, 851 mp4 video.

## Update ~18:45 IST
- Template example values -> fictional sample couple (fix_template_sample_values_20261006.py, text-only). New sha ba1205f0805985299418db9bf6e301c92cae30cfc967947cd8eb94bb5e520021; backup Wedding_Template_Islam_Christian_v1.before-sample-values-20261006.json (c46e3980...). CLIENT_FIELDS_BLANK.txt e1c325c7... (backup CLIENT_FIELDS_BLANK.before-sample-values-20261006.txt). Telegram 852, 853.
- Instagram v2 (no couple, no board at the end): promo/promo-bg.jpg 7d0d2074..., promo/clip-12-promo-v2.mp4 31b2b13d... (xAI 9d649782-6649-950e-975b-3766520d79cb), PIL text overlay promo/textfx.py + build_insta_v2.py. Output sha b4754a7d373f9a57e353f2014c40db50fbaa49706fad52cdab79c1dc667df0d0, 822 frames, 34.25 s, 45.7 MB. v1 archived in promo/archive-instagram-v1-board-20261006/. Telegram 854 (document), 855 (video).

## Update ~18:55 IST — sample couple Hamza & Angel
- update_sample_hamza_angel_20261006.py: groom Hamza, bride Angel, initials H&A (other values kept). JSON sha ca81cc40ea207a2c08bded1fb9e6fe52d9037cffae3d4cb99a8af858510a3cfc (backup Wedding_Template_Islam_Christian_v1.before-hamza-angel-20261006.json = ba1205f0...). CLIENT_FIELDS_BLANK.txt 49a530ea... (backup CLIENT_FIELDS_BLANK.before-hamza-angel-20261006.txt). Telegram 856, 857.
- Showcase stills: productions/icc-v1-showcase-hamza-angel-20261006-185341/ — BLOCKED, Replicate 402 Insufficient credit on scene 1. Resume with scripts/run_all.sh.
- ~19:25 IST: credit restored; 13 showcase stills generated (13 paid predictions, 0 retries, all lettering correct). assets/output/image-1..12.jpg + image-13-promo.jpg. Telegram albums 858–867, 868–870.
- ~19:40 IST: showcase video — 12 clips (grok-imagine-video-1.5, 12 paid generations, 0 retries; clip-12 = promo image-12 -> image-13-promo). Speed-ramped cut assets/output/FindMyInvite-Islam-Christian-Showcase-Instagram-1080x1920.mp4 sha 219249e3247a9e9dd9c1db9ecea31e47cff50e77b09bb1790b0558bcef53fc50, 802 frames, 33.417 s, 45.45 MB (crf20). Telegram 871 (video), 872 (document).
