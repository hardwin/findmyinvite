#!/usr/bin/env python3
"""Instagram promo clip (NOT part of the template): image-12 -> promo/promo-text.jpg, grok-imagine-video-1.5, 5 s, 9:16 720p. 403/402 -> STOP."""
import sys, json, hashlib
from pathlib import Path
sys.path.insert(0, "/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500/scripts")
import run_icc_v1_video_chain as V
OUT = V.OUT; FIRST = OUT/"image-12.jpg"; LAST = OUT/"promo/promo-text.jpg"; DEST = OUT/"promo/clip-12-promo.mp4"
LINES = "'Get your customised' / 'dreamy AI video Invitation' / 'at affordable price' / 'with findmyinvite.ai' / '\"FindMyInvite\"' preceded by 'DM us or Comment'"
PROMPT = "\n\n".join([
 "PROMO END CARD: EXACTLY ONE BRIDE, ONE GROOM AND ONE BOARD, the same two people and the same board from first frame to last. Never a second pair, a duplicate couple or a duplicate board.",
 "Portrait 9:16 Pixar-style 3D animated feature-film look in the same dual-faith floral candlelit sunset wedding world. Use the supplied first and last images as anchors; preserve characters, lighting, materials and the exact final lettering. Fixed scenery stays rigid with real parallax. No church, bell tower, mosque or other building appears anywhere: only sunset sky, palms, drapes, florals, lanterns and candles.",
 "CAMERA: ONE continuous smooth single shot with a gentle speed-ramp feel: 0.00-0.80s barely moving; 0.80-2.60s a smooth graceful push-in forward up the petal-strewn pathway toward the couple and the board; 2.60-5.00s ease into a slow-motion settle on the final framing of the last image, never fully stopping. No cuts, crossfades, whip, pan or frozen frames.",
 "ACTION: the couple stay turned toward each other, holding hands and gazing lovingly, breathing softly; feet planted, the bouquet cradled in their joined hands.",
 "BOARD TEXT: the gold crescent-moon-with-cross emblem at the top of the board stays fixed and gives one soft gold shimmer. 0.60-1.60s: the old lettering on the board's cream panel dissolves softly into fine champagne-gold glitter dust that drifts away, leaving the panel clean. From 1.80s the new lettering reveals line by line in reading order, CHARACTER BY CHARACTER, each character floating softly into its exact place with a subtle champagne-gold glitter, then settling crisp; the small gold heart and thin rules draw in between the two groups. The final lettering reads exactly: 'Get your customised' / 'dreamy AI video Invitation' / 'at affordable price' / 'with findmyinvite.ai' / heart and rules / 'DM us or Comment' / '\"FindMyInvite\"'. All text sharp and readable by 4.20s and held to the end. Final lettering exactly matches the last image: never change, add, drop, scramble or morph any letter; glitter never covers letters.",
 "SLOW-MOTION WIND: the bride's sheer veil, lace train and curly hair, the groom's hair and jacket edges, and the roses, hanging florals and cream drapes move gently in slow motion.",
 "PETALS: slow-motion white, pale-pink and cream rose petals drift continuously from first frame to last, never a burst or synchronized shower: 12-20 separate petals in near, middle and far layers, each fluttering with its own phase. Soft out-of-focus near-lens petal orbs (bokeh) and backlit backscatter petals glow in the sunset at several depths, all drifting in slow motion.",
 "Never invent any object absent from both anchors. No crossfade, no new people, no extra signs or words. End on the readable board with live subtle motion."])
assert len(PROMPT) < 3900
fid = V.upload_file(FIRST); lid = V.upload_file(LAST)
code, data = V.submit_video(PROMPT, 5, fid, lid); print("submit", code, json.dumps(data)[:300], flush=True)
if code in (402, 403): print("STOP billing"); sys.exit(3)
if code >= 400: sys.exit(1)
rid = data.get("request_id"); res = V.poll_video(rid)
if res.get("status") != "done": print("FAIL", res); sys.exit(1)
V.download(V.video_url(res), DEST); sha = V.sha256_file(DEST); tech = V.probe_video(DEST)
st = {"clip": "promo clip-12 (Instagram only)", "request_id": rid, "model": V.MODEL, "first_frame": str(FIRST), "last_frame": str(LAST), "duration_seconds": 5,
      "prompt": PROMPT, "prompt_len": len(PROMPT), "sha256": sha, "technical_probe": tech, "usage": res.get("usage"), "updated_at": V.now_ist()}
(OUT/"promo/clip-12-promo.status.json").write_text(json.dumps(st, indent=2) + "\n"); print("RESULT", json.dumps({"sha256": sha, "probe": tech, "request_id": rid}))
