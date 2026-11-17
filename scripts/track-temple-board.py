"""Real, local AllTracker inference for the Temple invitation-board entrance.

Uses the previously verified full checkpoint. Outputs dense model data and
provenance, never a hand-authored path labelled as model tracking.
"""
from pathlib import Path
import argparse,hashlib,json,sys,time
import cv2,numpy as np

p=argparse.ArgumentParser();p.add_argument('--model-dir',type=Path,required=True);p.add_argument('--frames',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--start',type=int,default=90);p.add_argument('--anchor',type=int,default=135);p.add_argument('--end',type=int,default=180);p.add_argument('--width',type=int,default=480);p.add_argument('--crop',type=int,nargs=4,default=[0,240,720,1120]);p.add_argument('--direction',choices=['both','forward','backward'],default='both');args=p.parse_args()
expected='ffd9ebcfb6d206d594b646999a150540f92c049cf9b2bf940facf7123f62aa1d'
checkpoint=args.model_dir/'alltracker.pth';checksum=hashlib.sha256(checkpoint.read_bytes()).hexdigest()
if checksum!=expected:raise RuntimeError('AllTracker checkpoint checksum mismatch')
sys.path.insert(0,str(args.model_dir/'vendor/alltracker'))
import torch
from nets.alltracker import Net
torch.set_num_threads(8);torch.set_num_interop_threads(2);torch.set_grad_enabled(False)
device=torch.device('cuda' if torch.cuda.is_available() else 'cpu');model=Net(16,init_weights=False).to(device);model.load_state_dict(torch.load(checkpoint,map_location='cpu',weights_only=True)['model'],strict=True);model.eval()
args.output.mkdir(parents=True,exist_ok=True);crop=args.crop;w=args.width;h=round((crop[3]-crop[1])*w/(crop[2]-crop[0])/8)*8
original=model.forward_window;started=time.perf_counter();windows=0
def logged(*a,**kw):
 global windows
 windows+=1;t=time.perf_counter();print('window',windows,'started',round(t-started,1),flush=True);result=original(*a,**kw);print('window',windows,'finished',round(time.perf_counter()-t,1),flush=True);return result
model.forward_window=logged
print('AllTracker full',device,'input',w,h,'frames',args.start,args.anchor,args.end,flush=True)
for name,indices in [('backward',list(range(args.anchor,args.start-1,-1))),('forward',list(range(args.anchor,args.end+1)))]:
 if args.direction!='both' and name!=args.direction:continue
 frames=[]
 for n in indices:
  im=cv2.imread(str(args.frames/f'{n:04}.png'))
  if im is None:raise RuntimeError(f'Missing reference frame {n}')
  frames.append(cv2.resize(cv2.cvtColor(im[crop[1]:crop[3],crop[0]:crop[2]],cv2.COLOR_BGR2RGB),(w,h),interpolation=cv2.INTER_AREA))
 images=torch.from_numpy(np.stack(frames)).permute(0,3,1,2)[None].float().to(device)
 with torch.inference_mode():flows,visibility,_,_=model.forward_sliding(images,iters=4,is_training=False)
 np.savez_compressed(args.output/f'{name}.npz',flows=flows[0].cpu().numpy(),visconf=visibility[0].cpu().numpy(),frames=indices,crop=crop,size=[w,h])
 report={'model':'AllTracker full','checkpointSha256':checksum,'sourceCommit':'e7553135e7b361590dbccd10e2b274b024f41cd6','device':str(device),'torch':torch.__version__,'anchor':args.anchor,'frames':indices,'crop':crop,'size':[w,h],'iterations':4,'elapsedSeconds':time.perf_counter()-started}
 (args.output/f'{name}-provenance.json').write_text(json.dumps(report,indent=2));print('saved',name,round(report['elapsedSeconds'],1),flush=True)
