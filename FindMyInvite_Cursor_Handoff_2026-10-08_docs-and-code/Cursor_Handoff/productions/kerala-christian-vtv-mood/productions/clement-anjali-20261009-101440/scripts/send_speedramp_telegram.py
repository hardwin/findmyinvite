#!/usr/bin/env python3
"""Clement & Anjali final speed-ramped video -> Telegram (sendVideo + sendDocument), then the 11 approved stills as albums.
Token: env TELEGRAM_BOT_TOKEN (e.g. @fmi_transfer_bot) or TELEGRAM_EVENTSBLR_BOT_TOKEN. Never printed or stored.
Waits up to --wait seconds for the chat to become reachable (a new bot can only message users who pressed Start).
usage: send_speedramp_telegram.py [--wait 1800] [--no-stills]"""
import json, os, sys, time, hashlib
from datetime import datetime
from pathlib import Path
import requests
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/kerala-christian-v1"; FINAL = A/"kerala-christian-v1-speedramp-720x1280.mp4"
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN") or os.environ.get("TELEGRAM_EVENTSBLR_BOT_TOKEN")
if not TOKEN: sys.exit("TELEGRAM_BOT_TOKEN missing")
CHAT = os.environ.get("TELEGRAM_CHAT_ID", "2002649357")
API = f"https://api.telegram.org/bot{TOKEN}"
wait = int(sys.argv[sys.argv.index("--wait")+1]) if "--wait" in sys.argv else 0
COUPLE = "Clement & Anjali"
names = {1:"Aerial church establish",2:"Porch blessing title",3:"Family invitation board",4:"Groom portrait",5:"Bride portrait",6:"Families blessing plaque",
         7:"Holy Matrimony (aisle, from behind)",8:"Venue board",9:"Reception board",10:"Hosts board",11:"Couple + Save the Date"}
deadline = time.time() + wait
while True:
    r = requests.post(f"{API}/sendChatAction", data={"chat_id": CHAT, "action": "upload_video"}, timeout=30).json()
    if r.get("ok"): break
    if time.time() > deadline: sys.exit(f"chat {CHAT} not reachable: {r.get('description')} (press Start on the bot)")
    time.sleep(10)
sha = hashlib.sha256(FINAL.read_bytes()).hexdigest()
cap = (f"{COUPLE} · Christian church wedding v1 · speed-ramped final\n12th November 2026 · Star Avenue, Belagavi\n"
       f"720x1280 · 28.2 s · {R.name}\nsha256 {sha[:16]}…")
res = {"ts_local": datetime.now().astimezone().isoformat(), "chat_id": CHAT, "final_sha256": sha, "messages": []}
def post(method, field, path, mime, **extra):
    with open(path, "rb") as f:
        j = requests.post(f"{API}/{method}", data={"chat_id": CHAT, **extra}, files={field: (path.name, f, mime)}, timeout=600).json()
    res["messages"].append({"method": method, "ok": j.get("ok"), "message_id": (j.get("result") or {}).get("message_id"), "error": j.get("description")})
    print(json.dumps(res["messages"][-1])); return j
post("sendVideo", "video", FINAL, "video/mp4", caption=cap, supports_streaming="true", width="720", height="1280", duration="28")
post("sendDocument", "document", FINAL, "video/mp4", caption=f"{COUPLE} · original file (no Telegram recompression)")
if "--no-stills" not in sys.argv:
    for n, group in enumerate([list(range(1, 7)), list(range(7, 12))], 1):
        media, files = [], {}
        for i in group:
            c = f"{COUPLE} · Scene {i:02d} – {names[i]}"
            if i == group[0]: c = f"{COUPLE} · approved stills · album {n}/2\n\n" + c
            media.append({"type": "photo", "media": f"attach://p{i}", "caption": c})
            files[f"p{i}"] = (f"image-{i}.jpg", open(A/f"image-{i}.jpg", "rb"), "image/jpeg")
        j = requests.post(f"{API}/sendMediaGroup", data={"chat_id": CHAT, "media": json.dumps(media, ensure_ascii=False)}, files=files, timeout=300).json()
        res["messages"].append({"method": "sendMediaGroup", "scenes": group, "ok": j.get("ok"),
                                "message_ids": [m["message_id"] for m in j.get("result", [])] if j.get("ok") else None, "error": j.get("description")})
        print(json.dumps(res["messages"][-1]))
log = R/"logs/TELEGRAM_SEND.json"
hist = json.loads(log.read_text()) if log.exists() else {"chat_id": CHAT, "sends": []}
hist["sends"].append(res); log.write_text(json.dumps(hist, indent=2) + "\n")
