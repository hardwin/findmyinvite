#!/usr/bin/env python3
"""Rahul & Praveena (Avinash) stills -> Telegram (Eventsblr bot, Ashok's chat), same mechanics as scripts/kc-v1-recreate/send_telegram.py.
Token: env TELEGRAM_EVENTSBLR_BOT_TOKEN (Cursor Cloud secret), else /home/box/shared/secrets/telegram-eventsblr.token. Never printed.
usage: send_telegram.py [scene numbers...]   (default: all 11; albums of <=6 so each album fits sendMediaGroup's 10 limit)"""
import json, os, sys, requests
from datetime import datetime
from pathlib import Path
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/kerala-christian-v1"
tok_file = Path("/home/box/shared/secrets/telegram-eventsblr.token")
TOKEN = os.environ.get("TELEGRAM_EVENTSBLR_BOT_TOKEN") or (tok_file.read_text().strip() if tok_file.exists() else None)
if not TOKEN: sys.exit("TELEGRAM_EVENTSBLR_BOT_TOKEN missing (add it in Cursor Dashboard > Cloud Agents > Secrets)")
CHAT = os.environ.get("TELEGRAM_CHAT_ID", "2002649357")
COUPLE = "Rahul & Praveena (Avinash)"
T = json.loads((R/"template.json").read_text()); P = T["parameters"]
names = {1:"Aerial church establish",2:"Porch blessing title",3:"Family invitation board",4:"Groom portrait",5:"Bride portrait",6:"Families blessing plaque",
         7:"Holy Matrimony (aisle, from behind)",8:"Venue board",9:"Reception board",10:"Hosts board",11:"Couple + Save the Date"}
def text(i):
    tpl = T["scenes"][i-1].get("image_prompt_template") or ""
    return " / ".join(P[k].replace("\n", " / ") for k in P if "{{"+k+"}}" in tpl) or "(no text)"
ASK = "Reply APPROVE to start video generation, or tell me which scene to change. No video is generated until you approve."
scenes = [int(x) for x in sys.argv[1:]] or list(range(1, 12))
groups = [scenes[i:i+6] for i in range(0, len(scenes), 6)]
res = []
for n, group in enumerate(groups, 1):
    media, files = [], {}
    for i in group:
        cap = f"{COUPLE} · Scene {i:02d} – {names[i]}\nText: {text(i)}"
        if i == group[0]: cap = f"{COUPLE} · stills for approval ({R.name}) · album {n}/{len(groups)}\n{ASK}\n\n" + cap
        media.append({"type": "photo", "media": f"attach://p{i}", "caption": cap[:1024]})
        files[f"p{i}"] = (f"image-{i}.jpg", open(A/f"image-{i}.jpg", "rb"), "image/jpeg")
    r = requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMediaGroup", data={"chat_id": CHAT, "media": json.dumps(media, ensure_ascii=False)}, files=files, timeout=120)
    j = r.json()
    ids = [m["message_id"] for m in j.get("result", [])] if j.get("ok") else None
    res.append({"scenes": group, "http": r.status_code, "ok": j.get("ok"), "message_ids": ids, "error": None if j.get("ok") else j.get("description")})
    print(json.dumps(res[-1]))
    if not j.get("ok"): break
log = R/"logs/TELEGRAM_SEND.json"
hist = json.loads(log.read_text()) if log.exists() else {"chat_id": CHAT, "sends": []}
hist["sends"].append({"ts_local": datetime.now().astimezone().isoformat(), "albums": res})
log.write_text(json.dumps(hist, indent=2) + "\n")
