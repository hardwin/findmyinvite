#!/usr/bin/env python3
import hashlib, json, os, subprocess, sys, time
from pathlib import Path

scene = sys.argv[1]
prod = Path('/workspace/fmi-productions/nandini-karthik-remake')
pkt_path = prod / 'packets' / f'scene-{scene}.json'
log_dir = prod / 'logs'
log_dir.mkdir(parents=True, exist_ok=True)
work = Path('/tmp/fmi_img_work_nandini') / scene
work.mkdir(parents=True, exist_ok=True)

pkt = json.loads(pkt_path.read_text())
prompt = pkt['image_prompt']
out = Path(pkt['output_path'])
prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()
token = os.environ['REPLICATE_API_TOKEN']
status_path = log_dir / f'scene-{scene}.status.json'


def write_status(status, attempt, **extra):
    obj = {
        'scene': scene,
        'status': status,
        'attempt': attempt,
        'model': 'openai/gpt-image-2.5-flare',
        'provider': 'replicate',
        'prompt_sha256': prompt_hash,
        'output_path': str(out),
        **extra,
    }
    status_path.write_text(json.dumps(obj, indent=2) + '\n')
    print(json.dumps(obj), flush=True)


def curl_post(payload_path, resp_path):
    p = subprocess.run([
        'curl', '-sS', '-A', 'Mozilla/5.0', '-w', '%{http_code}', '-o', str(resp_path),
        '-X', 'POST', 'https://api.replicate.com/v1/models/openai/gpt-image-2.5-flare/predictions',
        '-H', f'Authorization: Bearer {token}',
        '-H', 'Content-Type: application/json',
        '-H', 'Prefer: wait=60',
        '--data-binary', f'@{payload_path}', '--max-time', '180'
    ], capture_output=True, text=True)
    return (p.stdout or '').strip() or '000', p.stderr or ''


def curl_get(url, path):
    p = subprocess.run([
        'curl', '-sS', '-A', 'Mozilla/5.0', '-o', str(path),
        '-H', f'Authorization: Bearer {token}', '--max-time', '60', url
    ], capture_output=True, text=True)
    return p.returncode == 0


def curl_download(url, path):
    p = subprocess.run([
        'curl', '-sS', '-A', 'Mozilla/5.0', '-L', '-o', str(path),
        '--max-time', '120', url
    ], capture_output=True, text=True)
    return p.returncode == 0 and path.exists() and path.stat().st_size > 0


def extract_url(data):
    o = data.get('output')
    if isinstance(o, list) and o:
        return o[0] if isinstance(o[0], str) else None
    if isinstance(o, str): return o
    if isinstance(o, dict):
        for v in o.values():
            if isinstance(v, str) and v.startswith('http'): return v
            if isinstance(v, list) and v and isinstance(v[0], str): return v[0]
    return None


def generate(attempt):
    payload_path = work / f'input-{attempt}.json'
    resp_path = work / f'resp-{attempt}.json'
    raw_path = work / f'raw-{attempt}.bin'
    payload_path.write_text(json.dumps({'input': {
        'prompt': prompt, 'aspect_ratio': '9:16', 'quality': 'high',
        'output_format': 'jpeg', 'number_of_images': 1,
    }}))
    code, stderr = curl_post(payload_path, resp_path)
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
        if curl_get(poll_url, resp_path):
            try:
                data = json.loads(resp_path.read_text())
                status = data.get('status', 'unknown')
            except Exception:
                status = 'unknown'
        print(f'[{scene}] attempt={attempt} poll={polls} status={status}', flush=True)
    if status != 'succeeded':
        raise RuntimeError(f'prediction {status}: {data.get("error") or status or "unknown"}')
    out_url = extract_url(data)
    if not out_url:
        raise RuntimeError('no output URL in response')
    if not curl_download(out_url, raw_path):
        raise RuntimeError('download failed')
    if raw_path.stat().st_size <= 10000:
        raise RuntimeError(f'downloaded output too small: {raw_path.stat().st_size} bytes')
    out.parent.mkdir(parents=True, exist_ok=True)
    out.unlink(missing_ok=True)
    raw_path.replace(out)
    size = out.stat().st_size
    sha = hashlib.sha256(out.read_bytes()).hexdigest()
    return gen_id, out_url, size, sha

print(f'[{scene}] start prompt_sha256={prompt_hash} output={out}', flush=True)
last_error = None
for attempt in (1, 2):
    try:
        gid, url, size, sha = generate(attempt)
        write_status('GENERATED', attempt, generation_id=gid, output_url=url, size_bytes=size, sha256=sha)
        print(f'[{scene}] GENERATED {gid} size={size} sha256={sha}', flush=True)
        sys.exit(0)
    except Exception as e:
        last_error = str(e)
        print(f'[{scene}] attempt={attempt} failed: {last_error}', flush=True)
        if attempt == 1:
            time.sleep(3)
write_status('FAILED', 2, error=last_error)
sys.exit(1)
