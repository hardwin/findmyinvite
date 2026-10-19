"""Synthetic local-Qwen workflow evaluation. No database writes or WhatsApp sends."""
import argparse,json,logging,sys,tempfile,time
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'hermes/plugin'))
from fmi_support.qwen_workflow import reason_and_reply,model_decision
logging.basicConfig(level=logging.INFO)
CATALOG=[dict(id='church',name='Church Christian Wedding Template v1',customer_name='Christian Church Wedding',instagram_url='https://www.instagram.com/reel/Dd9nJFRTWpB/',instagram_views=100000,instagram_page='https://www.instagram.com/findmyinvite.ai',standard_price_paise=99900,personalized_price_paise=149900)]
CASES=[('I want the Christian wedding video','quote_standard','₹999'),
       ('Make those two look like us in all the scenes','personalize_photos','TEST — cannot accept payment'),
       ('I paid','payment_claim','')]
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument("--verbose",action="store_true");args=parser.parse_args()
    state={};history=[]
    with tempfile.TemporaryDirectory() as home:
        def decide(context):
            result=model_decision(home,context)
            if args.verbose:print(json.dumps({"synthetic_decision":result},ensure_ascii=False),flush=True)
            return result
        for text,action,expected in CASES:
            started=time.monotonic()
            state,reply=reason_and_reply(home,state,text,CATALOG,{},history,decide)
            print(json.dumps({'input':text,'action':state['last_model_action'],'seconds':round(time.monotonic()-started,1),'reply':reply},ensure_ascii=False),flush=True)
            assert state['last_model_action']==action,(state['last_model_action'],action)
            assert expected in reply
            assert "{" not in reply and "}" not in reply
            if action!='payment_claim':assert 'TEST — cannot accept payment' in reply
            history.extend([{'role':'user','content':text},{'role':'assistant','content':reply}])
        assert state['payment_claimed'] and 'payment_status' not in state
    print('PASS: catalog quote with payment link, photo custom price, and unverified payment claim.')
if __name__=='__main__':main()
