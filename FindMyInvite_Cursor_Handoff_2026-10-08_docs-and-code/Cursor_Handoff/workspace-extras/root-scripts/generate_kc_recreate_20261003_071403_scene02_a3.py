#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, os, subprocess, time
from pathlib import Path

ROOT = Path('/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403')
PKT = ROOT / 'packets/IMAGE_JOB/scene-02-attempt3.json'
LOG = ROOT / 'logs/image/scene-02-attempt3.status.json'
OUT = ROOT / 'assets/output/kerala-christian-v1/image-2-attempt3.jpg'
EXPECTED_PROMPT_SHA = '7ee70badd82f13b1175815eca86b879fa750b718decbe497842d5390287c8161'
MODEL = 'openai/gpt-image-2.5-flare'
UA = 'Mozilla/5.0'
WORK = Path('/tmp/kc_recreate_20261003_071403_scene02_a3')
PROTECTED = [
    ROOT / 'assets/output/kerala-christian-v1/image-2.jpg',
    ROOT / 'assets/output/kerala-christian-v1/image-2-attempt1.jpg',
    ROOT / 'assets/output/kerala-christian-v1/image-2-attempt2.jpg',
]


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def extract_url(data):
    o = data.get('output')
    if isinstance(o, str) and o.startswith('http'):
        return o
    if isinstance(o, list):
        for x in o:
            if isinstance(x, str) and x.startswith('http'):
                return x
    if isinstance(o, dict):
        for v in o.values():
            if isinstance(v, str) and v.startswith('http'):
                return v
            if isinstance(v, list):
                for x in v:
                    if isinstance(x, str) and x.startswith('http'):
                        return x
    return None


def dims(path):
    p = run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
             '-show_entries', 'stream=width,height', '-of', 'csv=p=0', str(path)])
    if p.returncode != 0:
        raise RuntimeError('ffprobe failed: ' + (p.stderr or '')[-500:])
    val = (p.stdout or '').strip()
    w, h = [int(x) for x in val.split(',', 1)]
    return w, h


def main():
    token = os.environ.get('REPLICATE_API_TOKEN')
    if not token:
        raise SystemExit('REPLICATE_API_TOKEN is not set')
    data = json.loads(PKT.read_text(encoding='utf-8'))
    prompt = data['image_prompt']
    prompt_sha = hashlib.sha256(prompt.encode('utf-8')).hexdigest()
    print(f'prompt_sha256={prompt_sha} expected={EXPECTED_PROMPT_SHA}', flush=True)
    if prompt_sha != EXPECTED_PROMPT_SHA or prompt_sha != data.get('image_prompt_sha256'):
        raise SystemExit(f'prompt hash mismatch: got {prompt_sha}, expected {EXPECTED_PROMPT_SHA}')
    if str(data.get('output_path')) != str(OUT):
        raise SystemExit('output path mismatch/refusing to proceed')
    if data.get('model', {}).get('id') != MODEL or data.get('model', {}).get('provider') != 'replicate':
        raise SystemExit('model/provider mismatch')
    if OUT.exists():
        raise SystemExit('refusing to overwrite existing attempt3 output')
    before = {str(p): (p.stat().st_size, p.stat().st_mtime_ns) for p in PROTECTED}
    WORK.mkdir(parents=True, exist_ok=True)
    payload_path = WORK / 'payload.json'
    resp_path = WORK / 'response.json'
    raw_path = WORK / 'raw-output'
    payload = {'input': {
        'prompt': prompt,
        'aspect_ratio': '9:16',
        'quality': 'high',
        'output_format': 'jpeg',
        'number_of_images': 1,
    }}
    payload_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    endpoint = f'https://api.replicate.com/v1/models/{MODEL}/predictions'
    args = ['curl', '-sS', '-A', UA, '-w', '%{http_code}', '-o', str(resp_path),
            '-X', 'POST', endpoint, '-H', f'Authorization: Bearer {token}',
            '-H', 'Content-Type: application/json', '-H', 'Prefer: wait=60',
            '--data-binary', f'@{payload_path}', '--max-time', '180']
    create = run(args)
    code = (create.stdout or '').strip() or '000'
    body = resp_path.read_text(errors='replace') if resp_path.exists() else ''
    # At most one technical retry, only for a transport-level failure with no HTTP response.
    if code == '000':
        print('technical HTTP retry after transport failure', flush=True)
        time.sleep(3)
        create = run(args)
        code = (create.stdout or '').strip() or '000'
        body = resp_path.read_text(errors='replace') if resp_path.exists() else ''
    if code not in {'200', '201'}:
        raise RuntimeError(f'create HTTP {code}: {body[:2000]}')
    pred = json.loads(body)
    generation_id = pred.get('id')
    if not generation_id:
        raise RuntimeError('create response missing generation id')
    status = pred.get('status', '')
    poll_url = (pred.get('urls') or {}).get('get') or f'https://api.replicate.com/v1/predictions/{generation_id}'
    polls = 0
    while status in {'starting', 'processing', 'queued'}:
        polls += 1
        if polls > 120:
            raise RuntimeError(f'poll timeout status={status} id={generation_id}')
        time.sleep(5)
        poll = run(['curl', '-sS', '-A', UA, '-o', str(resp_path),
                    '-H', f'Authorization: Bearer {token}', '--max-time', '60', poll_url])
        if poll.returncode != 0:
            raise RuntimeError(f'poll curl rc={poll.returncode}: {(poll.stderr or "")[-500:]}')
        pred = json.loads(resp_path.read_text())
        status = pred.get('status', 'unknown')
        print(f'poll={polls} status={status} id={generation_id}', flush=True)
    if status != 'succeeded':
        raise RuntimeError(f'prediction {status}: {pred.get("error") or status}')
    url = extract_url(pred)
    if not url:
        raise RuntimeError('prediction succeeded without output URL')
    dl = run(['curl', '-sS', '-A', UA, '-L', '-o', str(raw_path), '--max-time', '120', url])
    if dl.returncode != 0 or not raw_path.exists() or raw_path.stat().st_size <= 10000:
        raise RuntimeError(f'download failed rc={dl.returncode} bytes={raw_path.stat().st_size if raw_path.exists() else 0}: {(dl.stderr or "")[-500:]}')
    OUT.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUT.with_suffix('.tmp.jpg')
    ff = run(['ffmpeg', '-y', '-i', str(raw_path), '-vf',
              'scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black',
              '-frames:v', '1', '-q:v', '2', str(tmp)])
    if ff.returncode != 0 or not tmp.exists() or tmp.stat().st_size <= 10000:
        raise RuntimeError(f'ffmpeg failed rc={ff.returncode} bytes={tmp.stat().st_size if tmp.exists() else 0}: {(ff.stderr or "")[-1000:]}')
    if dims(tmp) != (720, 1280):
        raise RuntimeError(f'bad final dims {dims(tmp)}')
    tmp.replace(OUT)
    size = OUT.stat().st_size
    sha = hashlib.sha256(OUT.read_bytes()).hexdigest()
    if size <= 10000:
        raise RuntimeError(f'final output too small: {size}')
    after = {str(p): (p.stat().st_size, p.stat().st_mtime_ns) for p in PROTECTED}
    if before != after:
        raise RuntimeError(f'protected file changed: before={before} after={after}')
    now = time.strftime('%Y-%m-%dT%H:%M:%S%z')
    result = {
        'ts_local': now, 'job_id': data.get('job_id'), 'scene_id': 'scene-02', 'scene_index': 2,
        'status': 'GENERATED', 'attempt': 3, 'generation_id': generation_id,
        'prompt_sha256': prompt_sha, 'output_path': str(OUT), 'output_url': url,
        'sha256': sha, 'size_bytes': size, 'bytes': size, 'width': 720, 'height': 1280,
        'model': MODEL, 'provider': 'replicate', 'generation': 'text-only',
        'technical_retries': 1 if code == '000' else 0, 'error': None,
    }
    LOG.parent.mkdir(parents=True, exist_ok=True)
    LOG.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    data['status'] = 'GENERATED'
    data['authorized_to_dispatch'] = False
    data['generation_id'] = generation_id
    data['output_sha256'] = sha
    data['output_size_bytes'] = size
    data['output_path'] = str(OUT)
    data['output_url'] = url
    data['generated_at'] = now
    data['attempt'] = 3
    PKT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({'generation_id': generation_id, 'output_path': str(OUT), 'bytes': size,
                      'sha256': sha, 'width': 720, 'height': 1280,
                      'prompt_sha256': prompt_sha, 'status': 'GENERATED'}, indent=2), flush=True)

if __name__ == '__main__':
    main()
