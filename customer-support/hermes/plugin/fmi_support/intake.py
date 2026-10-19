"""Authorized gateway turn intake. Storage failures never become customer replies."""
import asyncio
import logging
import sqlite3
from pathlib import Path

from .identity import intake_payload
from .storage import Outbox, SupabaseStore, StorageUnavailable
from .journal import Journal

log = logging.getLogger("fmi.support")
_workers = {}


async def _retry_worker(home):
    while True:
        try:
            outbox = await asyncio.to_thread(Journal, home)
            if await asyncio.to_thread(outbox.count) or await asyncio.to_thread(outbox.pending_messages):
                store = SupabaseStore.from_home(home)
                result = await asyncio.to_thread(outbox.flush, store)
                messages = await asyncio.to_thread(outbox.flush_messages, store)
                result["pending"] += messages["pending"]
                if result["pending"]:
                    log.warning("FMI support intake pending=%d; retry scheduled", result["pending"])
        except (StorageUnavailable, OSError, ValueError, sqlite3.Error):
            log.warning("FMI support storage unavailable; check operator configuration")
        await asyncio.sleep(30)


async def handle(event_type, context, home):
    home = str(Path(home).resolve())
    if event_type == "agent:start":
        payload = intake_payload(context)
        if payload is None:
            return
        try:
            outbox = await asyncio.to_thread(Journal, home)
            await asyncio.to_thread(outbox.bind, payload)
            await asyncio.to_thread(outbox.enqueue, payload)
        except Exception as error:
            # No values or exception messages: they can contain customer data.
            log.error("FMI support local intake failed (%s)", type(error).__name__)
            return
    elif event_type != "gateway:startup":
        return
    if event_type == "gateway:startup":
        from gateway.run import _gateway_runner_ref
        from .handover import install_gateway_guards
        runner = _gateway_runner_ref()
        if runner:
            install_gateway_guards(runner, home)
            log.info("FMI WhatsApp handover delivery guard installed")
    worker = _workers.get(home)
    if worker is None or worker.done():
        _workers[home] = asyncio.create_task(_retry_worker(home))
