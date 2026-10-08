import subprocess,time,json
from pathlib import Path
root=Path('/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-003016')
pack=root/'packets'; helper=root/'scripts/ap_auto_unlock_next.py'
seen=set()
while len(seen)<8:
    for n in range(4,12):
        g=pack/f'VIDEO_DIRECTOR_CLIP{n:02d}_GENERATED.json'
        if n not in seen and g.exists():
            print(f'AP_UNLOCK clip-{n:02d}',flush=True)
            r=subprocess.run(['python3',str(helper)],cwd=root,capture_output=True,text=True)
            print(r.stdout.strip(),flush=True)
            if r.returncode!=0:
                print(r.stderr,flush=True)
            seen.add(n)
    if len(seen)>=8: break
    time.sleep(1)
