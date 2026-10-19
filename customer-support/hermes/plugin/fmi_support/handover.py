"""Owner-only, durable per-chat handover; no control words reach the model."""
import asyncio
from dataclasses import replace
import hashlib
import logging
from .identity import intake_payload
from .journal import Journal

log = logging.getLogger('fmi.support')
def suppress_notice(content):
    text = str(content or '').strip().casefold()
    return not text or 'no home channel is set' in text or ('home channel' in text and '/sethome' in text)


SKIP = {'action': 'skip', 'reason': 'fmi_human_handover'}


def contact_for(chat):
    return intake_payload({'platform': 'whatsapp', 'chat_type': 'dm',
        'user_id': chat, 'session_id': 'handover-' + hashlib.sha256(str(chat).encode()).hexdigest()})


class Handover:
    def __init__(self, home):
        self.journal = Journal(home)
        with self.journal.connect() as db:
            db.execute('create table if not exists support_handover(identity text primary key, paused integer not null)')
            db.execute('create table if not exists support_handover_generation(identity text primary key, generation integer not null)')

    def generation(self, chat):
        contact=contact_for(chat)
        if not contact:return 0
        with self.journal.connect() as db:
            row=db.execute('select generation from support_handover_generation where identity=?',(contact['p_identity'],)).fetchone()
        return row[0] if row else 0

    def paused(self, chat):
        contact = contact_for(chat)
        if not contact:
            return False
        with self.journal.connect() as db:
            row = db.execute('select paused from support_handover where identity=?', (contact['p_identity'],)).fetchone()
        return bool(row and row[0])

    def set_paused(self, chat, paused):
        contact = contact_for(chat)
        if not contact:
            raise ValueError('invalid_chat_identity')
        with self.journal.connect() as db:
            db.execute('insert into support_handover values(?,?) on conflict(identity) do update set paused=excluded.paused',
                       (contact['p_identity'], int(paused)))
            db.execute('insert into support_handover_generation values(?,1) on conflict(identity) do update set generation=generation+1',(contact['p_identity'],))

    def save(self, chat, message_id, text, owner):
        contact = contact_for(chat)
        if not contact or not message_id:
            return
        self.journal.save(contact, 'transport:' + str(message_id),
                          'assistant' if owner else 'user', text, historical=owner)


def install_delivery_guard(adapter, home):
    """Version-tested adapter boundary: Hermes has no outgoing policy hook.

    Do not edit Hermes source. Check each bridge chunk, edits and typing as well
    as normal sends; an already submitted network request cannot be recalled.
    """
    if not adapter or getattr(adapter, '_fmi_handover_guard', False):
        return
    from gateway.platforms.base import SendResult
    def blocked(chat):
        try:
            return Handover(home).paused(chat)
        except Exception:
            log.error('FMI handover state unavailable; suppressing outbound reply')
            return True
    original_post = adapter._post_bridge_message
    async def guarded_post(path, payload, **kwargs):
        if suppress_notice(payload.get('message', payload.get('caption', 'media'))) or blocked(payload.get('chatId')):
            return SendResult(success=True, raw_response={'fmi_suppressed': True})
        return await original_post(path, payload, **kwargs)
    adapter._post_bridge_message = guarded_post
    for name in ('send', 'edit_message', 'send_typing'):
        original = getattr(adapter, name, None)
        if original is None:
            continue
        def wrap(fn, method):
            async def guarded(chat_id, *args, **kwargs):
                if (method == 'send' and suppress_notice(args[0] if args else kwargs.get('content'))) or blocked(chat_id):
                    return None if method == 'send_typing' else SendResult(success=True, raw_response={'fmi_suppressed': True})
                return await fn(chat_id, *args, **kwargs)
            return guarded
        setattr(adapter, name, wrap(original, name))
    adapter._fmi_handover_guard = True


def install_gateway_guards(gateway, home):
    for platform, adapter in gateway.adapters.items():
        if getattr(platform, 'value', platform) == 'whatsapp':
            install_delivery_guard(adapter, home)
            log.debug('FMI WhatsApp handover delivery guard ready')


async def _dispatch(event, gateway, **kwargs):
    source = event.source
    if getattr(source.platform, 'value', source.platform) != 'whatsapp' or source.chat_type != 'dm':
        return None
    from hermes_constants import get_hermes_home
    home = get_hermes_home()
    install_gateway_guards(gateway, home)
    owner = (event.metadata or {}).get('whatsapp_from_owner') is True
    # This hook runs before authorization. Check the customer chat, even for an
    # owner event whose sender_id is the business account itself.
    admitted_source = replace(source, user_id=source.chat_id) if owner else source
    if not gateway._is_user_authorized_for_source(admitted_source):
        return SKIP if owner else None
    state = Handover(home)
    chat = source.chat_id
    if not contact_for(chat):
        return SKIP if owner else None
    text = event.text or ''
    if owner and text.startswith('[owner reply] '):
        text = text[len('[owner reply] '):]
    command = text.strip().casefold()
    from .gates import FIRST_CONTACT,customer_reset_source,gate_sender,match_gate,reset_contact,send_whatsapp,swallowed_slash
    from .voice import split_bubbles
    sender = 'operator_tester' if owner else gate_sender(admitted_source)
    gate = match_gate(text, sender)
    if gate and gate.get('action')=='switch_backend':
        # Admission already flipped the backend. Do not toggle again.
        return SKIP
    if gate and gate.get('action')=='reset_conversation':
        # Consume the slash here. If this hook returns None, Hermes treats /new as
        # its own session command and leaks a confirm prompt plus model banner.
        try:
            reset_contact(home, customer_reset_source(chat), 'reset-'+chat)
        except Exception:
            log.error('FMI conversation reset unavailable')
        try:
            await gateway._interrupt_and_clear_session(
                gateway._session_key_for_source(admitted_source), admitted_source,
                interrupt_reason='stop_command', invalidation_reason='fmi_conversation_reset')
        except Exception:
            log.error('FMI reset could not clear the Hermes session')
        try:
            state.set_paused(chat, False)
        except Exception:
            log.error('FMI reset could not clear handover pause')
        try:
            for part in split_bubbles(FIRST_CONTACT):
                await send_whatsapp(gateway, chat, part)
        except Exception:
            log.error('FMI reset greeting was not delivered')
        return SKIP
    if swallowed_slash(text):
        return SKIP
    if owner and command in {'hmm', 'okies'}:
        # Remain paused until interrupted work is invalidated, including when
        # resuming. This prevents an old generation from leaking after okies.
        state.set_paused(chat, True)
        await gateway._interrupt_and_clear_session(
            gateway._session_key_for_source(admitted_source), admitted_source,
            interrupt_reason='stop_command', invalidation_reason='fmi_human_handover')
        if command == 'okies':
            state.set_paused(chat, False)
        return SKIP
    paused = state.paused(chat)
    if owner or paused:
        await asyncio.to_thread(state.save, chat, event.message_id, text, owner)
        return SKIP
    return None


async def dispatch(event, gateway, **kwargs):
    try:
        return await _dispatch(event, gateway, **kwargs)
    except Exception as error:
        source = getattr(event, "source", None)
        if getattr(getattr(source, "platform", None), "value", getattr(source, "platform", None)) == "whatsapp":
            log.error("FMI handover check failed; holding silently (%s)", type(error).__name__)
            return SKIP
        raise
