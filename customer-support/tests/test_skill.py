from pathlib import Path
from unittest.mock import patch
import json
import tempfile
import unittest
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'hermes/plugin'))
from fmi_support.skill import skill_text,talk
from fmi_support.gates import FIRST_CONTACT
from fmi_support.policy import FALLBACK,POLICY
from fmi_support.sales import KNOWLEDGE
from fmi_support.voice import blocked_reply,invented_facts,listen_reply,name_next,same_reply,split_bubbles,usable_history

def local_ollama(home):
    Path(home,'fmi-support-model.json').write_text(json.dumps({
        'backend':'ollama','model':'qwen3.5:4b-hermes','base_url':'http://127.0.0.1:11434/v1'}))

class SkillTests(unittest.TestCase):
    def test_skill_owns_shop_and_leaves_prices_blank(self):
        text=skill_text()
        self.assertIn('Your name please?',text)
        self.assertIn('This document is the job',text)
        self.assertIn('Never ask',text)
        self.assertIn('gender tool',text)
        self.assertNotIn('Ashok, Alex',text)
        self.assertIn('Christian Church Wedding',text)
        self.assertIn('instagram.com/reel/Dd9nJFRTWpB',text)
        self.assertIn('if you can\'t decide, check these from our insta page',text)
        self.assertIn('Status: **set**',text)
        self.assertIn('₹999',text)
        self.assertIn('₹1499',text)
        self.assertIn('Never say template',text)
        self.assertIn('payment',text.casefold())
        self.assertIn('Just talk',text)
        self.assertIn('cool local video editor bro',text)
        self.assertIn('Never repeat',text)
        self.assertIn('full custom',text)
        self.assertLess(text.find('## Opening'),text.find('If they want full custom'))
        self.assertLess(POLICY.find('OPENING'),POLICY.find('full custom'))
    def test_greeting_and_hold_line(self):
        self.assertEqual(FIRST_CONTACT,'Hi\nYour name please?')
        self.assertNotIn('get back to you',FALLBACK.casefold())
        self.assertTrue(KNOWLEDGE['pricing_authority']['prices_set'])
        self.assertIsNone(KNOWLEDGE['pricing_authority']['exclusive_inr'])
        self.assertIn('gender_tool',KNOWLEDGE['opening'])
        self.assertNotIn('boy_name',KNOWLEDGE['opening'])
        self.assertEqual(name_next('Alex'),'Alex — who is the video for?')
        self.assertEqual(name_next('Alex','boy'),'Alex — you the bride or a relative of the bride?')
    def test_talk_uses_native_chat_without_thinking(self):
        captured=[]
        class Fake:
            def __init__(self,payload):self.payload=payload
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self):return json.dumps({'message':{'content':self.payload}}).encode()
        def open_req(req,timeout=0):
            body=json.loads(req.data)
            captured.append((req.full_url,body,timeout))
            system=body['messages'][0]['content']
            if body.get('think') or 'Classify this personal name' in system:
                content='{"gender":"boy"}'
            elif 'You are the listener agent' in system:
                content='{"intent":"name","offer":null}'
            elif 'You are the reviewer agent' in system:
                content='{"ok":true}'
            else:
                content='Albert — you the bride or a relative of the bride?'
            return Fake(content)
        with tempfile.TemporaryDirectory() as tmp:
            local_ollama(tmp)
            with patch('fmi_support.backend.build_opener') as opener:
                opener.return_value.open.side_effect=open_req
                reply=talk(tmp,'Albert',[{'role':'assistant','content':'Your name please?'}])
        self.assertEqual(reply,'Albert — you the bride or a relative of the bride?')
        gender=next(item for item in captured if item[1].get('think'))
        sales=next(item for item in captured if 'You are the sales agent' in item[1]['messages'][0]['content'])
        self.assertTrue(gender[0].endswith('/api/chat'))
        self.assertEqual(gender[2],8)
        self.assertTrue(sales[0].endswith('/api/chat'))
        self.assertIn('DATA',sales[1]['messages'][0]['content'])
        self.assertIn('WORKFLOW',sales[1]['messages'][0]['content'])
        self.assertIn('Gender tool result: boy',sales[1]['messages'][0]['content'])
        listener=next(item for item in captured if 'You are the listener agent' in item[1]['messages'][0]['content'])
        self.assertIn('WORKFLOW',listener[1]['messages'][0]['content'])
        self.assertNotIn('BOY_NAMES',Path(__file__).resolve().parents[1].joinpath('hermes/plugin/fmi_support/voice.py').read_text())
    def test_loop_and_invented_brief_are_blocked(self):
        fake='Hi Albert, thanks for chatting about your Valakapou plan! The date of the 5th is noted down in our team\'s brief.'
        history=[{'role':'assistant','content':'Your name please?'},
                 {'role':'user','content':'Albert'},
                 {'role':'assistant','content':fake}]
        self.assertTrue(invented_facts(fake,'Albert',history))
        self.assertTrue(same_reply(fake,fake))
        self.assertEqual([r['content'] for r in usable_history(history)],['Your name please?','Albert'])
        self.assertIn('full custom',listen_reply('No i want full custom',history).casefold())
        sales_calls=[]
        class Fake:
            def __init__(self,payload):self.payload=payload
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self):return json.dumps({'message':{'content':self.payload}}).encode()
        def open_req(req,timeout=0):
            body=json.loads(req.data)
            system=body['messages'][0]['content']
            if 'You are the listener agent' in system:
                content='{"intent":"pick_offer","offer":"exclusive"}'
            elif 'You are the reviewer agent' in system:
                content='{"ok":false,"notes":"invented brief"}'
            else:
                sales_calls.append(1)
                content='got it Albert — full custom, who is the video for?' if len(sales_calls)>1 else fake
            return Fake(content)
        with tempfile.TemporaryDirectory() as tmp:
            local_ollama(tmp)
            with patch('fmi_support.backend.build_opener') as opener:
                opener.return_value.open.side_effect=open_req
                reply=talk(tmp,'No i want full custom',history)
        self.assertIn('full custom',reply.casefold())
        self.assertNotIn('Valakapou',reply)
        self.assertNotIn('5th',reply)
    def test_name_only_does_not_jump_to_full_custom(self):
        history=[{'role':'assistant','content':'Your name please?'}]
        bad='Got it, Alex! Full custom is the way for a once-in-a-lifetime moment.\n\nWho exactly are we making this video for?'
        self.assertTrue(blocked_reply(bad,'Alex',history,'boy'))
        self.assertEqual(listen_reply('Alex',history),'Alex — who is the video for?')
        self.assertEqual(listen_reply('Alex',history,'boy'),'Alex — you the bride or a relative of the bride?')
        self.assertIn('who is the video for',listen_reply('Priya',history,'girl').casefold())
        self.assertNotIn('relative of the bride',listen_reply('Priya',history,'girl').casefold())
        class Fake:
            def __init__(self,payload):self.payload=payload
            def __enter__(self):return self
            def __exit__(self,*a):pass
            def read(self):return json.dumps({'message':{'content':self.payload}}).encode()
        prompts=[]
        def open_req(req,timeout=0):
            body=json.loads(req.data)
            system=body['messages'][0]['content']
            prompts.append(system)
            if body.get('think') or 'Classify this personal name' in system:
                return Fake('{"gender":"boy"}')
            if 'You are the listener agent' in system:
                return Fake('{"intent":"name"}')
            if 'You are the reviewer agent' in system:
                return Fake('{"ok":false,"notes":"name only"}')
            return Fake(bad)
        with tempfile.TemporaryDirectory() as tmp:
            local_ollama(tmp)
            with patch('fmi_support.backend.build_opener') as opener:
                opener.return_value.open.side_effect=open_req
                reply=talk(tmp,'Alex',history)
            notes=(Path(tmp)/'state'/'fmi-support'/'learning.jsonl').read_text()
        self.assertEqual(reply,'Alex — you the bride or a relative of the bride?')
        self.assertNotIn('full custom',reply.casefold())
        self.assertNotIn('exclusive',reply.casefold())
        self.assertNotIn('Alex',notes)
        self.assertIn('"executed": false',notes)
        self.assertTrue(any('Gender tool result: boy' in prompt for prompt in prompts))
    def test_broken_markdown_is_stripped_to_url_bubble(self):
        parts=split_bubbles('Check this\n[Check out this Christian Church Wedding reel (100k views)](\nhttps://www.instagram.com/reel/Dd9nJFRTWpB/')
        self.assertIn('https://www.instagram.com/reel/Dd9nJFRTWpB/',parts)
        self.assertFalse(any(part.startswith('[Check') for part in parts))
