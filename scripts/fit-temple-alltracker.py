"""Fit a writing plane to actual AllTracker output and validate held-out ink."""
from pathlib import Path
import argparse,json
import cv2,numpy as np
from scipy.linalg import solve
p=argparse.ArgumentParser();p.add_argument('directory',type=Path);p.add_argument('--full-arrival',action='store_true');args=p.parse_args();root=args.directory
anchor=135;start=90;end=180;qref=np.float32([[234,350],[589,350],[589,835],[234,835]])
ref=cv2.imread(str(root/'frames/0135.png'));gray=cv2.cvtColor(ref,cv2.COLOR_BGR2GRAY)
mask=np.zeros(gray.shape,np.uint8);cv2.rectangle(mask,(225,337),(601,835 if args.full_arrival else 720),255,-1)
if args.full_arrival:cv2.rectangle(mask,(220,866),(596,1007),255,-1)
cv2.rectangle(mask,(250,520),(570,578),0,-1) # Second wording line is held out.
yy,xx=np.mgrid[340:(1008 if args.full_arrival else 720):4,228:600:4];take=mask[yy,xx]>0;points=np.column_stack([xx[take],yy[take]]).astype(np.float32)
rows={};diagnostics={};visibility={}
for name in ['backward','forward']:
 data=np.load(root/('full-frame' if args.full_arrival and name=='backward' else '')/(name+'.npz'));flows=data['flows'];visconf=data['visconf'];x0,y0,x1,y1=data['crop'];w,h=data['size'];scale=np.float32([w/(x1-x0),h/(y1-y0)]);coords=(points-[x0,y0]+.5)*scale-.5
 for j,frame in enumerate(data['frames']):
  frame=int(frame);flow=cv2.remap(flows[j].transpose(1,2,0),coords[:,0,None].astype(np.float32),coords[:,1,None].astype(np.float32),cv2.INTER_LINEAR)[:,0]
  vc=cv2.remap(visconf[j].transpose(1,2,0),coords[:,0,None].astype(np.float32),coords[:,1,None].astype(np.float32),cv2.INTER_LINEAR)[:,0];destination=points+flow/scale
  keep=(vc[:,0]>.8)&(vc[:,1]>.5)&(destination[:,0]>3)&(destination[:,0]<717)&(destination[:,1]>y0+3)&(destination[:,1]<y1-3)
  a,b=points[keep],destination[keep];record={'points':len(a),'valid':False,'visibleFraction':float(np.mean(vc[:,0]>.75))};diagnostics[frame]=record
  visible=np.zeros((1280,720),np.float32);visible[y0:y1,x0:x1]=cv2.resize(np.clip((visconf[j,0]-.55)/.25,0,1),(x1-x0,y1-y0));visibility[frame]=visible
  if len(a)<20:continue
  H,inliers=cv2.findHomography(a,b,cv2.USAC_MAGSAC,2.5,maxIters=10000,confidence=.9999)
  if H is None:continue
  keep=inliers.ravel().astype(bool);spread=np.ptp(a[keep],axis=0);quad=cv2.perspectiveTransform(qref[None],H)[0];error=np.linalg.norm(cv2.perspectiveTransform(a[None],H)[0]-b,axis=1)
  valid=bool(keep.sum()>40 and spread[0]>100 and spread[1]>220 and cv2.isContourConvex(quad) and 70000<cv2.contourArea(quad)<300000)
  record.update(valid=valid,inliers=int(keep.sum()),spread=spread.tolist(),medianFit=float(np.median(error[keep])),corners=quad.tolist())
  if valid:rows[frame]=quad
  elif args.full_arrival and frame<108:
   affine,affine_inliers=cv2.estimateAffinePartial2D(a,b,method=cv2.RANSAC,ransacReprojThreshold=2.5,maxIters=5000)
   if affine is not None and int(affine_inliers.sum())>35 and np.ptp(a[affine_inliers.ravel().astype(bool)],axis=0)[0]>100:
    stable=np.vstack([affine,[0,0,1]]);quad=cv2.perspectiveTransform(qref[None],stable)[0]
    if cv2.isContourConvex(quad) and 70000<cv2.contourArea(quad)<300000:
     record.update(valid=True,fitMode='partial-visibility similarity',corners=quad.tolist());rows[frame]=quad
rows[anchor]=qref;valid=np.array([f in rows for f in range(start,end+1)]);times=np.arange(start,end+1)
raw=np.array([rows.get(f,np.full((4,2),np.nan)) for f in times]);filled=np.stack([np.interp(times,times[valid],raw[valid].reshape(-1,8)[:,k]) for k in range(8)],axis=1)
groups=[];previous=None
for frame in times:
 im=cv2.imread(str(root/'frames'/f'{frame:04}.png')).astype(np.float32);mad=float(np.mean(abs(im-previous))) if previous is not None else 999
 if mad<.5:groups[-1].append(int(frame))
 else:groups.append([int(frame)])
 previous=im
values=[];weights=[]
for group in groups:
 good=[f for f in group if f in rows];values.append(np.mean([rows[f].reshape(8) for f in good],axis=0) if good else filled[group[0]-start]);weights.append(100 if anchor in group else 1 if good else .001)
weights=np.array(weights);values=np.array(values);D=np.diff(np.eye(len(groups)),n=3,axis=0);fit=solve(np.diag(weights)+.005*D.T@D,weights[:,None]*values,assume_a='pos').reshape(-1,4,2)
quads={f:q for group,q in zip(groups,fit) for f in group};(root/'masks').mkdir(exist_ok=True);checks=[]
template=gray[533:566,365:425]
for frame in times:
 q=quads[int(frame)].astype(np.float32);H=cv2.getPerspectiveTransform(qref,q);im=cv2.imread(str(root/'frames'/f'{frame:04}.png'))
 screen=cv2.warpPerspective(visibility[int(frame)],H,(720,1280));screen=cv2.erode(screen,np.ones((5,5),np.uint8));cv2.imwrite(str(root/'masks'/f'{frame:04}.png'),np.uint8(screen*255))
 aligned=cv2.warpPerspective(cv2.cvtColor(im,cv2.COLOR_BGR2GRAY),np.linalg.inv(H),(720,1280));search=aligned[521:578,353:437];scores=cv2.matchTemplate(search,template,cv2.TM_CCOEFF_NORMED);_,score,_,where=cv2.minMaxLoc(scores)
 if score>.8 and diagnostics[int(frame)]['valid']:checks.append({'frame':int(frame),'correlation':score,'errorPx':float(np.hypot(where[0]-12,where[1]-12))})
 if frame in [90,96,102,108,114,120,135,150,165,180]:
  cv2.polylines(im,[np.rint(q).astype(np.int32)],True,(60,255,60),2);cv2.imwrite(str(root/f'plane-{frame}.jpg'),im)
report={'model':'AllTracker full','method':'Dense model correspondence -> visibility/confidence gate -> MAGSAC -> repeated-pose-aware regularisation','referenceFrame':anchor,'referenceCorners':qref.tolist(),'repeatedPoseGroups':[g for g in groups if len(g)>1],'rows':[{'frame':int(f),'corners':quads[int(f)].tolist(),'visibleFraction':diagnostics[int(f)]['visibleFraction'],'valid':diagnostics[int(f)]['valid']} for f in times],'validation':{'heldOutRegion':[250,520,570,578],'samples':checks,'medianErrorPx':float(np.median([c['errorPx'] for c in checks])) if checks else None,'p95ErrorPx':float(np.quantile([c['errorPx'] for c in checks],.95)) if checks else None,'caveat':'Image-correlation diagnostic, not ground-truth tracking; occluded/uncorrelated frames excluded.'}}
(root/'alltracker-plane.json').write_text(json.dumps(report,indent=2));(root/'fit-diagnostics.json').write_text(json.dumps(diagnostics,indent=2));print(json.dumps({'validFrames':int(valid.sum()),'total':len(times),'heldOut':len(checks),'medianErrorPx':report['validation']['medianErrorPx'],'p95ErrorPx':report['validation']['p95ErrorPx'],'visibility':{f:round(diagnostics[f]['visibleFraction'],3) for f in range(90,136,3)}},indent=2))
