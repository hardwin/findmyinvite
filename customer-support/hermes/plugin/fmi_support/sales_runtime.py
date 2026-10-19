"""WhatsApp admission: /new and /switch here; the sales desk owns customer turns."""
import asyncio
import logging
from .identity import intake_payload
from .journal import Journal
from .storage import SupabaseStore, StorageUnavailable
from .policy import FALLBACK
from .conversation import merge_history
from .backend import apply_switch
from .gates import FIRST_CONTACT,gate_sender,match_gate,reset_contact,swallowed_slash
from .qwen_workflow import reason_and_reply
from .skill import talk
from .voice import deliver_whatsapp_bubbles,split_bubbles

log=logging.getLogger('fmi.support')


def respond(home,source,session_key,message_id,text,store=None,decider=None,cancelled=lambda:False):
    contact=intake_payload({'platform':'whatsapp','chat_type':source.get('chat_type'),
                           'user_id':source.get('user_id'),'session_id':session_key})
    if contact is None or not message_id:
        raise StorageUnavailable('missing_admitted_identity')
    journal=Journal(home)
    event='transport:'+str(message_id)
    journal.bind(contact)
    journal.enqueue(contact)
    journal.import_legacy(contact)
    key=journal.save(contact,event,'user',text)
    store=store or SupabaseStore.from_home(home)
    store.timeout=5
    store.record(contact)
    if key:journal.flush_messages(store,key=key,limit=1)
    remote=store.recent_messages(contact['p_identity'])
    if not isinstance(remote,list):raise StorageUnavailable('missing_history')
    remote=journal.since_reset(remote,contact['p_identity'])
    journal.cache_history(contact['p_identity'],remote)
    history=merge_history(remote,journal.recent(contact['p_identity']),key)
    if cancelled():return None
    if decider:
        data=store.rpc('support_sales_context',{'p_identity':contact['p_identity'],'p_event_id':event})
        if not isinstance(data,dict):raise StorageUnavailable('missing_sales_context')
        if data.get('previous_reply') is not None:
            journal.save(contact,event,'assistant',data['previous_reply'])
            return None
        existing=data.get('state') or {}
        state,reply=reason_and_reply(home,existing,text,data['templates'],data.get('verified'),history,decider,cancelled)
        if cancelled() or state is None:return None
        saved=store.rpc('support_sales_save',{'p_identity':contact['p_identity'],'p_event_id':event,
            'p_revision':data['revision'],'p_state':state,'p_reply':reply})
        if saved:
            key=journal.save(contact,event,'assistant',reply)
            try:journal.flush_messages(store,key=key,limit=1)
            except StorageUnavailable:log.warning('FMI sales reply history queued for synchronization')
            return reply
        raise StorageUnavailable('sales_revision_conflict')
    reply=talk(home,text,history)
    if cancelled():return None
    key=journal.save(contact,event,'assistant',reply)
    try:
        if key:journal.flush_messages(store,key=key,limit=1)
    except StorageUnavailable:
        log.warning('FMI sales reply history queued for synchronization')
    return reply


async def handle_sales(platform='',source=None,session_key='',message_id='',text='',**kwargs):
    if platform!='whatsapp' or not source or source.get('chat_type')!='dm':return None
    from hermes_constants import get_hermes_home
    home=get_hermes_home()
    from .handover import Handover
    try:
        controls=Handover(home)
        chat=source.get('chat_id')
    except Exception:
        log.error('FMI handover storage unavailable; holding silently')
        return {'action':'handled'}
    gate=match_gate(text,gate_sender(source))
    if gate and gate.get('action')=='switch_backend':
        try:
            reply=apply_switch(home,text)
        except Exception as error:
            log.error('FMI backend switch unavailable (%s)',type(error).__name__)
            return {'action':'handled','reply':FALLBACK}
        return {'action':'handled','reply':reply}
    if gate and gate.get('action')=='reset_conversation':
        try:
            await asyncio.to_thread(reset_contact,home,source,session_key or 'reset')
            controls.set_paused(chat,False)
        except Exception as error:
            log.error('FMI conversation reset unavailable (%s)',type(error).__name__)
            return {'action':'handled','reply':FALLBACK}
        return {'action':'handled','reply':FIRST_CONTACT}
    if swallowed_slash(text):
        return {'action':'handled'}
    if controls.paused(chat):
        return {'action':'handled'}
    try:
        reply=await asyncio.wait_for(asyncio.to_thread(respond,home,source,session_key,message_id,text),timeout=90)
    except Exception as error:
        log.error('FMI skill reply unavailable (%s)',type(error).__name__)
        reply=FALLBACK
    if reply:
        parts=split_bubbles(reply)
        if deliver_whatsapp_bubbles(chat,parts):
            return {'action':'handled'}
        return {'action':'handled','reply':reply}
    return {'action':'handled'}
