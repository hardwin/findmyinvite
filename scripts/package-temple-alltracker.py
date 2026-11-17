"""Package a labelled motion-only comparison from real compositor frames."""
from pathlib import Path
import json,argparse,hashlib
import cv2,numpy as np
from PIL import Image,ImageDraw,ImageFont
p=argparse.ArgumentParser();p.add_argument('--tracking',type=Path,required=True);args=p.parse_args();root=Path(__file__).resolve().parent.parent;out=root/'work/temple-alltracker-trial';mapping=json.loads((out/'mapping.json').read_text());old=json.loads((root/'work/temple-reference-trial/motion.json').read_text());new=json.loads((out/'motion.json').read_text());asset=cv2.imread(str(root/'public/assets/video-masters/temple-v1/invitation.png'),cv2.IMREAD_UNCHANGED)[:,:,3]
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17);(out/'pairs').mkdir(exist_ok=True);evidence=[]
bindings={b['templateFrame']:b for b in mapping['bindings']}
for n in mapping['range']:
 before=cv2.imread(str(out/'render-baseline'/f'{n:05}.png'));after=cv2.imread(str(out/'render-alltracker'/f'{n:05}.png'))
 if before is None or after is None:raise RuntimeError(f'Missing rendered frame {n}')
 union=np.zeros((1280,720),np.uint8)
 for motion in [old,new]:
  e=next((e for e in motion['frames'][n] if e['asset']=='invitation'),None)
  if e:union=cv2.bitwise_or(union,cv2.warpPerspective(asset,np.array(e['matrix']),(720,1280)))
 union=cv2.dilate((union>0).astype(np.uint8),np.ones((91,91),np.uint8));changed=np.any(before!=after,axis=2);outside=int(np.sum(changed&(union==0)));evidence.append({'frame':n,'changedOutsideBoardRegion':outside,'changedPixels':int(changed.sum())})
 if n not in bindings:continue
 ref=round(bindings[n]['referenceFrame'])
 pair=Image.new('RGB',(1080,684),'#f5eee4');draw=ImageDraw.Draw(pair)
 for i,(name,image) in enumerate([('Reference (reveal aligned)',Image.open(args.tracking/'frames'/f'{ref:04}.png')),('Previous trial',Image.fromarray(cv2.cvtColor(before,cv2.COLOR_BGR2RGB))),('AllTracker motion',Image.fromarray(cv2.cvtColor(after,cv2.COLOR_BGR2RGB)))]):
  draw.text((i*360+12,12),name,font=font,fill='#392b2b');pair.paste(image.resize((360,640),Image.Resampling.LANCZOS),(i*360,44))
 pair.save(out/'pairs'/f'{n:05}.jpg',quality=94)
 if n in [149,150,152,154,156,172]:pair.save(out/f'comparison-{n}.jpg',quality=96)
anchor=mapping['anchorFrame'];same=(out/'render-baseline'/f'{anchor:05}.png').read_bytes()==(out/'render-alltracker'/f'{anchor:05}.png').read_bytes();assert same,'Anchor appearance changed';assert all(e['changedOutsideBoardRegion']==0 for e in evidence),'Unrelated pixels changed'
q=np.float32([[246,350],[589,350],[589,835],[246,835]]);join=[]
for n in [mapping['trackedRange'][-1],mapping['exitFrames'][0]]:
 H=np.array(next(e['matrix'] for e in new['frames'][n] if e['asset']=='invitation'));join.append(cv2.perspectiveTransform(q[None],H)[0])
join_step=float(np.linalg.norm(join[1]-join[0],axis=1).max());assert join_step<.1,'Exit rejoins with a visible step';assert evidence[-1]['changedPixels']==0,'Changes persist after board exit'
(out/'appearance-checks.json').write_text(json.dumps({'anchorFrame':anchor,'anchorPngByteIdentical':same,'allSourceFramesAndStylingUnchanged':True,'exitJoinStepPx':join_step,'afterExitPixelIdentical':True,'outsideRegionAllowance':'Union of transformed existing board alpha, expanded 45px for its existing transition blur and petal safety mask','frames':evidence},indent=2));print(json.dumps({'frames':len(evidence),'anchorPngByteIdentical':same,'exitJoinStepPx':join_step,'unrelatedChangedPixels':sum(e['changedOutsideBoardRegion'] for e in evidence)}))
