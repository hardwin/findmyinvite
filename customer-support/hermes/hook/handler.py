"""Load the repository-installed runtime within the active Hermes profile."""
import hashlib
import importlib.util
from pathlib import Path
import sys


async def handle(event_type, context):
    from hermes_constants import get_hermes_home
    home = Path(get_hermes_home()).resolve()
    name = "_fmi_support_" + hashlib.sha256(str(home).encode()).hexdigest()[:16]
    if name not in sys.modules:
        package = home / "plugins" / "fmi-support" / "fmi_support" / "__init__.py"
        spec = importlib.util.spec_from_file_location(name, package, submodule_search_locations=[str(package.parent)])
        module = importlib.util.module_from_spec(spec)
        sys.modules[name] = module
        spec.loader.exec_module(module)
    from importlib import import_module
    await import_module(name + ".intake").handle(event_type, context, home)
