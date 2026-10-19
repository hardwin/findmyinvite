import json
import os
from pathlib import Path
from unittest.mock import patch
import sys
import tempfile
import unittest
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'hermes/plugin'))
from fmi_support.backend import apply_switch,describe_backend,model_cfg
from fmi_support.gates import gate_sender,match_gate,swallowed_slash
from fmi_support.sales_runtime import handle_sales


class BackendTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.home=Path(self.tmp.name);self.addCleanup(self.tmp.cleanup)
        (self.home/'config.yaml').write_text('model:\n  default: qwen3.5:4b-hermes\n  provider: custom\n  base_url: http://127.0.0.1:11434/v1\n')
        (self.home/'fmi-support-model.json').write_text(json.dumps({
            'backend':'ollama','model':'qwen3.5:4b-hermes','base_url':'http://127.0.0.1:11434/v1'}))
    def test_switch_reports_and_flips_without_storing_a_key(self):
        self.assertIn('ollama',describe_backend(self.home))
        with patch.dict(os.environ,{'OPENAI_API_KEY':'sk-test','OPENAI_MODEL':'gpt-4.1-mini'},clear=False):
            reply=apply_switch(self.home,'/switch')
        self.assertIn('now on openai',reply)
        self.assertIn('now on local ollama',apply_switch(self.home,'/switch'))
        with patch.dict(os.environ,{'OPENAI_API_KEY':'sk-test','OPENAI_MODEL':'gpt-4.1-mini'},clear=False):
            self.assertIn('now on openai',apply_switch(self.home,'/switch'))
        cfg=model_cfg(self.home)
        self.assertEqual(cfg['backend'],'openai')
        self.assertEqual(cfg['model'],'gpt-4.1-mini')
        self.assertNotIn('sk-test',(self.home/'fmi-support-model.json').read_text())
        self.assertNotIn('sk-test',(self.home/'config.yaml').read_text())
        self.assertIn('ollama',apply_switch(self.home,'/switch ollama'))
        self.assertEqual(model_cfg(self.home)['backend'],'ollama')
    def test_switch_without_key_stays_on_ollama(self):
        env={k:v for k,v in os.environ.items() if k!='OPENAI_API_KEY'}
        with patch.dict(os.environ,env,clear=True),patch('fmi_support.backend.read_dotenv',return_value={}):
            reply=apply_switch(self.home,'/switch openai')
        self.assertIn('OPENAI_API_KEY',reply)
        self.assertEqual(model_cfg(self.home)['backend'],'ollama')
    def test_switch_gate_is_tester_only(self):
        self.assertEqual(match_gate('/switch openai','operator_tester')['id'],'switch_backend')
        self.assertEqual(match_gate('/switch','operator_tester')['id'],'switch_backend')
        self.assertIsNone(match_gate('/switch openai','any_direct_whatsapp'))
        self.assertTrue(swallowed_slash('/switch openai'))
        self.assertEqual(gate_sender({'user_id':'916362260992','chat_id':'916362260992'}),'operator_tester')
        self.assertEqual(gate_sender({'user_id':'15555550123'}),'any_direct_whatsapp')
    async def test_customer_switch_is_swallowed(self):
        from types import ModuleType
        constants=ModuleType('hermes_constants');constants.get_hermes_home=lambda:self.home
        source={'chat_type':'dm','user_id':'15555550123','chat_id':'15555550123'}
        with patch.dict(sys.modules,{'hermes_constants':constants}):
            result=await handle_sales('whatsapp',source,'s','m','/switch openai')
        self.assertEqual(result,{'action':'handled'})
        self.assertEqual(model_cfg(self.home)['backend'],'ollama')
    async def test_tester_switch_openai_needs_env(self):
        from types import ModuleType
        constants=ModuleType('hermes_constants');constants.get_hermes_home=lambda:self.home
        source={'chat_type':'dm','user_id':'916362260992','chat_id':'916362260992'}
        env={k:v for k,v in os.environ.items() if k!='OPENAI_API_KEY'}
        with patch.dict(sys.modules,{'hermes_constants':constants}),patch.dict(os.environ,env,clear=True),patch('fmi_support.backend.read_dotenv',return_value={}):
            result=await handle_sales('whatsapp',source,'s','m','/switch openai')
        self.assertIn('OPENAI_API_KEY',result['reply'])
