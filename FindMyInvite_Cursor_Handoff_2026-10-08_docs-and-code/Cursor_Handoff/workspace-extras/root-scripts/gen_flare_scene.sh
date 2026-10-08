#!/usr/bin/env bash
set -u
scene="$1"
base=/workspace/fmi-productions/nandini-karthik-remake
packet="$base/packets-v5/scene-${scene}.json"
out="$base/assets/stills-v5/scene-${scene}.jpg"
mkdir -p "$(dirname "$out")"
if [[ -z "${REPLICATE_API_TOKEN:-}" ]]; then echo "missing REPLICATE_API_TOKEN" >&2; exit 2; fi
prompt=$(jq -r '.image_prompt' "$packet")
aspect=$(jq -r '.aspect_ratio' "$packet")
ref_mode="none"
if [[ "$scene" == "05" ]]; then ref_mode="first"; fi
if [[ "$scene" == "06" ]]; then ref_mode="next"; fi
make_payload() {
  if [[ "$ref_mode" == "first" ]]; then
    ref1="data:image/jpeg;base64,$(base64 -w0 "$base/assets/stills-v3/scene-04.jpg")"
    ref2="data:image/jpeg;base64,$(base64 -w0 "$base/assets/stills-v5/scene-04.jpg")"
    jq -n --arg prompt "$prompt" --arg aspect "$aspect" --arg r1 "$ref1" --arg r2 "$ref2" '{input:{prompt:$prompt,input_images:[$r1,$r2],aspect_ratio:$aspect,quality:"high",output_format:"jpeg"}}'
  elif [[ "$ref_mode" == "next" ]]; then
    ref1="data:image/jpeg;base64,$(base64 -w0 "$base/assets/stills-v5/scene-05.jpg")"
    jq -n --arg prompt "$prompt" --arg aspect "$aspect" --arg r1 "$ref1" '{input:{prompt:$prompt,input_images:[$r1],aspect_ratio:$aspect,quality:"high",output_format:"jpeg"}}'
  else
    jq -n --arg prompt "$prompt" --arg aspect "$aspect" '{input:{prompt:$prompt,input_images:[],aspect_ratio:$aspect,quality:"high",output_format:"jpeg"}}'
  fi
}
for attempt in 1 2; do
  payload=$(make_payload)
  resp=$(curl -sS --fail-with-body -X POST "https://api.replicate.com/v1/models/openai/gpt-image-2.5-flare/predictions" \
    -H "Authorization: Bearer $REPLICATE_API_TOKEN" -H 'Content-Type: application/json' -H 'Prefer: wait=60' \
    --data-binary "$payload") || { echo "scene-$scene attempt-$attempt: API request failed: $resp" >&2; continue; }
  status=$(jq -r '.status // empty' <<<"$resp")
  get_url=$(jq -r '.urls.get // empty' <<<"$resp")
  if [[ "$status" == "starting" || "$status" == "processing" ]]; then
    for i in $(seq 1 24); do
      sleep 5
      resp=$(curl -sS --fail-with-body -H "Authorization: Bearer $REPLICATE_API_TOKEN" "$get_url") || { echo "scene-$scene poll failed" >&2; break; }
      status=$(jq -r '.status // empty' <<<"$resp")
      [[ "$status" == "succeeded" || "$status" == "failed" || "$status" == "canceled" ]] && break
    done
  fi
  if [[ "$status" == "succeeded" ]]; then
    url=$(jq -r '.output[0] // .output // empty' <<<"$resp")
    if [[ -n "$url" && "$url" != "null" ]]; then
      tmp="${out}.part"
      if curl -sS --fail-with-body -L "$url" -o "$tmp" && file "$tmp" | rg -qi 'jpeg|jpg|image'; then
        mv -f "$tmp" "$out"
        sha=$(sha256sum "$out" | awk '{print $1}')
        echo "scene-$scene succeeded attempt-$attempt sha256=$sha bytes=$(stat -c%s "$out")"
        exit 0
      else
        rm -f "$tmp"
        echo "scene-$scene attempt-$attempt: output download/validation failed" >&2
      fi
    else
      echo "scene-$scene attempt-$attempt: succeeded but no output URL" >&2
    fi
  else
    echo "scene-$scene attempt-$attempt status=${status:-unknown} error=$(jq -r '.error // empty' <<<"$resp")" >&2
  fi
done
exit 1
