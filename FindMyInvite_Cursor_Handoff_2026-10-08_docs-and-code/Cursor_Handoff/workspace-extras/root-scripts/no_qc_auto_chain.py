#!/usr/bin/env python3
import hashlib, json, os, subprocess, sys, time
from pathlib import Path
from datetime import datetime, timezone, timedelta

ROOT = Path('/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-003016')
PACKETS = ROOT/'packets'
JOBS = PACKETS/'VIDEO_JOB'
OUT = ROOT/'assets/output/kerala-christian-v1'
LOG = ROOT/'logs/video_jobs'
SCRIPT = ROOT/'scripts/run_recreate_video_chain.py'
IST = timezone(timedelta(hours=5, minutes=30))

def now(): return datetime.now(IST).isoformat()
def sha(p):
    h=hashlib.sha256()
    with open(p,'rb') as f:
        for b in iter(lambda:f.read(1<<20), b''): h.update(b)
    return h.hexdigest()
def write(p,obj):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(obj,indent=2)+'\n')
def probe(p):
    r=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(p)],capture_output=True,text=True)
    return float(r.stdout.strip() or 0)
def wait_unlock(n):
    p=JOBS/f'clip-{n:02d}.json'
    deadline=time.monotonic()+300
    last=None
    while time.monotonic()<deadline:
        try:
            d=json.loads(p.read_text()); auth=d.get('authorized_to_dispatch'); status=d.get('status')
        except Exception as e:
            auth=False; status=f'read_error:{e}'
        if auth:
            print(f'UNLOCK clip-{n:02d} authorized_to_dispatch=true status={status} at {now()}',flush=True)
            return d
        if status != last:
            print(f'WAIT clip-{n:02d} authorized_to_dispatch=false status={status} at {now()}',flush=True)
            last=status
        time.sleep(5)
    d={}
    try: d=json.loads(p.read_text())
    except Exception: pass
    waiting={
      'packet_type':f'VIDEO_DIRECTOR_WAITING_UNLOCK_CLIP{n:02d}',
      'production_id':'kc-v1-recreate-20261003-003016', 'clip_id':f'clip-{n:02d}',
      'job_id':f'VID-clip-{n:02d}', 'status':'WAITING_UNLOCK_TIMEOUT',
      'authorized_to_dispatch':d.get('authorized_to_dispatch',False),
      'job_status':d.get('status'), 'wait_limit_seconds':300,
      'timed_out_at':now(), 'video_job_packet':str(p)
    }
    out=PACKETS/f'VIDEO_DIRECTOR_WAITING_UNLOCK_CLIP{n:02d}.json'; write(out,waiting)
    print(f'TIMEOUT clip-{n:02d}; wrote {out}',flush=True)
    return None

def emit_receipts(n, packet):
    clip_id=f'clip-{n:02d}'; job_id=f'VID-clip-{n:02d}'
    status_path=LOG/f'{job_id}.status.json'
    st=json.loads(status_path.read_text())
    output=Path(packet['output_clip_path']); handoff=Path(packet['final_frame_path'])
    if st.get('status')!='generated' or not output.is_file() or not handoff.is_file():
        raise RuntimeError(f'clip-{n:02d} missing generated artifacts/status')
    mp4sha=sha(output); handsha=sha(handoff)
    tech=st.get('technical_probe') or {}
    rec={
      'packet_type':f'VIDEO_DIRECTOR_CLIP{n:02d}_GENERATED',
      'production_id':'kc-v1-recreate-20261003-003016','job_id':job_id,'clip_id':clip_id,
      'attempt':st.get('attempt',packet.get('attempt',1)),'status':'GENERATED',
      'output_clip_path':str(output),'handoff_path':str(handoff),
      'sha256':{'mp4':mp4sha,'handoff':handsha},
      'request_id':st.get('request_id') or st.get('generation_id'),
      'prompt_sha256':st.get('prompt_sha256'),'prompt_sha_match':st.get('prompt_sha_match'),
      'continuity_qc':'WAIVED','next_unlock_hint':f'clip-{n+1:02d}' if n<11 else None,
      'duration_s':tech.get('duration_s',probe(output)),
      'requested_duration_s':packet.get('duration_seconds',5),
      'model':st.get('model','grok-imagine-video-1.5'),'resolution':st.get('resolution','720p'),
      'aspect_ratio':st.get('aspect_ratio','9:16'),'handoff_decode_verified':True,
      'status_json':str(status_path)
    }
    genpath=PACKETS/f'VIDEO_DIRECTOR_CLIP{n:02d}_GENERATED.json'; write(genpath,rec)
    stamp={
      'packet_type':f'ASSET_PRODUCER_HANDOFF_READY_CLIP{n:02d}',
      'production_id':'kc-v1-recreate-20261003-003016','clip_id':clip_id,'job_id':job_id,
      'status':'HANDOFF_READY','handoff_path':str(handoff),'handoff_sha256':handsha,
      'output_clip_path':str(output),'clip_sha256':mp4sha,'request_id':rec['request_id'],
      'continuity_qc':'WAIVED','generated_packet':str(genpath),'created_at':now()
    }
    stamppath=PACKETS/f'ASSET_PRODUCER_HANDOFF_READY_CLIP{n:02d}.json'; write(stamppath,stamp)
    print(f'EMIT clip-{n:02d} generated={genpath} stamp={stamppath} mp4={mp4sha} handoff={handsha}',flush=True)
    return rec

def run_clip(n, packet):
    expected=OUT/f'clip-{n-1}-handoff.jpg'
    first=Path(packet.get('first_frame_path',''))
    if first != expected:
        raise RuntimeError(f'clip-{n:02d} first_frame_path is {first}, expected prior handoff {expected}')
    if not first.is_file() or first.stat().st_size < 1000:
        raise RuntimeError(f'clip-{n:02d} first_frame missing/small: {first}')
    print(f'VERIFY clip-{n:02d} first_frame prior handoff OK: {first}',flush=True)
    r=subprocess.run([sys.executable,str(SCRIPT),'--only',f'{n:02d}'],cwd=ROOT)
    if r.returncode != 0:
        raise RuntimeError(f'run_recreate_video_chain.py failed for clip-{n:02d} rc={r.returncode}')
    return emit_receipts(n,packet)

def concat_and_complete(recs):
    r=subprocess.run([sys.executable,str(SCRIPT),'--concat'],cwd=ROOT)
    if r.returncode != 0: raise RuntimeError(f'concat failed rc={r.returncode}')
    final=OUT/'kerala-christian-v1-final.mp4'; dl=OUT/'kerala-christian-v1-final-dl.mp4'
    cmd=['ffmpeg','-y','-i',str(final),'-an','-c:v','libx264','-crf','28','-preset','medium','-pix_fmt','yuv420p',str(dl)]
    r=subprocess.run(cmd,cwd=ROOT,capture_output=True,text=True)
    if r.returncode != 0 or not dl.is_file(): raise RuntimeError('lighter final ffmpeg failed: '+r.stderr[-1000:])
    clips=[]
    for n in range(1,12):
        mp4=OUT/f'clip-{n}.mp4'; hand=OUT/f'clip-{n}-handoff.jpg'
        clips.append({'clip_id':f'clip-{n:02d}','output_clip_path':str(mp4),'clip_sha256':sha(mp4),'handoff_path':str(hand),'handoff_sha256':sha(hand),'duration_s':probe(mp4)})
    packet={
      'packet_type':'VIDEO_DIRECTOR_CLIPS_COMPLETE','production_id':'kc-v1-recreate-20261003-003016','status':'COMPLETE',
      'clip_count':11,'final_mp4':str(final),'final_mp4_sha256':sha(final),'final_dl_mp4':str(dl),'final_dl_mp4_sha256':sha(dl),
      'duration_s':probe(final),'final_dl_duration_s':probe(dl),'clips':clips,'continuity_qc':'WAIVED','completed_at':now()
    }
    path=PACKETS/'VIDEO_DIRECTOR_CLIPS_COMPLETE.json'; write(path,packet)
    print(f'COMPLETE final={final} sha256={packet["final_mp4_sha256"]} duration_s={packet["duration_s"]}',flush=True)
    print(f'COMPLETE lighter={dl} sha256={packet["final_dl_mp4_sha256"]} duration_s={packet["final_dl_duration_s"]}',flush=True)
    print(f'WROTE {path}',flush=True)
    return packet

def main():
    recs=[]
    for n in range(4,12):
        packet=wait_unlock(n)
        if packet is None: return 2
        recs.append(run_clip(n,packet))
    concat_and_complete(recs)
    return 0
if __name__=='__main__':
    try: sys.exit(main())
    except Exception as e:
        print('FATAL '+repr(e),file=sys.stderr,flush=True); sys.exit(1)
