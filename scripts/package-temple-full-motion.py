"""Verify every full-film frame and package reference / before / after evidence."""
import argparse,hashlib,json
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw,ImageFont

p=argparse.ArgumentParser();p.add_argument('--reference-frames',type=Path,required=True);p.add_argument('--verify-only',action='store_true');a=p.parse_args()
root=Path(__file__).resolve().parent.parent;out=root/'work/temple-alltracker-full';approved=root/'work/temple-alltracker-trial'
baseline=json.loads((approved/'master.json').read_text());master=json.loads((out/'master.json').read_text());old=json.loads((approved/'motion.json').read_text());new=json.loads((out/'motion.json').read_text());report=json.loads((out/'motion-report.json').read_text())
for k,v in baseline.items():
    if k not in ['assets','release']:assert master[k]==v
for k,v in baseline['assets'].items():
    if k!='motion':
        assert master['assets'][k]==v
        assert hashlib.sha256((root/'public'/v['path'].lstrip('/')).read_bytes()).hexdigest()==v['sha256']
assert old['occlusion']==new['occlusion']
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17);small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
blank=Image.new('RGB',(360,640),'#f5eee4');d=ImageDraw.Draw(blank)
for i,t in enumerate(['No separate Venue scene','in the reference.','Existing form content retained.']):d.text((24,270+i*30),t,font=small,fill='#392b2b')
# Only the reference is phase-aligned for a useful comparison. The two Temple
# outputs retain all 1,296 original frames and the existing 54-second duration.
timeline=np.array([[0,0],[60,43],[102,60],[119,80],[120,87],[145,102],[148,104],[150,107],[152,110],[154,112],[156,115],[160,120],[172,135],[208,180],[240,240],[241,241],[270,282],[310,310],[340,339],[361,354],[362,354],[390,392],[430,420],[468,453],[479,474],[480,474],[486,486],[498,500],[512,518],[552,555],[578,579],[600,600],[601,600],[604,610],[612,620],[634,638],[675,675],[696,718],[721,744],[846,744],[850,755],[858,768],[870,790],[880,800],[910,870],[944,940],[970,963],[971,963],[980,978],[992,998],[1000,1005],[1035,1065],[1060,1130],[1085,1164],[1086,1164],[1100,1200],[1120,1242],[1248,1270],[1295,1316]],float)
assets={k:cv2.imread(str(root/'public'/v['path'].lstrip('/')),cv2.IMREAD_UNCHANGED)[:,:,3] for k,v in master['assets'].items() if v['kind']=='image'}
text_masks={}
for key,blocks in master['text'].items():
    m=np.zeros((1280,720),np.uint8)
    for b in blocks:
        cv2.rectangle(m,(int(b['centerX']-b['width']/2)-5,int(b['top'])-5),(int(b['centerX']+b['width']/2)+5,int(b['top']+b['height'])+5),255,-1)
    text_masks[key]=m
pairdir=out/'pairs';pairdir.mkdir(exist_ok=True);checks=[];approved_frames=0;scene_frames={s['id']:s['anchor'] for s in report['scenes']}
for n in range(1296):
    before=cv2.imread(str(out/'baseline-frames'/f'{n:05}.png'));after=cv2.imread(str(out/'revised-frames'/f'{n:05}.png'))
    if before is None or after is None:raise RuntimeError(f'Missing frame {n}')
    union=np.zeros((1280,720),np.float32);old_entries={e['asset']:e for e in old['frames'][n]};new_entries={e['asset']:e for e in new['frames'][n]}
    for key in set(old_entries)|set(new_entries):
        be,ae=old_entries.get(key),new_entries.get(key)
        if key in ['groom','bride','closing']:assert be['matrix']==ae['matrix']
        if be==ae:continue
        for e in [be,ae]:
            if e is None:continue
            floating=key in ['opening','groom','bride','closing'];mask=text_masks[key] if floating else assets[key];H=np.array(e.get('textMatrix',e['matrix']) if floating else e['matrix'],dtype=np.float64)
            if floating and key in master.get('textPlanes',{}):H=H@np.array(master['textPlanes'][key])
            # Preserve fractional alpha: an 8-bit mask can round a transformed
            # translucent artwork speck to zero while the renderer still draws it.
            union=np.maximum(union,cv2.warpPerspective(mask.astype(np.float32)/255,H,(720,1280)))
    union=cv2.dilate((union>0).astype(np.uint8),np.ones((91,91),np.uint8));changed=np.any(before!=after,axis=2);outside=int(np.sum(changed&(union==0)))
    checks.append({'frame':n,'changedPixels':int(changed.sum()),'outsideChangedRegions':outside})
    if 145<=n<=242:
        assert np.array_equal(before,after),f'Approved first board changed at {n}'
        approved_frames+=1
    if a.verify_only:
        assert (pairdir/f'{n:05}.jpg').exists(),'Comparison frames must already exist'
        if n%120==0:print('checked',n,'outside',outside,flush=True)
        continue
    pair=Image.new('RGB',(1080,712),'#f5eee4');draw=ImageDraw.Draw(pair)
    refidx=int(round(np.interp(n,timeline[:,0],timeline[:,1])));ref=blank if 722<=n<=845 else Image.open(a.reference_frames/f'{refidx+1:05}.jpg').resize((360,640),Image.Resampling.LANCZOS)
    for i,(label,im) in enumerate([('Reference · phase aligned',ref),('Previous · approved first board',Image.fromarray(cv2.cvtColor(before,cv2.COLOR_BGR2RGB))),('Revised · full motion',Image.fromarray(cv2.cvtColor(after,cv2.COLOR_BGR2RGB)))]):
        draw.text((i*360+10,11),label,font=font,fill='#392b2b');pair.paste(im.resize((360,640),Image.Resampling.LANCZOS),(i*360,40))
    draw.text((12,690),f'Template {n/24:.2f}s · Reference timing aligned for comparison · Venue is an existing additional scene',font=small,fill='#392b2b')
    pair.save(pairdir/f'{n:05}.jpg',quality=91)
    if n in scene_frames.values() or n%120==0:pair.save(out/f'comparison-{n:04}.jpg',quality=95)
    if n%120==0:print('checked',n,'outside',outside,flush=True)
result={'frames':1296,'approvedInvitationFramesIdentical':approved_frames,'unchangedFontsLightingCharactersAndSourceAssets':True,'characterMatricesIdentical':True,'unchangedForegroundMasks':True,'outsideChangedPixels':sum(c['outsideChangedRegions'] for c in checks),'regionAllowance':'Union of actual moving board alpha or floating text bounds, expanded 45px for existing motion blur and petal safety','framesChecked':checks,'comparisonReferenceRetimed':True,'sourceVideoFramesRetimed':False,'referenceAlignment':timeline.tolist()}
(out/'verification.json').write_text(json.dumps(result,indent=2));assert result['outsideChangedPixels']==0,'Unrelated pixels changed; inspect before accepting';print(json.dumps({k:v for k,v in result.items() if k not in ['framesChecked','referenceAlignment']},indent=2))
