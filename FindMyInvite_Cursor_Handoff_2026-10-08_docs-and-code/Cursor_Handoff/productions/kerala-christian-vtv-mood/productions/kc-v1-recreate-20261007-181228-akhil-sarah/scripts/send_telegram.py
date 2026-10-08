#!/usr/bin/env python3
"""Akhil & Sarah stills -> Telegram (same bot/chat/mechanics as kc-v1-recreate-20261006-211129/scripts/send_telegram.py).
Two sendMediaGroup albums (scenes 01-06, 07-11). Approval ask in the first caption of each album."""
import json, requests
from pathlib import Path
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/kerala-christian-v1"
TOKEN = Path("/home/box/shared/secrets/telegram-eventsblr.token").read_text().strip()  # never printed
CHAT = "2002649357"
texts = json.load(open(R/"work/texts.json"))
names = {1:"Aerial church establish",2:"Porch blessing title",3:"Family invitation board",4:"Groom portrait",5:"Bride portrait",6:"Families blessing plaque",7:"Holy Matrimony",8:"Venue board",9:"Reception board",10:"Hosts board",11:"Couple + Save the Date"}
ASK = "Please review all 11 stills and reply APPROVE to start video generation, or tell me which scene to change. No video is generated until you approve."
res = []
for n, group in enumerate(([1,2,3,4,5,6],[7,8,9,10,11]), 1):
    media, files = [], {}
    for i in group:
        cap = f"Akhil & Sarah · Scene {i:02d} – {names[i]}\nText: " + texts[str(i)].replace("\n"," / ")
        if i == group[0]: cap = f"Akhil & Sarah · stills for approval (kc-v1, {R.name}) · album {n}/2\n{ASK}\n\n" + cap
        media.append({"type":"photo","media":f"attach://p{i}","caption":cap[:1024]})
        files[f"p{i}"] = (f"image-{i}.jpg", open(A/f"image-{i}.jpg","rb"), "image/jpeg")
    r = requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMediaGroup", data={"chat_id":CHAT,"media":json.dumps(media, ensure_ascii=False)}, files=files, timeout=120)
    j = r.json()
    ids = [m["message_id"] for m in j.get("result", [])] if j.get("ok") else None
    res.append({"scenes":group,"http":r.status_code,"ok":j.get("ok"),"message_ids":ids,"error":None if j.get("ok") else j.get("description")})
    print(json.dumps(res[-1]))
    if not j.get("ok"): break
(R/"logs/TELEGRAM_SEND.json").write_text(json.dumps({"chat_id":CHAT,"albums":res}, indent=2))
