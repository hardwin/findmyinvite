"""Customer-facing wording and WhatsApp bubble delivery."""
import json
import re
import time
from urllib.request import Request,build_opener

from .storage import NoRedirect

INSTAGRAM_PAGE='https://www.instagram.com/findmyinvite.ai'
URL=re.compile(r'https?://\S+')
TEMPLATE_WORD=re.compile(r'\btemplates?\b',re.I)
PRIOR=re.compile(r'\b(?:you mentioned|you said|earlier|previously|last time)\b',re.I)
ROBOT=re.compile(r"I'?m (?:FMI'?s |FindMyInvite'?s )?(?:virtual )?assistant|how can I (?:help|assist)|team member",re.I)
FORMAL=re.compile(r"thanks for chatting|noted down|team'?s brief|we are still looking|exactly how I'?d imagine|looking at options",re.I)
DATE_TOKEN=re.compile(r'\b\d{1,2}(?:st|nd|rd|th)\b',re.I)
NAMED_PLAN=re.compile(r'\byour\s+\*?([A-Za-z][A-Za-z.\'-]{2,})\*?\s+plan\b',re.I)
MARKDOWN_LINK=re.compile(r'\[([^\]]*)\]\((https?://[^)]*)\)')
BROKEN_MARKDOWN=re.compile(r'\[[^\]]*\]\(\s*')
OFFER=re.compile(r'full custom|exclusive|from scratch|reel|instagram|payment|video|bride|groom|\u20b9',re.I)
SKIPPED=re.compile(r'full custom|exclusive|\breel\b|instagram\.com|payment|\u20b9',re.I)
NAME_FILLER=re.compile(r"^(?:(?:hi|hey|hello|i am|i'?m|im|my name is|this is|name is)\s+)+",re.I)
NOT_NAMES={'no','yes','ok','okay','hi','hey','hello','nah','nope','yep','yeah','thanks','thank','please','stop','hmm','okies','show','see','want','like','myself','for','same','details','custom','me','face','faces','not','that','video'}
COLLECTIONS_ASK='do you want to see our collections to choose from?'
COLLECTIONS_SHOW='https://www.instagram.com/findmyinvite.ai\n\nhttps://www.instagram.com/reel/Dd9nJFRTWpB/'
FACES_ASK='do you want bride and groom actual faces on the video?\n\ntext change on our collection, text change with face, or a full custom creative invite'
PAY_FIRST='pay to confirm the order first. our designer will collect the details after payment'
LINK_ABOVE="link's above. pay that first — the designer collects the details after"
SHOW_ASK=re.compile(r'^(?:yes[\s,]+)?(?:show|see)(?:\s+me)?[.! ]*$|^yes[\s,]+(?:show|see)\b',re.I)
WHO_FOR=re.compile(r'^(?:for )?(?:me|myself)$|^for my [\w\' ]{2,40}$|^my [\w\' ]{2,40}$',re.I)
LIKED=re.compile(r"i like it|i like this|i like that|same one|with my details|no custom|not custom",re.I)
PRICE_ASK=re.compile(r'\bhow much\b|\bwhat\b.{0,16}\bprice\b|\bprice\b',re.I)
FACE_OFFER=re.compile(r'with our faces|our pics|our face|face change|text change with face|\bfaces\b',re.I)
TEXT_OFFER=re.compile(r'text change|names and wording|only the wording|\bwording\b|no faces|without faces',re.I)
TEXT_PRICE='text change is ₹999'
FACE_PRICE='text change with face is ₹1499'
EXCLUSIVE_PRICE="full custom price isn't set, so I won't guess a number"
PRICE_MENU='text change is ₹999\ntext change with face is ₹1499\nfull custom price isn\'t set'
LISTED_AMOUNT={'999','1499'}
CUSTOM_WORDS=re.compile(r'full custom|exclusive|from scratch',re.I)
INVENTED_CUSTOM=re.compile(r'full custom|from scratch|no reels|no videos at all',re.I)
BUDGET_ASK=re.compile(r'how much are you looking|your budget|how much .{0,40}spend|price will be lower',re.I)
DETAIL_ASK=re.compile(r'\b(?:what|which) date\b|\bvenue\b|\bdate and venue\b|who is getting married|more details|wording',re.I)
BOT_SAID_PAID=re.compile(r'\byou (?:just )?paid\b|\bsince you paid\b',re.I)
YES_WORD=re.compile(r'^(?:yes|yeah|yep|ok|okay|sure)[.! ]*$',re.I)
BOY_QUESTION=re.compile(r'relative of the bride',re.I)
PAYMENT_URL='https://example.invalid/fmi-demo-payment'
PAYMENT_LINE=PAYMENT_URL+' (TEST — cannot accept payment)'
RUPEE=re.compile(r'₹|\brs\.?\s*\d|\brupees?\b|\binr\b',re.I)
PAY_ASK=re.compile(r'\b(?:pay|payment|checkout)\b|\bsend(?: me)? (?:the |a )?link\b',re.I)
PAID_CLAIM=re.compile(r"\b(?:i paid|i'?ve paid|i have paid|payment done)\b",re.I)
PAID_CONFIRM=re.compile(r'\b(?:confirmed|confirmation of payment|payment (?:is|was) (?:received|verified)|got confirmation|we(?:\'ve| have) received)\b',re.I)
VIDEO_PICK=re.compile(r'church|christian|reel|instagram\.com',re.I)
OFFER_PICK=re.compile(r'text change|names and wording|\bwording\b|face|outfit|our pics|full custom|exclusive',re.I)


def spoken_name(template):
    raw=(template or {}).get('customer_name') or ''
    if raw.strip():return raw.strip()
    name=(template or {}).get('name') or ''
    return re.sub(r'\s*Template(?:\s*v\d+)?\s*$','',name,flags=re.I).strip() or name


def display_name(value):
    cleaned=NAME_FILLER.sub('',(value or '').strip())
    token=re.sub(r'[^A-Za-z]+','',cleaned.split()[0] if cleaned.split() else '')
    if len(token)<3 or token.casefold() in NOT_NAMES:return ''
    return token[:1].upper()+token[1:].casefold()


def name_only(text):
    raw=(text or '').strip()
    if not raw or OFFER.search(raw) or re.search(r'\d',raw):return False
    cleaned=NAME_FILLER.sub('',raw)
    cleaned=re.sub(r'[^A-Za-z\s]+','',cleaned).strip()
    parts=[part for part in cleaned.split() if part.casefold() not in NOT_NAMES]
    return len(parts)==1 and len(parts[0])>=3 and parts[0].isalpha()


def name_next(text,gender=None):
    """Follow a gender-tool result. Never classify the name here."""
    name=display_name(text)
    if gender=='boy' and name:
        return f"{name} — you the bride or a relative of the bride?"
    if name:
        return f"{name} — who is the video for?"
    return "who is the video for?"


def rewrite_customer_language(reply,templates):
    text=reply or ''
    for item in templates or []:
        internal=item.get('name') or ''
        spoken=spoken_name(item)
        if internal and spoken and internal.casefold()!=spoken.casefold():
            text=re.sub(re.escape(internal),spoken,text,flags=re.I)
    def swap(word):
        return 'videos' if word.group(0).lower().endswith('s') else 'video'
    parts=[];last=0
    for match in URL.finditer(text):
        parts.append(TEMPLATE_WORD.sub(swap,text[last:match.start()]))
        parts.append(match.group(0));last=match.end()
    parts.append(TEMPLATE_WORD.sub(swap,text[last:]))
    return ''.join(parts)


def customer_said(text,history):
    bits=[text or '']
    for row in history or []:
        if row.get('role')=='user':
            bits.append(row.get('content') or '')
    return ' '.join(bits).casefold()


def fabricated_prior(reply,text,history):
    if not PRIOR.search(reply or ''):return False
    current=(text or '').strip().casefold()
    for row in history or []:
        if row.get('role')=='user' and (row.get('content') or '').strip().casefold() not in {'',current}:
            if not re.fullmatch(r'(?:hi|hey|hello)[.! ]*',(row.get('content') or '').strip(),re.I):
                return False
    return True


def invented_facts(reply,text,history):
    said=customer_said(text,history)
    for match in DATE_TOKEN.finditer(reply or ''):
        if match.group(0).casefold() not in said:
            return True
    for match in NAMED_PLAN.finditer(reply or ''):
        if match.group(1).casefold() not in said:
            return True
    if FORMAL.search(reply or ''):
        return True
    return fabricated_prior(reply,text,history)


def normalize_reply(text):
    body=URL.sub('',text or '')
    body=re.sub(r'[^a-z0-9]+',' ',body.casefold())
    return re.sub(r'\s+',' ',body).strip()


def same_reply(reply,previous):
    a,b=normalize_reply(reply),normalize_reply(previous)
    if not a or not b:return False
    if a==b or a[:60]==b[:60]:return True
    return (len(a)>40 and a in b) or (len(b)>40 and b in a)


def last_assistant(history):
    for row in reversed(history or []):
        if row.get('role')=='assistant':
            return row.get('content') or ''
    return ''


def usable_history(history):
    kept=[]
    previous=''
    for row in history or []:
        role=row.get('role');content=(row.get('content') or '').strip()
        if role=='user' and content:
            kept.append(row);continue
        if role!='assistant' or not content:
            continue
        if invented_facts(content,'',history) or same_reply(content,previous):
            continue
        kept.append(row);previous=content
    return kept[-8:]


def strip_markup(text):
    raw=MARKDOWN_LINK.sub(lambda m:m.group(2) or m.group(1),text or '')
    raw=BROKEN_MARKDOWN.sub('',raw)
    return re.sub(r'[*_`]{1,3}','',raw).strip()


def skipped_offer(reply,text):
    return name_only(text) and bool(SKIPPED.search(reply or ''))


def ignores_tool(reply,text,gender):
    if not name_only(text) or gender not in {'boy','girl','unknown'}:return False
    asks=bool(BOY_QUESTION.search(reply or ''))
    return not asks if gender=='boy' else asks


def said_so_far(text,history):
    return ' '.join([text or '']+[(row.get('content') or '') for row in history or []])


def ready_to_pay(text,history):
    if PAID_CLAIM.search(text or '') or not PAY_ASK.search(text or ''):return False
    said=said_so_far(text,history)
    if CUSTOM_WORDS.search(said):return True
    return bool(VIDEO_PICK.search(said) and OFFER_PICK.search(said))


def rupee_amounts(text):
    return [item.replace(',','') for item in re.findall(r'(?:₹|\brs\.?\s*|\brupees?\s*|\binr\s*)([0-9][0-9,]*)',text or '',re.I)]


def invented_price(reply,prices_set=False):
    amounts=rupee_amounts(reply)
    return any(amount not in LISTED_AMOUNT for amount in amounts)


def strip_prices(reply):
    kept=[line for line in (reply or '').splitlines() if line.strip() and not RUPEE.search(line)]
    return '\n'.join(kept).strip()


def withheld_link(reply,text,history):
    return ready_to_pay(text,history) and PAYMENT_URL not in (reply or '')


def order_chosen(history):
    said=' '.join((row.get('content') or '') for row in history or [])
    return bool(VIDEO_PICK.search(said) and OFFER_PICK.search(said))


def wants_show(text):
    return bool(SHOW_ASK.search((text or '').strip()))


def who_for_answer(text,history=None):
    raw=re.sub(r'[.!?]+$','',(text or '').strip())
    if CUSTOM_WORDS.search(raw) or PAY_ASK.search(raw) or VIDEO_PICK.search(raw):return False
    if CUSTOM_WORDS.search(customer_said('',history or [])):return False
    return bool(WHO_FOR.match(raw))


def liked_video(text):
    return bool(LIKED.search(text or ''))


def invented_custom(reply,text,history):
    if not INVENTED_CUSTOM.search(reply or ''):return False
    return not CUSTOM_WORDS.search(customer_said(text,history))


def asks_budget(reply,prices_set=False):
    return bool(BUDGET_ASK.search(reply or ''))


def collects_details_early(reply,history):
    if PAYMENT_URL in ' '.join((row.get('content') or '') for row in history or [] if row.get('role')=='assistant'):
        return False
    return bool(DETAIL_ASK.search(reply or ''))


def offer_in(text):
    raw=text or ''
    if re.search(r'\bno faces\b|\bwithout faces\b|\bno custom\b|\bnot custom\b',raw,re.I):
        return 'text' if re.search(r'\bno faces\b|\bwithout faces\b',raw,re.I) else None
    if CUSTOM_WORDS.search(raw):return 'exclusive'
    if FACE_OFFER.search(raw) or re.search(r'\bface\b',raw,re.I):return 'face'
    if TEXT_OFFER.search(raw):return 'text'
    return None


def chosen_offer(text,history):
    if YES_WORD.match((text or '').strip()) and 'faces on the video' in last_assistant(history).casefold():
        return 'face'
    if re.search(r'^no\b',(text or '').strip(),re.I) and 'faces on the video' in last_assistant(history).casefold():
        return 'text'
    picked=offer_in(text)
    if picked:return picked
    for row in reversed(history or []):
        if row.get('role')=='user':
            picked=offer_in(row.get('content') or '')
            if picked:return picked
    return None


def video_known(text,history):
    return bool(VIDEO_PICK.search(said_so_far(text,history)))


def quote_for(offer):
    if offer=='face':return FACE_PRICE
    if offer=='text':return TEXT_PRICE
    if offer=='exclusive':return EXCLUSIVE_PRICE
    return ''


def priced_link(text,history):
    offer=chosen_offer(text,history)
    line=quote_for(offer)
    if offer=='exclusive' and not PAY_ASK.search(text or ''):
        return line
    if line:
        return line+'\n'+PAYMENT_LINE
    return "link's here\n"+PAYMENT_LINE


def selection_ready(text,history):
    picked=offer_in(text) or (chosen_offer(text,history) if YES_WORD.match((text or '').strip()) or re.search(r'^no\b',(text or '').strip(),re.I) else None)
    if not picked:return False
    if 'faces on the video' in last_assistant(history).casefold():return True
    return video_known(text,history)


def confirms_offer(text,history):
    if not YES_WORD.match((text or '').strip()):return False
    last=last_assistant(history).casefold()
    return 'faces on the video' in last or 'text change' in last or 'creative invite' in last


def giving_details(text):
    return bool(DATE_TOKEN.search(text or ''))


def false_payment(reply,text,history=None):
    if not PAID_CLAIM.search(text or ''):return False
    if PAID_CONFIRM.search(reply or '') or re.search(r'\bverified\b',reply or '',re.I):return True
    if not order_chosen(history) and PAYMENT_URL in (reply or ''):return True
    return not re.search(r'\btime\b',reply or '',re.I)


def payment_nudge(text,history,prices_set=False):
    if PAID_CLAIM.search(text or ''):
        return '\nThey claim they paid. Ask what time. Do not say confirmed, verified, or received.'
    line='\nListed prices only: text change ₹999, text change with face ₹1499. Full custom has no price. Never write another amount.'
    if liked_video(text) or wants_show(text):
        line+='\nThey are still choosing. Do not say pay first, lock it in, or send the payment link.'
    elif PRICE_ASK.search(text or '') and not chosen_offer(text,history):
        line+='\nThey asked the price before picking. Say only: '+PRICE_MENU.replace('\n',' ')+'\nDo not say pay first. Do not send the link.'
    elif selection_ready(text,history) or ready_to_pay(text,history) or (PRICE_ASK.search(text or '') and chosen_offer(text,history)):
        line+='\nThey picked. Quote that one price, then send: '+PAYMENT_LINE
    elif who_for_answer(text,history):
        line+='\nThey said who it is for. Ask only: '+COLLECTIONS_ASK+'\nDo not say full custom. Do not recap it as a solo project.'
    elif giving_details(text):
        line+='\n'+PAY_FIRST+'\nDo not repeat the date or venue.'
    elif name_only(text):
        line+='\nAsk only the next question. Do not guess a wife, groom, sister, or solo project.'
    return line


def blocked_reply(reply,text,history,gender=None,prices_set=False):
    if not (reply or '').strip():return True
    if invented_facts(reply,text,history):return True
    if invented_price(reply,prices_set):return True
    if invented_custom(reply,text,history):return True
    if asks_budget(reply,prices_set):return True
    if collects_details_early(reply,history):return True
    if wants_show(text) and ('Dd9nJFRTWpB' not in (reply or '') or normalize_reply(reply)):return True
    if who_for_answer(text,history) and normalize_reply(reply)!=normalize_reply(COLLECTIONS_ASK):return True
    if name_only(text) and normalize_reply(reply)!=normalize_reply(name_next(text,gender)):return True
    if BOT_SAID_PAID.search(reply or '') and not PAID_CLAIM.search(text or ''):return True
    if YES_WORD.match((text or '').strip()) and PAYMENT_URL in last_assistant(history) and normalize_reply(reply)!=normalize_reply(LINK_ABOVE):return True
    if liked_video(text) and normalize_reply(reply)!=normalize_reply(FACES_ASK):return True
    if PRICE_ASK.search(text or '') and not chosen_offer(text,history) and ('999' not in (reply or '') or '1499' not in (reply or '') or PAYMENT_URL in (reply or '') or re.search(r'pay first',reply or '',re.I)):return True
    if PRICE_ASK.search(text or '') and chosen_offer(text,history)=='face' and '1499' not in (reply or ''):return True
    if PRICE_ASK.search(text or '') and chosen_offer(text,history)=='text' and '999' not in (reply or ''):return True
    if selection_ready(text,history) and chosen_offer(text,history)=='face' and '1499' not in (reply or ''):return True
    if selection_ready(text,history) and chosen_offer(text,history)=='text' and '999' not in (reply or ''):return True
    if chosen_offer(text,history)=='exclusive' and any(amount in LISTED_AMOUNT for amount in rupee_amounts(reply)):return True
    if re.search(r'^no\b',(text or '').strip(),re.I) and 'faces on the video' in last_assistant(history).casefold() and PAYMENT_URL not in (reply or ''):return True
    if giving_details(text) and DATE_TOKEN.search(reply or ''):return True
    if giving_details(text) and PAYMENT_URL in last_assistant(history) and 'designer' not in (reply or '').casefold():return True
    if giving_details(text) and order_chosen(history) and PAYMENT_URL not in (reply or '') and PAYMENT_URL not in last_assistant(history):return True
    if withheld_link(reply,text,history):return True
    if false_payment(reply,text,history):return True
    if skipped_offer(reply,text):return True
    if ignores_tool(reply,text,gender):return True
    if same_reply(reply,last_assistant(history)):return True
    return robotic_voice(reply,text)


def listen_reply(text,history,gender=None,prices_set=False):
    if PAID_CLAIM.search(text or ''):
        return 'got it — what time did you pay?'
    if YES_WORD.match((text or '').strip()) and PAYMENT_URL in last_assistant(history):
        return LINK_ABOVE
    if PRICE_ASK.search(text or '') and chosen_offer(text,history):
        return priced_link(text,history)
    if PRICE_ASK.search(text or '') and not chosen_offer(text,history):
        return PRICE_MENU
    if selection_ready(text,history) or ready_to_pay(text,history) or confirms_offer(text,history):
        return priced_link(text,history)
    if wants_show(text):
        return COLLECTIONS_SHOW
    if giving_details(text) and PAYMENT_URL in last_assistant(history):
        return "date and venue come after payment. the designer collects those"
    if giving_details(text):
        if order_chosen(history):
            parts=[quote_for(chosen_offer(text,history)),PAY_FIRST,PAYMENT_LINE]
            return '\n'.join(part for part in parts if part)
        return PAY_FIRST
    if liked_video(text):
        return FACES_ASK
    if re.search(r'^no\b',(text or '').strip(),re.I) and 'faces on the video' in last_assistant(history).casefold():
        return priced_link(text,history)
    if who_for_answer(text,history):
        return COLLECTIONS_ASK
    if name_only(text):
        return name_next(text,gender)
    if re.search(r'full custom|exclusive|from scratch|own video',text or '',re.I):
        return "got it — full custom, we make that from scratch\nwho is the video for?"
    if re.search(r'^no\b',(text or '').strip(),re.I):
        return "okay, not that one\nwhat do you want instead?"
    return "got you\nsay that again in one line?"


def robotic_voice(reply,text):
    if not ROBOT.search(reply or ''):return False
    return not re.search(r'\b(?:are you|bot|human|ai|real person)\b',text or '',re.I)


def split_bubbles(text,max_parts=3):
    raw=strip_markup(text or '')
    if not raw:return []
    urls=[]
    for match in URL.findall(raw):
        url=match.rstrip('.,)')
        if url not in urls:urls.append(url)
    body=URL.sub('\n\n',raw)
    texts=[part.strip() for part in re.split(r'\n\s*\n+',body) if part.strip()]
    if len(texts)==1 and '\n' in texts[0]:
        lines=[line.strip() for line in texts[0].splitlines() if line.strip()]
        if 1<len(lines)<=max_parts:texts=lines
    url_slots=min(len(urls),max_parts)
    texts=texts[:max(0,max_parts-url_slots)]
    out=[]
    if texts:
        out.append(texts[0]);texts=texts[1:]
    if urls:
        out.append(urls[0]);urls=urls[1:]
    out.extend(texts);out.extend(urls)
    return [part for part in out if part][:max_parts]


def deliver_whatsapp_bubbles(chat,parts,endpoint='http://127.0.0.1:3000/send',pause=0.45):
    if not chat or not parts:return False
    sent=0
    opener=build_opener(NoRedirect)
    for index,part in enumerate(parts[:3]):
        request=Request(endpoint,data=json.dumps({'chatId':chat,'message':part}).encode(),
                        headers={'Content-Type':'application/json'})
        try:
            with opener.open(request,timeout=8) as response:
                if getattr(response,'status',200)>=400:return sent>0
        except (OSError,ValueError):
            return sent>0
        sent+=1
        if index+1<len(parts[:3]):time.sleep(pause)
    return sent>0
