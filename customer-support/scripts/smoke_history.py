"""Opt-in real Supabase + installed plugin continuity check; sends no WhatsApp messages."""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import uuid
from urllib.parse import urlencode
from urllib.request import Request, build_opener

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'hermes/plugin'))
from fmi_support.storage import SupabaseStore,NoRedirect


def main(home,source,test_model=False):
    sys.path.insert(0,str(source))
    store=SupabaseStore.from_home(home)
    identity='lid:'+str(uuid.uuid4().int%10**30).zfill(30)
    original=os.environ.get('HERMES_HOME')
    try:
        with tempfile.TemporaryDirectory(prefix='fmi-history-smoke-') as tmp:
            target=Path(tmp)
            shutil.copytree(home/'plugins/fmi-support',target/'plugins/fmi-support')
            shutil.copy2(home/'fmi-support-secrets.json',target/'fmi-support-secrets.json')
            os.environ['HERMES_HOME']=tmp
            spec=importlib.util.spec_from_file_location('_fmi_history_smoke',target/'plugins/fmi-support/__init__.py',submodule_search_locations=[str(target/'plugins/fmi-support')])
            module=importlib.util.module_from_spec(spec);sys.modules[spec.name]=module;spec.loader.exec_module(module)
            hooks={}
            class Context:
                def register_hook(self,name,fn):hooks[name]=fn
            module.register(Context())
            from gateway.session_context import set_session_vars,clear_session_vars
            def before(session,turn,message):
                tokens=set_session_vars(platform='whatsapp',chat_type='dm',user_id=identity[4:]+'@lid',session_id=session,message_id=turn)
                try:
                    return hooks['pre_llm_call'](platform='whatsapp',session_id=session,turn_id=turn,user_message=message)['context']
                finally:clear_session_vars(tokens)
            before('history-first','first','My wedding is on 7 November in Jaipur. I need help with the invitation link.')
            hooks['post_llm_call'](platform='whatsapp',turn_id='first',assistant_response='For your 7 November wedding in Jaipur, what happens when you open the invitation link?')
            # A fresh local state and new Hermes session must recover context from Supabase.
            shutil.rmtree(target/'state')
            context=before('history-new','second','What wedding date and city did I tell you?')
            assert '7 November' in context and 'Jaipur' in context
            raw='Hi! Welcome to FMI. How can I assist you today?'
            guarded=hooks['transform_llm_output'](platform='whatsapp',turn_id='second',response_text=raw)
            assert guarded=='Please allow some time, We will get back to you'
            if test_model:
                request=Request('http://127.0.0.1:11434/v1/chat/completions',data=json.dumps({
                    'model':'qwen3.5:4b-hermes','messages':[{'role':'system','content':(target/'plugins/fmi-support/fmi_support/persona.md').read_text()},
                    {'role':'user','content':'What wedding date and city did I tell you?\n\n'+context}],
                    'max_tokens':8192,'temperature':0,'stream':False}).encode(),headers={'Content-Type':'application/json'})
                with build_opener(NoRedirect).open(request,timeout=180) as response:
                    result=json.load(response)
                    choice=result['choices'][0]
                    answer=choice['message'].get('content','')
                    print('Model result:',json.dumps({'answer':answer,'finish_reason':choice.get('finish_reason')}))
                assert '7' in answer and 'November' in answer and 'Jaipur' in answer, 'Model did not recall the fixture'
                assert 'how can i' not in answer.lower() and 'welcome' not in answer.lower()
                hooks['post_llm_call'](platform='whatsapp',turn_id='second',assistant_response=answer)
                print('Qwen continuity reply:',answer)
            assert len(store.recent_messages(identity)) >= 3
            assert store.recent_messages(identity+'9') == []
            print('PASS: full text stored; cloud history restored after local-state reset; generic restart greeting blocked; customer isolation verified.')
    finally:
        if original is None:os.environ.pop('HERMES_HOME',None)
        else:os.environ['HERMES_HOME']=original
        request=Request(store.url+'/rest/v1/support_customers?'+urlencode({'channel_identity':'eq.'+identity}),method='DELETE',headers={'apikey':store.key,'Authorization':'Bearer '+store.key})
        with build_opener(NoRedirect).open(request,timeout=10) as response:response.read()
        assert store.recent_messages(identity)==[]
        print('Synthetic contact and message history removed. No WhatsApp messages sent.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--home',type=Path,default=Path.home()/'.hermes')
    parser.add_argument('--hermes-source',type=Path)
    parser.add_argument('--allow-live-write',action='store_true')
    parser.add_argument('--test-model',action='store_true')
    args=parser.parse_args()
    if not args.allow_live_write:parser.error('Pass --allow-live-write only for an authorized test target.')
    main(args.home,args.hermes_source or args.home/'hermes-agent',args.test_model)
