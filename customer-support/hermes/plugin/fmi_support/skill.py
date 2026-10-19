"""Load the FMI WhatsApp sales skill and run the sales desk."""
from pathlib import Path

from .backend import complete
from .layers import parse_gender
from .storage import StorageUnavailable

NAME = 'fmi-whatsapp-sales'


def skill_dir():
    here = Path(__file__).resolve()
    candidates = [here.parents[2] / 'skills' / NAME]
    try:
        from hermes_constants import get_hermes_home
        candidates.insert(0, Path(get_hermes_home()) / 'skills' / NAME)
    except Exception:
        pass
    candidates.append(Path.home() / '.hermes' / 'skills' / NAME)
    for path in candidates:
        if (path / 'SKILL.md').exists():
            return path
    return candidates[0]


def skill_text():
    folder = skill_dir()
    body = (folder / 'SKILL.md').read_text(encoding='utf-8')
    refs = folder / 'references'
    extra = []
    if refs.is_dir():
        for path in sorted(refs.glob('*.md')):
            extra.append(path.read_text(encoding='utf-8'))
    return body + ('\n\n' + '\n\n'.join(extra) if extra else '')


def _post(home,messages,think,num_predict,timeout):
    return complete(home,messages,think,num_predict,timeout)


def classify_gender(home,name):
    """Internal tool answer. Not a customer reply and not a stored name list."""
    if not name:return 'unknown'
    try:
        raw=_post(home,[{'role':'system','content':'Classify this personal name. Think privately. Final answer is JSON only: {"gender":"boy"} or {"gender":"girl"} or {"gender":"unknown"}. Do not write a customer message.'},
                        {'role':'user','content':name}],True,48,8)
    except StorageUnavailable:
        return 'unknown'
    return parse_gender(raw)


def talk(home,text,history=None):
    """Listener, sales, and reviewer agents. One customer reply."""
    from .desk import converse
    reply=converse(home,text,history)
    if not reply:
        raise StorageUnavailable('empty_model_reply')
    return reply
