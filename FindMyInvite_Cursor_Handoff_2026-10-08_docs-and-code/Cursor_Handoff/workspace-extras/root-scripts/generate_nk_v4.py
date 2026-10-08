#!/usr/bin/env python3
import base64, hashlib, json, os, subprocess, sys, time
from pathlib import Path

if len(sys.argv) != 2:
    raise SystemExit('usage: generate_nk_v4.py scene-01')
scene = sys.argv[1]
prod = Path('/workspace/fmi-productions/nandini-karthik-remake')
pkt_path = prod / 'packets-v4' / f'{scene}.json'
pkt = json.loads(pkt_path.read_text())
out = Path(pkt['output_path'])
prompt = pkt['image_prompt']
log_dir = prod / 'logs' / 'v4'
log_dir.mkdir(parents=True, exist_ok=True)
work = Path('/tmp/nk_v4_img_work') / scene
work.mkdir(parents=True, exist_ok=True)
token = os.environ.get('REPLICATE_API_TOKEN')
if not token:
    raise SystemExit('REPLICATE_API_TOKEN is not set')


def data_uri(path: Path) -> str:
    return 'data:image/jpeg;base64,' + base64.b64encode(path.read_bytes()).decode('ascii')

refs = []
if scene == 'scene-04':
    refs = [
        prod / 'assets' / 'stills-v3' / 'scene-04.jpg',
        prod / 'assets' / 'stills-v4' / 'scene-03.jpg',
    ]
elif scene in ('scene-05', 'scene-06'):
    refs = [prod / 'assets' / 'stills-v4' / 'scene-04.jpg']
for p in refs:
    if not p.exists():
        raise SystemExit(f'missing input image: {p}')

prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()

def write_status(status, attempt, **extra):
    obj = {
        'ts_local': time.strftime('%Y-%m-%dT%H:%M:%S%z'),
        'scene': scene,
        'scene_id': scene,
        'job_id': pkt.get('job_id'),
        'status': status,
        'attempt': attempt,
        'model': 'openai/gpt-image-2.5-flare',
        'provider': 'replicate',
        'prompt_sha256': prompt_hash,
        'output_path': str(out),
        'input_images_count': len(refs),
        **extra,
    }
    (log_dir / f'{scene}.status.json').write_text(json.dumps(obj, indent=2) + '\n')
    print(json.dumps(obj), flush=True)

def run_curl(args):
    return subprocess.run(args, capture_output=True, text=True)

def post(payload_path, resp_path):
    p = run_curl([
        'curl', '-sS', '-A', 'Mozilla/5.0', '-w', '%{http_code}', '-o', str(resp_path),
        '-X', 'POST', 'https://api.replicate.com/v1/models/openai/gpt-image-2.5-flare/predictions',
        '-H', f'Authorization: Bearer {token}',
        '-H', 'Content-Type: application/json',
        '-H', 'Prefer: wait=60',
        '--data-binary', f'@{payload_path}', '--max-time', '180'
    ])
    return (p.stdout or '').strip() or '000', p.stderr or ''

def get(url, path):
    p = run_curl(['curl', '-sS', '-A', 'Mozilla/5.0', '-o', str(path),
                  '-H', f'Authorization: Bearer {token}', '--max-time', '60', url])
    return p.returncode == 0

def download(url, path):
    p = run_curl(['curl', '-sS', '-A', 'Mozilla/5.0', '-L', '-o', str(path),
                  '--max-time', '120', url])
    return p.returncode == 0 and path.exists() and path.stat().st_size > 10000

def output_url(data):
    o = data.get('output')
    if isinstance(o, list) and o and isinstance(o[0], str): return o[0]
    if isinstance(o, str): return o
    if isinstance(o, dict):
        for v in o.values():
            if isinstance(v, str) and v.startswith('http'): return v
            if isinstance(v, list) and v and isinstance(v[0], str): return v[0]
    return None

def generate(attempt):
    payload = {
        'input': {
            'prompt': prompt,
            'aspect_ratio': '9:16',
            'quality': 'high',
            'output_format': 'jpeg',
            'number_of_images': 1,
        }
    }
    if refs:
        payload['input']['input_images'] = [data_uri(p) for p in refs]
    payload_path = work / f'input-{attempt}.json'
    resp_path = work / f'resp-{attempt}.json'
    raw_path = work / f'raw-{attempt}.bin'
    payload_path.write_text(json.dumps(payload))
    code, stderr = post(payload_path, resp_path)
    (work / f'http-{attempt}.txt').write_text(f'code={code}\nstderr={stderr}\n')
    if code not in ('200', '201'):
        body = resp_path.read_text(errors='replace')[:2000] if resp_path.exists() else ''
        raise RuntimeError(f'HTTP {code}: {body}')
    data = json.loads(resp_path.read_text())
    gen_id = data.get('id')
    status = data.get('status', '')
    poll_url = (data.get('urls') or {}).get('get') or f'https://api.replicate.com/v1/predictions/{gen_id}'
    polls = 0
    while status in ('starting', 'processing', 'queued'):
        polls += 1
        if polls > 120:
            raise RuntimeError(f'timeout polling status={status} id={gen_id}')
        time.sleep(5)
        if get(poll_url, resp_path):
            try:
                data = json.loads(resp_path.read_text())
                status = data.get('status', 'unknown')
            except Exception:
                status = 'unknown'
        print(f'[{scene}] attempt={attempt} poll={polls} status={status}', flush=True)
    if status != 'succeeded':
        raise RuntimeError(f'prediction {status}: {data.get("error") or status or "unknown"}')
    url = output_url(data)
    if not url:
        raise RuntimeError('no output URL in response')
    if not download(url, raw_path):
        raise RuntimeError('download failed or output too small')
    out.parent.mkdir(parents=True, exist_ok=True)
    raw_path.replace(out)
    return gen_id, url, out.stat().st_size, hashlib.sha256(out.read_bytes()).hexdigest()

print(f'[{scene}] start refs={len(refs)} prompt_sha256={prompt_hash} output={out}', flush=True)
write_status('STARTED', 1)
last = None
for attempt in (1, 2):
    try:
        gid, url, size, sha = generate(attempt)
        write_status('GENERATED', attempt, generation_id=gid, output_url=url, size_bytes=size, sha256=sha)
        print(f'[{scene}] GENERATED {gid} size={size} sha256={sha}', flush=True)
        raise SystemExit(0)
    except Exception as e:
        last = str(e)
        print(f'[{scene}] attempt={attempt} failed: {last}', flush=True)
        if attempt == 1:
            time.sleep(3)
write_status('FAILED', 2, error=last)
raise SystemExit(1)
