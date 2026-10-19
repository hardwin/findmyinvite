import json
from pathlib import Path
from unittest.mock import patch
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'hermes/plugin'))
from fmi_support.desk import converse,workflow_text
from fmi_support.skill import talk


def local_ollama(home):
    Path(home,'fmi-support-model.json').write_text(json.dumps({
        'backend':'ollama','model':'qwen3.5:4b-hermes','base_url':'http://127.0.0.1:11434/v1'}))


def fake_open(payloads):
    class Fake:
        def __init__(self,payload):self.payload=payload
        def __enter__(self):return self
        def __exit__(self,*a):pass
        def read(self):return json.dumps(self.payload).encode()
    def open_req(req,timeout=0):
        body=json.loads(req.data)
        system=body['messages'][0]['content']
        if 'Classify this personal name' in system:
            content='{"gender":"boy"}'
        elif 'You are the listener agent' in system:
            content=payloads.get('listen','{"intent":"show_collections","offer":null,"notes":"yes to collections"}')
        elif 'You are the reviewer agent' in system:
            content=payloads.get('review','{"ok":true}')
        else:
            content=payloads.get('sales','https://www.instagram.com/findmyinvite.ai\n\nhttps://www.instagram.com/reel/Dd9nJFRTWpB/')
        if body.get('think'):
            return Fake({'message':{'content':'{"gender":"boy"}'}})
        return Fake({'message':{'content':content}})
    return open_req


class DeskTests(unittest.TestCase):
    def test_workflow_is_the_plan_not_a_matcher(self):
        text=workflow_text()
        self.assertIn('This document is the job',text)
        self.assertIn('from scratch',text)
        self.assertNotIn('/switch',text)
    def test_sure_after_collections_shows_the_reel_not_a_price(self):
        history=[{'role':'assistant','content':'do you want to see our collections to choose from?'}]
        with tempfile.TemporaryDirectory() as tmp, patch('fmi_support.backend.build_opener') as opener:
            local_ollama(tmp)
            opener.return_value.open.side_effect=fake_open({})
            reply=talk(tmp,'Sure',history)
        self.assertIn('instagram.com/reel/Dd9nJFRTWpB',reply)
        self.assertNotIn('1499',reply)
        self.assertNotIn('example.invalid',reply)
    def test_name_does_not_jump_to_full_custom(self):
        payloads={'listen':'{"intent":"name","offer":null,"notes":"name"}',
                  'sales':'Got it, Alex! Full custom is the way',
                  'review':'{"ok":false,"notes":"name only, no offer"}'}
        with tempfile.TemporaryDirectory() as tmp, patch('fmi_support.backend.build_opener') as opener:
            local_ollama(tmp)
            opener.return_value.open.side_effect=fake_open(payloads)
            reply=talk(tmp,'Alex',[{'role':'assistant','content':'Your name please?'}])
        self.assertIn('relative of the bride',reply.casefold())
        self.assertNotIn('full custom',reply.casefold())
    def test_reviewer_rewrite_drops_invented_brief(self):
        calls={'sales':0}
        class Fake:
            def __init__(self,payload):self.payload=payload
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self):return json.dumps(self.payload).encode()
        def open_req(req,timeout=0):
            body=json.loads(req.data)
            system=body['messages'][0]['content']
            if 'You are the listener agent' in system:
                content='{"intent":"pick_offer","offer":"exclusive","notes":"full custom"}'
            elif 'You are the reviewer agent' in system:
                content='{"ok":false,"notes":"invented Valakapou"}'
            else:
                calls['sales']+=1
                content='got it — full custom, we make that from scratch\nwho is the video for?' if calls['sales']>1 else 'thanks for chatting about your Valakapou plan, date of the 5th'
            return Fake({'message':{'content':content}})
        history=[{'role':'assistant','content':'Your name please?'},{'role':'user','content':'Albert'}]
        with tempfile.TemporaryDirectory() as tmp, patch('fmi_support.backend.build_opener') as opener:
            local_ollama(tmp)
            opener.return_value.open.side_effect=open_req
            reply=converse(tmp,'No i want full custom',history)
        self.assertIn('full custom',reply.casefold())
        self.assertNotIn('Valakapou',reply)
        self.assertNotIn('5th',reply)
