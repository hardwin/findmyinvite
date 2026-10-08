import json, sys, requests
TOKEN = open("/home/box/shared/secrets/telegram-eventsblr.token").read().strip()
CHAT = 2002649357
def send_photo(path, caption):
    with open(path, "rb") as f:
        r = requests.post(f"https://api.telegram.org/bot{TOKEN}/sendPhoto", data={"chat_id": CHAT, "caption": caption}, files={"photo": f}, timeout=120)
    return r.status_code, r.json()
def send_video(path, caption, w, h, dur):
    with open(path, "rb") as f:
        r = requests.post(f"https://api.telegram.org/bot{TOKEN}/sendVideo", data={"chat_id": CHAT, "caption": caption, "width": w, "height": h, "duration": int(dur), "supports_streaming": "true"}, files={"video": (path.split("/")[-1], f, "video/mp4")}, timeout=600)
    return r.status_code, r.json()
if __name__ == "__main__":
    kind = sys.argv[1]
    if kind == "photo":
        code, j = send_photo(sys.argv[2], sys.argv[3])
    else:
        code, j = send_video(sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), float(sys.argv[6]))
    res = j.get("result") or {}
    print(json.dumps({"http": code, "ok": j.get("ok"), "description": j.get("description"), "message_id": res.get("message_id"),
                      "video": {k: (res.get("video") or {}).get(k) for k in ("width", "height", "duration", "file_size")} if kind != "photo" else None}))
