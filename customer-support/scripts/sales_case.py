"""Operator-only case inspection and verified business facts. Never a model tool."""
import argparse
import json
from pathlib import Path
import sys
from urllib.parse import urlsplit
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'hermes/plugin'))
from fmi_support.storage import SupabaseStore

ALLOWED={'payment_status','production_status','payment_url','preview_url','delivery_url',
         'approved_price_paise','approved_template_id','approved_tier','approved_changes','delivery_terms','scope_approved','policy_answer','policy_question'}
def validate(data):
    if not isinstance(data,dict) or set(data)-ALLOWED:raise ValueError('Unsupported verified field')
    for k,v in data.items():
        if k=='payment_status' and v not in {'unverified','pending','paid','refunded'}:raise ValueError(k)
        if k=='production_status' and v not in {'not_started','queued','in_progress','preview_ready','delivered'}:raise ValueError(k)
        if k.endswith('_url'):
            u=urlsplit(v)
            if u.scheme!='https' or not u.netloc or u.username or u.password or u.hostname.endswith('.invalid'):raise ValueError(k)
        if k=='approved_price_paise' and (type(v) is not int or v<=0):raise ValueError(k)
        if k in {'approved_template_id','approved_changes'} and (not isinstance(v,str) or len(v)>2000):raise ValueError(k)
        if k=='approved_tier' and v not in {'standard','personalized'}:raise ValueError(k)
        if k=='scope_approved' and type(v) is not bool:raise ValueError(k)
        if k in {'delivery_terms','policy_answer','policy_question'} and (not isinstance(v,str) or len(v)>2000):raise ValueError(k)
    return data

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('action',choices=['show','verify'])
    p.add_argument('--identity',required=True)
    p.add_argument('--home',type=Path,default=Path.home()/'.hermes')
    p.add_argument('--facts-file',type=Path)
    p.add_argument('--expected-revision',type=int)
    a=p.parse_args();store=SupabaseStore.from_home(a.home)
    if a.action=='show':
        d=store.rpc('support_sales_context',{'p_identity':a.identity,'p_event_id':'operator-inspection'})
        if d: d.pop('templates',None)
        print(json.dumps(d,indent=2,ensure_ascii=False));return
    if not a.facts_file or a.expected_revision is None:p.error('verify requires --facts-file and --expected-revision from show')
    facts=validate(json.loads(a.facts_file.read_text()))
    ok=store.rpc('support_sales_verify',{'p_identity':a.identity,'p_revision':a.expected_revision,'p_verified':facts})
    if not ok:raise SystemExit('Case changed or does not exist. Inspect it again before applying verified facts.')
    print('Verified facts saved. No customer message sent.')
if __name__=='__main__':main()
