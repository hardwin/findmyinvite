"""Fit measured planes / rigid floating titles and validate excluded lettering."""
import argparse, json
from pathlib import Path
import cv2
import numpy as np
from scipy.linalg import solve

p=argparse.ArgumentParser()
p.add_argument('--tracking',type=Path,required=True)
p.add_argument('--frames',type=Path,required=True)
p.add_argument('--scenes',nargs='*')
a=p.parse_args()
specs=json.loads(Path(__file__).with_name('temple-alltracker-scenes.json').read_text())
def project(q,h):
    return cv2.perspectiveTransform(np.float32(q)[None],np.asarray(h,dtype=float))[0]
def smooth(t):
    t=np.clip(t,0,1)
    return t*t*t*(10+t*(-15+6*t))

for name,s in specs.items():
    if a.scenes and name not in a.scenes:continue
    root=a.tracking/name
    if not all((root/(d+'.npz')).exists() and (root/(d+'-provenance.json')).exists() for d in ['forward','backward']):
        print('not ready',name,flush=True);continue
    ref=cv2.imread(str(a.frames/f"{s['anchor']+1:05}.jpg"))
    qref=np.float32(s['quad']);mask=np.zeros((1280,720),np.uint8)
    cv2.fillConvexPoly(mask,np.rint(qref).astype(np.int32),255)
    mask=cv2.erode(mask,np.ones((11,11),np.uint8))
    if s['kind']=='floating':
        b,g,r=ref.astype(float).transpose(2,0,1)
        ink=(r>g*1.25)&(r>b*1.1)&(g<130)&(r-g>25)
        mask[~ink]=0
    if s.get('features')=='light-ink':
        b,g,r=ref.astype(float).transpose(2,0,1)
        mask[~((g>140)&(r>180)&(b>100))]=0
    x0,y0,x1,y1=s['holdout'];mask[y0:y1,x0:x1]=0
    # Include an easel's rigid base to recover partial, high entrances. Prefer
    # the paper points for planar fitting once the paper is sufficiently visible.
    paper=mask.copy()
    features=None
    if s['kind']=='floating':
        features=cv2.goodFeaturesToTrack(cv2.cvtColor(ref,cv2.COLOR_BGR2GRAY),maxCorners=300,qualityLevel=.02,minDistance=5,mask=paper)
    for support in s.get('supports',[]):
        cv2.fillConvexPoly(mask,np.int32(support),255)
    yy,xx=np.mgrid[0:1280:3,0:720:3];take=mask[yy,xx]>0
    pts=np.float32(np.column_stack([xx[take],yy[take]]))
    inpaper=paper[pts[:,1].astype(int),pts[:,0].astype(int)]>0
    rows={};records={}
    for direction in ['backward','forward']:
        data=np.load(root/(direction+'.npz'));flows=data['flows'];vc=data['visconf'];crop=data['crop'];w,h=data['size']
        scale=np.float32([w/(crop[2]-crop[0]),h/(crop[3]-crop[1])]);coords=(pts-crop[:2]+.5)*scale-.5
        mx,my=coords[:,0,None].astype(np.float32),coords[:,1,None].astype(np.float32)
        for j,frame in enumerate(data['frames']):
            frame=int(frame)
            flow=cv2.remap(flows[j].transpose(1,2,0),mx,my,cv2.INTER_LINEAR)[:,0]
            weights=cv2.remap(vc[j].transpose(1,2,0),mx,my,cv2.INTER_LINEAR)[:,0]
            dest=pts+flow/scale
            keep=(weights[:,0]>.8)&(weights[:,1]>.5)&(dest[:,0]>3)&(dest[:,0]<717)&(dest[:,1]>3)&(dest[:,1]<1277)
            if frame<s.get('firstPaperFrame',s['start']):keep&=~inpaper
            record={'frame':frame,'valid':False,'points':int(keep.sum())};records[frame]=record
            if frame<s.get('firstVisibleFrame',s['start']) or frame>s.get('lastVisibleFrame',s['end']):continue
            if keep.sum()<25:continue
            src,dst=pts[keep&inpaper],dest[keep&inpaper]
            fitkind='plane' if s['kind']=='board' else 'rigid title'
            H=None;inliers=None
            rigid_hold=s.get('rigidHold') and s['holdStart']-10<=frame<=s['holdEnd']+10
            if s['kind']=='board' and len(src)>45 and not rigid_hold:
                H,inliers=cv2.findHomography(src,dst,cv2.USAC_MAGSAC,2.5,maxIters=5000,confidence=.999)
                if H is not None:
                    selected=inliers.ravel().astype(bool);spread=np.ptp(src[selected],axis=0)
                    if min(spread/np.ptp(qref,axis=0))<.3:H=None
            if H is None:
                src,dst=pts[keep],dest[keep]
                affine,inliers=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=2.5,maxIters=5000)
                if affine is not None:H=np.vstack([affine,[0,0,1]]);fitkind='rigid title' if s['kind']=='floating' else 'partial-visibility similarity'
            if H is None:continue
            if features is not None:
                # One-frame local refinement, initialized by the actual model.
                # The held-out lettering is absent from this feature mask.
                current=cv2.imread(str(a.frames/f'{frame+1:05}.jpg'));g0=cv2.cvtColor(ref,cv2.COLOR_BGR2GRAY);g1=cv2.cvtColor(current,cv2.COLOR_BGR2GRAY)
                initial=project(features[:,0],H).reshape(-1,1,2)
                tracked,ok,error=cv2.calcOpticalFlowPyrLK(g0,g1,features,initial.copy(),winSize=(21,21),maxLevel=3,criteria=(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,40,.001),flags=cv2.OPTFLOW_USE_INITIAL_FLOW)
                back,bok,_=cv2.calcOpticalFlowPyrLK(g1,g0,tracked,features.copy(),winSize=(21,21),maxLevel=3,criteria=(cv2.TERM_CRITERIA_EPS|cv2.TERM_CRITERIA_COUNT,40,.001),flags=cv2.OPTFLOW_USE_INITIAL_FLOW)
                good=(ok[:,0]>0)&(bok[:,0]>0)&(error[:,0]<25)&(np.linalg.norm(back[:,0]-features[:,0],axis=1)<.75)&(np.linalg.norm(tracked[:,0]-initial[:,0],axis=1)<14)
                if good.sum()>=20:
                    aa,bb=features[good,0],tracked[good,0]
                    refined,ri=cv2.estimateAffinePartial2D(aa,bb,method=cv2.RANSAC,ransacReprojThreshold=1.2,maxIters=5000)
                    if refined is not None and ri.sum()>=20:
                        src,dst=aa,bb;H=np.vstack([refined,[0,0,1]]);inliers=ri;fitkind='AllTracker + bidirectional local ink refinement'
            selected=inliers.ravel().astype(bool);q=project(qref,H);area=cv2.contourArea(q);ratio=area/cv2.contourArea(qref)
            valid=bool(selected.sum()>=25 and cv2.isContourConvex(q) and .25<ratio<4 and np.max(np.abs(q))<3500)
            record.update(valid=valid,fitMode=fitkind,inliers=int(selected.sum()),corners=q.tolist(),medianFitPx=float(np.median(np.linalg.norm(project(src,H)-dst,axis=1)[selected])))
            if valid:rows[frame]=q
        del flows,vc,data
    rows[s['anchor']]=qref
    times=np.arange(s['start'],s['end']+1);valid=np.array([f in rows for f in times])
    if valid.sum()<20:raise RuntimeError('Insufficient reliable '+name+' poses')
    raw=np.array([rows.get(int(f),np.full((4,2),np.nan)) for f in times])
    filled=np.stack([np.interp(times,times[valid],raw[valid].reshape(-1,8)[:,i]) for i in range(8)],axis=1)
    # Positions outside the image are not observations. Continue the first
    # measured entrance velocity backwards only to keep the object offscreen.
    first=int(times[valid][0]);next_valid=[f for f in times[valid] if first<f<=first+4]
    if first>s['start'] and next_valid:
        velocity=np.mean([(rows[int(f)]-rows[first])/(f-first) for f in next_valid],axis=0)
        for f in times[times<first]:filled[f-s['start']]=(rows[first]+(f-first)*velocity).reshape(8)
    last=int(times[valid][-1]);previous_valid=[f for f in times[valid] if last-4<=f<last]
    if last<s['end'] and previous_valid:
        velocity=np.mean([(rows[last]-rows[int(f)])/(last-f) for f in previous_valid],axis=0)
        for f in times[times>last]:filled[f-s['start']]=(rows[last]+(f-last)*velocity).reshape(8)
    weights=valid.astype(float)+.001;weights[s['anchor']-s['start']]=100
    D=np.diff(np.eye(len(times)),n=3,axis=0)
    fitted=solve(np.diag(weights)+.4*D.T@D,weights[:,None]*filled,assume_a='pos').reshape(-1,4,2)
    # A single measured velocity covers the reading hold: no alternating
    # per-frame corrections, and the approved anchor remains exact.
    use=np.array([int(f) for f in times if s['holdStart']<=f<=s['holdEnd'] and f in rows])
    center=float(np.mean(use));centered=use-center;values=np.array([rows[int(f)] for f in use]);intercept=values.mean(0)
    velocity=(centered[:,None,None]*(values-intercept)).sum(0)/(centered**2).sum()
    if s['holdStart']<=s['anchor']<=s['holdEnd']:
        intercept=qref-(s['anchor']-center)*velocity
    for i,f in enumerate(times):
        feather=s.get('holdFeather',10)
        t=min((f-s['holdStart']+feather)/feather,(s['holdEnd']+feather-f)/feather)
        weight=smooth(t);linear=intercept+(f-center)*velocity
        fitted[i]=fitted[i]*(1-weight)+linear*weight
    fitted[s['anchor']-s['start']]=qref
    checks=[];x0,y0,x1,y1=s['holdout'];gray=cv2.cvtColor(ref,cv2.COLOR_BGR2GRAY);template=gray[y0:y1,x0:x1];margin=14
    for i,f in enumerate(times):
        im=cv2.imread(str(a.frames/f'{f+1:05}.jpg'));H=cv2.getPerspectiveTransform(qref,np.float32(fitted[i]));aligned=cv2.warpPerspective(cv2.cvtColor(im,cv2.COLOR_BGR2GRAY),np.linalg.inv(H),(720,1280));search=aligned[y0-margin:y1+margin,x0-margin:x1+margin]
        _,score,_,where=cv2.minMaxLoc(cv2.matchTemplate(search,template,cv2.TM_CCOEFF_NORMED))
        if score>.78 and records[int(f)]['valid']:
            checks.append({'frame':int(f),'correlation':score,'errorPx':float(np.hypot(where[0]-margin,where[1]-margin))})
        if f in [s['start'],s['start']+10,s['holdStart'],s['anchor'],s['end']]:
            cv2.polylines(im,[np.rint(fitted[i]).astype(np.int32)],True,(60,255,60),2);cv2.imwrite(str(root/f'plane-{f}.jpg'),im)
    report={'scene':name,'source':'Actual AllTracker full','spec':s,'referenceCorners':qref.tolist(),'holdVelocity':velocity.tolist(),'acceptedFrames':int(valid.sum()),'rows':[{'frame':int(f),'corners':fitted[i].tolist(),'valid':bool(valid[i])} for i,f in enumerate(times)],'validation':{'heldOut':s['holdout'],'samples':checks,'p95Px':float(np.quantile([c['errorPx'] for c in checks],.95)) if checks else None,'caveat':'Excluded-lettering correlation, not ground truth; uncertain occluded poses are not certified.'}}
    (root/'plane.json').write_text(json.dumps(report,indent=2));(root/'fit-diagnostics.json').write_text(json.dumps(records,indent=2))
    print(json.dumps({'scene':name,'accepted':int(valid.sum()),'total':len(times),'heldOut':len(checks),'p95Px':report['validation']['p95Px']}),flush=True)
