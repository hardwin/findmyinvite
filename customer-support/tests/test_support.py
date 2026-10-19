import asyncio
import importlib.util
import io
import json
from pathlib import Path
import sqlite3
import sys
import tempfile
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "hermes/plugin"))
from fmi_support.identity import intake_payload
from fmi_support.storage import Outbox, SupabaseStore, StorageUnavailable
from fmi_support.policy import customer_response, support_context, FALLBACK
from fmi_support import intake


def context(**changes):
    return {"platform": "whatsapp", "chat_type": "dm", "user_id": "15555550123",
            "session_id": "test-session", "message": "private customer text", **changes}


class IdentityTests(unittest.TestCase):
    def test_phone_formats_converge_and_body_is_not_saved(self):
        for value in ["15555550123", "+15555550123", "15555550123@s.whatsapp.net", "15555550123:5@s.whatsapp.net"]:
            result = intake_payload(context(user_id=value))
            self.assertEqual(result["p_identity"], "phone:+15555550123")
            self.assertEqual(result["p_phone_e164"], "+15555550123")
            self.assertNotIn("private customer text", json.dumps(result))

    def test_lid_is_not_mistaken_for_a_phone(self):
        result = intake_payload(context(user_id="123456789012345@lid"))
        self.assertEqual(result["p_identity"], "lid:123456789012345")
        self.assertIsNone(result["p_phone_e164"])

    def test_only_known_direct_whatsapp_identity_is_admitted(self):
        for change in [{"platform": "telegram"}, {"chat_type": "group"}, {"chat_type": ""},
                       {"user_id": ""}, {"user_id": "123@g.us"}, {"user_id": "0"}, {"session_id": ""}]:
            self.assertIsNone(intake_payload(context(**change)))


class OutboxTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.box = Outbox(self.temp.name)

    def test_restart_and_duplicates_preserve_first_last_seen(self):
        self.box.enqueue(intake_payload(context(), now="2026-10-18T10:00:00+00:00"))
        self.box.enqueue(intake_payload(context(), now="2026-10-18T11:00:00+00:00"))
        self.box.enqueue(intake_payload(context(), now="2026-10-18T09:00:00+00:00"))
        self.assertEqual(Outbox(self.temp.name).count(), 1)
        captured = []
        class Store:
            def record(self, payload): captured.append(payload)
        self.assertEqual(self.box.flush(Store())["sent"], 1)
        self.assertEqual(captured[0]["p_first_seen_at"], "2026-10-18T09:00:00+00:00")
        self.assertEqual(captured[0]["p_last_seen_at"], "2026-10-18T11:00:00+00:00")
        self.assertEqual(self.box.count(), 0)

    def test_outage_retained_until_retry_succeeds(self):
        self.box.enqueue(intake_payload(context()))
        class Down:
            def record(self, payload): raise StorageUnavailable("http_503")
        self.assertEqual(self.box.flush(Down(), now=0)["pending"], 1)
        class Up:
            calls = 0
            def record(self, payload): self.calls += 1
        up = Up()
        self.box.flush(up, now=1)
        self.assertEqual(up.calls, 0)
        self.box.flush(up, now=6)
        self.assertEqual(up.calls, 1)
        self.assertEqual(self.box.count(), 0)

    def test_new_event_during_flush_cannot_be_deleted(self):
        self.box.enqueue(intake_payload(context(), now="2026-10-18T10:00:00+00:00"))
        box = self.box
        class Store:
            def record(self, payload):
                box.enqueue(intake_payload(context(), now="2026-10-18T11:00:00+00:00"))
        self.box.flush(Store())
        self.assertEqual(self.box.count(), 1)

    def test_sessions_are_separate(self):
        self.box.enqueue(intake_payload(context()))
        self.box.enqueue(intake_payload(context(session_id="another-session")))
        self.assertEqual(self.box.count(), 2)

    def test_credentials_and_urls_are_validated(self):
        for url in ["https://evil.example", "https://project.supabase.co@evil.example", "http://project.supabase.co", "https://project.supabase.co/path"]:
            with self.assertRaises(StorageUnavailable): SupabaseStore(url, "secret")
        SupabaseStore("https://project.supabase.co", "secret")
        SupabaseStore("http://127.0.0.1:54321", "local-key")


class PolicyTests(unittest.TestCase):
    def test_errors_are_safe_but_normal_responses_survive(self):
        for text in ["Provider said: HTTP 404", "Operation interrupted: retrying automatically", "Session restored successfully.", "(empty)",
                     "✨ New session started!\n◆ Model: qwen3.5:4b-hermes\n◆ Endpoint: http://127.0.0.1:11434/v1"]:
            self.assertEqual(customer_response(text, platform="whatsapp"), FALLBACK)
        self.assertIsNone(customer_response("Hi! Welcome to FMI.", platform="whatsapp"))
        self.assertIsNone(customer_response("HTTP 404", platform="cli"))
        self.assertIn("FMI", support_context(platform="whatsapp")["context"])


class TransportTests(unittest.TestCase):
    def test_rpc_uses_private_headers_and_exact_metadata(self):
        payload = intake_payload(context())
        with patch("fmi_support.storage.build_opener") as opener:
            opener.return_value.open.return_value = io.BytesIO(b'{"customer_id":"test"}')
            SupabaseStore("https://example.supabase.co", "private-key").record(payload)
            request = opener.return_value.open.call_args.args[0]
            self.assertEqual(request.full_url, "https://example.supabase.co/rest/v1/rpc/support_record_contact")
            self.assertEqual(request.get_header("Authorization"), "Bearer private-key")
            self.assertEqual(json.loads(request.data), payload)
            self.assertNotIn("private customer text", request.data.decode())

    def test_transport_error_does_not_expose_response_or_key(self):
        with patch("fmi_support.storage.build_opener") as opener:
            opener.return_value.open.side_effect = HTTPError("https://example.supabase.co", 503, "sensitive detail", {}, None)
            with self.assertRaisesRegex(StorageUnavailable, "^http_503$"):
                SupabaseStore("https://example.supabase.co", "private-key").record(intake_payload(context()))


class HookTests(unittest.IsolatedAsyncioTestCase):
    async def asyncTearDown(self):
        workers = list(intake._workers.values())
        for worker in workers: worker.cancel()
        await asyncio.gather(*workers, return_exceptions=True)
        intake._workers.clear()

    async def test_gateway_hook_durably_records_without_credentials(self):
        with tempfile.TemporaryDirectory() as home:
            with self.assertLogs("fmi.support", level="WARNING"):
                await intake.handle("agent:start", context(), home)
                await asyncio.sleep(0.1)
            self.assertEqual(Outbox(home).count(), 1)
            await intake.handle("agent:start", context(chat_type="group"), home)
            self.assertEqual(Outbox(home).count(), 1)
            worker = intake._workers[str(Path(home).resolve())]
            worker.cancel()
            await asyncio.gather(worker, return_exceptions=True)


class InstallerTests(unittest.TestCase):
    def test_fresh_clone_install_preserves_unrelated_config_and_backs_up(self):
        import yaml
        spec = importlib.util.spec_from_file_location("fmi_installer", ROOT / "scripts/install.py")
        installer = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(installer)
        with tempfile.TemporaryDirectory() as tmp:
            home = Path(tmp)
            (home / "config.yaml").write_text("gateway:\n  allow_all_users: false\nplugins:\n  enabled: [other-plugin]\n")
            (home / "hermes-agent/locales").mkdir(parents=True)
            (home / "hermes-agent/locales/en.yaml").write_text("gateway:\n  errors:\n    generic_failed: raw error\n")
            installer.install(home)
            config = yaml.safe_load((home / "config.yaml").read_text())
            self.assertFalse(config["gateway"]["allow_all_users"])
            self.assertIn("other-plugin", config["plugins"]["enabled"])
            self.assertEqual(config["platform_toolsets"]["whatsapp"], [])
            self.assertTrue((home / "hooks/fmi-customer-intake/handler.py").exists())
            self.assertTrue((home / "skills/fmi-whatsapp-sales/SKILL.md").exists())
            self.assertEqual(len(list((home / "backups").iterdir())), 1)
            self.assertEqual(yaml.safe_load((home / "locales/en.yaml").read_text())["gateway.errors.generic_failed"], FALLBACK)


if __name__ == "__main__":
    unittest.main()
