"""Inspect/retry intake locally without printing customer identities."""
import argparse
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "hermes/plugin"))
from fmi_support.storage import SupabaseStore
from fmi_support.journal import Journal

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("command", choices=["status", "flush"])
parser.add_argument("--home", type=Path, default=Path.home() / ".hermes")
args = parser.parse_args()
outbox = Journal(args.home)
if args.command == "flush":
    store = SupabaseStore.from_home(args.home)
    outbox.flush(store)
    outbox.flush_messages(store)
print(json.dumps({"pending_contacts": outbox.count(),"pending_messages": outbox.pending_messages()}))
