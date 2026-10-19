"""Local Qwen customer-reply check using synthetic fixtures; no WhatsApp sends."""
import json
from pathlib import Path
import sys
from urllib.request import Request,urlopen
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'hermes/plugin'))
from fmi_support.policy import POLICY,FALLBACK,clean_response
from fmi_support.conversation import history_context
fixtures=[([], 'Hello,'),
([{'role':'user','content':'I would like a new design.'},{'role':'assistant','content':FALLBACK}], 'Hi'),
([{'role':'user','content':'Hello'},{'role':'assistant','content':FALLBACK}], 'Okay')]
for previous,current in fixtures:
    for r in previous:r.update(occurred_at='2026-10-18T10:00:00Z',delivery_state='historical')
    context=POLICY+(history_context(previous) if previous else '\nNo previous conversation exists. Address the current message directly.')
    body={'model':'qwen3.5:4b-hermes','messages':[{'role':'system','content':POLICY},{'role':'user','content':current+'\n\n'+context}], 'reasoning_effort':'none','max_tokens':1024,'temperature':0,'stream':False}
    with urlopen(Request('http://127.0.0.1:11434/v1/chat/completions',data=json.dumps(body).encode(),headers={'Content-Type':'application/json'}),timeout=240) as response:
        choice=json.load(response)['choices'][0]
    answer=clean_response(choice['message'].get('content',''),returning=bool(previous))
    print(json.dumps({'fixture':current,'answer':answer,'finish':choice.get('finish_reason')}),flush=True)
    assert answer!=FALLBACK and '?' in answer
    assert 'home channel' not in answer.lower()
print('PASS: first contact and returning follow-ups receive useful questions.',flush=True)
