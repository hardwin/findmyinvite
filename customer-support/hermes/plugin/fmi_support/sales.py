"""Deterministic sales workflow. Customer text never verifies money or fulfilment."""
from copy import deepcopy
import re
import json
from pathlib import Path
from urllib.parse import urlsplit
from .gates import FIRST_CONTACT
from .voice import spoken_name

FIELDS = [('occasion','What is the occasion?'),('event_date','What is the event date?'),
          ('style','What style would you like for the invitation?')]
DETAILS = [('names','What names should appear on the invitation?'),
           ('event_date','What is the event date?'),('venue','What venue should appear on the invitation?'),
           ('wording','What invitation wording would you like?')]
KNOWLEDGE=json.loads((Path(__file__).with_name('business_knowledge.json')).read_text())
PHOTO_RULE=KNOWLEDGE['photo_personalization']
DEMO_URL = 'https://example.invalid/fmi-demo-payment'


def listed_custom_paise(template):
    if not template:return None
    return template.get('custom_price_paise') or template.get('personalized_price_paise')


def has(pattern,text): return bool(re.search(pattern,text,re.I))
def amount(paise): return '₹' + format(paise/100, '.2f').removesuffix('.00')
def safe_url(value):
    try:
        p=urlsplit(value or '')
        return bool(p.scheme=='https' and p.netloc and not p.username and not p.password)
    except ValueError: return False


def advance(previous, text, templates, verified=None, demo_payments=True):
    s=deepcopy(previous or {})
    v=verified or {}
    t=text.strip()
    low=t.casefold()
    s.setdefault('stage','discovery'); s.setdefault('details',{})
    s.setdefault('goal','send_catalog_payment_link')
    s.setdefault('control','automation')
    chosen=next((x for x in templates if x['id']==s.get('template_id')),None)

    def reply(message, stage=None, action=None):
        if stage: s['stage']=stage
        if action: s['next_action']=action
        s['last_question']=message
        return s,message
    def team(reason,message):
        s['needs_team']=True; s['team_reason']=reason
        if message.rstrip().endswith('?'):s['awaiting_review_detail']=reason
        return reply(message,action='team_review:'+reason)
    def collect(fields,stage):
        for key,question in fields:
            if not s['details'].get(key):
                s['awaiting_field']=key
                return reply(question,stage,'collect:'+key)
        s.pop('awaiting_field',None)
        return None
    def checkout(price,message):
        s['quoted_price_paise']=price
        s['quoted_template_name']=spoken_name(chosen) if chosen else s.get('quoted_template_name')
        s['scope_confirmed']=True
        if demo_payments:
            return reply(f"{message} Payment link: {DEMO_URL} (TEST — cannot accept payment)",'payment_demo','await_test_payment_event')
        if chosen and v.get('approved_price_paise')==price and v.get('approved_template_id')==chosen['id'] and v.get('approved_tier')==s.get('tier','standard') and v.get('approved_changes','')==s.get('requested_changes','') and v.get('delivery_terms') and v.get('scope_approved') is True and safe_url(v.get('payment_url')):
            return reply(f"{message} {v['delivery_terms']} Payment link: {v['payment_url']}",'awaiting_payment','verify_payment')
        return team('payment_link','Your selection is saved. The team needs to confirm the delivery terms and provide your payment link before you pay.')
    def quote():
        tier=s.get('tier','standard')
        if tier=='exclusive':
            if chosen and chosen.get('custom_price_paise'):
                return checkout(chosen['custom_price_paise'],f"exclusive {spoken_name(chosen)} is {amount(chosen['custom_price_paise'])}.")
            return reply("that's the exclusive video — personal, for the bride/groom\nI'll share that price separately",'exclusive_interest','share_exclusive_price')
        if chosen is None:
            option=templates[0] if templates else None
            if not option:return team('catalog_unavailable','The team needs to confirm which videos are available.')
            name=spoken_name(option)
            return reply(f"our most watched one is {name}\n{option['instagram_url']}\ntext change {amount(option['standard_price_paise'])} / face, outfit and theme {amount(option['personalized_price_paise'])}",'template_selection','identify_template')
        name=spoken_name(chosen)
        price=chosen['personalized_price_paise'] if tier=='personalized' else chosen['standard_price_paise']
        s['quoted_template_name']=name
        if tier=='personalized':
            return checkout(price,f"{name} with face, outfit and theme is {amount(price)}.")
        return checkout(price,f"{name} with text change is {amount(price)}.\n{chosen['instagram_url']}\nface, outfit and theme is {amount(chosen['personalized_price_paise'])}.")

    if s.get('awaiting_review_detail')=='payment_verification' and v.get('payment_status')=='paid':s.pop('awaiting_review_detail',None)
    if s.get('awaiting_review_detail') and not has(r'\b(refund|cancel|status|paid|payment|urgent|revision|approve)\b',low) and '?' not in t:
        reason=s.pop('awaiting_review_detail')
        s.setdefault('review_details',{})[reason]=t[:2000]
        return reply('I have saved these details for team review.',action='team_review:'+reason)

    # Handle service/support requests ahead of sales; never upsell a complaint.
    if has(r'\b(refund|cancel|complaint|unhappy|disappointed)\b',low):
        s['request']=t
        return team('cancellation_or_complaint','I have saved your request for team review. What happened with your order?')
    if has(r'\b(payment failed|payment pending|debited|charged twice|paid twice)\b',low):
        s['request']=t
        return team('payment_issue','Please do not pay again while the payment is being checked. What time did you make the payment?')
    claimed=has(r'\b(i |we |already |have |has )?(paid|payment done|payment sent)\b',low) and not has(r'\b(not paid|haven.t paid|not yet paid|unpaid)\b',low)
    if claimed and v.get('payment_status')!='paid':
        s['payment_claimed']=True; s['stage']='payment_verification'
        return team('payment_verification','I have noted that you paid. The payment still needs verification; please do not pay again. What time did you pay?')
    if has(r'\b(status|progress|ready yet|where is my|when.*(?:ready|deliver)|track.*order)\b',low):
        status=v.get('production_status')
        texts={'queued':'Your order is queued for production.','in_progress':'Your invitation is in production.',
               'preview_ready':'Your preview is ready.','delivered':'Your invitation is ready to download.'}
        if status in texts:
            link=v.get('delivery_url') if status=='delivered' else v.get('preview_url') if status=='preview_ready' else None
            return reply(texts[status]+(' '+link if safe_url(link) else ''),action='await_customer_or_team')
        return team('order_status','The team needs to confirm the current order status. I cannot confirm a delivery time yet.')
    if has(r'\b(urgent|asap|today|tomorrow|deadline)\b',low):
        s['requested_deadline']=t
        return team('deadline','I have noted your deadline. The team must confirm availability before we promise delivery or take payment.')
    if has(r'\b(download|link.*(?:not|doesn.t|won.t).*open|cannot open|can.t open)\b',low):
        if safe_url(v.get('delivery_url')):
            return reply('Here is your invitation link: '+v['delivery_url']+' What happens when you open it?',action='resolve_delivery_access')
        return team('delivery_access','The team needs to check your delivery link. What happens when you try to open it?')
    if has(r'\b(approve|approved|looks good|finalize|finalise)\b',low) and v.get('production_status')=='preview_ready':
        s['approval_requested']=True; s['stage']='approval_review'
        return team('final_delivery','Your approval is recorded. The team needs to prepare the final delivery link.')
    if has(r'\b(revision|revise|correction|fix spelling)\b',low):
        s['revision_request']=t; s['stage']='revision_review'
        return team('revision','Your requested revision is saved. The team will need to confirm what is included before any extra charge.')
    if has(r'\b(discount|negotiate|cheaper|best price|bargain)\b',low):
        return reply('I can quote the listed price. Any discount needs team approval. Would you like to continue at the listed price?',action='confirm_listed_price')
    if has(r'\b(delivery time|how long|duration|video length|music|language|revision limit|what.*included|deposit|tax|refund policy)\b',low):
        s['policy_question']=t
        if v.get('policy_answer') and v.get('policy_question','').strip().casefold()==low:
            return reply(v['policy_answer'],action='continue_current_stage')
        return team('policy_question','That detail needs team confirmation before you pay. I have saved your question with this conversation.')

    if s.get('awaiting_field') and not has(r'^(hi|hey|hello|ok|okay|yes|no|thanks)[.! ,]*$',low) and '?' not in t:
        s['details'][s.pop('awaiting_field')]=t[:1000]
    if v.get('payment_status')=='paid':
        if s.get('team_reason') in {'payment_verification','payment_link','payment_issue'}:
            s['needs_team']=False;s.pop('team_reason',None);s.pop('awaiting_review_detail',None)
        s['goal']='collect_confirmed_details_and_deliver_invitation'
        got=collect(DETAILS,'details_collection')
        if got:return got
        summary='; '.join(k.replace('_',' ')+': '+s['details'][k] for k,_ in DETAILS)
        if has(r'^(yes|correct|confirmed|confirm)[.! ]*$',low) and s.get('stage')=='details_confirmation':
            s['details_confirmed']=True
            return team('production','Your invitation details are confirmed and saved for production review.')
        return reply('Please confirm these details: '+summary+'. Are they correct?','details_confirmation','confirm_details')

    if has(r'\b(show.*(?:templates?|designs?|videos?)|not sure|undecided|suggest|options)\b',low):
        if not templates:
            return team('catalog_unavailable','The team needs to confirm which videos are available.')
        option=templates[0]
        name=spoken_name(option)
        return reply(f"our most watched one is {name}\n{option['instagram_url']}\ntext change is {amount(option['standard_price_paise'])}",'template_selection','identify_template')

    # Explicit selection wins over inferred intent and previous selection.
    urls=re.findall(r'https?://\S+',t)
    matched=next((x for x in templates if x['name'].casefold() in low or spoken_name(x).casefold() in low or any(urlsplit(u.rstrip('.,)')).path.rstrip('/')==urlsplit(x['instagram_url']).path.rstrip('/') and (urlsplit(u).hostname or '').lower() in {'instagram.com','www.instagram.com'} for u in urls)),None)
    if urls and not matched:
        s['reference_url']=urls[0]
        return team('unknown_template','I could not match that link to our listed templates. Is it an existing FMI design or a reference for a new invitation?')
    if not matched and has(r'\b(church|christian)\b',low):
        matched=next((x for x in templates if 'christian' in x['name'].casefold()),None)
    if matched:
        chosen=matched;s['template_id']=chosen['id'];s['tier']='standard';s.pop('scope_confirmed',None)
    if (s.get('next_action')=='classify_customization' and has(r'^(new|completely new)[.! ]*$',low)) or has(r'\b(fully custom|full customi[sz]ation|completely new|exclusive|new design|new invitation|birthday|housewarming|anniversary|other occasion)\b',low):
        s['tier']='exclusive';s.pop('quoted_price_paise',None);s.pop('scope_confirmed',None)
        if has(r'\bbirthday\b',low):s['details']['occasion']='birthday'
        return quote()
    photo_request=has(r"\b(pics?|pictures?|photos?|photographs?|images?|selfies?)\b",low) and has(r"\b(our|ours|my|us|couple|bride|groom)\b",low)
    negated_photo=has(r"\b(no|not|without|don.t|do not)\b.{0,25}\b(pics?|pictures?|photos?|images?)\b",low)
    if has(r'\b(separate photos|photo slideshow|insert.*photos)\b',low):
        s.pop('awaiting_photo_scope',None);s['requested_changes']=t;s.pop('scope_confirmed',None)
        return team('photo_insertion_quote','I have noted your request for separate photos. The team needs to confirm this additional scope and price before payment.')
    legacy_photo_confirmation=s.get('awaiting_photo_scope') and has(r'^(yes|yes please|exactly|correct|replace them)[.! ]*$',low)
    if (photo_request and not negated_photo) or legacy_photo_confirmation:
        s['photo_request']=t if not legacy_photo_confirmation else s.get('photo_request','Use customer photos')
        if chosen is None:
            return reply('which video should we put your photos in?\nsend the Instagram reel','template_selection','identify_template')
        s.pop('awaiting_photo_scope',None)
        s['tier']='personalized';s['requested_changes']=PHOTO_RULE['scope']
        return checkout(chosen['personalized_price_paise'],f"{PHOTO_RULE['reply']} The total is {amount(chosen['personalized_price_paise'])}.")
    if has(r'\b(face|faces|outfit|outfits|small location change)\b',low):
        s['tier']='personalized';s['requested_changes']=t
        return quote()
    if has(r'\b(custom|customized|customised|customization|customisation)\b',low) and not has(r'\b(no custom|not custom|without custom)\b',low):
        s['tier']='exclusive';return quote()
    if has(r'\b(change|adjust|edit|modify|different|something adjusted)\b',low) and not has(r'\b(pics?|photos?|face|outfit|pay|price|cost)\b',low):
        return reply('what do you want changed — faces, outfits, or the theme?',action='clarify_changes')
    if matched or has(r'\b(price|cost|how much)\b',low):return quote()

    if s.get('tier')=='exclusive':return quote()
    if has(r'\b(as shown|no changes|same video|standard video|without changes|text change)\b',low):
        s['tier']='standard';s.pop('requested_changes',None)
        return quote()
    ready=(has(r'\b(pay|payment link|book|proceed|go ahead|ready)\b',low) or (s.get('stage') in {'ready_to_pay','payment_demo'} and has(r'^(yes|sure|okay|ok)[.! ]*$',low))) and not has(r'\b(not|don.t|later|cannot|can.t)\b',low)
    if ready:
        if not chosen:return quote()
        if s.get('tier')=='exclusive':
            if chosen.get('custom_price_paise'):return checkout(chosen['custom_price_paise'],f"{spoken_name(chosen)}, {amount(chosen['custom_price_paise'])}.")
            return quote()
        price=chosen['personalized_price_paise'] if s.get('tier')=='personalized' else chosen['standard_price_paise']
        return checkout(price,f"{spoken_name(chosen)}, {amount(price)}.")
    if s.get('next_action')=='ask_name' and t and not has(r'^(hi|hey|hello)[.! ]*$',low) and not has(r'https?://',low) and len(t.split())<=4:
        s.setdefault('details',{})['contact_name']=t[:80]
        first=t.split()[0]
        return reply(f"hey {first} — who is this video for?",'discovery','ask_who_for')
    if s.get('next_action')=='ask_relationship' and t:
        s.setdefault('details',{})['relationship']=t[:200]
        name=s['details'].get('contact_name','').split()[0]
        return reply(f"got it{', '+name if name else ''}. who is the video for?",'discovery','ask_who_for')
    if s.get('last_question'):return s,s['last_question'].removeprefix('Hi\n')
    greeting=FIRST_CONTACT if not previous else FIRST_CONTACT.split('\n',1)[-1]
    return reply(greeting,'discovery','ask_name')
