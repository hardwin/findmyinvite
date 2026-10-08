#!/usr/bin/env python3
import json, requests
from pathlib import Path
R = Path(__file__).resolve().parent.parent
F = R/"assets/output/kerala-christian-v1/kerala-christian-v1-final-1080x1920.mp4"
TOKEN = Path("/home/box/shared/secrets/telegram-eventsblr.token").read_text().strip()  # never printed
CHAT = "2002649357"; CAP = "Rahul & Mounika – Christian wedding invite (1080x1920)"
B = f"https://api.telegram.org/bot{TOKEN}"
res = {}
r = requests.post(f"{B}/sendVideo", data={"chat_id": CHAT, "caption": CAP, "width": 1080, "height": 1920, "duration": 54, "supports_streaming": "true"},
                  files={"video": (F.name, open(F, "rb"), "video/mp4")}, timeout=600)
j = r.json(); res["sendVideo"] = {"http": r.status_code, "ok": j.get("ok"), "message_id": (j.get("result") or {}).get("message_id"), "error": None if j.get("ok") else j.get("description")}
print(json.dumps(res["sendVideo"]), flush=True)
r = requests.post(f"{B}/sendDocument", data={"chat_id": CHAT, "caption": CAP + " – download copy", "disable_content_type_detection": "true"},
                  files={"document": (F.name, open(F, "rb"), "video/mp4")}, timeout=600)
j = r.json(); res["sendDocument"] = {"http": r.status_code, "ok": j.get("ok"), "message_id": (j.get("result") or {}).get("message_id"), "error": None if j.get("ok") else j.get("description")}
print(json.dumps(res["sendDocument"]), flush=True)
log = json.loads((R/"logs/TELEGRAM_SEND.json").read_text()); log["final_video"] = res
(R/"logs/TELEGRAM_SEND.json").write_text(json.dumps(log, indent=2))
