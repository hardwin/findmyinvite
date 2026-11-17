"""Measure approved Temple source layers against a supplied reference film.

Authoring only: no customer data, model calls, or public template mutations.
Outputs inspectable correspondences; estimates are never release approval.
"""
from pathlib import Path
import argparse,json
import cv2,numpy as np

SCENES=[('opening','01-opening',2.0,0,3.0),('invitation','02-invitation-courtyard',5.5,3,7.8),('groom','03-groom-veranda',10.5,7.8,11.8),('bride','04-bride-courtyard',14.5,11.8,15.8),('family','05-family-veranda',18.5,15.8,20),('ceremony','06-ceremony-courtyard',22.5,20,24.8),('reception','07-reception-evening',29,24.8,32.5),('hosts','08-hosts-sanctuary',35.5,32.5,38.8),('closing','09-closing-courtyard',42.5,38.8,43.9)]

def features(im,mask=None):
    return cv2.SIFT_create(nfeatures=5000,contrastThreshold=.025).detectAndCompute(cv2.cvtColor(im[:,:,:3],cv2.COLOR_BGR2GRAY),mask)

def match(a,b):
    k1,d1=a;k2,d2=b
    if d1 is None or d2 is None:return None,0,0
    pairs=[m for m,n in cv2.BFMatcher(cv2.NORM_L2).knnMatch(d1,d2,k=2) if m.distance<.68*n.distance]
    if len(pairs)<12:return None,len(pairs),0
    src=np.float32([k1[m.queryIdx].pt for m in pairs]);dst=np.float32([k2[m.trainIdx].pt for m in pairs])
    h,valid=cv2.findHomography(src,dst,cv2.RANSAC,2.5)
    return h,len(pairs),int(valid.sum()) if valid is not None else 0

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--frames',type=Path,required=True);ap.add_argument('--assets',type=Path,required=True);ap.add_argument('--backgrounds',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);args=ap.parse_args();args.output.mkdir(exist_ok=True,parents=True)
    records=[]
    for name,bg,t,start,end in SCENES:
        ref=cv2.imread(str(args.frames/f'{round(t*30)+1:05}.jpg'));target=features(ref)
        clean=cv2.resize(cv2.imread(str(args.backgrounds/(bg+'.png'))),(720,1280));bgH,bgm,bgi=match(features(clean),target)
        layer=None if name=='opening' else cv2.imread(str(args.assets/(name+'.png')),cv2.IMREAD_UNCHANGED)
        h,m,i=(np.eye(3),0,0) if layer is None else match(features(layer,layer[:,:,3]),target)
        # Correlations are evidence. Low confidence fails explicitly instead of
        # extrapolating a repeated-column or decoration match into a whole film.
        record={'id':name,'anchor':round(t*30),'start':round(start*30),'end':round(end*30),'background':bg,'backgroundMatches':bgm,'backgroundInliers':bgi,'backgroundMatrix':None if bgH is None else bgH.tolist(),'matches':m,'inliers':i,'matrix':None if h is None else h.tolist()}
        records.append(record);print(name,'background',bgi,'layer',i,flush=True)
        if bgH is not None:
            result=cv2.warpPerspective(clean,bgH,(720,1280),borderMode=cv2.BORDER_REFLECT_101)
            if h is not None and layer is not None:
                a=layer[:,:,3:4].astype(np.float32)/255;premult=np.concatenate([layer[:,:,:3].astype(np.float32)*a,a],axis=2);warped=cv2.warpPerspective(premult,h,(720,1280));result=np.uint8(np.clip(warped[:,:,:3]+result*(1-warped[:,:,3:4]),0,255))
            cv2.imwrite(str(args.output/(name+'-source-reconstruction.jpg')),np.concatenate([ref,result],axis=1))
    (args.output/'anchors.json').write_text(json.dumps(records,indent=2))

if __name__=='__main__':main()
