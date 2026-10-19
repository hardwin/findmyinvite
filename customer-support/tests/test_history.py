import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'hermes/plugin'))
from fmi_support.conversation import ConversationService
from fmi_support.identity import intake_payload
from fmi_support.journal import Journal
from fmi_support.policy import FALLBACK
from fmi_support.storage import StorageUnavailable


def contact(number='15555550123',session='session-one'):
    return intake_payload({'platform':'whatsapp','chat_type':'dm','user_id':number,'session_id':session})


class Store:
    def __init__(self):
        self.rows={}
        self.down=False
    def record_message(self,payload):
        if self.down: raise StorageUnavailable('http_503')
        self.rows[payload['p_identity'],payload['p_message_key']]=dict(payload)
    def recent_messages(self,identity):
        if self.down: raise StorageUnavailable('http_503')
        return [{'message_key':p['p_message_key'],'role':p['p_role'],'content':p['p_content'],
                 'occurred_at':p['p_occurred_at'],'delivery_state':p['p_delivery_state']}
                for p in self.rows.values() if p['p_identity']==identity]


class HistoryTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.store=Store()
        self.service=ConversationService(self.temp.name,self.store)

    def test_full_text_is_saved_and_reused_in_new_session(self):
        text='Our wedding is on 7 November in Jaipur. '+('More detail. '*100)
        self.service.before(contact(),'turn-a',text,'wa-a')
        self.service.after('turn-a','I have noted 7 November in Jaipur.')
        result=self.service.before(contact(session='new-session'),'turn-b','What date did I mention?','wa-b')
        self.assertIn('7 November in Jaipur',result)
        self.assertIn('existing FMI customer conversation',result)
        self.assertTrue(any(row['p_content']==text.strip() for row in self.store.rows.values()))
        self.assertNotIn('What date did I mention?',result)  # current message isn't doubled

    def test_customer_history_is_not_shared(self):
        self.service.before(contact(),'a','Private details for customer one.','a')
        self.service.after('a','Your private details are noted.')
        result=self.service.before(contact('15555550456',session='customer-two-session'),'b','Hello','b')
        self.assertNotIn('Private details for customer one',result)
        self.assertIn('No earlier customer conversation',result)

    def test_fresh_host_reads_cloud_and_cache_survives_outage(self):
        self.service.before(contact(),'a','My invitation link will not open.','a')
        self.service.after('a','Which phone are you using?')
        with tempfile.TemporaryDirectory() as other:
            fresh=ConversationService(other,self.store)
            text=fresh.before(contact(session='fresh'),'b','Android','b')
            self.assertIn('Which phone are you using?',text)
            self.store.down=True
            fresh=ConversationService(other,self.store)
            with self.assertLogs('fmi.support',level='WARNING'):
                text=fresh.before(contact(session='fresh'),'c','Still not opening','c')
            self.assertIn('My invitation link will not open',text)
            self.assertNotEqual(fresh.transform('c','Please try opening the link in Chrome.'),FALLBACK)
            self.assertGreater(fresh.journal.pending_messages(),0)
            self.store.down=False
            fresh.journal.flush_messages(self.store,now=10**12)
            self.assertEqual(fresh.journal.pending_messages(),0)

    def test_unknown_history_outage_does_not_reset_or_guess(self):
        self.store.down=True
        with self.assertLogs('fmi.support',level='WARNING'):
            self.service.before(contact(),'a','Continue','a')
        self.assertEqual(self.service.transform('a','Hi! Welcome to FMI.'),FALLBACK)
        with self.assertLogs('fmi.support',level='WARNING'):
            self.service.after('a',FALLBACK)
            self.service.before(contact(),'b','Are you there?','b')
        self.assertEqual(self.service.transform('b','How can I assist you?'),FALLBACK)

    def test_callback_replay_does_not_duplicate_and_reply_can_update(self):
        for _ in range(2):
            self.service.before(contact(),'a','The same message','wa-a')
            self.service.after('a','First reply')
        self.assertEqual(len(self.store.rows),2)
        self.service.after('a','Corrected reply')
        self.assertEqual(len(self.store.rows),2)
        self.assertTrue(any(r['p_content']=='Corrected reply' for r in self.store.rows.values()))

    def test_returning_customer_generic_greeting_is_removed(self):
        self.service.before(contact(),'a','My link is broken','a')
        self.service.after('a','Please try Chrome.')
        self.service.before(contact(),'b','It still fails','b')
        self.assertEqual(self.service.transform('b','Hi! Welcome to FMI. How can I assist you today?'),FALLBACK)
        self.assertEqual(self.service.transform('b','Hi! Welcome to FMI. Please send the public invitation link.'),'Please send the public invitation link.')

    def test_identity_rebinding_is_refused(self):
        self.service.before(contact(),'a','Hello','a')
        with self.assertRaisesRegex(ValueError,'identity_mismatch'):
            self.service.before(contact('15555550456'),'b','Hello','b')

    def test_pending_revision_is_not_lost_during_sync(self):
        journal=self.service.journal
        key=journal.save(contact(),'a','assistant','old')
        class UpdatingStore:
            def record_message(self,payload):
                journal.save(contact(),'a','assistant','new')
        journal.flush_messages(UpdatingStore())
        self.assertEqual(journal.pending_messages(),1)
        journal.flush_messages(self.store)
        self.assertEqual(journal.pending_messages(),0)
        self.assertEqual(self.store.rows[contact()['p_identity'],key]['p_content'],'new')

    def test_legacy_import_is_scoped_bounded_by_cutoff_and_idempotent(self):
        home=Path(self.temp.name)
        (home/'fmi-support-history.json').write_text(json.dumps({'legacy_max_message_id':3}))
        db=sqlite3.connect(home/'state.db')
        db.executescript('''create table sessions(id text,source text,chat_type text,user_id text);
            create table messages(id integer,session_id text,role text,content text,timestamp real,
              platform_message_id text,display_kind text,_compressed_summary integer,tool_calls text);
            insert into sessions values('old','whatsapp','dm','15555550123'),('other','whatsapp','dm','15555550456');
            insert into messages values(1,'old','user','Remember my wedding date',1,null,null,0,null);
            insert into messages values(2,'old','assistant','Internal instruction',2,null,'hidden',0,null);
            insert into messages values(3,'other','user','Another customer secret',3,null,null,0,null);
            insert into messages values(4,'old','assistant','Post-cutoff message',4,null,null,0,null);''')
        db.commit();db.close()
        self.service.journal.import_legacy(contact())
        self.service.journal.import_legacy(contact())
        rows=self.service.journal.recent(contact()['p_identity'])
        self.assertEqual([r['content'] for r in rows],['Remember my wedding date'])
        self.assertEqual(self.service.journal.pending_messages(),1)

    def test_reset_forgets_the_previous_chat_on_the_same_number(self):
        first=contact()
        self.service.before(first,'a','I am Jebarson','a')
        self.service.after('a','Jebarson — who is the video for?')
        self.service.journal.reset_conversation(first['p_identity'])
        result=self.service.before(contact(session='after-new'),'b','Alex','b')
        self.assertNotIn('Jebarson',result)
        self.assertNotIn('who is the video for',result.casefold())


if __name__=='__main__':unittest.main()
