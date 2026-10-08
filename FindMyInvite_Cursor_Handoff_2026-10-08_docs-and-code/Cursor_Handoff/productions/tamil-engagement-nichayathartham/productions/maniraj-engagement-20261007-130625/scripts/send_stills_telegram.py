#!/usr/bin/env python3
import json, requests
from pathlib import Path
R = Path(__file__).resolve().parent.parent
A = R/"assets/output/tamil-engagement-nichayathartham-v1"
TOKEN = Path("/home/box/shared/secrets/telegram-eventsblr.token").read_text().strip()  # never printed
CHAT = "2002649357"
T = json.loads((R/"storyboard.json").read_text())
names = {1:"Title (தலைப்பு)",2:"Couple names (மணமக்கள்)",3:"Elders' blessing (பெரியோர்)",4:"Save the date (நன்னாள்)",
         5:"Muhurtham (முகூர்த்தம்)",6:"Venue (இடம்)",7:"Welcome (வரவேற்பு)",8:"Closing card (நிறைவு)"}
media, files = [], {}
for s in T["scenes"]:
    i = s["index"]; lines = [t["resolved"] for t in s["text_fields"] if t["on_screen"]]
    cap = f"Scene {i}/8 – {names[i]}\nText: " + " / ".join(lines)
    if i == 5: cap += "\n(retried once: first take misspelled முகூர்த்த)"
    if i == 6: cap += "\n⚠️ Please confirm venue spelling: 'Annai Manimegal' written as மணிமேகலை (Manimegalai, matches the hall's public listing in Chengam)."
    if i == 1:
        cap = ("Maniraj (அ) Rajesh ♥ Keerthana – நிச்சயதார்த்த stills for review (8 scenes, 9:16, no people, Tamil only)\n"
               "Dropped: parents' names, Tamil-calendar date, feast line, FindMyInvite credit.\n\n") + cap
    media.append({"type": "photo", "media": f"attach://p{i}", "caption": cap[:1024]})
    files[f"p{i}"] = (f"image-{i}.jpg", open(A/f"image-{i}.jpg", "rb"), "image/jpeg")
r = requests.post(f"https://api.telegram.org/bot{TOKEN}/sendMediaGroup",
                  data={"chat_id": CHAT, "media": json.dumps(media, ensure_ascii=False)}, files=files, timeout=180)
j = r.json()
res = {"chat_id": CHAT, "http": r.status_code, "ok": j.get("ok"),
       "message_ids": [m["message_id"] for m in j.get("result", [])] if j.get("ok") else None,
       "error": None if j.get("ok") else j.get("description"), "captions": [m["caption"] for m in media]}
(R/"logs/TELEGRAM_SEND_stills.json").write_text(json.dumps(res, indent=2, ensure_ascii=False))
print(json.dumps({k: res[k] for k in ("http", "ok", "message_ids", "error")}))
