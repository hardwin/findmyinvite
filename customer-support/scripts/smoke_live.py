"""Opt-in integration check: real Hermes hook + Supabase, synthetic rows only."""
import argparse
import asyncio
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
import uuid
from urllib.parse import urlencode
from urllib.request import Request, build_opener

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "hermes/plugin"))
from fmi_support.storage import SupabaseStore, Outbox, NoRedirect


async def verify(home, source):
    sys.path.insert(0, str(source))
    store = SupabaseStore.from_home(home)
    identity = "lid:" + str(uuid.uuid4().int % 10**30).zfill(30)

    def rest(path, method="GET"):
        request = Request(store.url + "/rest/v1/" + path, method=method,
                          headers={"apikey": store.key, "Authorization": "Bearer " + store.key})
        with build_opener(NoRedirect).open(request, timeout=10) as response:
            raw = response.read()
            return json.loads(raw) if raw else None

    customer_query = "support_customers?" + urlencode({"channel_identity": "eq." + identity, "select": "id"})
    original_home = os.environ.get("HERMES_HOME")
    try:
        with tempfile.TemporaryDirectory(prefix="fmi-support-smoke-") as tmp:
            target = Path(tmp)
            shutil.copytree(home / "plugins/fmi-support", target / "plugins/fmi-support")
            shutil.copytree(home / "hooks/fmi-customer-intake", target / "hooks/fmi-customer-intake")
            shutil.copy2(home / "fmi-support-secrets.json", target / "fmi-support-secrets.json")
            os.environ["HERMES_HOME"] = tmp
            from gateway.hooks import HookRegistry
            registry = HookRegistry()
            registry.discover_and_load()
            assert any(h["name"] == "fmi-customer-intake" for h in registry.loaded_hooks)
            for session in ["fmi-smoke-a", "fmi-smoke-a", "fmi-smoke-b"]:
                await registry.emit("agent:start", {"platform": "whatsapp", "chat_type": "dm",
                    "user_id": identity.removeprefix("lid:") + "@lid", "session_id": session,
                    "message": "synthetic test; must not be stored"})
                for _ in range(150):
                    if Outbox(tmp).count() == 0:
                        break
                    await asyncio.sleep(0.1)
                assert Outbox(tmp).count() == 0, "Synthetic contact did not drain"
                # The worker's own deletion proves its network call has finished.
                # Stop the sleeping worker so the next event tests restart recovery too.
                workers = [task for name, module in list(sys.modules.items())
                           if name.startswith("_fmi_support_") and name.endswith(".intake")
                           for task in module._workers.values()]
                for task in workers: task.cancel()
                await asyncio.gather(*workers, return_exceptions=True)
            customers = await asyncio.to_thread(rest, customer_query)
            assert len(customers) == 1
            conversations = await asyncio.to_thread(rest, "support_conversations?" + urlencode({
                "customer_id": "eq." + customers[0]["id"], "select": "id"}))
            assert len(conversations) == 2
            print("PASS: installed Hermes hook -> durable outbox -> same Supabase; one customer, two sessions.")
    finally:
        if original_home is None: os.environ.pop("HERMES_HOME", None)
        else: os.environ["HERMES_HOME"] = original_home
        # Delete only this run's randomly generated synthetic identity; cascade its sessions.
        await asyncio.to_thread(rest, "support_customers?" + urlencode({"channel_identity": "eq." + identity}), "DELETE")
        assert await asyncio.to_thread(rest, customer_query) == []
        print("Synthetic rows removed. No WhatsApp messages sent.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--home", type=Path, default=Path.home() / ".hermes")
    parser.add_argument("--hermes-source", type=Path)
    parser.add_argument("--allow-live-write", action="store_true", help="Explicitly permit creating/removing synthetic rows")
    args = parser.parse_args()
    if not args.allow_live_write:
        parser.error("This check writes synthetic rows. Pass --allow-live-write for an authorized target.")
    asyncio.run(verify(args.home, args.hermes_source or args.home / "hermes-agent"))
