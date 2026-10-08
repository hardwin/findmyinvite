#!/usr/bin/env bash
set -euo pipefail
BASE=/workspace/fmi-productions/kerala-christian-vtv-mood/productions/kc-v1-recreate-20261003-071403
TMP=/workspace/.fmi_image_job_tmp_20261003
mkdir -p "$TMP" "$BASE/logs/image"

# Record immutable baselines before any target write.
python3 - "$BASE" "$TMP/protected_baseline.json" <<'PY'
import os,sys,hashlib,json
base,out=sys.argv[1:]
paths=[
 'assets/output/kerala-christian-v1/image-2-attempt1.jpg',
 'assets/output/kerala-christian-v1/image-2-attempt2.jpg',
 'assets/output/kerala-christian-v1/image-2-attempt3.jpg',
 'assets/output/kerala-christian-v1/archive-delivered-20261003/image-2.jpg',
 'assets/output/kerala-christian-v1/archive-delivered-20261003/image-8.jpg',
]
items=[]
for rel in paths:
 p=os.path.join(base,rel); st=os.stat(p)
 items.append({'path':p,'size':st.st_size,'mtime_ns':st.st_mtime_ns,'sha256':hashlib.sha256(open(p,'rb').read()).hexdigest()})
json.dump(items,open(out,'w'),indent=2)
PY

worker() {
  local packet="$1" expected="$2" label="$3"
  local pfx="$TMP/$label" payload="$TMP/$label.payload.json" resp="$TMP/$label.response.json" raw="$TMP/$label.raw" finaltmp="$TMP/$label.final.jpg"
  local outpath gen status pollurl outurl http
  python3 - "$packet" "$expected" <<'PY'
import hashlib,json,sys
p,w=sys.argv[1:]
d=json.load(open(p)); h=hashlib.sha256(d['image_prompt'].encode()).hexdigest()
if h!=w:
 print(f'PROMPT_HASH_MISMATCH {h} != {w}',file=sys.stderr); raise SystemExit(42)
print(h)
PY
  jq -c '{input:{prompt:.image_prompt,aspect_ratio:"9:16",output_format:"jpeg",number_of_images:1}}' "$packet" > "$payload"

  # One POST technical retry maximum for this job.
  http=$(curl -sS -A 'Mozilla/5.0' -H "Authorization: Bearer $REPLICATE_API_TOKEN" -H 'Content-Type: application/json' -H 'Prefer: wait=60' -o "$resp" -w '%{http_code}' -X POST "https://api.replicate.com/v1/models/openai/gpt-image-2.5-flare/predictions" --data-binary "@$payload" || true)
  if [[ ! "$http" =~ ^2 ]]; then
    echo "Initial HTTP $http for $label; one technical retry" >&2
    http=$(curl -sS -A 'Mozilla/5.0' -H "Authorization: Bearer $REPLICATE_API_TOKEN" -H 'Content-Type: application/json' -H 'Prefer: wait=60' -o "$resp" -w '%{http_code}' -X POST "https://api.replicate.com/v1/models/openai/gpt-image-2.5-flare/predictions" --data-binary "@$payload" || true)
  fi
  [[ "$http" =~ ^2 ]] || { echo "HTTP create failed for $label: $http" >&2; cat "$resp" >&2 || true; return 1; }
  gen=$(jq -r '.id // empty' "$resp")
  [[ -n "$gen" ]] || { echo "No generation id for $label" >&2; cat "$resp" >&2; return 1; }
  status=$(jq -r '.status // empty' "$resp")
  pollurl=$(jq -r '.urls.get // empty' "$resp")
  while [[ "$status" == "starting" || "$status" == "processing" || -z "$status" ]]; do
    [[ -n "$pollurl" ]] || { echo "No poll URL for $label" >&2; return 1; }
    sleep 3
    http=$(curl -sS -A 'Mozilla/5.0' -H "Authorization: Bearer $REPLICATE_API_TOKEN" -o "$resp" -w '%{http_code}' "$pollurl" || true)
    [[ "$http" =~ ^2 ]] || { echo "HTTP poll failed for $label: $http" >&2; cat "$resp" >&2 || true; return 1; }
    status=$(jq -r '.status // empty' "$resp")
  done
  [[ "$status" == "succeeded" ]] || { echo "Generation $label ended $status: $(jq -c '{error,logs}' "$resp")" >&2; return 1; }
  outurl=$(jq -r '.output[0] // empty' "$resp")
  [[ -n "$outurl" ]] || { echo "No output URL for $label" >&2; return 1; }
  http=$(curl -sS -A 'Mozilla/5.0' -o "$raw" -w '%{http_code}' "$outurl" || true)
  if [[ ! "$http" =~ ^2 ]]; then
    echo "Initial output HTTP $http for $label; one technical retry" >&2
    http=$(curl -sS -A 'Mozilla/5.0' -o "$raw" -w '%{http_code}' "$outurl" || true)
  fi
  [[ "$http" =~ ^2 ]] || { echo "HTTP download failed for $label: $http" >&2; return 1; }
  ffmpeg -hide_banner -loglevel error -y -i "$raw" -vf 'scale=720:1280:flags=lanczos' -frames:v 1 -q:v 2 "$finaltmp"
  [[ -s "$finaltmp" ]] || { echo "Empty converted output for $label" >&2; return 1; }
  dims=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$finaltmp")
  bytes=$(stat -c '%s' "$finaltmp")
  [[ "$dims" == "720x1280" && "$bytes" -gt 10240 ]] || { echo "Invalid final output for $label: dims=$dims bytes=$bytes" >&2; return 1; }
  outpath=$(jq -r '.output_path' "$packet")
  mkdir -p "$(dirname "$outpath")"
  mv -f "$finaltmp" "$outpath"
  sha=$(sha256sum "$outpath" | awk '{print $1}')
  python3 - "$packet" "$gen" "$outpath" "$sha" "$bytes" "$dims" "$label" "$BASE" <<'PY'
import json,sys,os
packet,gen,outpath,sha,bytes_s,dims,label,base=sys.argv[1:]
d=json.load(open(packet)); d['status']='GENERATED'; d['authorized_to_dispatch']=False; d['generation_id']=gen; d['output_sha256']=sha; d['output_path']=outpath
# Keep packet JSON update atomic.
tmp=packet+'.tmp'; json.dump(d,open(tmp,'w'),indent=2,ensure_ascii=False); open(tmp,'a').write('\n'); os.replace(tmp,packet)
status_path=os.path.join(base,'logs/image',label+'.status.json')
rec={'job_id':d['job_id'],'production_id':d['production_id'],'generation_id':gen,'sha256':sha,'bytes':int(bytes_s),'dims':dims,'prompt_sha256':d['image_prompt_sha256'],'attempt':d['attempt'],'status':'GENERATED','output_path':outpath}
tmp2=status_path+'.tmp'; json.dump(rec,open(tmp2,'w'),indent=2); open(tmp2,'a').write('\n'); os.replace(tmp2,status_path)
PY
  echo "$label generation_id=$gen path=$outpath bytes=$bytes dims=$dims sha256=$sha"
}

worker "$BASE/packets/IMAGE_JOB/scene-02-attempt4.json" 3c710db86dd5c837949bafa5e1eccbc201daef26646d58c00f2dcd11b8a78903 scene-02-attempt4 > "$TMP/scene-02-attempt4.log" 2>&1 & p1=$!
worker "$BASE/packets/IMAGE_JOB/scene-08-attempt2.json" 87aea8c750ec82899f3c072b9702ccaa23d07f2e3c59ec5f198f8f564b08a063 scene-08-attempt2 > "$TMP/scene-08-attempt2.log" 2>&1 & p2=$!
rc=0
wait "$p1" || rc=1
wait "$p2" || rc=1
cat "$TMP/scene-02-attempt4.log" "$TMP/scene-08-attempt2.log"
if (( rc != 0 )); then echo 'At least one generation failed; no rollup written.' >&2; exit "$rc"; fi
python3 - "$BASE" "$TMP/protected_baseline.json" <<'PY'
import os,sys,hashlib,json
base,bp=sys.argv[1:]
baseitems=json.load(open(bp)); after=[]; ok=True
for b in baseitems:
 st=os.stat(b['path']); a={'path':b['path'],'size':st.st_size,'mtime_ns':st.st_mtime_ns,'sha256':hashlib.sha256(open(b['path'],'rb').read()).hexdigest()}; after.append(a)
 if any(a[k]!=b[k] for k in ('size','mtime_ns','sha256')): ok=False; print('PROTECTED_CHANGED',b['path'],b,a,file=sys.stderr)
if not ok: raise SystemExit(2)
json.dump(after,open('$TMP/protected_after.json','w'),indent=2)
print('PROTECTED_FILES_UNCHANGED')
PY
python3 - "$BASE" <<'PY'
import json,os,sys,datetime
base=sys.argv[1]
labels=['scene-02-attempt4','scene-08-attempt2']
recs=[json.load(open(os.path.join(base,'logs/image',x+'.status.json'))) for x in labels]
roll={'production_id':'kc-v1-recreate-20261003-071403','batch':'correction-20261003','status':'GENERATED','qc_waived':True,'jobs':recs,'video':'HELD; no video emitted','protected_files':'unchanged'}
out=os.path.join(base,'packets/IMAGE_DIRECTOR_GENERATED_CORRECTION_20261003.json'); tmp=out+'.tmp'; json.dump(roll,open(tmp,'w'),indent=2); open(tmp,'a').write('\n'); os.replace(tmp,out)
print('ROLLUP',out)
PY
