import math, json
FR=24; H=20; R=14; A=0.25
OUT="/workspace/fmi-productions/wedding-template-islam-christian-church/productions/icc-v1-20261005-234500/assets/output"
nb=[121,121,97,121,121,121,121,121,121]
def w(u):
    if u<A: return math.sin(math.pi/2*u/A)**2
    if u>1-A: return math.sin(math.pi/2*(1-u)/A)**2
    return 1.0
ws=[w((k+0.5)/R) for k in range(R)]
plan=[]; fc=[]
for i,N in enumerate(nb):
    D=N-1; P=1+(D-2*H-R)/sum(ws)
    steps=[1]*H+[1+(P-1)*x for x in ws]+[1]*H
    pos=[0.0]
    for s in steps: pos.append(pos[-1]+s)
    idx=[math.floor(p+0.5) for p in pos]
    assert idx[-1]==D and all(b>a for a,b in zip(idx,idx[1:]))
    plan.append(dict(clip=i+1,src_frames=N,peak=round(P,2),out_frames=len(idx),speeds=[round(s,2) for s in steps[H:H+R]],idx=idx))
    expr="+".join(f"eq(n\\,{j})" for j in idx)
    f=f"[{i}:v:0]select='{expr}',setpts=N/({FR}*TB),fps={FR}"
    if i==0: f+=",tpad=start=24:start_mode=clone"
    if i==len(nb)-1: f+=",tpad=stop=24:stop_mode=clone"
    fc.append(f+f"[c{i}]")
fc.append("".join(f"[c{i}]" for i in range(9))+"concat=n=9:v=1:a=0,scale=1080:1920:flags=lanczos,setsar=1,fps=24[v]")
open("fc.txt","w").write(";\n".join(fc))
json.dump(plan,open("plan.json","w"),indent=1)
tot=sum(p["out_frames"] for p in plan)+48
for p in plan: print(p["clip"],p["src_frames"],p["out_frames"],p["peak"],p["speeds"])
print("total frames",tot,tot/24)
