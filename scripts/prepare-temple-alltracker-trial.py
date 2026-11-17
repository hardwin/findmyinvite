"""Change only the invitation board's motion in the existing Temple renderer."""
from pathlib import Path
import argparse,json,hashlib
import cv2,numpy as np
p=argparse.ArgumentParser();p.add_argument('--tracking',type=Path,required=True);args=p.parse_args();root=Path(__file__).resolve().parent.parent;old=root/'work/temple-reference-trial';out=root/'work/temple-alltracker-trial';out.mkdir(exist_ok=True,parents=True)
master=json.loads((old/'master.json').read_text());motion=json.loads((old/'motion.json').read_text());original_motion=json.loads(json.dumps(motion));tracked=json.loads((args.tracking/'alltracker-plane.json').read_text());qref=np.float32(tracked['referenceCorners']);rows={r['frame']:np.array(r['corners'],np.float32) for r in tracked['rows']}
# Align the reference reveal to this film's actual pillar mask. All artwork,
# source frames, fonts, colour, texture and light remain the previous trial's.
keys=np.array([[145,102],[148,104],[150,107],[152,110],[154,112],[156,115],[160,120],[172,135],[208,180]],float)
anchor=172;baseline=next(e['matrix'] for e in motion['frames'][anchor] if e['asset']=='invitation');asset=np.float32([[246,350],[589,350],[589,835],[246,835]]);current=cv2.perspectiveTransform(asset[None],np.array(baseline))[0];alignment=cv2.getPerspectiveTransform(qref,current)
frames=list(range(145,209));bindings=[]
for n in frames:
 f=float(np.interp(n,keys[:,0],keys[:,1]));a=int(np.floor(f));b=min(180,a+1);t=f-a;q=rows[a]*(1-t)+rows[b]*t;quad=cv2.perspectiveTransform(q[None],alignment)[0]
 H=np.array(baseline) if n==anchor else cv2.getPerspectiveTransform(asset,quad)
 if not np.isfinite(H).all() or not cv2.isContourConvex(quad):raise RuntimeError(f'Invalid tracked plane {n}')
 entries=motion['frames'][n];entry=next((e for e in entries if e['asset']=='invitation'),None)
 if entry is None:entry={'asset':'invitation'};entries.append(entry)
 entry['matrix']=H.tolist();bindings.append({'templateFrame':n,'referenceFrame':f,'corners':quad.tolist()})
# Preserve the existing exit choreography without snapping back to the old
# reading position at frame 209. Carry a constant board-local correction until
# this layer is fully hidden; other assets and screen-space masks are unchanged.
last_tracked=frames[-1];original_end=np.array(next(e['matrix'] for e in original_motion['frames'][last_tracked] if e['asset']=='invitation'));corrected_end=np.array(next(e['matrix'] for e in motion['frames'][last_tracked] if e['asset']=='invitation'));exit_correction=np.linalg.inv(original_end)@corrected_end;exit_frames=[]
for n in range(last_tracked+1,len(motion['frames'])):
 entry=next((e for e in motion['frames'][n] if e['asset']=='invitation'),None)
 if entry is None:break
 entry['matrix']=(np.array(entry['matrix'])@exit_correction).tolist();exit_frames.append(n)
review_frames=frames+exit_frames+[exit_frames[-1]+1]
digest=lambda b:hashlib.sha256(b).hexdigest()
# Restore the exact baseline authoring asset, not a regenerated approximation.
path=root/'public'/master['assets']['motion']['path'].lstrip('/');path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes((old/'motion.json').read_bytes());assert digest(path.read_bytes())==master['assets']['motion']['sha256']
baseline_master=json.loads(json.dumps(master));data=json.dumps(motion,separators=(',',':')).encode();relative='/assets/video-masters/temple-v1/alltracker-entrance-20261117/motion.json';target=root/'public'/relative.lstrip('/');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);(out/'motion.json').write_bytes(data)
master['assets']['motion']={'path':relative,'kind':'json','sha256':digest(data)};master['release']={'approved':False,'reason':'Isolated invitation entrance trial only, not a full-film release'}
(out/'master.json').write_text(json.dumps(master,indent=2));(out/'baseline-master.json').write_text(json.dumps(baseline_master,indent=2));content=json.loads((old/'render.json').read_text(encoding='utf-8'))['content']
for name in ['baseline','alltracker']:
 config={'master':str(out/('baseline-master.json' if name=='baseline' else 'master.json')),'content':content,'reviewFrames':review_frames,'output':str(out/('render-'+name)),'requireRelease':False};(out/(name+'.json')).write_text(json.dumps(config,indent=2));(out/(name+'-exit.json')).write_text(json.dumps({**config,'reviewFrames':exit_frames+[exit_frames[-1]+1]},indent=2))
unchanged={key:master[key]==baseline_master[key] for key in ['text','textPlanes','output','photoFrames','photoSlots','preview','scenes']};assert all(unchanged.values());assert all(a==baseline_master['assets'][key] for key,a in master['assets'].items() if key!='motion')
(out/'mapping.json').write_text(json.dumps({'source':'Actual AllTracker dense correspondence','range':review_frames,'trackedRange':frames,'exitFrames':exit_frames,'exitMethod':'Original exit with constant board-local correction; no new reference tracking beyond frame 180','anchorFrame':anchor,'bindings':bindings,'unchanged':unchanged,'allNonMotionAssetsUnchanged':True,'sourceFramesRetimed':False,'scope':'First invitation board arrival/hold and continuous existing exit; unreleased'},indent=2));print(json.dumps({'directory':str(out),'frames':len(review_frames),'unchanged':unchanged},indent=2))
