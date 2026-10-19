import json
from pathlib import Path
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'hermes/plugin'))
from fmi_support.journal import Journal
from fmi_support.layers import parse_gender,parse_proposal,run
from fmi_support.voice import COLLECTIONS_ASK,FACES_ASK,PAYMENT_URL,blocked_reply,listen_reply,name_only
from fmi_support.review import format_chat,last_chat


class LayerTests(unittest.TestCase):
    def test_gender_tool_answer_is_not_a_name_list(self):
        self.assertEqual(parse_gender('{"gender":"boy"}'),'boy')
        self.assertEqual(parse_gender('{"gender":"female"}'),'girl')
        self.assertEqual(parse_gender('Alex is a nice name'),'unknown')
        proposal=parse_proposal('{"call":"gender","propose":"venue_finder","why":"missing"}')
        self.assertEqual(proposal['call'],'gender')
        self.assertEqual(proposal['propose'],'venue_finder')
        self.assertIsNone(parse_proposal('{"propose":"gender"}')['propose'])
    def test_main_reply_follows_tool_and_proposal_is_not_executed(self):
        seen=[]
        def complete(gender):
            seen.append(gender)
            return 'Got it Alex, full custom is the way'
        def propose(rows):
            return '{"call":null,"propose":"venue_finder","why":"loop"}'
        with tempfile.TemporaryDirectory() as tmp:
            reply=run('Alex',[],'boy',complete,propose,tmp)
            notes=(Path(tmp)/'state'/'fmi-support'/'learning.jsonl').read_text()
        self.assertEqual(seen,['boy'])
        self.assertIn('relative of the bride',reply)
        self.assertNotIn('full custom',reply.casefold())
        saved=json.loads(notes)
        self.assertEqual(saved['proposal'],'venue_finder')
        self.assertFalse(saved['executed'])
        self.assertNotIn('Alex',notes)
    def test_blank_price_sends_the_link_and_a_claim_is_not_confirmed(self):
        history=[{'role':'user','content':'Christian Church Wedding'},{'role':'user','content':'text change only'}]
        quote='Face change is ₹800 and full custom is ₹2500. I will ask the team before sending a link.'
        self.assertTrue(blocked_reply(quote,'send the payment link',history,prices_set=False))
        reply=listen_reply('send the payment link',history)
        self.assertIn(PAYMENT_URL,reply)
        self.assertIn('₹999',reply)
        self.assertNotIn('₹800',reply)
        confirmed='Awesome, got confirmation of payment via our test gateway.'
        self.assertTrue(blocked_reply(confirmed,'I paid',history,prices_set=False))
        self.assertEqual(listen_reply('I paid',history),'got it — what time did you pay?')
        early=listen_reply('just send payment',[{'role':'assistant','content':'Your name please?'}])
        self.assertNotIn(PAYMENT_URL,early)
        link=listen_reply('send the link',history)
        self.assertIn(PAYMENT_URL,link)
        self.assertIn('₹999',link)
    def test_yes_show_is_not_a_name_and_for_me_is_not_full_custom(self):
        self.assertFalse(name_only('Yes show'))
        self.assertFalse(name_only('no faces'))
        self.assertIn(PAYMENT_URL,listen_reply('no faces',[{'role':'assistant','content':FACES_ASK}]))
        self.assertFalse(name_only('For me'))
        self.assertFalse(name_only('For myself'))
        history=[{'role':'assistant','content':'Alex — who is the video for?'}]
        self.assertEqual(listen_reply('For me',history),COLLECTIONS_ASK)
        self.assertTrue(blocked_reply('Got it. Full custom, so no reels.','For me',history))
        self.assertIn('instagram.com/reel/Dd9nJFRTWpB',listen_reply('Yes show',history))
        self.assertNotIn('who is the video for',listen_reply('Yes show',history).casefold())
        self.assertIn('faces on the video',listen_reply('I like it',history).casefold())
        self.assertNotIn('pay',listen_reply('I like this',history).casefold())
        self.assertTrue(blocked_reply('Do you want faces on the video? Pay first to lock it in.','I like this',history))
        choosing=listen_reply('How much',history)
        self.assertIn('₹999',choosing)
        self.assertIn('₹1499',choosing)
        self.assertNotIn(PAYMENT_URL,choosing)
        picked=listen_reply('With our faces',[{'role':'assistant','content':'https://www.instagram.com/reel/Dd9nJFRTWpB/'}])
        self.assertIn('₹1499',picked)
        self.assertIn(PAYMENT_URL,picked)
        self.assertNotIn('₹999',picked)
        self.assertTrue(blocked_reply('How much are you looking to spend?','No custom, same one with my details',history))
        early=listen_reply('24th nov, palai',[{'role':'user','content':'church video'},{'role':'user','content':'text change'}])
        self.assertIn(PAYMENT_URL,early)
        self.assertNotIn('24th',early)
        self.assertNotIn('Palai',early)
        after=listen_reply('24th nov, palai',[{'role':'assistant','content':'text change is ₹999\n'+PAYMENT_URL}])
        self.assertIn('designer',after)
        self.assertNotIn('24th',after)
        self.assertTrue(blocked_reply("Okay, so you're Alex! Since it's likely your wife is getting married",'Alex',[]))
        paid=[{'role':'assistant','content':PAYMENT_URL}]
        self.assertIn("link's above",listen_reply('Yes',paid))
        self.assertNotIn('24th',listen_reply('Yes',[{'role':'assistant','content':'pay first\n'+PAYMENT_URL}]))
        self.assertTrue(blocked_reply('Since you just paid, what is the date and venue?','Yes',paid))
    def test_last_chat_for_ashok_includes_the_local_time(self):
        with tempfile.TemporaryDirectory() as tmp:
            journal=Journal(tmp)
            contact={'p_channel':'whatsapp','p_identity':'phone:+916362260992','p_phone_e164':'+916362260992','p_session_id':'s'}
            journal.save(contact,'transport:1','user','Alex',occurred_at='2026-10-19T13:17:00+00:00')
            journal.save(contact,'transport:1','assistant','Your name please?',occurred_at='2026-10-19T13:17:05+00:00')
            found=last_chat(tmp,'Ashok')
            text=format_chat(found)
        self.assertEqual(found['phone'],'+916362260992')
        self.assertIn('2026-10-19 18:47 customer: Alex',text)
        self.assertIn('FMI: Your name please?',text)
