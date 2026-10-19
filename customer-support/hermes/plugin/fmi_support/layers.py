"""WhatsApp reply layers. The main reply does not classify gender."""
import json
from datetime import datetime, timezone
from pathlib import Path

from .voice import blocked_reply,display_name,invented_price,listen_reply,name_only,strip_prices

REGISTERED_TOOLS={'gender'}
GENDERS={'boy','girl','unknown'}


def data_layer():
    from .sales import KNOWLEDGE
    shop=KNOWLEDGE['shop_window']
    video=shop['seeded_video']
    return ('DATA\nInstagram shop: '+shop['instagram_page']
            +'\nLead video: '+video['customer_name']
            +' (views floor '+str(video['instagram_views_floor'])+').'
            +'\nDo not invent another video or a view count.')


def hermes_learning():
    """Hermes already has a journey graph of learned skills and MEMORY.md.

    Customer memory stays off so one chat cannot recall another. FMI learning
    is an operator retrospective, not a name list.
    """
    try:
        import agent.learning_graph  # noqa: F401
        return 'hermes_journey'
    except Exception:
        return 'local_retrospective'


def parse_gender(raw):
    text=raw or ''
    start,end=text.find('{'),text.rfind('}')
    if start<0 or end<=start:return 'unknown'
    try:
        value=str(json.loads(text[start:end+1]).get('gender','')).casefold()
    except (ValueError,TypeError,AttributeError):
        return 'unknown'
    if value in {'male','man','boy'}:return 'boy'
    if value in {'female','woman','girl'}:return 'girl'
    return value if value in GENDERS else 'unknown'


def tool_instruction(text,gender):
    if not name_only(text) or gender not in GENDERS:return ''
    return ('\nTOOL\nGender tool result: '+gender
            +'. The main reply must follow it and must not classify the name.'
            +'\nAsk only this, one short bubble: '+listen_reply(text,[],gender)
            +'\nDo not mention offers, reels, or payment.')


def learning_path(home):
    return Path(home)/'state'/'fmi-support'/'learning.jsonl'


def recent_learning(home,limit=8):
    path=learning_path(home)
    if not path.exists():return []
    rows=[]
    for line in path.read_text(encoding='utf-8').splitlines()[-limit:]:
        try:rows.append(json.loads(line))
        except ValueError:continue
    return rows


def remember(home,row):
    path=learning_path(home)
    path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    row=dict(row,at=datetime.now(timezone.utc).isoformat(),hermes_learning=hermes_learning())
    with path.open('a',encoding='utf-8') as stream:
        stream.write(json.dumps(row,ensure_ascii=False)+'\n')
    return row


def parse_proposal(raw):
    text=raw or ''
    start,end=text.find('{'),text.rfind('}')
    if start<0 or end<=start:return {'call':None,'propose':None}
    try:
        data=json.loads(text[start:end+1])
    except (ValueError,TypeError):
        return {'call':None,'propose':None}
    call=data.get('call')
    propose=data.get('propose')
    return {'call':call if call in REGISTERED_TOOLS else None,
            'propose':propose if isinstance(propose,str) and propose and propose not in REGISTERED_TOOLS else None,
            'why':str(data.get('why') or '')[:240]}


def prices_set():
    from .sales import KNOWLEDGE
    return bool(KNOWLEDGE['pricing_authority']['prices_set'])


def run(text,history,gender,complete,propose=None,home=None):
    """Main reply uses the tool fact. Quality can discard it. Proposals are not executed."""
    priced=prices_set()
    reply=complete(gender)
    if invented_price(reply,priced):
        reply=strip_prices(reply)
    failed=blocked_reply(reply,text,history,gender if name_only(text) else None,priced)
    proposal=None
    if failed:
        reply=listen_reply(text,history,gender if name_only(text) else None,priced)
        if propose:
            proposal=parse_proposal(propose(recent_learning(home or '.') if home else []))
    if home:
        row={'tool':'gender' if name_only(text) else None,'result':gender if name_only(text) else None,
             'quality':'rejected' if failed else 'passed','executed':False}
        if proposal and proposal.get('propose'):
            row['proposal']=proposal['propose']
            row['why']=proposal.get('why') or ''
        remember(home,row)
    return reply
