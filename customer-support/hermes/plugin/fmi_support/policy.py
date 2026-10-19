"""Customer-facing policy, separate from transport and customer storage."""
import re
from pathlib import Path

FALLBACK = "still here — say that again?"
POLICY = (Path(__file__).parent / "persona.md").read_text(encoding="utf-8")
TECHNICAL = re.compile(
    r"provider said|provider temporarily unavailable|operation interrupted|"
    r"session restored|session recovered|gateway|APIConnectionError|HTTP\s*[45]\d\d|"
    r"traceback|/retry|/model|/busy|hermes logs|fallback add|retrying automatically|"
    r"didn't answer after|didn't produce a reply|request was not processed|"
    r"iteration \d+/|connection error|AI model service|session database|"
    r"session storage|context window|token limit|no home channel|/sethome|"
    r"new session started|approve once|always approve|text fallback|"
    r"◆\s*model:|◆\s*provider:|◆\s*context:|◆\s*endpoint:|"
    r"127\.0\.0\.1:11434|/approve|/always|/cancel", re.I,
)


def support_context(platform="", **kwargs):
    if platform == "whatsapp":
        return {"context": POLICY}


def customer_response(response_text, platform="", **kwargs):
    if platform == "whatsapp" and (
        response_text.strip() == "(empty)" or TECHNICAL.search(response_text)
    ):
        return FALLBACK
    return None


def clean_response(text, returning=False):
    safe = customer_response(text,platform="whatsapp") or text
    if returning and safe != FALLBACK:
        # Strip only generic reset phrases, not a substantive reply or customer name.
        safe = re.sub(r"^\s*(?:(?:hi|hello|hey)[!,.]?\s*)?(?:welcome (?:back )?to (?:FMI|FindMyInvite)[!.]?\s*)?"
                      r"how (?:can|may) I (?:help|assist)(?: you)?(?: today)?\??[!.]?\s*", "", safe, flags=re.I)
        safe = re.sub(r"^\s*(?:hi|hello|hey)[!,.]\s*(?:welcome (?:back )?to (?:FMI|FindMyInvite)[!.]?\s*)?", "", safe, flags=re.I)
        safe = re.sub(r"^\s*welcome (?:back )?to (?:FMI|FindMyInvite)[!.]?\s*", "", safe, flags=re.I)
    return safe.strip() or FALLBACK
