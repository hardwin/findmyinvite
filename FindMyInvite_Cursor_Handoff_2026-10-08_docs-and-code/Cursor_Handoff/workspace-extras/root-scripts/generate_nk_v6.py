#!/usr/bin/env python3
"""Generate stills-v6 from packets/IMAGE_JOB scene-0N.v6.json packets. Sequential 01→06."""
import base64, hashlib, json, os, subprocess, sys, time
from pathlib import Path

PRODUCTIONS = Path('/workspace/fmi-productions/nandini-karthik-remake')
PKT_DIR = PRODUCTIONS / 'packets' / 'IMAGE_JOB'
LOG_DIR = PRODUCTIONS / 'logs' / 'v6'
STILLS = PRODUCTIONS / 'assets' / 'stills-v6'
WORK_ROOT = Path('/tmp/nk_v6_img_work')
MODEL = 'openai/gpt-image-2.5-flare'
SCENES = [f'scene-{i:02d}' for i in range(1, 7)]
TARGET_W, TARGET_H = 720, 1280


def data_uri(path: Path) -> str:
    return 'data:image/jpeg;base64,' + base64.b64encode(path.read_bytes()).decode('ascii')


def run_curl(args):
    return subprocess.run(args, capture_output=True, text=True)


def post(token, payload_path, resp_path):
    p = run_curl([
        'curl', '-sS', '-A', 'Mozilla/5.0', '-w', '%{http_code}', '-o', str(resp_path),
        '-X', 'POST', f'https://api.replicate.com/v1/models/{MODEL}/predictions',
        '-H', f'Authorization: Bearer {token}',
        '-H', 'Content-Type: application/json',
        '-H', 'Prefer: wait=60',
        '--data-binary', f'@{payload_path}', '--max-time', '180'
    ])
    return (p.stdout or '').strip() or '000', p.stderr or ''


def get(token, url, path):
    p = run_curl(['curl', '-sS', '-A', 'Mozilla/5.0', '-o', str(path),
                  '-H', f'Authorization: Bearer {token}', '--max-time', '60', url])
    return p.returncode == 0


def download(url, path):
    p = run_curl(['curl', '-sS', '-A', 'Mozilla/5.0', '-L', '-o', str(path),
                  '--max-time', '120', url])
    return p.returncode == 0 and path.exists() and path.stat().st_size > 10000


def output_url(data):
    o = data.get('output')
    if isinstance(o, list) and o and isinstance(o[0], str):
        return o[0]
    if isinstance(o, str):
        return o
    if isinstance(o, dict):
        for v in o.values():
            if isinstance(v, str) and v.startswith('http'):
                return v
            if isinstance(v, list) and v and isinstance(v[0], str):
                return v[0]
    return None


def ffmpeg_pad(src: Path, dst: Path, tw=TARGET_W, th=TARGET_H):
    """Scale/pad to exactly tw x th JPEG."""
    tmp = dst.with_suffix('.tmp.jpg')
    cmd = [
        'ffmpeg', '-y', '-i', str(src),
        '-vf', f'scale={tw}:{th}:force_original_aspect_ratio=decrease,'
               f'pad={tw}:{th}:(ow-iw)/2:(oh-ih)/2:color=black',
        '-frames:v', '1', '-q:v', '2', str(tmp)
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0 or not tmp.exists() or tmp.stat().st_size < 10000:
        raise RuntimeError(f'ffmpeg failed rc={p.returncode}: {(p.stderr or "")[-800:]}')
    probe = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v:0',
         '-show_entries', 'stream=width,height', '-of', 'csv=p=0', str(tmp)],
        capture_output=True, text=True)
    dims = (probe.stdout or '').strip()
    if dims != f'{tw},{th}':
        raise RuntimeError(f'bad dims after ffmpeg: {dims!r} expected {tw},{th}')
    tmp.replace(dst)


def continuity_refs(scene: str):
    """scene-04 ← scene-03; scene-06 ← scene-05; others none."""
    if scene == 'scene-04':
        return [STILLS / 'scene-03.jpg']
    if scene == 'scene-06':
        return [STILLS / 'scene-05.jpg']
    return []


def write_status(log_dir, pkt, prompt_hash, status, attempt, refs_count, **extra):
    obj = {
        'ts_local': time.strftime('%Y-%m-%dT%H:%M:%S%z'),
        'job_id': pkt.get('job_id'),
        'scene_id': pkt.get('scene_id'),
        'status': status,
        'attempt': attempt,
        'generation_id': extra.pop('generation_id', None),
        'prompt_sha256': prompt_hash,
        'output_path': pkt.get('output_path'),
        'size_bytes': extra.pop('size_bytes', None),
        'sha256': extra.pop('sha256', None),
        'facet': pkt.get('facet'),
        'spatial_map_version': pkt.get('spatial_map_version'),
        'forbidden_reuse': pkt.get('forbidden_reuse'),
        'error': extra.pop('error', None),
        'model': MODEL,
        'provider': 'replicate',
        'input_images_count': refs_count,
    }
    obj.update(extra)
    path = log_dir / f'{pkt["scene_id"]}.status.json'
    path.write_text(json.dumps(obj, indent=2) + '\n')
    print(json.dumps(obj), flush=True)
    return obj


def generate_one(token, scene: str):
    pkt_path = PKT_DIR / f'{scene}.v6.json'
    if not pkt_path.exists():
        raise SystemExit(f'missing packet: {pkt_path}')
    pkt = json.loads(pkt_path.read_text())
    out = Path(pkt['output_path'])
    prompt = pkt['image_prompt']
    max_attempts = int(pkt.get('max_paid_attempts') or 2)
    prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()
    res = pkt.get('resolution') or {}
    tw = int(res.get('width') or TARGET_W)
    th = int(res.get('height') or TARGET_H)
    refs = continuity_refs(scene)
    for p in refs:
        if not p.exists():
            raise SystemExit(f'missing continuity ref: {p}')
    work = WORK_ROOT / scene
    work.mkdir(parents=True, exist_ok=True)
    LOG_DIR.mkdir(parents=True, exist_ok=True)

    print(f'[{scene}] start refs={len(refs)} prompt_sha256={prompt_hash} '
          f'facet={pkt.get("facet")} couple={pkt.get("couple")} output={out}', flush=True)
    write_status(LOG_DIR, pkt, prompt_hash, 'STARTED', 1, len(refs))

    def do_attempt(attempt):
        payload = {
            'input': {
                'prompt': prompt,
                'aspect_ratio': pkt.get('aspect_ratio') or '9:16',
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
        code, stderr = post(token, payload_path, resp_path)
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
            if get(token, poll_url, resp_path):
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
        ffmpeg_pad(raw_path, out, tw, th)
        size = out.stat().st_size
        sha = hashlib.sha256(out.read_bytes()).hexdigest()
        if size < 10000:
            raise RuntimeError(f'final output too small: {size}')
        return gen_id, url, size, sha

    last = None
    final = None
    for attempt in range(1, max_attempts + 1):
        try:
            gid, url, size, sha = do_attempt(attempt)
            final = write_status(
                LOG_DIR, pkt, prompt_hash, 'GENERATED', attempt, len(refs),
                generation_id=gid, output_url=url, size_bytes=size, sha256=sha)
            print(f'[{scene}] GENERATED {gid} size={size} sha256={sha}', flush=True)
            return final
        except Exception as e:
            last = str(e)
            print(f'[{scene}] attempt={attempt} failed: {last}', flush=True)
            if attempt < max_attempts:
                time.sleep(3)
    final = write_status(
        LOG_DIR, pkt, prompt_hash, 'FAILED', max_attempts, len(refs), error=last)
    return final


def main():
    token = os.environ.get('REPLICATE_API_TOKEN')
    if not token:
        raise SystemExit('REPLICATE_API_TOKEN is not set')
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    STILLS.mkdir(parents=True, exist_ok=True)

    only = None
    if len(sys.argv) == 2:
        only = sys.argv[1]
        if only not in SCENES:
            raise SystemExit(f'usage: generate_nk_v6.py [scene-01..scene-06]')
        scenes = [only]
    elif len(sys.argv) == 1:
        scenes = SCENES
    else:
        raise SystemExit('usage: generate_nk_v6.py [scene-01..scene-06]')

    results = []
    for scene in scenes:
        status_path = LOG_DIR / f'{scene}.status.json'
        out_guess = STILLS / f'{scene}.jpg'
        if (not only) and status_path.exists() and out_guess.exists() and out_guess.stat().st_size > 10000:
            try:
                st = json.loads(status_path.read_text())
                if st.get('status') == 'GENERATED':
                    print(f'[{scene}] skip existing GENERATED', flush=True)
                    results.append(st)
                    continue
            except Exception:
                pass
        results.append(generate_one(token, scene))

    rollup_jobs = []
    for scene in SCENES:
        sp = LOG_DIR / f'{scene}.status.json'
        if sp.exists():
            rollup_jobs.append(json.loads(sp.read_text()))
        else:
            rollup_jobs.append({'scene_id': scene, 'status': 'MISSING'})

    ok = sum(1 for j in rollup_jobs if j.get('status') == 'GENERATED')
    rollup = {
        'ts_local': time.strftime('%Y-%m-%dT%H:%M:%S%z'),
        'batch': 'stills-v6',
        'model': MODEL,
        'generated_count': ok,
        'total': 6,
        'jobs': rollup_jobs,
    }
    rollup_path = LOG_DIR / 'STILLS_V6_ROLLUP.json'
    rollup_path.write_text(json.dumps(rollup, indent=2) + '\n')
    print(f'ROLLUP written {rollup_path} generated={ok}/6', flush=True)
    if ok < len(scenes) and any(j.get('status') == 'FAILED' for j in results):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
