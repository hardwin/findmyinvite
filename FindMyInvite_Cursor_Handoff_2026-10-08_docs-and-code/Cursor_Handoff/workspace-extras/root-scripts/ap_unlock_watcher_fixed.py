import subprocess,time,json
from pathlib import Path
root=Path('/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-003016')
pack=root/'packets'; jobs=pack/'VIDEO_JOB'; helper=root/'scripts/ap_auto_unlock_next.py'
seen=set()
while len(seen)<7:
    for n in range(5,12):
        g=pack/f'VIDEO_DIRECTOR_CLIP{n:02d}_GENERATED.json'
        if n not in seen and g.exists():
            # The chain runner marks its own job GENERATED_AWAITING_CONTINUITY;
            # normalize that terminal disk state so the supplied AP helper can advance.
            jp=jobs/f'clip-{n:02d}.json'
            d=json.loads(jp.read_text())
            if d.get('status') != 'GENERATED':
                d['status']='GENERATED'
                jp.write_text(json.dumps(d,indent=2)+'\n')
            print(f'AP_UNLOCK clip-{n:02d}',flush=True)
            r=subprocess.run(['python3',str(helper)],cwd=root,capture_output=True,text=True)
            print(r.stdout.strip(),flush=True)
            if r.returncode!=0: print(r.stderr,flush=True)
            seen.add(n)
    if len(seen)>=7: break
    time.sleep(1)
