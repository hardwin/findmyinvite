"""Qwen plans the workflow and writes each reply; code validates business authority."""
from copy import deepcopy
import json
import logging
from pathlib import Path
import re
import time
from urllib.parse import urlsplit
from urllib.request import Request,build_opener
from .storage import NoRedirect,StorageUnavailable
from .policy import POLICY,TECHNICAL
from .sales import KNOWLEDGE,amount,DEMO_URL,PHOTO_RULE,listed_custom_paise,safe_url
from .voice import fabricated_prior,rewrite_customer_language,robotic_voice,spoken_name

log=logging.getLogger('fmi.support')
WORKFLOW=Path(__file__).with_name('model_workflow.md').read_text()
ACTIONS={'discover','suggest','quote_standard','personalize_photos','personalize_other',
 'custom','confirm_scope','request_payment','payment_claim','payment_issue','status',
 'delivery_issue','revision','approval','complaint','deadline','policy_question','details','confirm_details','unlisted_request','clarify'}
DETAILS={'occasion','event_date','style','names','venue','wording'}
CONTACT={'contact_name','relationship'}
ALL_FIELDS=DETAILS|CONTACT
class InvalidDecision(ValueError):pass


def settings(home):
    p=Path(home)/'fmi-support-model.json'
    config=json.loads(p.read_text()) if p.exists() else {}
    return {'model':'qwen3.5:4b-hermes','base_url':'http://127.0.0.1:11434/v1',
            'reasoning_effort':'medium','timeout_seconds':180,'max_tokens':1536,'thinking_tokens':1024,
            'minimum_reply_seconds':8,**config}


def model_decision(home,context,cancelled=lambda:False):
    cfg=settings(home)
    url=cfg['base_url'];parsed=urlsplit(url)
    if parsed.scheme!='http' or parsed.hostname not in {'127.0.0.1','localhost','::1'}:
        raise StorageUnavailable('local_model_endpoint_required')
    messages=[{'role':'system','content':POLICY+'\n\n'+WORKFLOW},
              {'role':'user','content':json.dumps(context,ensure_ascii=False)}]
    started=time.monotonic()
    def request():
        if cancelled():raise StorageUnavailable('cancelled_model_turn')
        body={'model':cfg['model'],'reasoning_effort':cfg['reasoning_effort'],'messages':messages,
              'temperature':0.6,'max_tokens':cfg['thinking_tokens'],'stream':False}
        req=Request(url.rstrip('/')+'/chat/completions',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
        with build_opener(NoRedirect).open(req,timeout=cfg['timeout_seconds']) as response:
            return json.load(response)['choices'][0]
    try:
        choice=request()
        message=choice['message']
        private_draft=message.get('reasoning') or message.get('reasoning_content') or ''
        # This local Qwen can exhaust a very large budget on thinking alone.
        # Give it bounded private deliberation, then a separate finalization pass.
        # Draft reasoning exists in RAM for this request only, never in history/logs.
        # Always finalize through the constrained JSON contract.
        if not private_draft:raise InvalidDecision('missing_private_reasoning')
        if cancelled():raise StorageUnavailable('cancelled_model_turn')
        # Qwen's text-only chat template, continuing the same assistant after
        # closing its bounded thinking segment (see docs/WORKFLOWS.md).
        def escape(value):
            return value.replace('<|','< |').replace('|>','| >').replace('<think>','[think]').replace('</think>','[/think]')
        prompt=''.join('<|im_start|>'+m['role']+'\n'+escape(m['content'])+'<|im_end|>\n' for m in messages)
        prompt+='<|im_start|>assistant\n<think>\n'+escape(private_draft[:12000])+'\nI have considered the workflow. I will now provide the final JSON decision, using the catalog ID and {{PRICE}} placeholder rather than literal amounts.\n</think>\n\n'
        schema={'type':'object','additionalProperties':False,'required':['action','template_id','details','reply'],
                'properties':{'action':{'type':'string','enum':sorted(ACTIONS)},
                  'template_id':{'enum':[None]+[t['id'] for t in context['catalog']]},
                  'details':{'type':'object','properties':{k:{'type':'string'} for k in sorted(ALL_FIELDS)},'additionalProperties':False},
                  'reply':{'type':'string'}}}
        body={'model':cfg['model'],'prompt':prompt,'raw':True,'think':False,'stream':False,'format':schema,
              'options':{'num_predict':cfg['max_tokens'],'temperature':0.4,'stop':['<|im_end|>']}}
        endpoint=parsed.scheme+'://'+parsed.netloc+'/api/generate'
        req=Request(endpoint,data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
        with build_opener(NoRedirect).open(req,timeout=cfg['timeout_seconds']) as response:data=json.load(response)
        log.info('FMI Qwen workflow generation completed seconds=%.1f finish=%s reasoning=%s reasoning_present=%s bounded_finalization=True',
                 time.monotonic()-started,data.get('done_reason'),cfg['reasoning_effort'],bool(private_draft))
        if data.get('done_reason')!='stop':raise InvalidDecision('incomplete_model_output')
        return json.loads(data['response'])
    except InvalidDecision:
        raise
    except json.JSONDecodeError:
        raise InvalidDecision('decision_json') from None
    except (OSError,ValueError,KeyError,IndexError,TypeError):
        raise StorageUnavailable('model_generation_unavailable') from None


def validate_and_apply(proposal,previous,text,templates,verified,history):
    if not isinstance(proposal,dict) or set(proposal)!={'action','template_id','details','reply'}:raise InvalidDecision('decision_shape')
    previous=previous or {}
    action=proposal['action'];tid=proposal['template_id'];details=proposal['details'];reply=proposal['reply']
    if not isinstance(action,str) or action not in ACTIONS or not isinstance(details,dict) or set(details)-ALL_FIELDS:raise InvalidDecision('decision_fields')
    if not isinstance(reply,str) or not 1<=len(reply.strip())<=1600 or TECHNICAL.search(reply) or re.search(r'</?think|private draft|reasoning effort|workflow_state|template_id',reply,re.I):raise InvalidDecision('reply_shape')
    if fabricated_prior(reply,text,history):raise InvalidDecision('fabricated_prior_context')
    if robotic_voice(reply,text):raise InvalidDecision('robotic_voice')
    reply=re.sub(r'\{+\s*(PRICE|PERSONALIZED_PRICE|TEMPLATE_LINK|PAYMENT_LINK|DELIVERY_LINK|PREVIEW_LINK)\s*\}+',lambda m:'{{'+m.group(1)+'}}',reply)
    evidence=[text]+[r['content'] for r in history if r.get('role')=='user']
    for key,value in details.items():
        if not isinstance(value,str) or not value.strip() or len(value)>1000 or not any(value.casefold() in e.casefold() for e in evidence):raise InvalidDecision('ungrounded_detail')
    if tid is not None and not isinstance(tid,str):raise InvalidDecision('invalid_template_id')
    s=deepcopy(previous or {});v=verified or {}
    selected=next((t for t in templates if t['id']==tid),None) if tid else next((t for t in templates if t['id']==s.get('template_id')),None)
    if tid and not selected:raise InvalidDecision('unknown_template')
    if selected and selected['id']!=s.get('template_id'):
        s['template_id']=selected['id'];s['tier']='standard'
        s.pop('scope_confirmed',None);s.pop('requested_changes',None)
    s.setdefault('details',{})
    for key,value in details.items():
        if key in CONTACT:s['details'][key]=value
    paid=v.get('payment_status')=='paid'
    invite={key:value for key,value in details.items() if key in DETAILS}
    if invite:
        if paid or action in {'details','confirm_details'}:s['details'].update(invite)
        elif action=='details':raise InvalidDecision('details_before_payment')
    tokens={}
    exclusive_price=selected.get('custom_price_paise') if selected else None
    checkout=action in {'quote_standard','personalize_photos','personalize_other','confirm_scope','request_payment'} or (action=='custom' and exclusive_price)
    if action in {'quote_standard','personalize_photos','personalize_other','request_payment'} and not selected:raise InvalidDecision('template_required')
    if checkout and paid:raise InvalidDecision('already_paid')
    if action=='personalize_photos':
        s['tier']='personalized';s['requested_changes']=PHOTO_RULE['scope'];s['scope_confirmed']=True
        s['stage']='ready_to_pay';s['next_action']='request_payment_consent'
    elif action=='personalize_other':
        s['tier']='personalized';s['requested_changes']=text[:2000];s['scope_confirmed']=True
        s['stage']='ready_to_pay';s['next_action']='request_payment_consent'
    elif action=='quote_standard':
        s['tier']='standard';s['scope_confirmed']=True;s['stage']='ready_to_pay';s['next_action']='request_payment_consent'
        s.pop('requested_changes',None)
    elif action=='confirm_scope':
        if not selected:raise InvalidDecision('scope_not_presented')
        s['scope_confirmed']=True;s['stage']='ready_to_pay';s['next_action']='request_payment_consent'
    elif action=='request_payment':
        if not selected or s.get('payment_claimed') or v.get('payment_status')=='pending' or s.get('needs_team'):raise InvalidDecision('payment_not_allowed')
        s['scope_confirmed']=True;s['stage']='payment_demo';s['next_action']='await_test_payment_event'
    elif action=='custom':
        s['tier']='exclusive'
        if exclusive_price:
            s['scope_confirmed']=True;s['stage']='ready_to_pay';s['next_action']='request_payment_consent'
        else:
            s['stage']='exclusive_interest';s['next_action']='share_exclusive_price';s.pop('scope_confirmed',None);s.pop('quoted_price_paise',None)
    elif action in {'discover','suggest'}:
        s.setdefault('stage','discovery');s['next_action']='identify_requirement'
    elif action=='unlisted_request':
        s.update(needs_team=True,team_reason='scope_review',next_action='team_review:scope_review',customer_request=text[:2000])
        s.pop('scope_confirmed',None)
    elif action=='confirm_details':
        if not paid or previous.get('stage')!='details_confirmation' or details or not all(s['details'].get(k) for k in ('names','event_date','venue','wording')):
            raise InvalidDecision('details_not_ready_for_confirmation')
        s.update(stage='production_review',details_confirmed=True,needs_team=True,team_reason='production',next_action='team_review:production')
    elif action in {'details','clarify'}:
        if action=='details':
            if invite and not paid:raise InvalidDecision('details_before_payment')
            if paid and s.get('team_reason') in {'payment_verification','payment_issue','payment_link'}:
                s.update(needs_team=False);s.pop('team_reason',None)
            if paid:
                s['stage']='details_collection';s['next_action']='collect_missing_details'
                if all(s['details'].get(k) for k in ('names','event_date','venue','wording')):
                    s.update(stage='details_confirmation',next_action='confirm_details')
    else:
        reasons={'payment_claim':'payment_verification','payment_issue':'payment_issue',
          'status':'order_status','delivery_issue':'delivery_access','revision':'revision',
          'approval':'final_delivery','complaint':'cancellation_or_complaint','deadline':'deadline',
          'policy_question':'policy_question'}
        reason=reasons[action]
        s['customer_request']=text[:2000]
        s.setdefault('review_details',{})[reason]=text[:2000]
        s.update(needs_team=True,team_reason=reason,next_action='team_review:'+reason)
        if action=='payment_claim':
            if paid:
                s.update(stage='details_collection',needs_team=False,next_action='collect_missing_details')
                s.pop('team_reason',None)
            else:s.update(payment_claimed=True,stage='payment_verification')
        if action=='payment_issue':s.update(payment_claimed=True,stage='payment_verification')
        if action=='approval':
            if v.get('production_status')!='preview_ready':raise InvalidDecision('no_preview_to_approve')
            s.update(approval_requested=True,stage='approval_review')
        if action=='revision':s.update(revision_request=text[:2000],stage='revision_review')
        if action=='deadline':s['requested_deadline']=text[:2000]
        if action=='policy_question':s['policy_question']=text[:2000]
        if action=='status' and v.get('production_status') in {'queued','in_progress','preview_ready','delivered'}:
            s.update(needs_team=False,next_action='await_customer_or_team');s.pop('team_reason',None)
    if selected:
        tokens['TEMPLATE_LINK']=selected['instagram_url']
        if s.get('tier')=='personalized':price=selected['personalized_price_paise']
        elif s.get('tier')=='exclusive':price=exclusive_price
        else:price=selected['standard_price_paise']
        if price:
            tokens['PRICE']=amount(price);s['quoted_price_paise']=price
            if action=='quote_standard':tokens['PERSONALIZED_PRICE']=amount(listed_custom_paise(selected))
    if v.get('production_status')=='delivered' and safe_url(v.get('delivery_url')):tokens['DELIVERY_LINK']=v['delivery_url']
    if v.get('production_status')=='preview_ready' and safe_url(v.get('preview_url')):tokens['PREVIEW_LINK']=v['preview_url']
    if checkout and tokens.get('PRICE') and not s.get('payment_claimed') and v.get('payment_status')!='pending' and not s.get('needs_team'):
        tokens['PAYMENT_LINK']=DEMO_URL+' (TEST — cannot accept payment)'
        if '{{PAYMENT_LINK}}' not in reply:reply=reply.rstrip()+' {{PAYMENT_LINK}}'
        s['scope_confirmed']=True;s['stage']='payment_demo';s['next_action']='await_test_payment_event'
    # Normalize a model-written amount only when it exactly matches this tier's
    # catalog price. Missing mandatory commercial facts are rendered by code.
    def normalize_price(match):
        number=match.group(1).replace(',','')
        value=amount(round(float(number)*100))
        if value==tokens.get('PRICE'):return '{{PRICE}}'
        if action=='quote_standard' and value==tokens.get('PERSONALIZED_PRICE') and re.search(r'personaliz|personalis|face|outfit|photo|pics?|custom|with changes',reply,re.I):
            return '{{PERSONALIZED_PRICE}}'
        raise InvalidDecision('incorrect_catalog_price')
    reply=re.sub(r'(?:₹|\bINR\s*|\bRs\.?\s*)([0-9][0-9,]*(?:\.[0-9]{1,2})?)',normalize_price,reply,flags=re.I)
    allowed={re.sub(r'\D','',tokens[key]):key for key in ('PRICE','PERSONALIZED_PRICE') if key in tokens}
    def normalize_digits(match):
        token=allowed.get(match.group(1).replace(',',''))
        return '{{'+token+'}}' if token else match.group(0)
    if allowed:
        forms=[]
        for digits in allowed:
            forms.append(digits)
            if len(digits)>3:forms.append(digits[:-3]+','+digits[-3:])
        reply=re.sub(r'\b('+ '|'.join(re.escape(f) for f in forms)+r')\b',normalize_digits,reply)
    if tokens.get('PAYMENT_LINK'):
        reply=re.sub(re.escape(DEMO_URL), '{{PAYMENT_LINK}}', reply)
        reply=re.sub(r'https?://example\.invalid/\S+', '{{PAYMENT_LINK}}', reply,flags=re.I)
    if selected and tokens.get('TEMPLATE_LINK'):
        reply=reply.replace(selected['instagram_url'],'{{TEMPLATE_LINK}}')
    if action in {'quote_standard','personalize_photos','personalize_other','request_payment'} or (action=='custom' and tokens.get('PRICE')):
        if '{{PRICE}}' not in reply:reply='The total is {{PRICE}}. '+reply
    if action in {'quote_standard','suggest'} and selected and '{{TEMPLATE_LINK}}' not in reply:
        reply=reply.rstrip()+'\n\n{{TEMPLATE_LINK}}'
    # Only code renders monetary amounts and URLs; no invented checkout or quote.
    if re.search(r'https?://|www\.|₹|\b(?:INR|Rs\.?|rupees|dollars|discount of)\s*\d|\b(?:999|1499|1,499)\b',reply,re.I):raise InvalidDecision('literal_commercial_fact')
    if not paid and re.search(r'(?:payment|money).{0,18}(?:received|verified|confirmed|successful)|(?:received|verified|confirmed).{0,18}(?:payment|money)',reply,re.I):
        # Negative/pending statements are permitted, positive verification is not.
        if not re.search(r'not (?:yet )?(?:received|verified|confirmed)|needs? (?:to be |)verif|awaiting verif',reply,re.I):raise InvalidDecision('unverified_payment_claim')
    if re.search(r'\b(?:I|we|our team)\s+(?:have |has |already )?(?:started|finished|completed|sent|notified|refunded|processed your refund)\b',reply,re.I):raise InvalidDecision('unverified_action_claim')
    if v.get('production_status') not in {'in_progress','preview_ready','delivered'} and re.search(r'\b(?:invitation|order|video|preview|production)\b.{0,28}\b(?:is|are|being) (?:in production|ready|completed|designed|prepared)\b',reply,re.I):raise InvalidDecision('unverified_production_claim')
    for token in re.findall(r'\{\{([^{}]+)\}\}',reply):
        if token not in tokens:raise InvalidDecision('unavailable_reply_fact')
        reply=reply.replace('{{'+token+'}}',tokens[token])
    reply=rewrite_customer_language(reply,templates)
    reply=re.sub(r'(\(TEST — cannot accept payment\))(?:\s*\1)+',r'\1',reply)
    if '{' in reply or '}' in reply:raise InvalidDecision('invalid_placeholder')
    if previous or history:reply=re.sub(r'^\s*(?:hi|hello|hey)\b[!,.]?\s*\n?','',reply,flags=re.I).strip()
    if not reply:raise InvalidDecision('empty_reply')
    s['goal']='collect_confirmed_details_and_deliver_invitation' if paid else 'send_catalog_payment_link'
    s['last_question']=reply;s['last_model_action']=action
    return s,reply


def reason_and_reply(home,previous,text,templates,verified,history,decider=None,cancelled=lambda:False):
    # Bound context by serialized size. Never send customer identifiers or secrets.
    recent=[];budget=12000
    for row in reversed(history[-40:]):
        item={'role':row['role'],'content':row['content'][-1800:]}
        size=len(json.dumps(item,ensure_ascii=False))
        if size>budget:break
        recent.insert(0,item);budget-=size
    # Do not ask a small language model to convert integer paise into rupees.
    # The database keeps integer money; the reasoning view contains display values.
    catalog=[]
    for t in templates:
        row={'id':t['id'],'customer_name':spoken_name(t),'instagram_url':t['instagram_url'],
             'instagram_views':int(t.get('instagram_views') or 0),
             'instagram_page':t.get('instagram_page') or 'https://www.instagram.com/findmyinvite.ai',
             'standard_price':amount(t['standard_price_paise']),
             'personalized_price':amount(t['personalized_price_paise'])}
        if t.get('custom_price_paise'):row['exclusive_price']=amount(t['custom_price_paise'])
        catalog.append(row)
    def money_view(record):
        result=deepcopy(record or {})
        for key in list(result):
            if key.endswith('_price_paise'):
                value=result.pop(key)
                if isinstance(value,(int,float)):result[key.removesuffix('_paise')]=amount(value)
        return result
    context={'workflow_state':money_view(previous),'catalog':catalog,'verified_facts':money_view(verified),
             'approved_business_knowledge':KNOWLEDGE,
             'recent_conversation':recent,'customer_message':text,
             'demo_payments':True}
    generate=decider or (lambda c:model_decision(home,c,cancelled))
    for attempt in range(2):
        if cancelled():return None,None
        try:
            proposal=generate(context)
            if cancelled():return None,None
            return validate_and_apply(proposal,previous,text,templates,verified,history)
        except InvalidDecision as error:
            log.warning('FMI Qwen decision rejected check=%s attempt=%d',str(error),attempt+1)
            if attempt:raise StorageUnavailable('model_decision_rejected') from None
            context['validation_feedback']=str(error)
            context['instruction']='Reconsider the decision against the workflow. Return a corrected JSON object. Do not expose this validation.'
    raise StorageUnavailable('model_decision_unavailable')
