"""Operator lookup for stored WhatsApp test chats. Not a gender list."""
import json
from datetime import datetime
from zoneinfo import ZoneInfo

TESTERS={'ashok':'+916362260992','supriya':'+918050284700'}
IST=ZoneInfo('Asia/Kolkata')


def last_chat(home, who, limit=40):
    from .journal import Journal
    journal=Journal(home)
    key=str(who or '').strip()
    identity='phone:'+TESTERS[key.casefold()] if key.casefold() in TESTERS else _identity_for_name(journal,key)
    if not identity:
        return {'who':key,'phone':None,'messages':[]}
    phone=identity.removeprefix('phone:') if identity.startswith('phone:') else None
    return {'who':key,'phone':phone,'messages':journal.recent(identity,limit)}


def _identity_for_name(journal, who):
    if not who:return None
    needle=who.casefold()
    with journal.connect() as db:
        rows=db.execute("select identity,payload from support_texts order by occurred_at desc limit 400").fetchall()
    for identity,raw in rows:
        payload=json.loads(raw)
        content=(payload.get('p_content') or '').casefold()
        if payload.get('p_role')=='user' and needle in content.split():
            return identity
    return None


def format_chat(found):
    if not found['messages']:
        return 'No stored chat for '+found['who']+'.'
    lines=[found['who']+' '+ (found['phone'] or '')]
    for row in found['messages']:
        stamp=datetime.fromisoformat(row['occurred_at'].replace('Z','+00:00')).astimezone(IST)
        speaker='customer' if row['role']=='user' else 'FMI'
        lines.append(stamp.strftime('%Y-%m-%d %H:%M')+' '+speaker+': '+row['content'])
    return '\n'.join(lines)
