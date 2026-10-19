"""Use adapter identities, never phone numbers extracted from customer prose."""
import re
from datetime import datetime, timezone


def intake_payload(context, now=None):
    if context.get("platform") != "whatsapp" or context.get("chat_type") != "dm":
        return None
    raw = str(context.get("user_id") or "").strip()
    session = str(context.get("session_id") or "").strip()
    if not session or len(session) > 200:
        return None
    phone = None
    if re.fullmatch(r"\d{1,30}(?::\d+)?@lid", raw):
        identity = "lid:" + raw.split("@")[0].split(":")[0]
    else:
        # Hermes WhatsApp bridge resolves phone JIDs to digits when possible.
        number = re.sub(r"(?::\d+)?@(s\.whatsapp\.net|c\.us)$", "", raw)
        if not re.fullmatch(r"\+?[1-9]\d{6,14}", number):
            return None
        phone = "+" + number.lstrip("+")
        identity = "phone:" + phone
    timestamp = now or datetime.now(timezone.utc).isoformat()
    return {
        "p_channel": "whatsapp", "p_identity": identity,
        "p_phone_e164": phone, "p_session_id": session,
        "p_first_seen_at": timestamp, "p_last_seen_at": timestamp,
    }
