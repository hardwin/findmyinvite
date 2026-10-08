#!/usr/bin/env python3
"""Instagram promo end card (NOT part of the template): text-only stills (input_images: []), Replicate openai/gpt-image-2.5-flare.
Variant 'text' = board carries the promo copy; variant 'blank' = same card with a blank panel (fallback for a clean PIL overlay).
402/403/credit -> STOP; 429 -> spaced retry."""
import json, hashlib, os, subprocess, sys, time
from datetime import datetime
from pathlib import Path
import requests
R = Path("/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500")
OUT = R/"assets/output/promo"; OUT.mkdir(exist_ok=True)
MODEL = "openai/gpt-image-2.5-flare"; TOK = os.environ["REPLICATE_API_TOKEN"]
now = lambda: datetime.now().astimezone().isoformat(); fsha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
T = json.loads((R/"template.json").read_text()); s12 = [s for s in T["scenes"] if s["index"] == 12][0]["image_prompt"]
BASE = s12[: s12.index("SCENE COMPOSITION:")]
COMMON = ("SCENE COMPOSITION:\nPromotional end card continuing directly from the wide pathway finale, in the same place and the same sunset light, the camera a few steps closer down the same petal-strewn pathway: "
 "the long, softly reflective cream pathway strewn with pink, white and cream rose petals leads from the bottom edge of the frame toward the couple and the board, lined on both sides with glowing candles in brass Moroccan pierced lanterns and gold-and-glass lanterns and low pink-and-white rose arrangements, with cream drapes and hanging wisteria-like florals framing the top corners. "
 "Left of centre, the same groom and bride stand turned toward each other, gazing into each other's eyes and holding hands, her blush-pink and white rose bouquet cradled in their joined hands; groom on the left, bride on the right, full-length, about two fifths of the frame height, with the same tall elegant adult proportions as the earlier scenes: not short, not chibi, not stocky, not dwarf-like; the groom clearly taller than the bride. "
 "Immediately to their right, slightly larger in frame than the couple, stands the same tall cream-ivory-and-champagne-gold Islamic board designed as a pointed ogival arch with interlocking geometric star medallions, mashrabiya lattice accents and arabesque filigree, framed by pink and white roses and hanging wisteria-like florals, brass Moroccan pierced lanterns at its base, with a wide, flat, smooth cream central panel facing the camera squarely. At the top of the board, above the panel: the gold crescent-moon-with-cross emblem flanked by small stars. ")
TEXT = ("On the panel, in crisp champagne-gold serif lettering with fine beveled edges, centered, large, perfectly spelled and easy to read, exactly these seven lines and nothing else: "
 "'Get your customised' / 'dreamy AI video Invitation' / 'at affordable price' / 'with findmyinvite.ai' / a small gold heart between two thin gold rules / 'DM us or Comment' / '\"FindMyInvite\"' (the last line in double quotation marks). Spell every word exactly as written, letter for letter. ")
BLANK = ("The central cream panel is completely blank and smooth: no lettering, no words, no letters, no numbers and no symbols on it at all, only a thin gold inner border. ")
TAIL = ("Behind them: a warm golden-pink sunset sky with soft peach clouds and stylised palms; NO church, no bell tower, no mosque and no other building anywhere in the frame. A soft breeze lifts her veil; a few separate petals drift at different depths. "
 "Exactly one couple and one board; no other people, no duplicate boards, no other signs, and no text anywhere except as described.")
VAR = {"text": BASE + COMMON + TEXT + TAIL, "blank": BASE + COMMON + BLANK + TAIL}
CREDIT = ("insufficient", "payment required", "billing", "balance", "spending limit")
def gen(name):
    prompt = VAR[name]; out = OUT/f"promo-{name}.jpg"; st = {"variant": name, "model": MODEL, "input_images": [], "text_only": True, "prompt_chars": len(prompt), "prompt": prompt, "started_at": now()}
    payload = {"input": {"prompt": prompt, "input_images": [], "aspect_ratio": "9:16", "quality": "high", "output_format": "jpeg"}}
    assert payload["input"]["input_images"] == []
    for tri in range(4):
        r = requests.post(f"https://api.replicate.com/v1/models/{MODEL}/predictions", headers={"Authorization": f"Bearer {TOK}", "Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}, json=payload, timeout=120)
        d = r.json() if r.headers.get("content-type", "").startswith("application/json") else {"raw": r.text[:300]}
        if r.status_code in (200, 201) and d.get("id"): break
        if r.status_code == 429 and tri < 3: time.sleep(max(15, int(float(r.headers.get("retry-after") or 10)) + 5)); continue
        if r.status_code in (402, 403) or any(w in json.dumps(d).lower() for w in CREDIT): print("STOP billing", r.status_code, d); sys.exit(3)
        print("FAIL", r.status_code, d); sys.exit(1)
    gid = d["id"]; st["request_id"] = gid; print(name, "created", gid, flush=True)
    url_get = (d.get("urls") or {}).get("get"); status = d.get("status")
    for _ in range(120):
        if status not in ("starting", "processing", "queued"): break
        time.sleep(5); g = requests.get(url_get, headers={"Authorization": f"Bearer {TOK}"}, timeout=60)
        if g.ok: d = g.json(); status = d.get("status")
    if status != "succeeded": print("FAIL", name, status, d.get("error")); sys.exit(1)
    o = d.get("output"); url = o[0] if isinstance(o, list) else o
    raw = OUT/f"promo-{name}.raw.jpg"; raw.write_bytes(requests.get(url, timeout=120).content)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-vf", "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2", "-frames:v", "1", "-q:v", "2", str(out)], check=True)
    st.update(status="GENERATED", raw_sha256=fsha(raw), sha256=fsha(out), finished_at=now())
    (OUT/f"promo-{name}.status.json").write_text(json.dumps(st, indent=2) + "\n"); print(name, "OK", st["sha256"], flush=True)
for v in (sys.argv[1:] or ["text", "blank"]): gen(v)
