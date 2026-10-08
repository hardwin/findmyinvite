import json, sys, requests
TOKEN = open("/home/box/shared/secrets/telegram-eventsblr.token").read().strip()
API = f"https://api.telegram.org/bot{TOKEN}"; CHAT = 2002649357
P = "/workspace/fmi-productions/wedding-template-islam-christian-church"
for path, mime, cap in [(P+"/Wedding_Template_Islam_Christian_v1.json", "application/json", "Wedding_Template_Islam_Christian_v1.json (updated): example values are now a fictional sample couple (Ayesha & Daniel, A&D, St. Mary's Church Fort Kochi, Al Noor Grand Hall Kochi, DECEMBER 14) with neutral generic looks. No client details. Templates unchanged."),
                        (P+"/CLIENT_FIELDS_BLANK.txt", "text/plain", "CLIENT_FIELDS_BLANK.txt (updated): fictional sample values; replace with the client's details.")]:
    with open(path, "rb") as f:
        r = requests.post(f"{API}/sendDocument", data={"chat_id": CHAT, "caption": cap}, files={"document": (path.split("/")[-1], f, mime)}, timeout=300)
    j = r.json(); print(json.dumps({"file": path.split("/")[-1], "http": r.status_code, "ok": j.get("ok"), "description": j.get("description"), "message_id": (j.get("result") or {}).get("message_id")}))
    if not j.get("ok"): sys.exit(3)
