"""Local Ollama or OpenAI chat. The API key stays in env, never in prompts."""
import json
import os
import re
from pathlib import Path
from urllib.parse import urlsplit
from urllib.request import Request,build_opener

from .storage import NoRedirect,StorageUnavailable

OLLAMA_MODEL='qwen3.5:4b-hermes'
OLLAMA_URL='http://127.0.0.1:11434/v1'
OPENAI_URL='https://api.openai.com/v1'
OPENAI_MODEL='gpt-4.1-mini'
ENV_KEYS=('OPENAI_API_KEY','OPENAI_MODEL','OPENAI_BASE_URL')
ALIASES={'ollama':'ollama','local':'ollama','openai':'openai','gpt':'openai'}


def _strip_quotes(value):
    text=(value or '').strip()
    if len(text)>=2 and text[0]==text[-1] and text[0] in '"\'':
        return text[1:-1]
    return text


def read_dotenv(path):
    values={}
    try:
        lines=Path(path).read_text(encoding='utf-8').splitlines()
    except OSError:
        return values
    for line in lines:
        raw=line.strip()
        if not raw or raw.startswith('#') or '=' not in raw:
            continue
        key,value=raw.split('=',1)
        key=key.strip().removeprefix('export ')
        if key in ENV_KEYS:
            values[key]=_strip_quotes(value)
    return values


def env_files(home):
    files=[Path(home)/'.env',
           Path.home()/'Documents'/'.env.local',
           Path.home()/'Documents'/'fmi'/'findmyinvite'/'.env.local']
    here=Path(__file__).resolve()
    for parent in here.parents:
        for name in ('.env.local','.env'):
            path=parent/name
            if path.exists():
                files.append(path)
        nested=parent/'findmyinvite'/'.env.local'
        if nested.exists():
            files.append(nested)
    return files


def load_env(home):
    merged={}
    for path in env_files(home):
        merged.update(read_dotenv(path))
    for key,value in merged.items():
        if value and key not in os.environ:
            os.environ[key]=value
    return merged


def persist_openai_key(home):
    key=os.environ.get('OPENAI_API_KEY') or ''
    path=Path(home)/'.env'
    existing=path.read_text(encoding='utf-8') if path.exists() else ''
    if not key or re.search(r'^OPENAI_API_KEY=',existing,re.M):
        return
    path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    with path.open('a',encoding='utf-8') as stream:
        stream.write('\nOPENAI_API_KEY='+key+'\n')
    path.chmod(0o600)


def model_cfg(home):
    load_env(home)
    path=Path(home)/'fmi-support-model.json'
    cfg=json.loads(path.read_text()) if path.exists() else {}
    backend=cfg.get('backend')
    if backend not in {'ollama','openai'}:
        backend='openai'
    model=cfg.get('model') or (os.environ.get('OPENAI_MODEL') or OPENAI_MODEL if backend=='openai' else OLLAMA_MODEL)
    base=cfg.get('base_url') or (os.environ.get('OPENAI_BASE_URL') or OPENAI_URL if backend=='openai' else OLLAMA_URL)
    return {'backend':backend,'model':model,'base_url':base,
            'hermes_provider':'openai' if backend=='openai' else 'custom'}


def current_backend(home):
    return model_cfg(home)['backend']


def describe_backend(home):
    cfg=model_cfg(home)
    if cfg['backend']=='openai':
        return 'openai ('+cfg['model']+')'
    return 'local ollama ('+cfg['model']+')'


def provider_spec(name,home):
    load_env(home)
    if name=='openai':
        return {'backend':'openai','model':os.environ.get('OPENAI_MODEL') or OPENAI_MODEL,
                'base_url':os.environ.get('OPENAI_BASE_URL') or OPENAI_URL,'hermes_provider':'openai'}
    return {'backend':'ollama','model':OLLAMA_MODEL,'base_url':OLLAMA_URL,'hermes_provider':'custom'}


def write_model(home,name):
    spec=provider_spec(name,home)
    path=Path(home)/'fmi-support-model.json'
    current=json.loads(path.read_text()) if path.exists() else {}
    current.update({'backend':spec['backend'],'model':spec['model'],'base_url':spec['base_url']})
    path.parent.mkdir(parents=True,exist_ok=True,mode=0o700)
    path.write_text(json.dumps(current,indent=2),encoding='utf-8')
    path.chmod(0o600)
    return spec


def write_hermes_config(home,spec):
    path=Path(home)/'config.yaml'
    try:
        import yaml
        config=yaml.safe_load(path.read_text()) if path.exists() else {}
    except (OSError,ImportError):
        return
    if not isinstance(config,dict):
        return
    model=config.setdefault('model',{})
    model['default']=spec['model']
    model['provider']=spec['hermes_provider']
    model['base_url']=spec['base_url']
    path.write_text(yaml.safe_dump(config,sort_keys=False,allow_unicode=True),encoding='utf-8')
    path.chmod(0o600)


def apply_switch(home,text):
    load_env(home)
    parts=str(text or '').strip().split()
    target=(parts[1].casefold() if len(parts)>1 else '')
    if not target:
        name='openai' if current_backend(home)=='ollama' else 'ollama'
    else:
        name=ALIASES.get(target)
        if not name:
            return 'on '+describe_backend(home)+'\nsay /switch or /switch ollama or /switch openai'
    if name=='openai' and not os.environ.get('OPENAI_API_KEY'):
        return 'openai needs OPENAI_API_KEY in env'
    spec=write_model(home,name)
    write_hermes_config(home,spec)
    if name=='openai':
        persist_openai_key(home)
    return 'now on '+describe_backend(home)


def parse_json(raw):
    text=raw or ''
    start,end=text.find('{'),text.rfind('}')
    if start<0 or end<=start:
        return {}
    try:
        data=json.loads(text[start:end+1])
    except (ValueError,TypeError):
        return {}
    return data if isinstance(data,dict) else {}


def _complete_ollama(cfg,messages,think,num_predict,timeout):
    parsed=urlsplit(cfg['base_url'])
    if parsed.scheme!='http' or parsed.hostname not in {'127.0.0.1','localhost','::1'}:
        raise StorageUnavailable('local_model_endpoint_required')
    endpoint=parsed.scheme+'://'+parsed.netloc+'/api/chat'
    body={'model':cfg['model'],'messages':messages,'stream':False,'think':think,
          'options':{'num_predict':num_predict,'temperature':0.2 if think else 0.45}}
    req=Request(endpoint,data=json.dumps(body).encode(),headers={'Content-Type':'application/json'})
    try:
        with build_opener(NoRedirect).open(req,timeout=timeout) as response:
            data=json.load(response)
        return ((data.get('message') or {}).get('content') or '')
    except (OSError,ValueError,KeyError,TypeError) as error:
        raise StorageUnavailable('model_generation_unavailable') from error


def _complete_openai(cfg,messages,num_predict,timeout):
    key=os.environ.get('OPENAI_API_KEY') or ''
    if not key:
        raise StorageUnavailable('openai_key_missing')
    parsed=urlsplit(cfg['base_url'] or OPENAI_URL)
    if parsed.scheme!='https' or not (parsed.hostname or '').endswith('openai.com'):
        raise StorageUnavailable('openai_endpoint_required')
    endpoint=parsed.scheme+'://'+parsed.netloc+'/v1/chat/completions'
    body={'model':cfg['model'],'messages':messages,'stream':False,
          'temperature':0.4,'max_tokens':num_predict}
    req=Request(endpoint,data=json.dumps(body).encode(),
                headers={'Content-Type':'application/json','Authorization':'Bearer '+key})
    try:
        with build_opener(NoRedirect).open(req,timeout=timeout) as response:
            data=json.load(response)
        return (((data.get('choices') or [{}])[0].get('message') or {}).get('content') or '')
    except (OSError,ValueError,KeyError,TypeError,IndexError) as error:
        raise StorageUnavailable('model_generation_unavailable') from error


def complete(home,messages,think=False,num_predict=180,timeout=25):
    cfg=model_cfg(home)
    if cfg['backend']=='openai':
        raw=_complete_openai(cfg,messages,num_predict,timeout)
    else:
        raw=_complete_ollama(cfg,messages,think,num_predict,timeout)
    return re.sub(r'<think>.*?</think>','',raw or '',flags=re.S).strip()
