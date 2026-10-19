"""Install this checkout's support integration; no network or gateway restart."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess

import yaml

ROOT = Path(__file__).resolve().parents[1]


def merge(base, overlay):
    for key, value in overlay.items():
        if isinstance(value, dict):
            if not isinstance(base.get(key), dict):
                base[key] = {}
            merge(base[key], value)
        else:
            base[key] = value
    return base


def flattened(data, prefix=""):
    result = {}
    for key, value in data.items():
        name = prefix + "." + key if prefix else key
        if isinstance(value, dict):
            result.update(flattened(value, name))
        else:
            result[name] = value
    return result


def private_write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    temporary = path.with_name(path.name + ".tmp")
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as stream:
        stream.write(text)
    os.replace(temporary, path)
    path.chmod(0o600)


def read_env_credentials(path):
    credentials = {}
    for line in path.read_text().splitlines():
        key, separator, value = line.partition("=")
        key = key.strip().removeprefix("export ")
        if separator and key in {"SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"}:
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            credentials[key] = value
    return credentials


def install(home, secrets=None, env_file=None):
    home = home.expanduser().resolve()
    config_path = home / "config.yaml"
    if not config_path.exists():
        raise SystemExit("Set up Hermes first, then pass its profile home with --home.")
    config = yaml.safe_load(config_path.read_text()) or {}
    credential_text = None
    if secrets or env_file:
        credentials = json.loads(secrets.read_text()) if secrets else read_env_credentials(env_file)
        import sys
        sys.path.insert(0, str(ROOT / "hermes/plugin"))
        from fmi_support.storage import SupabaseStore
        SupabaseStore(credentials["SUPABASE_URL"], credentials["SUPABASE_SERVICE_ROLE_KEY"])
        credential_text = json.dumps({k: credentials[k] for k in ("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")})
    backup = home / "backups" / ("fmi-support-" + datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ"))
    backup.mkdir(parents=True, mode=0o700)
    targets = [".env", "config.yaml", "SOUL.md", "locales/en.yaml", "plugins/fmi-support", "hooks/fmi-customer-intake", "fmi-support-secrets.json", "fmi-support-install.json", "fmi-support-model.json"]
    for relative in targets:
        source = home / relative
        if source.exists():
            destination = backup / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            if source.is_dir():
                shutil.copytree(source, destination)
            else:
                shutil.copy2(source, destination)
    for relative, source in [("plugins/fmi-support", ROOT / "hermes/plugin"), ("hooks/fmi-customer-intake", ROOT / "hermes/hook"),
                             ("skills/fmi-whatsapp-sales", ROOT / "hermes/skills/fmi-whatsapp-sales")]:
        target = home / relative
        if target.exists():
            shutil.rmtree(target)
        shutil.copytree(source, target, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
    overlay = yaml.safe_load((ROOT / "config/hermes-overlay.yaml").read_text())
    merge(config, overlay)
    # Explicit per-platform values take precedence over global display defaults.
    whatsapp = config.setdefault("display", {}).setdefault("platforms", {}).setdefault("whatsapp", {})
    merge(whatsapp, overlay["display"])
    plugins = config.setdefault("plugins", {})
    plugins["enabled"] = list(dict.fromkeys([*plugins.get("enabled", []), "fmi-support"]))
    plugins["disabled"] = [name for name in plugins.get("disabled", []) if name != "fmi-support"]
    private_write(config_path, yaml.safe_dump(config, sort_keys=False, allow_unicode=True))
    previous_model = {}
    model_path = home / "fmi-support-model.json"
    if model_path.exists():
        try:
            previous_model = json.loads(model_path.read_text())
        except (OSError, ValueError):
            previous_model = {}
    backend = previous_model.get("backend") or "openai"
    model_payload = {
        "backend": backend,
        "model":config["model"]["default"],"base_url":config["model"]["base_url"],
        "reasoning_effort":config["agent"]["reasoning_effort"],
        "timeout_seconds":180,"max_tokens":1536,"thinking_tokens":1024,"minimum_reply_seconds":8}
    if backend == "openai":
        model_payload["model"] = previous_model.get("model") or os.environ.get("OPENAI_MODEL") or "gpt-4.1-mini"
        model_payload["base_url"] = previous_model.get("base_url") or "https://api.openai.com/v1"
        config.setdefault("model", {})["default"] = model_payload["model"]
        config["model"]["provider"] = "openai"
        config["model"]["base_url"] = model_payload["base_url"]
        private_write(config_path, yaml.safe_dump(config, sort_keys=False, allow_unicode=True))
    elif backend == "ollama":
        model_payload["model"] = previous_model.get("model") or "qwen3.5:4b-hermes"
        model_payload["base_url"] = previous_model.get("base_url") or "http://127.0.0.1:11434/v1"
    private_write(model_path, json.dumps(model_payload, indent=2))
    private_write(home / "SOUL.md", (ROOT / "hermes/plugin/fmi_support/persona.md").read_text())
    locale_path = home / "locales/en.yaml"
    locale = yaml.safe_load(locale_path.read_text()) if locale_path.exists() else {}
    # Resolve static messages emitted outside the model, including busy acknowledgments.
    bundled = home / "hermes-agent/locales/en.yaml"
    # Installed Hermes source may be elsewhere (profiles commonly share the default checkout).
    if not bundled.exists():
        from agent.i18n import _bundled_locales_dir
        bundled = _bundled_locales_dir() / "en.yaml"
    keys = flattened(yaml.safe_load(bundled.read_text()))
    fallback = "still here — say that again?"
    for key in keys:
        if key.startswith(("gateway.errors.", "gateway.notify.turn_error", "gateway.shutdown.notice_", "gateway.restart.", "gateway.proxy.")) or key in {
            "gateway.shared.warn_passthrough", "gateway.shared.error_prefix", "gateway.busy.ack",
            "gateway.busy.drain_queued", "gateway.busy.drain_rejected", "gateway.busy.drain_rejected_new_work",
            "gateway.busy.draining_maintenance", "gateway.busy.another_turn_running",
        }:
            locale[key] = fallback
    locale["gateway.notify.no_home_channel"] = ""
    locale["gateway.startup.restarted"] = fallback
    private_write(locale_path, yaml.safe_dump(locale, allow_unicode=True))
    if credential_text:
        private_write(home / "fmi-support-secrets.json", credential_text)
    # Bridge supplies a trusted owner flag for linked-account manual messages.
    env_path = home / ".env"
    lines = env_path.read_text().splitlines() if env_path.exists() else []
    lines = [line for line in lines if not line.strip().startswith("WHATSAPP_FORWARD_OWNER_MESSAGES=")]
    lines.append("WHATSAPP_FORWARD_OWNER_MESSAGES=true")
    private_write(env_path, "\n".join(lines) + "\n")
    # Freeze the legacy boundary once: later records are owned by full-text hooks.
    # This stores only an integer, never copies customer content into a manifest.
    marker = home / "fmi-support-history.json"
    if not marker.exists():
        maximum = 0
        if (home / "state.db").exists():
            connection = sqlite3.connect((home / "state.db").as_uri()+"?mode=ro",uri=True)
            try:
                maximum = connection.execute("select coalesce(max(id),0) from messages").fetchone()[0]
            finally:
                connection.close()
        private_write(marker,json.dumps({"legacy_max_message_id":maximum}))
    hashes = {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest()
              for p in (ROOT / "hermes").rglob("*") if p.is_file() and "__pycache__" not in p.parts}
    commit = subprocess.run(["git", "-C", str(ROOT), "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
    private_write(home / "fmi-support-install.json", json.dumps({"source": str(ROOT), "commit": commit, "files": hashes}, indent=2))
    print("Installed FMI support. Backup:", backup)
    print("Restart the Hermes gateway to load the gateway event hook and settings.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--home", type=Path, default=Path(os.environ.get("HERMES_HOME", "~/.hermes")))
    credentials = parser.add_mutually_exclusive_group()
    credentials.add_argument("--secrets-file", type=Path, help="Private JSON file; never commit it")
    credentials.add_argument("--env-file", type=Path, help="Reuse only SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from an existing ignored env file")
    args = parser.parse_args()
    install(args.home, args.secrets_file, args.env_file)
