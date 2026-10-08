#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, os, subprocess, sys, time
from pathlib import Path

ROOT = Path('/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403')
PKT = ROOT / 'packets/IMAGE_JOB/scene-02-attempt2.json'
LOG = ROOT / 'logs/image/scene-02-attempt2.status.json'
OUT = ROOT / 'assets/output/kerala-christian-v1/image-2-attempt2.jpg'
EXPECTED_PROMPT_SHA = 'abe9245cdc2a27e5bfa5d13aefb1fe9533fca86abb2002ddbe83ecbe1242f75f'
EXPECTED_OUT = '/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403/assets/output/kerala-christian-v1/image-2-attempt2.jpg'
MODEL = 'openai/gpt-image-2.5-flare'
UA = 'Mozilla/5.0'
WORK = Path('/tmp/kc_recreate_20261003_071403_scene02_a2')


def curl(args, check=True):
    p = subprocess.run(args, capture_output=True, text=True)
    if check and p.returncode != 0:
        raise RuntimeError(f'curl rc={p.returncode}: {(p.stderr or "")[-1000:]}')
    return p


def output_url(data):
    o = data.get('output')
    if isinstance(o, str): return o
    if isinstance(o, list):
        for x in o:
            if isinstance(x, str) and x.startswith('http'): return x
    if isinstance(o, dict):
        for v in o.values():
            if isinstance(v, str) and v.startswith('http'): return v
            if isinstance(v, list):
                for x in v:
                    if isinstance(x, str) and x.startswith('http'): return x
    return None


def is_transient(code, body):
    if code in {'000','408','429','500','502','503','504'}: return True
    low = body.lower()
    return any(x in low for x in ('timeout','temporar','rate limit','try again','overloaded','connection'))


def dims(path):
    p = subprocess.run(['ffprobe','-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','csv=p=0',str(path)], capture_output=True, text=True)
    if p.returncode != 0: raise RuntimeError('ffprobe failed: '+(p.stderr or '')[-500:])
    val = (p.stdout or '').strip()
    if ',' not in val: raise RuntimeError('ffprobe bad dimensions: '+repr(val))
    w,h = [int(x) for x in val.split(',',1)]
    return w,h


def main():
    token = os.environ.get('REPLICATE_API_TOKEN')
    if not token: raise SystemExit('REPLICATE_API_TOKEN is not set')
    data = json.loads(PKT.read_text(encoding='utf-8'))
    prompt = data['image_prompt']
    got = hashlib.sha256(prompt.encode('utf-8')).hexdigest()
    if got != EXPECTED_PROMPT_SHA or got != data.get('image_prompt_sha256'):
        raise SystemExit(f'prompt hash mismatch: got {got}, expected {EXPECTED_PROMPT_SHA}')
    if str(data['output_path']) != EXPECTED_OUT or str(OUT) != EXPECTED_OUT:
        raise SystemExit('output path mismatch/refusing to proceed')
    if data.get('model',{}).get('id') != MODEL or data.get('model',{}).get('provider') != 'replicate':
        raise SystemExit('model/provider mismatch')
    if OUT.name in {'image-2.jpg','image-2-attempt1.jpg'}:
        raise SystemExit('refusing protected output name')
    WORK.mkdir(parents=True, exist_ok=True)
    payload = {'input': {
        'prompt': prompt,
        'aspect_ratio': '9:16',
        'quality': 'high',
        'output_format': 'jpeg',
        'number_of_images': 1,
    }}
    payload_path = WORK / 'payload.json'
    resp_path = WORK / 'response.json'
    raw_path = WORK / 'raw-output'
    payload_path.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    create = curl(['curl','-sS','-A',UA,'-w','%{http_code}','-o',str(resp_path),'-X','POST',f'https://api.replicate.com/v1/models/{MODEL}/predictions','-H',f'Authorization: Bearer {token}','-H','Content-Type: application/json','-H','Prefer: wait=60','--data-binary',f'@{payload_path}','--max-time','180'], check=False)
    code = (create.stdout or '').strip() or '000'
    body = resp_path.read_text(errors='replace') if resp_path.exists() else ''
    # One optional technical HTTP retry is permitted, but only if no prediction response was received.
    if code not in {'200','201'} and is_transient(code, body):
        time.sleep(3)
        create = curl(['curl','-sS','-A',UA,'-w','%{http_code}','-o',str(resp_path),'-X','POST',f'https://api.replicate.com/v1/models/{MODEL}/predictions','-H',f'Authorization: Bearer {token}','-H','Content-Type: application/json','-H','Prefer: wait=60','--data-binary',f'@{payload_path}','--max-time','180'], check=False)
        code = (create.stdout or '').strip() or '000'
        body = resp_path.read_text(errors='replace') if resp_path.exists() else ''
    if code not in {'200','201'}:
        raise RuntimeError(f'create HTTP {code}: {body[:2000]}')
    pred = json.loads(body)
    generation_id = pred.get('id')
    if not generation_id: raise RuntimeError('create response missing generation id')
    status = pred.get('status','')
    poll_url = (pred.get('urls') or {}).get('get') or f'https://api.replicate.com/v1/predictions/{generation_id}'
    polls = 0
    while status in {'starting','processing','queued'}:
        polls += 1
        if polls > 120: raise RuntimeError(f'poll timeout status={status} id={generation_id}')
        time.sleep(5)
        poll = curl(['curl','-sS','-A',UA,'-o',str(resp_path),'-H',f'Authorization: Bearer {token}','--max-time','60',poll_url], check=False)
        if poll.returncode != 0: raise RuntimeError(f'poll curl rc={poll.returncode}: {(poll.stderr or "")[-500:]}')
        pred = json.loads(resp_path.read_text())
        status = pred.get('status','unknown')
        print(f'poll={polls} status={status} id={generation_id}', flush=True)
    if status != 'succeeded': raise RuntimeError(f'prediction {status}: {pred.get("error") or status}')
    url = output_url(pred)
    if not url: raise RuntimeError('prediction succeeded without output URL')
    dl = curl(['curl','-sS','-A',UA,'-L','-o',str(raw_path),'--max-time','120',url], check=False)
    if dl.returncode != 0 or not raw_path.exists() or raw_path.stat().st_size <= 10000:
        raise RuntimeError(f'download failed rc={dl.returncode} bytes={raw_path.stat().st_size if raw_path.exists() else 0}: {(dl.stderr or "")[-500:]}')
    OUT.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUT.with_suffix('.tmp.jpg')
    ff = subprocess.run(['ffmpeg','-y','-i',str(raw_path),'-vf','scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black','-frames:v','1','-q:v','2',str(tmp)],capture_output=True,text=True)
    if ff.returncode != 0 or not tmp.exists() or tmp.stat().st_size <= 10000:
        raise RuntimeError(f'ffmpeg failed rc={ff.returncode} bytes={tmp.stat().st_size if tmp.exists() else 0}: {(ff.stderr or "")[-1000:]}')
    if dims(tmp) != (720,1280): raise RuntimeError(f'bad final dims {dims(tmp)}')
    tmp.replace(OUT)
    size = OUT.stat().st_size
    sha = hashlib.sha256(OUT.read_bytes()).hexdigest()
    if size <= 10000: raise RuntimeError(f'final output too small: {size}')
    now = time.strftime('%Y-%m-%dT%H:%M:%S%z')
    result = {
        'ts_local': now, 'job_id': data.get('job_id'), 'scene_id': 'scene-02', 'scene_index': 2,
        'status': 'GENERATED', 'attempt': 2, 'generation_id': generation_id,
        'prompt_sha256': got, 'output_path': str(OUT), 'output_url': url,
        'sha256': sha, 'size_bytes': size, 'bytes': size, 'width': 720, 'height': 1280,
        'model': MODEL, 'provider': 'replicate', 'generation': 'text-only', 'technical_retries': 0,
        'error': None,
    }
    LOG.parent.mkdir(parents=True, exist_ok=True)
    LOG.write_text(json.dumps(result, indent=2)+'\n', encoding='utf-8')
    # Update only this packet after the paid generation and final output have succeeded.
    data['status'] = 'GENERATED'
    data['authorized_to_dispatch'] = False
    data['generation_id'] = generation_id
    data['output_sha256'] = sha
    data['output_size_bytes'] = size
    data['output_path'] = str(OUT)
    data['output_url'] = url
    data['generated_at'] = now
    data['attempt'] = 2
    PKT.write_text(json.dumps(data, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    print(json.dumps({'generation_id':generation_id,'output_path':str(OUT),'bytes':size,'sha256':sha,'width':720,'height':1280,'prompt_sha256':got,'status':'GENERATED'}, indent=2), flush=True)

if __name__ == '__main__':
    main()
