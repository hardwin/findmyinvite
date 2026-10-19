"""Private, durable metadata outbox; idempotent Supabase RPC; no message bodies."""
import hashlib
from contextlib import contextmanager
import json
import os
from pathlib import Path
import sqlite3
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, build_opener, HTTPRedirectHandler


class StorageUnavailable(Exception):
    """Contains an operator-safe code only, never credentials or customer data."""


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


class SupabaseStore:
    def __init__(self, url, key, timeout=5):
        parsed = urlsplit(url)
        local = parsed.hostname in {"127.0.0.1", "localhost", "::1"}
        if (not key or parsed.username or parsed.password or parsed.query or parsed.fragment
                or parsed.path not in {"", "/"}
                or not ((parsed.scheme == "https" and (parsed.hostname or "").endswith(".supabase.co"))
                        or (local and parsed.scheme == "http"))):
            raise StorageUnavailable("invalid_configuration")
        self.url, self.key, self.timeout = url.rstrip("/"), key, timeout

    @classmethod
    def from_home(cls, home):
        # Kept outside prompts and tools. Profile-local file avoids cross-profile secrets.
        try:
            config = json.loads((Path(home) / "fmi-support-secrets.json").read_text())
            return cls(config["SUPABASE_URL"], config["SUPABASE_SERVICE_ROLE_KEY"])
        except (OSError, ValueError, KeyError):
            raise StorageUnavailable("missing_configuration") from None

    def record(self, payload):
        return self.rpc("support_record_contact", payload)

    def record_message(self, payload):
        return self.rpc("support_record_message", payload)

    def recent_messages(self, identity, limit=40):
        return self.rpc("support_recent_messages", {
            "p_channel": "whatsapp", "p_identity": identity, "p_limit": limit,
        })

    def rpc(self, name, payload):
        request = Request(
            self.url + "/rest/v1/rpc/" + name,
            data=json.dumps(payload).encode(), method="POST",
            headers={"apikey": self.key, "Authorization": "Bearer " + self.key,
                     "Content-Type": "application/json"},
        )
        try:
            with build_opener(NoRedirect).open(request, timeout=self.timeout) as response:
                return json.load(response)
        except HTTPError as error:
            raise StorageUnavailable("http_" + str(error.code)) from None
        except (URLError, TimeoutError, OSError, ValueError):
            raise StorageUnavailable("connection_or_response") from None


class Outbox:
    def __init__(self, home):
        directory = Path(home) / "state" / "fmi-support"
        directory.mkdir(parents=True, exist_ok=True, mode=0o700)
        self.path = directory / "outbox.sqlite3"
        fd = os.open(self.path, os.O_CREAT | os.O_RDWR, 0o600)
        os.close(fd)
        os.chmod(self.path, 0o600)
        with self.connect() as db:
            db.execute("""create table if not exists pending (
                id text primary key, payload text not null, revision integer not null default 1,
                attempts integer not null default 0, next_attempt real not null default 0
            )""")

    @contextmanager
    def connect(self):
        connection = sqlite3.connect(self.path, timeout=5)
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def enqueue(self, payload):
        key = hashlib.sha256(json.dumps([
            payload["p_channel"], payload["p_identity"], payload["p_session_id"]
        ]).encode()).hexdigest()
        with self.connect() as db:
            db.execute("begin immediate")
            old = db.execute("select payload from pending where id=?", (key,)).fetchone()
            merged = dict(payload)
            if old:
                previous = json.loads(old[0])
                merged["p_first_seen_at"] = min(previous["p_first_seen_at"], payload["p_first_seen_at"])
                merged["p_last_seen_at"] = max(previous["p_last_seen_at"], payload["p_last_seen_at"])
            db.execute("""insert into pending(id,payload) values(?,?)
                on conflict(id) do update set payload=excluded.payload, revision=pending.revision+1""",
                       (key, json.dumps(merged)))

    def flush(self, store, limit=20, now=None):
        now = time.time() if now is None else now
        with self.connect() as db:
            rows = db.execute("select id,payload,revision,attempts from pending where next_attempt<=? order by next_attempt limit ?",
                              (now, limit)).fetchall()
        sent = 0
        for key, raw, revision, attempts in rows:
            try:
                store.record(json.loads(raw))
            except StorageUnavailable:
                delay = min(300, 5 * 2 ** min(attempts, 6))
                with self.connect() as db:
                    db.execute("update pending set attempts=attempts+1,next_attempt=? where id=? and revision=?",
                               (now + delay, key, revision))
                continue
            # A newer event received during the request must remain pending.
            with self.connect() as db:
                db.execute("delete from pending where id=? and revision=?", (key, revision))
            sent += 1
        return {"sent": sent, "pending": self.count()}

    def count(self):
        with self.connect() as db:
            return db.execute("select count(*) from pending").fetchone()[0]
