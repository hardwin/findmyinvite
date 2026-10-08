import json, sys, requests
TOKEN = open("/home/box/shared/secrets/telegram-eventsblr.token").read().strip()
API = f"https://api.telegram.org/bot{TOKEN}"; CHAT = 2002649357
MP4 = "/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500/assets/output/Anusha-Rishad-Islam-Christian-Instagram-1080x1920.mp4"
def post(method, data, field, mime):
    with open(MP4, "rb") as f:
        r = requests.post(f"{API}/{method}", data={"chat_id": CHAT, **data}, files={field: (MP4.split("/")[-1], f, mime)}, timeout=900)
    j = r.json(); res = j.get("result") or {}
    print(json.dumps({"method": method, "http": r.status_code, "ok": j.get("ok"), "description": j.get("description"), "message_id": res.get("message_id"),
                      "media": {k: (res.get("video") or res.get("document") or {}).get(k) for k in ("width", "height", "duration", "file_size", "mime_type")}}), flush=True)
    if not j.get("ok"): sys.exit(3)
post("sendDocument", {"caption": "Anusha & Rishad Instagram cut v2 (1080x1920, 34.3s): speed-ramped v5, then the camera drifts past the couple onto the empty petal pathway with floating gold FindMyInvite promo text (no couple, no signboard). Full-quality download.", "disable_content_type_detection": "true"}, "document", "application/octet-stream")
post("sendVideo", {"caption": "Anusha & Rishad Instagram cut v2 (preview): floating gold promo text over the empty petal pathway", "width": 1080, "height": 1920, "duration": 34, "supports_streaming": "true"}, "video", "video/mp4")
