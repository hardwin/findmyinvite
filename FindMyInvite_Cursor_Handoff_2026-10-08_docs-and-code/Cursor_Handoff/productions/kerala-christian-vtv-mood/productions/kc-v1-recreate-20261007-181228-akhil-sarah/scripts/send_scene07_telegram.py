#!/usr/bin/env python3
"""Send revised scene-07 (aisle, from behind) via sendPhoto, same bot/chat as send_telegram.py."""
import json, requests
from pathlib import Path
R = Path(__file__).resolve().parent.parent
TOKEN = Path("/home/box/shared/secrets/telegram-eventsblr.token").read_text().strip()  # never printed
CHAT = "2002649357"
cap = ("Akhil & Sarah · REVISED Scene 07 – Holy Matrimony\n"
       "Couple standing at the front of the aisle inside the church, seen from behind, decorated pews, ready to get married.\n"
       "Text: Holy Matrimony / 19th December 2026 / 4:30 p.m.\n"
       "Replaces the earlier seated scene 07 (msg 908). Reply APPROVE, or tell me what to change. No video until you approve.")
r = requests.post(f"https://api.telegram.org/bot{TOKEN}/sendPhoto", data={"chat_id": CHAT, "caption": cap},
                  files={"photo": ("image-7.jpg", open(R/"assets/output/kerala-christian-v1/image-7.jpg", "rb"), "image/jpeg")}, timeout=120)
j = r.json(); res = {"scene": 7, "method": "sendPhoto", "http": r.status_code, "ok": j.get("ok"),
                     "message_id": (j.get("result") or {}).get("message_id"), "replaces": 908, "error": None if j.get("ok") else j.get("description")}
print(json.dumps(res))
log = json.loads((R/"logs/TELEGRAM_SEND.json").read_text()); log.setdefault("single_photos", []).append(res)
(R/"logs/TELEGRAM_SEND.json").write_text(json.dumps(log, indent=2))
