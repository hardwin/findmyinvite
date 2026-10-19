"""Durable, identity-scoped text history and message retry queue."""
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import sqlite3
import time

from .storage import Outbox, StorageUnavailable


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def message_key(identity, source, role):
    return hashlib.sha256(json.dumps([identity, source, role]).encode()).hexdigest()


def text_content(value):
    if isinstance(value, str):
        return value.strip()
    if isinstance(value, list):
        return "\n".join(p["text"] for p in value if isinstance(p, dict)
                         and p.get("type") == "text" and isinstance(p.get("text"), str)).strip()
    return ""


class Journal(Outbox):
    def __init__(self, home):
        super().__init__(home)
        self.home = Path(home)
        with self.connect() as db:
            db.executescript("""
                create table if not exists support_bindings(session_id text primary key,payload text not null);
                create table if not exists support_texts(
                    message_key text primary key, identity text not null, payload text not null,
                    occurred_at text not null, revision integer not null default 1,
                    synced_revision integer not null default 0, attempts integer not null default 0,
                    next_attempt real not null default 0);
                create index if not exists support_texts_identity on support_texts(identity,occurred_at);
                create table if not exists support_turns(
                    turn_id text primary key,payload text not null,source_key text not null,
                    has_history integer not null,context_ready integer not null);
                create table if not exists support_history_cache(identity text primary key,messages text not null);
                create table if not exists support_resets(identity text primary key, reset_at text not null);
            """)

    def bind(self, payload):
        with self.connect() as db:
            db.execute("begin immediate")
            old = db.execute("select payload from support_bindings where session_id=?",
                             (payload["p_session_id"],)).fetchone()
            if old and json.loads(old[0])["p_identity"] != payload["p_identity"]:
                raise ValueError("identity_mismatch")
            db.execute("insert into support_bindings values(?,?) on conflict(session_id) do nothing",
                       (payload["p_session_id"], json.dumps(payload)))

    def binding(self, session_id):
        with self.connect() as db:
            row = db.execute("select payload from support_bindings where session_id=?", (session_id,)).fetchone()
        return json.loads(row[0]) if row else None

    def save(self, contact, source, role, content, occurred_at=None, historical=False):
        content = text_content(content)
        if not content:
            return None
        # A bounded storage contract; never silently truncate a customer's message.
        if len(content) > 65536:
            raise ValueError("message_too_large")
        key = message_key(contact["p_identity"], source, role)
        payload = {k: contact[k] for k in ("p_channel", "p_identity", "p_phone_e164", "p_session_id")}
        payload.update(p_message_key=key,p_role=role,p_content=content,
                       p_occurred_at=occurred_at or utc_now(),
                       p_delivery_state="historical" if historical else ("received" if role == "user" else "generated"))
        with self.connect() as db:
            db.execute("begin immediate")
            previous = db.execute("select payload from support_texts where message_key=?",(key,)).fetchone()
            if previous:
                original = json.loads(previous[0])
                payload["p_occurred_at"] = original["p_occurred_at"]
                payload["p_session_id"] = original["p_session_id"]
            db.execute("""insert into support_texts(message_key,identity,payload,occurred_at) values(?,?,?,?)
                on conflict(message_key) do update set payload=excluded.payload,
                  revision=support_texts.revision+1,next_attempt=0,attempts=0
                where json_extract(support_texts.payload,'$.p_content') <> json_extract(excluded.payload,'$.p_content')""",
                       (key, contact["p_identity"], json.dumps(payload), payload["p_occurred_at"]))
        return key

    def reset_at(self, identity):
        with self.connect() as db:
            row = db.execute("select reset_at from support_resets where identity=?", (identity,)).fetchone()
        return row[0] if row else None

    def since_reset(self, messages, identity):
        stamp = self.reset_at(identity)
        if not stamp:
            return list(messages or [])
        return [row for row in (messages or []) if (row.get("occurred_at") or "") >= stamp]

    def recent(self, identity, limit=40):
        with self.connect() as db:
            rows = db.execute("select payload from support_texts where identity=? order by occurred_at desc,rowid desc limit ?",
                              (identity, limit)).fetchall()
        messages = [{"message_key": p["p_message_key"], "role": p["p_role"], "content": p["p_content"],
                     "occurred_at": p["p_occurred_at"], "delivery_state": p["p_delivery_state"]}
                    for p in (json.loads(row[0]) for row in reversed(rows))]
        return self.since_reset(messages, identity)[-limit:]

    def cache_history(self, identity, messages):
        with self.connect() as db:
            db.execute("insert or replace into support_history_cache values(?,?)",(identity,json.dumps(messages)))

    def cached_history(self, identity):
        with self.connect() as db:
            row = db.execute("select messages from support_history_cache where identity=?",(identity,)).fetchone()
        return self.since_reset(json.loads(row[0]), identity) if row else None

    def pending_messages(self):
        with self.connect() as db:
            return db.execute("select count(*) from support_texts where synced_revision<revision").fetchone()[0]

    def flush_messages(self, store, limit=20, identity=None, key=None, now=None):
        now = time.time() if now is None else now
        with self.connect() as db:
            rows = db.execute("""select message_key,payload,revision,attempts from support_texts
                where synced_revision<revision and next_attempt<=?
                and (? is null or identity=?) and (? is null or message_key=?)
                order by occurred_at,rowid limit ?""", (now,identity,identity,key,key,limit)).fetchall()
        sent = 0
        for key, raw, revision, attempts in rows:
            try:
                store.record_message(json.loads(raw))
            except StorageUnavailable:
                with self.connect() as db:
                    db.execute("update support_texts set attempts=attempts+1,next_attempt=? where message_key=? and revision=?",
                               (now + min(300, 5 * 2**min(attempts,6)),key,revision))
                continue
            with self.connect() as db:
                db.execute("update support_texts set synced_revision=? where message_key=? and revision=?", (revision,key,revision))
            sent += 1
        return {"sent": sent, "pending": self.pending_messages()}

    def set_turn(self, turn_id, contact, source, has_history, ready):
        with self.connect() as db:
            db.execute("insert or replace into support_turns values(?,?,?,?,?)",
                       (turn_id,json.dumps(contact),source,int(has_history),int(ready)))

    def turn(self, turn_id):
        with self.connect() as db:
            row = db.execute("select payload,source_key,has_history,context_ready from support_turns where turn_id=?", (turn_id,)).fetchone()
        return (json.loads(row[0]),row[1],bool(row[2]),bool(row[3])) if row else None

    def reset_conversation(self, identity):
        with self.connect() as db:
            db.execute("begin immediate")
            db.execute("delete from support_texts where identity=?", (identity,))
            db.execute("delete from support_history_cache where identity=?", (identity,))
            db.execute("insert or replace into support_resets values(?,?)", (identity, utc_now()))

    def was_reset(self, identity):
        with self.connect() as db:
            return db.execute("select 1 from support_resets where identity=?", (identity,)).fetchone() is not None

    def import_legacy(self, contact):
        """Import only this verified customer's pre-upgrade, visible local text rows."""
        if self.was_reset(contact["p_identity"]):
            return
        marker = self.home / "fmi-support-history.json"
        if not marker.exists() or not (self.home / "state.db").exists():
            return
        cutoff = json.loads(marker.read_text())["legacy_max_message_id"]
        identity = contact["p_identity"]
        if identity.startswith("phone:"):
            phone = identity.removeprefix("phone:")
            digits = phone.lstrip("+")
            aliases = [phone,digits,digits+"@s.whatsapp.net",digits+"@c.us"]
        else:
            aliases = [identity.removeprefix("lid:")+"@lid"]
        connection = sqlite3.connect((self.home / "state.db").as_uri() + "?mode=ro",uri=True)
        try:
            rows = connection.execute("""select m.id,m.session_id,m.role,m.content,m.timestamp,m.platform_message_id
                from messages m join sessions s on s.id=m.session_id
                where s.source='whatsapp' and s.chat_type='dm' and s.user_id in ("""
                + ",".join("?" for _ in aliases) + """ ) and m.id<=? and m.role in ('user','assistant')
                and (m.display_kind is null or m.display_kind in ('user','assistant','failed_turn'))
                and coalesce(m._compressed_summary,0)=0 and m.tool_calls is null
                order by m.id""",(*aliases,cutoff)).fetchall()
        finally:
            connection.close()
        imported = 0
        for row_id,sid,role,content,timestamp,platform_id in rows:
            if not content:
                continue
            legacy = dict(contact,p_session_id=sid)
            source = "transport:"+platform_id if platform_id and role == "user" else "legacy:"+sid+":"+str(row_id)
            occurred = datetime.fromtimestamp(timestamp,timezone.utc).isoformat()
            try:
                decoded = json.loads(content)
                if isinstance(decoded,list):
                    content = text_content(decoded)
            except (ValueError,TypeError):
                pass
            self.save(legacy,source,role,content,occurred_at=occurred,historical=True)
            imported += 1
        return imported
