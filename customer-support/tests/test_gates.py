import json
from pathlib import Path
from types import ModuleType
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'hermes/plugin'))
from fmi_support.gates import CATALOG,FIRST_CONTACT,match_gate,reset_contact
from fmi_support.journal import Journal
from fmi_support.sales_runtime import handle_sales
from fmi_support.handover import Handover,dispatch
from test_handover import Gateway,Source
from types import SimpleNamespace


class Store:
    def __init__(self):
        self.resets=[];self.timeout=5
    def rpc(self,name,payload):
        self.resets.append((name,payload))
        if name!='support_conversation_reset':raise AssertionError(name)
        return {'reset':True,'existed':True}


class GateTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.home=Path(self.tmp.name);self.addCleanup(self.tmp.cleanup)
        constants=ModuleType('hermes_constants');constants.get_hermes_home=lambda:self.home
        self.mock=patch.dict(sys.modules,{'hermes_constants':constants});self.mock.start();self.addCleanup(self.mock.stop)
        self.source={'chat_type':'dm','user_id':'15555550123','chat_id':'15555550123'}
        self.store=Store()
    def test_catalog_is_operator_only_and_includes_new(self):
        self.assertTrue(CATALOG['do_not_send_to_model']);self.assertTrue(CATALOG['do_not_mention_to_customers'])
        self.assertEqual(match_gate(' /NEW ')['id'],'new_conversation')
        self.assertIsNone(match_gate('/new please'));self.assertIsNone(match_gate('new'))
        from fmi_support.gates import swallowed_slash
        self.assertTrue(swallowed_slash('/approve'));self.assertTrue(swallowed_slash('/new please'))
        self.assertFalse(swallowed_slash('/new'));self.assertFalse(swallowed_slash('Hi'))
        plugin=Path(__file__).resolve().parents[1]/'hermes/plugin/fmi_support'
        for name in ('persona.md','model_workflow.md'):
            self.assertNotIn('/new',(plugin/name).read_text().casefold())
    def test_local_reset_clears_history_and_blocks_legacy_reimport(self):
        journal=Journal(self.home)
        contact={'p_channel':'whatsapp','p_identity':'phone:+15555550123','p_phone_e164':'+15555550123','p_session_id':'s'}
        journal.save(contact,'transport:1','user','I want the Christian wedding video')
        journal.cache_history(contact['p_identity'],[{'role':'user','content':'old'}])
        reset_contact(self.home,self.source,'s',self.store)
        self.assertEqual(journal.recent(contact['p_identity']),[])
        self.assertIsNone(journal.cached_history(contact['p_identity']))
        self.assertTrue(journal.was_reset(contact['p_identity']))
        self.assertIsNone(journal.import_legacy(contact))
        self.assertEqual(self.store.resets[0][0],'support_conversation_reset')
        self.assertEqual(self.store.resets[0][1]['p_identity'],'phone:+15555550123')
        leaked=[{'message_key':'old','role':'user','content':'Jebarson','occurred_at':'2020-01-01T00:00:00+00:00'}]
        self.assertEqual(journal.since_reset(leaked,contact['p_identity']),[])
    async def test_any_number_new_starts_fresh_greeting_without_saving_gate(self):
        journal=Journal(self.home)
        contact={'p_channel':'whatsapp','p_identity':'phone:+15555550123','p_phone_e164':'+15555550123','p_session_id':'s'}
        journal.save(contact,'transport:old','user','previous sale talk')
        with patch('fmi_support.sales_runtime.reset_contact',side_effect=lambda *a,**k:reset_contact(self.home,self.source,'s',self.store)):
            result=await handle_sales('whatsapp',self.source,'s','mid-new','/new')
        self.assertEqual(result['reply'],FIRST_CONTACT)
        self.assertEqual([r['content'] for r in journal.recent(contact['p_identity'])],[])
        self.assertFalse(Handover(self.home).paused(self.source['chat_id']))
    async def test_new_unpauses_and_does_not_reach_model(self):
        Handover(self.home).set_paused(self.source['chat_id'],True)
        called=[]
        with patch('fmi_support.sales_runtime.reset_contact',return_value=None),patch('fmi_support.sales_runtime.respond',side_effect=called.append):
            result=await handle_sales('whatsapp',self.source,'s','m','/new')
        self.assertEqual(result['reply'],FIRST_CONTACT);self.assertEqual(called,[])
        self.assertFalse(Handover(self.home).paused(self.source['chat_id']))
    async def test_handover_consumes_new_before_hermes_and_sends_greeting(self):
        base=ModuleType('gateway.platforms.base');base.SendResult=lambda **kw:SimpleNamespace(**kw)
        store=Store()
        with patch.dict(sys.modules,{'gateway.platforms.base':base}),patch('fmi_support.gates.reset_contact',side_effect=lambda *a,**k:reset_contact(self.home,self.source,'s',store)):
            gateway=Gateway()
            event=SimpleNamespace(source=Source(),text='/new',metadata={},message_id='g1')
            self.assertEqual(await dispatch(event,gateway),{'action':'skip','reason':'fmi_human_handover'})
            self.assertEqual([row[1]['message'] for row in gateway.adapters['whatsapp'].sent[:2]],['Hi',"Your name please?"])
            event=SimpleNamespace(source=Source(),text='/approve',metadata={},message_id='g2')
            self.assertEqual(await dispatch(event,gateway),{'action':'skip','reason':'fmi_human_handover'})
        self.assertEqual(Handover(self.home).journal.recent('phone:+15555550123'),[])
