#!/usr/bin/env python3
"""Send ONLY the speed-ramped final (Lunch update) to Ashok via Eventsblr bot: sendVideo + sendDocument download copy. Token never printed."""
import json, math, subprocess, requests
from datetime import datetime
from pathlib import Path
R = Path(__file__).resolve().parent.parent
F = R/"assets/output/kerala-christian-v1/kerala-christian-v1-speedramp-1080x1920.mp4"
TOKEN = Path("/home/box/shared/secrets/telegram-eventsblr.token").read_text().strip()  # never printed
CHAT = "2002649357"; CAP = "Rahul & Mounika - Speed-ramped final (Lunch update)"
DUR = round(float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(F)],capture_output=True,text=True).stdout.strip()))
B = f"https://api.telegram.org/bot{TOKEN}"
res = {"file": str(F), "duration": DUR, "sent_at": datetime.now().astimezone().isoformat(timespec="seconds")}
r = requests.post(f"{B}/sendVideo", data={"chat_id": CHAT, "caption": CAP, "width": 1080, "height": 1920, "duration": DUR, "supports_streaming": "true"},
                  files={"video": (F.name, open(F, "rb"), "video/mp4")}, timeout=600)
j = r.json(); res["sendVideo"] = {"http": r.status_code, "ok": j.get("ok"), "message_id": (j.get("result") or {}).get("message_id"), "caption": CAP, "error": None if j.get("ok") else j.get("description")}
print(json.dumps(res["sendVideo"]), flush=True)
r = requests.post(f"{B}/sendDocument", data={"chat_id": CHAT, "caption": CAP + " - download copy", "disable_content_type_detection": "true"},
                  files={"document": (F.name, open(F, "rb"), "video/mp4")}, timeout=600)
j = r.json(); res["sendDocument"] = {"http": r.status_code, "ok": j.get("ok"), "message_id": (j.get("result") or {}).get("message_id"), "caption": CAP + " - download copy", "error": None if j.get("ok") else j.get("description")}
print(json.dumps(res["sendDocument"]), flush=True)
log = json.loads((R/"logs/TELEGRAM_SEND.json").read_text()); log["speedramp_final_lunch_update"] = res
(R/"logs/TELEGRAM_SEND.json").write_text(json.dumps(log, indent=2))
