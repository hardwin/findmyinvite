"""Run the actual AllTracker checkpoint for each remaining Temple text surface.

Offline authoring only. Persist original frame indices and full model provenance;
never introduce inference in customer preview/export requests.
"""
import argparse, hashlib, json, sys, time
from pathlib import Path
import cv2
import numpy as np

p = argparse.ArgumentParser()
p.add_argument('--model-dir', type=Path, required=True)
p.add_argument('--frames', type=Path, required=True)
p.add_argument('--output', type=Path, required=True)
p.add_argument('--scenes', nargs='*')
a = p.parse_args()
specs = json.loads(Path(__file__).with_name('temple-alltracker-scenes.json').read_text())
checkpoint = a.model_dir / 'alltracker.pth'
checksum = hashlib.sha256(checkpoint.read_bytes()).hexdigest()
if checksum != 'ffd9ebcfb6d206d594b646999a150540f92c049cf9b2bf940facf7123f62aa1d':
    raise RuntimeError('Unverified AllTracker checkpoint')
sys.path.insert(0, str(a.model_dir / 'vendor/alltracker'))
import torch
from nets.alltracker import Net
torch.set_num_threads(8)
torch.set_num_interop_threads(2)
torch.set_grad_enabled(False)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = Net(16, init_weights=False).to(device)
model.load_state_dict(torch.load(checkpoint, map_location='cpu', weights_only=True)['model'], strict=True)
model.eval()
original = model.forward_window
started = time.perf_counter()
def logged(*args, **kwargs):
    print('window', round(time.perf_counter()-started, 1), flush=True)
    return original(*args, **kwargs)
model.forward_window = logged
for name, spec in specs.items():
    if a.scenes and name not in a.scenes:
        continue
    out = a.output / name
    out.mkdir(parents=True, exist_ok=True)
    for direction, indices in [('backward', list(range(spec['anchor'], spec['start']-1, -1))),
                               ('forward', list(range(spec['anchor'], spec['end']+1)))]:
        destination = out / (direction+'.npz')
        if destination.exists() and (out/(direction+'-provenance.json')).exists():
            previous=json.loads((out/(direction+'-provenance.json')).read_text())
            if previous['checkpointSha256']!=checksum or any(previous['spec'][k]!=spec[k] for k in ['start','anchor','end','width','crop']):
                raise RuntimeError('Existing inference settings differ; use a separate output directory: '+name)
            print('already complete', name, direction, flush=True)
            continue
        crop = spec['crop']
        w = spec['width']
        h = round((crop[3]-crop[1])*w/(crop[2]-crop[0])/8)*8
        frames = []
        for n in indices:
            im = cv2.imread(str(a.frames / f'{n+1:05}.jpg'))
            if im is None:
                raise RuntimeError(f'Missing source frame {n}')
            frames.append(cv2.resize(cv2.cvtColor(im[crop[1]:crop[3],crop[0]:crop[2]], cv2.COLOR_BGR2RGB), (w,h), interpolation=cv2.INTER_AREA))
        print('START', name, direction, len(frames), w, h, flush=True)
        t = time.perf_counter()
        images = torch.from_numpy(np.stack(frames)).permute(0,3,1,2)[None].float().to(device)
        with torch.inference_mode():
            flow, vc, _, _ = model.forward_sliding(images, iters=4, is_training=False)
        np.savez_compressed(destination, flows=flow[0].cpu().numpy(), visconf=vc[0].cpu().numpy(), frames=indices, crop=crop, size=[w,h])
        report = {'model':'AllTracker full', 'checkpointSha256':checksum, 'sourceCommit':'e7553135e7b361590dbccd10e2b274b024f41cd6', 'device':str(device), 'torch':torch.__version__, 'scene':name, 'spec':spec, 'frames':indices, 'size':[w,h], 'iterations':4, 'elapsedSeconds':time.perf_counter()-t}
        (out/(direction+'-provenance.json')).write_text(json.dumps(report, indent=2))
        print('DONE', name, direction, round(report['elapsedSeconds'], 1), flush=True)
        del images, flow, vc, frames
