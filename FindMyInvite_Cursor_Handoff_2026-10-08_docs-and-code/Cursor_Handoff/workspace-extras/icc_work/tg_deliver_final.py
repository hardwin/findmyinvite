import json, sys, requests
TOKEN = open("/home/box/shared/secrets/telegram-eventsblr.token").read().strip()
CHAT = 2002649357; API = f"https://api.telegram.org/bot{TOKEN}"
P = "/workspace/fmi-productions/wedding-template-islam-christian-church"
MP4 = P + "/productions/icc-v1-20261005-234500/assets/output/Anusha-Rishad-Islam-Christian-Instagram-1080x1920.mp4"
def post(method, data, field, path, mime):
    with open(path, "rb") as f:
        r = requests.post(f"{API}/{method}", data={"chat_id": CHAT, **data}, files={field: (path.split("/")[-1], f, mime)}, timeout=900)
    j = r.json(); res = j.get("result") or {}
    out = {"method": method, "file": path.split("/")[-1], "http": r.status_code, "ok": j.get("ok"), "description": j.get("description"), "message_id": res.get("message_id")}
    if res.get("video"): out["video"] = {k: res["video"].get(k) for k in ("width", "height", "duration", "file_size")}
    if res.get("document"): out["document"] = {k: res["document"].get(k) for k in ("file_name", "mime_type", "file_size")}
    print(json.dumps(out), flush=True)
    if r.status_code in (402, 403) or not j.get("ok"): sys.exit(3)
post("sendDocument", {"caption": "Wedding_Template_Islam_Christian_v1.json: reusable Islam + Christian wedding template (12 scenes / 11 clips), extracted from the accepted Anusha & Rishad v5. Client text and looks are {{placeholders}}; Anusha & Rishad values included as examples."}, "document", P + "/Wedding_Template_Islam_Christian_v1.json", "application/json")
post("sendDocument", {"caption": "CLIENT_FIELDS_BLANK.txt: client fields for Wedding_Template_Islam_Christian_v1 (example values shown; replace with the client's details)."}, "document", P + "/CLIENT_FIELDS_BLANK.txt", "text/plain")
post("sendDocument", {"caption": "Anusha & Rishad Instagram cut (1080x1920, 33.4s): speed-ramped v5 plus FindMyInvite promo end card. Full-quality download.", "disable_content_type_detection": "true"}, "document", MP4, "application/octet-stream")
post("sendVideo", {"caption": "Anusha & Rishad Instagram cut (preview): speed-ramped v5 plus FindMyInvite promo end card", "width": 1080, "height": 1920, "duration": 33, "supports_streaming": "true"}, "video", MP4, "video/mp4")
