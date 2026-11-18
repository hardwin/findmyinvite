"""Apply measured motion to immutable Temple source layers for owner review."""
import argparse,hashlib,json
from pathlib import Path
import cv2,numpy as np

p=argparse.ArgumentParser();p.add_argument('--tracking',type=Path,required=True);p.add_argument('--scenes',nargs='*');a=p.parse_args()
root=Path(__file__).resolve().parent.parent;out=root/'work/temple-alltracker-full';out.mkdir(exist_ok=True,parents=True)
approved=root/'work/temple-alltracker-trial';baseline=json.loads((approved/'master.json').read_text());original=json.loads((approved/'motion.json').read_text());motion=json.loads(json.dumps(original));master=json.loads(json.dumps(baseline))
baseline_bytes=(approved/'motion.json').read_bytes()
assert hashlib.sha256(baseline_bytes).hexdigest()==baseline['assets']['motion']['sha256']
baseline_path=root/'public'/baseline['assets']['motion']['path'].lstrip('/');baseline_path.parent.mkdir(parents=True,exist_ok=True);baseline_path.write_bytes(baseline_bytes)
specs=json.loads(Path(__file__).with_name('temple-alltracker-scenes.json').read_text())
# Reference and existing-film pillars are different. Align measured movement to
# this film's reveal, and keep the real local foreground masks unchanged.
layout={
 'family':{'anchor':552,'end':578,'keys':[[480,486],[486,486],[498,500],[512,518],[552,555],[578,579]],'quad':[[200,365],[515,365],[515,790],[200,790]]},
 'ceremony':{'anchor':675,'end':696,'keys':[[601,610],[604,610],[612,620],[634,638],[675,675],[696,718]],'quad':[[48,575],[672,575],[672,854],[48,854]]},
 'venue':{'source':'family','anchor':795,'end':818,'keys':[[722,486],[726,486],[738,500],[750,518],[795,555],[818,578]],'quad':[[200,365],[515,365],[515,790],[200,790]]},
 'reception':{'anchor':910,'end':944,'keys':[[846,750],[850,755],[858,768],[870,790],[880,800],[910,870],[944,940]],'quad':[[230,330],[572,330],[572,790],[230,790]]},
 'hosts':{'anchor':1035,'end':1060,'keys':[[971,963],[980,978],[992,998],[1000,1005],[1035,1065],[1060,1130]],'quad':[[180,375],[555,375],[555,955],[180,955]]},
 'opening':{'anchor':102,'end':119,'keys':[[60,43],[102,60],[119,73]],'quad':[[50,175],[670,175],[670,425],[50,425]]},
 'groom':{'anchor':310,'end':348,'keys':[[241,282],[270,282],[310,310],[348,339]],'quad':[[395,430],[705,430],[705,740],[395,740]]},
 'bride':{'anchor':430,'end':468,'keys':[[362,392],[390,392],[430,420],[468,453]],'quad':[[120,149],[690,149],[690,326],[120,326]]},
 'closing':{'anchor':1248,'end':1295,'keys':[[1086,1242],[1120,1242],[1248,1270],[1295,1316]],'quad':[[70,195],[650,195],[650,403],[70,403]]}
}
def project(q,h):return cv2.perspectiveTransform(np.float32(q)[None],np.asarray(h,dtype=float))[0]
reports=[]
for name,L in layout.items():
    source=L.get('source',name)
    if a.scenes and name not in a.scenes:continue
    path=a.tracking/source/'plane.json'
    if not path.exists():raise RuntimeError('Missing measured track '+source)
    fit=json.loads(path.read_text());s=specs[source];floating=s['kind']=='floating'
    key='textMatrix' if floating else 'matrix';qa=np.float32(L['quad']);qr=np.float32(fit['referenceCorners'])
    base=np.array(next(e['matrix'] for e in original['frames'][L['anchor']] if e['asset']==name))
    alignment=cv2.getPerspectiveTransform(qr,project(qa,base));model={r['frame']:np.float32(r['corners']) for r in fit['rows']};keys=np.asarray(L['keys'],float)
    active=[n for n,entries in enumerate(original['frames']) if any(e['asset']==name for e in entries)];bindings=[];end=L['end']
    for n in active:
        if n>end:continue
        frame=float(np.interp(n,keys[:,0],keys[:,1]));lo=int(np.floor(frame));hi=min(s['end'],lo+1);t=frame-lo
        q=model[lo]*(1-t)+model[hi]*t;target=project(q,alignment)
        H=base if n==L['anchor'] else cv2.getPerspectiveTransform(qa,target)
        if not np.isfinite(H).all() or not cv2.isContourConvex(target):raise RuntimeError(f'Invalid {name} plane at {n}')
        entry=next(e for e in motion['frames'][n] if e['asset']==name);entry[key]=H.tolist()
        bindings.append({'frame':n,'referenceFrame':frame,'corners':target.tolist()})
    # Keep the existing exit camera path, translated from the corrected hold;
    # this avoids both an untracked scene extrapolation and a one-frame snap.
    before=np.array(next(e['matrix'] for e in original['frames'][end] if e['asset']==name));after=np.array(next(e[key] for e in motion['frames'][end] if e['asset']==name));correction=np.linalg.inv(before)@after
    for n in active:
        if n>end:
            entry=next(e for e in motion['frames'][n] if e['asset']==name);entry[key]=(np.array(entry['matrix'])@correction).tolist()
    reports.append({'id':name,'source':source,'kind':s['kind'],'active':active,'anchor':L['anchor'],'trackedEnd':end,'bindings':bindings,'alignment':alignment.tolist(),'localQuad':qa.tolist(),'adaptation':name=='venue'})

# Approved invitation board remains bit-for-bit unchanged, including its exit.
for n in range(1296):
    old=next((e for e in original['frames'][n] if e['asset']=='invitation'),None);new=next((e for e in motion['frames'][n] if e['asset']=='invitation'),None)
    assert old==new
    for e in original['frames'][n]:
        if e['asset'] in ['groom','bride','closing']:
            assert e['matrix']==next(x['matrix'] for x in motion['frames'][n] if x['asset']==e['asset'])
assert original['occlusion']==motion['occlusion']
data=json.dumps(motion,separators=(',',':')).encode();relative='/assets/video-masters/temple-v1/alltracker-full-20261118/motion.json';target=root/'public'/relative.lstrip('/');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
master['assets']['motion']={'path':relative,'kind':'json','sha256':hashlib.sha256(data).hexdigest()};master['release']={'approved':False,'reason':'Full-film owner review; not released to customers'}
for k,v in baseline.items():
    if k not in ['assets','release']:assert master[k]==v
for k,v in baseline['assets'].items():
    if k!='motion':assert master['assets'][k]==v
(out/'master.json').write_text(json.dumps(master,indent=2));(out/'motion.json').write_bytes(data);(out/'motion-report.json').write_text(json.dumps({'approvedFirstBoardPreserved':True,'characterMatricesPreserved':True,'allNonMotionMasterFieldsPreserved':True,'scenes':reports},indent=2))
content=json.loads((root/'work/temple-reference-trial/render.json').read_text(encoding='utf-8'))['content'];config={'master':str(out/'master.json'),'content':content,'output':str(out/'revised-frames'),'requireRelease':False}
(out/'render.json').write_text(json.dumps({**config,'reviewFrames':list(range(1296))},indent=2))
review=sorted(set(n for r in reports for n in [r['active'][0],r['active'][0]+8,r['active'][0]+16,r['active'][0]+24,r['anchor'],r['trackedEnd'],r['active'][-1]]))
(out/'review.json').write_text(json.dumps({**config,'reviewFrames':review,'output':str(out/'review-frames')},indent=2))
print(json.dumps({'scenes':[r['id'] for r in reports],'reviewFrames':review,'preserved':'first board, characters, all fonts/styles/assets/occlusion'},indent=2))
