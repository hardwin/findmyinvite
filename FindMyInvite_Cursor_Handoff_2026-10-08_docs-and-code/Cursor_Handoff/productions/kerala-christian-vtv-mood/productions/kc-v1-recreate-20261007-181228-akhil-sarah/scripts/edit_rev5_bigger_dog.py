#!/usr/bin/env python3
"""Ashok rev5 (2026-10-07 ~19:40): real dog is 'little bigger in size' -> medium Indian Spitz, cream-white, pinkish-brown nose, sitting.
Replaces the rev4 small-Pomeranian wording in scene-11, clip-10, clip-11 and the scene-12 note. Photo NOT sent anywhere; text only."""
import json, hashlib
from pathlib import Path
P = Path(__file__).resolve().parent.parent
t = json.loads((P/"template.json").read_text()); prm = t['parameters']
def rep(s, o, n, f):
    assert s.count(o) == 1, (f, o[:80]); return s.replace(o, n)
OLD_DOG = ("a small white Pomeranian / Japanese Spitz-type dog in the same stylized storybook 3D animation style as the couple (never realistic): very fluffy "
       "pure white fur with a big fluffy chest ruff, small upright pointed ears, round dark-brown eyes, a black button nose, a happy open-mouth smile with "
       "a pink tongue out, and a plume tail curled up over its back")
NEW_DOG = ("a MEDIUM-sized Indian Spitz dog in the same stylized storybook 3D animation style as the couple (never realistic): bigger than a Pomeranian, with "
       "longer legs and a longer muzzle, a thick fluffy cream-white / off-white coat with a big fluffy chest and neck ruff, upright pointed ears, warm "
       "dark-brown eyes, a pinkish-brown nose (not black), a happy open-mouth smile with a pink tongue, and a fluffy plume tail")
s11 = t['scenes'][10]; f = 'scene-11'; v = s11['image_prompt_template']
v = rep(v, "stands " + OLD_DOG + ", one front paw playfully raised. The dog is clearly visible, about knee height, and covers only a small part of the lower gown;",
        "SITS UPRIGHT " + NEW_DOG + ", facing slightly toward the camera. Sitting, the dog reaches roughly the couple's knee height; it is clearly visible and covers only a small part of the lower gown;", f)
s11['image_prompt_template'] = v
s11['name'] = "Single couple, medium cream-white Indian Spitz sitting at their feet, and single date board"
c10 = t['clips'][9]; f = 'clip-10'; v = c10['video_prompt_template']
v = rep(v, "A small fluffy white Pomeranian-type dog (same storybook 3D style) is already sitting/standing on the floor at their feet, facing the camera,",
        "A medium-sized fluffy cream-white Indian Spitz dog (same storybook 3D style, pinkish-brown nose, about knee height when sitting) is already sitting upright on the floor at their feet, facing slightly toward the camera,", f)
c10['video_prompt_template'] = v
c11 = t['clips'][10]; f = 'clip-11'; v = c11['video_prompt_template']
v = rep(v, "ONE small fluffy white dog at their feet", "ONE medium-sized fluffy cream-white Indian Spitz dog sitting at their feet", f)
v = rep(v, "The SAME small white fluffy dog stays at their feet facing the camera the whole time: it lowers its raised paw, sits happily with its tongue out and gently wags its curled plume tail;",
        "The SAME medium cream-white Indian Spitz (pinkish-brown nose, knee height when sitting) stays sitting upright at their feet, facing slightly toward the camera, the whole time: it pants happily with its tongue out, tilts its head a little and gently sweeps its fluffy plume tail;", f)
v = rep(v, "shows the forehead touch with the dog sitting at their feet.", "shows the forehead touch with the cream-white Indian Spitz sitting upright at their feet.", f)
c11['video_prompt_template'] = v
t['scenes'][11]['review_note'] = "Final decoded frame of clip-11; per rev5 it must show the couple's forehead touch with the medium cream-white Indian Spitz (pinkish-brown nose) sitting upright at their feet."
def fill(s):
    for k, val in prm.items(): s = s.replace("{{"+k+"}}", val)
    assert '{{' not in s; return s
s11['image_prompt'] = fill(s11['image_prompt_template'])
for c in (c10, c11): c['video_prompt'] = fill(c['video_prompt_template'])
for x in (s11, c10, c11):
    p = x.get('image_prompt') or x.get('video_prompt'); assert 'Pomeranian-type' not in p and 'small white' not in p.lower() and 'black button' not in p, x['id']
out = json.dumps(t, indent=2, ensure_ascii=False) + "\n"; (P/"template.json").write_text(out)
print("template sha", hashlib.sha256(out.encode()).hexdigest())
