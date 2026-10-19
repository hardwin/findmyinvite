"""Operator secret gates. Loaded from secret_gates.json; never sent to the model."""
import json
import logging
from pathlib import Path
from .identity import intake_payload
from .journal import Journal
from .storage import SupabaseStore, StorageUnavailable

log = logging.getLogger('fmi.support')
CATALOG = json.loads(Path(__file__).with_name('secret_gates.json').read_text())
FIRST_CONTACT = "Hi\nYour name please?"


def match_gate(text, sender='any_direct_whatsapp'):
    command = str(text or '').strip().casefold()
    head = command.split()[0] if command else ''
    for gate in CATALOG.get('gates', []):
        token = gate.get('match', '').casefold()
        if gate.get('match_prefix'):
            if head != token and command != token:
                continue
        elif token != command:
            continue
        allowed = gate.get('sender')
        if allowed not in {sender, 'any_direct_whatsapp'} and sender != allowed:
            continue
        return gate
    return None


def _source_value(source, key):
    if source is None:
        return ''
    if isinstance(source, dict):
        return source.get(key) or ''
    return getattr(source, key, '') or ''


def gate_sender(source):
    from .review import TESTERS
    raw = str(_source_value(source, 'user_id') or _source_value(source, 'chat_id'))
    digits = ''.join(ch for ch in raw if ch.isdigit())
    phone = '+' + digits if digits else ''
    if phone in TESTERS.values() or digits in {item.lstrip('+') for item in TESTERS.values()}:
        return 'operator_tester'
    return 'any_direct_whatsapp'


def reset_contact(home, source, session_key, store=None):
    contact = intake_payload({'platform': 'whatsapp', 'chat_type': source.get('chat_type'),
                              'user_id': source.get('user_id'), 'session_id': session_key or 'reset'})
    if contact is None:
        raise StorageUnavailable('missing_admitted_identity')
    journal = Journal(home)
    journal.reset_conversation(contact['p_identity'])
    store = store or SupabaseStore.from_home(home)
    store.timeout = 5
    result = store.rpc('support_conversation_reset', {'p_identity': contact['p_identity']})
    if not isinstance(result, dict) or result.get('reset') is not True:
        raise StorageUnavailable('conversation_reset_failed')
    log.info('FMI operator gate reset_conversation completed')
    return contact


def customer_reset_source(chat_id):
    return {'chat_type': 'dm', 'user_id': chat_id, 'chat_id': chat_id}


def swallowed_slash(text):
    """Hermes built-in slashes that must never reach a WhatsApp customer."""
    raw=str(text or '').strip().casefold()
    if not raw.startswith('/') or match_gate(text):
        return False
    head=raw.split()[0].lstrip('/')
    blocked={item.casefold().lstrip('/') for item in (CATALOG.get('swallow_hermes_slashes') or [])}
    return head in blocked or head in {'new','reset'}


async def send_whatsapp(gateway, chat, text):
    adapters = getattr(gateway, 'adapters', {}) or {}
    for platform, adapter in adapters.items():
        if getattr(platform, 'value', platform) == 'whatsapp' and hasattr(adapter, 'send'):
            await adapter.send(chat, text)
            return True
    return False
