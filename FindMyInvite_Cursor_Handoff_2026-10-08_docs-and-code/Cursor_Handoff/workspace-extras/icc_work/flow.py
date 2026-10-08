import cv2,numpy as np,sys
def flow(path):
    cap=cv2.VideoCapture(path); prev=None; xs=[]
    while True:
        ok,f=cap.read()
        if not ok: break
        g=cv2.cvtColor(cv2.resize(f,(180,320)),cv2.COLOR_BGR2GRAY)
        if prev is not None:
            fl=cv2.calcOpticalFlowFarneback(prev,g,None,0.5,3,15,3,5,1.2,0)
            xs.append(float(np.median(fl[...,0])))
        prev=g
    xs=np.array(xs)
    return xs
for p in sys.argv[1:]:
    xs=flow(p)
    seg=[round(float(xs[i:i+12].sum()),1) for i in range(0,len(xs),12)]
    print(p.split('/')[-1], 'sum_dx=%.1f'%xs.sum(), 'peak_win=',seg)
