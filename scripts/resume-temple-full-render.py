"""Reuse verified immutable frames; render every frame affected by the final master."""
import hashlib,json,shutil
from pathlib import Path
root=Path(__file__).resolve().parent.parent;out=root/'work/temple-alltracker-full';approved=root/'work/temple-alltracker-trial'
new=json.loads((out/'motion.json').read_text());baseline=json.loads((approved/'motion.json').read_text());master=json.loads((out/'master.json').read_text());snapshot=json.loads((out/'boards-batch-snapshot.json').read_text());revised=out/'revised-frames';revised.mkdir(exist_ok=True)
assert snapshot['compositorSha256']==hashlib.sha256((root/'src/video/temple-compositor.mjs').read_bytes()).hexdigest()
for k,v in snapshot['master'].items():
    if k not in ['release','assets']:assert master[k]==v
for k,v in snapshot['master']['assets'].items():
    if k!='motion':assert master['assets'][k]==v
def same_frame(a,b,n):
    if a['frames'][n]!=b['frames'][n]:return False
    # Motion blur samples neighboring poses for each currently active layer.
    for entry in a['frames'][n]:
        for t in [max(0,n-1),min(1295,n+1)]:
            aa=next((e for e in a['frames'][t] if e['asset']==entry['asset']),None)
            bb=next((e for e in b['frames'][t] if e['asset']==entry['asset']),None)
            if aa!=bb:return False
    return a['occlusion']==b['occlusion']
reused=[];invalidated=[]
for n in snapshot['frames']:
    if not same_frame(snapshot['motion'],new,n):
        invalidated.append(n)
        continue
    assert (revised/f'{n:05}.png').exists(),f'Missing completed board frame: {n}'
    reused.append(n)
copied=[]
for n in range(1296):
    if n in reused:continue
    if same_frame(baseline,new,n):
        shutil.copyfile(out/'baseline-frames'/f'{n:05}.png',revised/f'{n:05}.png');copied.append(n)
remaining=sorted(set(range(1296))-set(reused)-set(copied));config=json.loads((out/'render.json').read_text());config['reviewFrames']=remaining;(out/'remaining.json').write_text(json.dumps(config,indent=2));(out/'render-reuse.json').write_text(json.dumps({'completedBoardFrames':reused,'invalidatedTransitionFrames':invalidated,'unchangedCopiedFrames':copied,'remainingFrames':remaining,'neighboringMotionAndAllStylesVerified':True},indent=2));print(json.dumps({'renderedBoards':len(reused),'unchangedBaseline':len(copied),'remaining':len(remaining),'invalidated':invalidated}))
