"""Opt-in Supabase persistence test with synthetic model decisions; no WhatsApp sends."""
import argparse,json,sys,tempfile,uuid
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,build_opener
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'hermes/plugin'))
from fmi_support.storage import SupabaseStore,NoRedirect
from fmi_support.sales_runtime import respond

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--allow-live-write',action='store_true');a=p.parse_args()
 if not a.allow_live_write:p.error('Authorized live target required')
 store=SupabaseStore.from_home(Path.home()/'.hermes')
 identity='lid:'+str(uuid.uuid4().int%10**30).zfill(30)
 source={'chat_type':'dm','user_id':identity[4:]+'@lid','chat_id':identity[4:]+'@lid'}
 try:
  with tempfile.TemporaryDirectory() as tmp:
   def decide(c):
    text=c['customer_message']
    action,reply={
     'Hi':('discover',"Hi\nYour name please?"),
     'https://www.instagram.com/reel/Dd9nJFRTWpB/':('quote_standard','This design costs {{PRICE}}. Would you like changes?'),
     'change groom face and outfit':('personalize_other','Those changes cost {{PRICE}}. Shall we use this scope?'),
     'I paid':('payment_claim','The payment needs verification. What time did you pay?'),
     'continue':('details','What names should appear on the invitation?')
    }[text]
    return {'action':action,'template_id':c['catalog'][0]['id'],'details':{},'reply':reply}
   def turn(n,t):return respond(Path(tmp),source,'sales-smoke',str(n),t,store,decide)
   assert turn(1,'Hi').startswith('Hi\n')
   assert '₹999' in turn(2,'https://www.instagram.com/reel/Dd9nJFRTWpB/')
   assert '₹1499' in turn(3,'change groom face and outfit')
   assert turn(3,'change groom face and outfit') is None
   assert 'verified' not in turn(4,'I paid').lower().replace('verification','')
   d=store.rpc('support_sales_context',{'p_identity':identity,'p_event_id':'inspect'})
   assert d['state']['payment_claimed'] and d['verified']=={}
   assert store.rpc('support_sales_verify',{'p_identity':identity,'p_revision':d['revision'],'p_verified':{'payment_status':'paid'}})
   assert 'names' in turn(5,'continue').lower()
   d=store.rpc('support_sales_context',{'p_identity':identity,'p_event_id':'inspect'})
   assert d['state']['stage']=='details_collection' and d['verified']['payment_status']=='paid'
   assert not store.rpc('support_sales_save',{'p_identity':identity,'p_event_id':'stale','p_revision':0,'p_state':{},'p_reply':'wrong'})
   assert len(store.recent_messages(identity))==10
   print('PASS: live catalog pricing, saved workflow, replay deduplication, unverified payment claim, operator verification, details collection and stale-write rejection.')
 finally:
  req=Request(store.url+'/rest/v1/support_customers?'+urlencode({'channel_identity':'eq.'+identity}),method='DELETE',headers={'apikey':store.key,'Authorization':'Bearer '+store.key})
  with build_opener(NoRedirect).open(req,timeout=10) as response:response.read()
  assert store.recent_messages(identity)==[]
  assert store.rpc('support_sales_context',{'p_identity':identity,'p_event_id':'inspect'}) is None
  print('Synthetic customer, workflow and messages removed. No WhatsApp messages sent.')
if __name__=='__main__':main()
