#!/usr/bin/env python3
import json, requests
from pathlib import Path
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/kerala-christian-v1"
TOKEN = Path("/home/box/shared/secrets/telegram-eventsblr.token").read_text().strip()  # never printed
CHAT = "2002649357"
texts = json.load(open("/tmp/kcbuild/texts.json"))
names = {1:"Aerial church establish (REUSED from Theresa & Isaac base)",2:"Porch blessing title",3:"Family invitation board",4:"Groom portrait",5:"Bride portrait",6:"Families blessing plaque",7:"Holy Matrimony",8:"Venue board",9:"Reception board",10:"Hosts board",11:"Couple + Save the Date"}
res = []
for group in ([1,2,3,4,5,6],[7,8,9,10,11]):
    media, files = [], {}
    for i in group:
        cap = f"Rahul & Mounika · Scene {i:02d} – {names[i]}\nText: " + texts[str(i)].replace("\n"," / ")
        if i == 1: cap = f"Rahul & Mounika · stills (kc-v1, {R.name})\n" + cap
        media.append({"type":"photo","media":f"attach://p{i}","caption":cap[:1024]})
        files[f"p{i}"] = (f"image-{i}.jpg", open(A/f"image-{i}.jpg","rb"), "image/jpeg")
    r = requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMediaGroup", data={"chat_id":CHAT,"media":json.dumps(media, ensure_ascii=False)}, files=files, timeout=120)
    j = r.json()
    ids = [m["message_id"] for m in j.get("result", [])] if j.get("ok") else None
    res.append({"scenes":group,"http":r.status_code,"ok":j.get("ok"),"message_ids":ids,"error":None if j.get("ok") else j.get("description")})
    print(json.dumps(res[-1]))
    if not j.get("ok"): break
(R/"logs/TELEGRAM_SEND.json").write_text(json.dumps({"chat_id":CHAT,"albums":res}, indent=2))
