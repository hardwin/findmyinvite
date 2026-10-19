"""Bounded three-agent WhatsApp desk: listener, sales, reviewer. Not a script."""
import json
from pathlib import Path

from .backend import complete,parse_json
from .layers import data_layer,remember,tool_instruction
from .policy import FALLBACK
from .storage import StorageUnavailable
from .voice import (PAYMENT_URL,display_name,false_payment,invented_facts,invented_price,
                    last_assistant,name_only,name_next,rewrite_customer_language,
                    strip_markup,strip_prices,usable_history)

LISTENER=('You are the listener agent on the FMI WhatsApp sales desk. '
          'Read the latest customer line and the last assistant bubble. '
          'Reply JSON only: {"intent":"name|who_for|show_collections|like_video|pick_offer|ask_price|pay|paid|date_early|other",'
          '"offer":"text|face|exclusive|null","notes":"one line"}. '
          'Yes, sure, show, samples after a collections question is show_collections, not a paid offer. '
          'Do not write a customer message.')
SALES=('You are the sales agent. Write the WhatsApp reply the customer will see. '
       'Casual local editor bro. 1 or 2 short bubbles, never more than 3. '
       'Follow the listener JSON and the tool facts. Do not invent a date, venue, name, or rupee. '
       'Shop and reel URLs stay on their own lines. Never say template.')
REVIEWER=('You are the reviewer agent. Check the draft. Reply JSON only: '
          '{"ok":true} or {"ok":false,"notes":"what to fix"}. '
          'Fail if it quotes a price before they picked an offer, says pay first while they are still choosing, '
          'sends the payment link before a pick, invents ₹ except 999 or 1499 after a pick, '
          'says template, confirms a payment, or invents a date or venue. '
          'Do not write a customer message.')
def workflow_text():
    from .skill import skill_dir
    path=skill_dir()/'references'/'WORKFLOW.md'
    if path.exists():
        return path.read_text(encoding='utf-8')
    fallback=Path(__file__).resolve().parents[2]/'skills'/'fmi-whatsapp-sales'/'references'/'WORKFLOW.md'
    return fallback.read_text(encoding='utf-8') if fallback.exists() else ''


def brief_system(role):
    return 'WORKFLOW\n'+workflow_text()+'\n\nDATA\n'+data_layer()+'\n\nROLE\n'+role


def _history(history):
    rows=[]
    for row in usable_history(history):
        role=row.get('role');content=(row.get('content') or '')[-800:]
        if role in {'user','assistant'} and content:
            rows.append({'role':role,'content':content})
    return rows


def _ask(home,system,text,history,think=False,num_predict=120,timeout=12):
    messages=[{'role':'system','content':system}]
    messages.extend(_history(history))
    messages.append({'role':'user','content':text})
    return complete(home,messages,think,num_predict,timeout)


def listen(home,text,history):
    last=last_assistant(history)
    prompt=brief_system(LISTENER)+'\nLast assistant bubble: '+(last or '(none)')
    try:
        data=parse_json(_ask(home,prompt,text,history,False,80,12))
    except StorageUnavailable:
        data={}
    intent=data.get('intent') if data.get('intent') in {
        'name','who_for','show_collections','like_video','pick_offer','ask_price','pay','paid','date_early','other'
    } else 'other'
    offer=data.get('offer') if data.get('offer') in {'text','face','exclusive'} else None
    return {'intent':intent,'offer':offer,'notes':str(data.get('notes') or '')[:240]}


def facts_for(brief,text,history,gender):
    bits=[brief_system(SALES),'Listener JSON: '+json.dumps(brief,ensure_ascii=False)]
    extra=tool_instruction(text,gender)
    if extra:
        bits.append(extra)
    return '\n\n'.join(bits)


def sales(home,text,history,brief,gender,notes=''):
    from .skill import skill_text
    system=facts_for(brief,text,history,gender)+'\n\n'+skill_text()
    if notes:
        system+='\n\nReviewer notes: '+notes+'\nRewrite the customer reply from the WORKFLOW. Keep it short.'
    return _ask(home,system,text,history,False,280,30)


def review(home,draft,text,history):
    prompt=brief_system(REVIEWER)+'\nCustomer just said: '+text+'\nDraft:\n'+draft
    try:
        return parse_json(_ask(home,prompt,text,history,False,80,10))
    except StorageUnavailable:
        return {'ok':True}


def sanitize(reply,text,history):
    body=rewrite_customer_language(strip_markup(reply),[])
    if invented_price(body):
        body=strip_prices(body)
    if false_payment(body,text,history):
        return 'got it — what time did you pay?'
    if invented_facts(body,text,history):
        body=strip_prices(body)
    return body.strip()


def converse(home,text,history=None):
    """Listener -> sales -> reviewer. One optional rewrite. No canned replacement."""
    history=history or []
    gender=None
    if name_only(text):
        from .skill import classify_gender
        gender=classify_gender(home,display_name(text))
    brief=listen(home,text,history)
    if name_only(text) and brief.get('intent')=='other':
        brief['intent']='name'
    draft=sales(home,text,history,brief,gender)
    checked=review(home,draft,text,history)
    if checked.get('ok') is False:
        draft=sales(home,text,history,brief,gender,str(checked.get('notes') or 'fix the draft'))
    reply=sanitize(draft,text,history)
    if name_only(text) and (not reply or 'full custom' in reply.casefold() or PAYMENT_URL in reply):
        reply=name_next(text,gender)
    if not reply:
        reply=FALLBACK
    remember(home,{'tool':'gender' if name_only(text) else 'desk','result':gender if name_only(text) else brief.get('intent'),
                   'quality':'rewritten' if checked.get('ok') is False else 'passed','executed':False,
                   'intent':brief.get('intent')})
    if not reply:
        raise StorageUnavailable('empty_model_reply')
    return reply
