import asyncio
from dataclasses import dataclass
from pathlib import Path
from types import SimpleNamespace, ModuleType
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'hermes/plugin'))
from fmi_support.handover import Handover, dispatch, install_delivery_guard

@dataclass
class Source:
    platform: str = 'whatsapp'
    chat_type: str = 'dm'
    chat_id: str = '15555550123'
    user_id: str = '15555550123'

class Adapter:
    def __init__(self): self.sent = []
    async def _post_bridge_message(self, path, payload, **kwargs):
        self.sent.append((path, payload)); return 'sent'
    async def send(self, chat_id, text):
        return await self._post_bridge_message('send', {'chatId':chat_id,'message':text})
    async def edit_message(self, chat_id, *args): self.sent.append('edit'); return 'sent'
    async def send_typing(self, chat_id): self.sent.append('typing')

class Gateway:
    def __init__(self):
        self.adapters = {'whatsapp':Adapter()}; self.interrupts = []; self.allowed = True
    def _is_user_authorized_for_source(self, source): return self.allowed
    def _session_key_for_source(self, source): return source.chat_id + ':' + source.user_id
    async def _interrupt_and_clear_session(self, key, source, **kwargs): self.interrupts.append(key)

class HandoverTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(); self.home = Path(self.tmp.name)
        constants = ModuleType('hermes_constants'); constants.get_hermes_home = lambda:self.home
        base = ModuleType('gateway.platforms.base'); base.SendResult = lambda **kw:SimpleNamespace(**kw)
        self.mock = patch.dict(sys.modules, {'hermes_constants':constants,'gateway.platforms.base':base}); self.mock.start()
        self.gateway = Gateway(); self.state = Handover(self.home)
    def tearDown(self): self.mock.stop(); self.tmp.cleanup()
    async def message(self, text, owner=False, chat='15555550123', mid='message-1', group=False):
        source = Source(chat_id=chat, user_id='15555550999' if owner else chat, chat_type='group' if group else 'dm')
        event = SimpleNamespace(source=source, text=('[owner reply] '+text) if owner else text,
                                metadata={'whatsapp_from_owner':owner},message_id=mid)
        return await dispatch(event,self.gateway)
    async def test_owner_pause_resume_case_insensitive_no_control_reply(self):
        self.assertEqual((await self.message('  HmM  ',True))['action'],'skip')
        self.assertTrue(Handover(self.home).paused('15555550123'))
        self.assertEqual(self.gateway.interrupts,['15555550123:15555550123'])
        self.assertEqual((await self.message('OKIES',True))['action'],'skip')
        self.assertFalse(self.state.paused('15555550123'))
        self.assertIsNone(await self.message('continue'))
    async def test_customer_cannot_control_and_exact_words_only(self):
        self.assertIsNone(await self.message('Hmm'))
        self.assertFalse(self.state.paused('15555550123'))
        await self.message('hmm please',True)
        self.assertFalse(self.state.paused('15555550123'))
        await self.message('hmm',True)
        await self.message('okies',False)
        self.assertTrue(self.state.paused('15555550123'))
    async def test_paused_customer_and_human_text_preserved_without_codes(self):
        await self.message('Hmm',True)
        await self.message('The link now opens',False,mid='customer-2')
        await self.message('Great, please check the venue',True,mid='owner-3')
        await self.message('okies',True)
        rows = self.state.journal.recent('phone:+15555550123')
        self.assertEqual([r['content'] for r in rows],['The link now opens','Great, please check the venue'])
        self.assertEqual([r['role'] for r in rows],['user','assistant'])
    async def test_isolation_restart_and_outbound_silence(self):
        await self.message('hmm',True)
        adapter = self.gateway.adapters['whatsapp']
        result = await adapter.send('15555550123','late model response')
        self.assertTrue(result.raw_response['fmi_suppressed'])
        await adapter.edit_message('15555550123','id','late edit')
        await adapter.send_typing('15555550123')
        self.assertEqual(adapter.sent,[])
        self.assertEqual(await adapter.send('15555550124','other customer'),'sent')
        fresh = Adapter(); install_delivery_guard(fresh,self.home)
        await fresh.send('15555550123','after restart')
        self.assertEqual(fresh.sent,[])
    async def test_bridge_chunks_blocked_after_pause(self):
        install_delivery_guard(self.gateway.adapters['whatsapp'],self.home)
        self.state.set_paused('15555550123',True)
        result = await self.gateway.adapters['whatsapp']._post_bridge_message('send',{'chatId':'15555550123'},timeout=30)
        self.assertTrue(result.raw_response['fmi_suppressed'])
    async def test_unauthorized_and_groups_cannot_change_state(self):
        self.gateway.allowed = False
        await self.message('hmm',True)
        self.assertFalse(self.state.paused('15555550123'))
        self.gateway.allowed = True
        await self.message('hmm',True,group=True)
        self.assertFalse(self.state.paused('15555550123'))

    async def test_resume_reenables_delivery_and_interrupt_failure_stays_paused(self):
        await self.message('hmm',True)
        await self.message('okies',True)
        adapter = self.gateway.adapters['whatsapp']
        self.assertEqual(await adapter.send('15555550123','continued answer'),'sent')
        async def fail(*args, **kwargs): raise RuntimeError('fixture')
        self.gateway._interrupt_and_clear_session = fail
        result = await self.message('okies',True)
        self.assertEqual(result['action'],'skip')
        self.assertTrue(self.state.paused('15555550123'))

    async def test_first_contact_setup_notice_and_empty_notice_are_silent(self):
        adapter = self.gateway.adapters['whatsapp']
        install_delivery_guard(adapter,self.home)
        for text in ('📬 No home channel is set for Whatsapp. Type /sethome to continue.', ''):
            result = await adapter.send('15555550123',text)
            self.assertTrue(result.raw_response['fmi_suppressed'])
        self.assertEqual(adapter.sent,[])
        self.assertEqual(await adapter.send('15555550123','Which invitation design did you choose?'),'sent')
