#!/usr/bin/env python3
"""Ashok rev4 (2026-10-07 ~19:30): add a small white fluffy dog in front of the couple in the last image (scene-11), and keep it in clip-10
(lands on image-11), clip-11 (-> scene-12 forehead touch, final frame). Dog described in text only (his reference is flat 2D vector art; not sent).
scene-12 has no prompt (it is clip-11's final frame), so its continuity comes from clip-11."""
import json, hashlib
from pathlib import Path
P = Path(__file__).resolve().parent.parent
t = json.loads((P/"template.json").read_text()); prm = t['parameters']
DOG = ("a small white Pomeranian / Japanese Spitz-type dog in the same stylized storybook 3D animation style as the couple (never realistic): very fluffy "
       "pure white fur with a big fluffy chest ruff, small upright pointed ears, round dark-brown eyes, a black button nose, a happy open-mouth smile with "
       "a pink tongue out, and a plume tail curled up over its back")
def rep(s, o, n, f):
    assert s.count(o) == 1, (f, o[:80]); return s.replace(o, n)
s11 = t['scenes'][10]; f = 'scene-11'; v = s11['image_prompt_template']
v = rep(v, "They face mostly toward the camera with small soft smiles, their hands gently joined at waist height, calm and affectionate.",
        "They face mostly toward the camera with small soft smiles, their hands gently joined at waist height, calm and affectionate. "
        "ON THE FLOOR JUST IN FRONT OF THE COUPLE, at their feet between them and facing the camera, stands " + DOG + ", one front paw playfully raised. "
        "The dog is clearly visible, about knee height, and covers only a small part of the lower gown; it never overlaps the board, its easel or its text.", f)
v = rep(v, "No other written text in the whole image.", "No other written text in the whole image. Exactly ONE dog.", f)
s11['image_prompt_template'] = v
s11['name'] = "Single couple, small white dog at their feet, and single date board"
c10 = t['clips'][9]; f = 'clip-10'; v = c10['video_prompt_template']
v = rep(v, "Keep the ornate SAVE THE DATE board physically to their right,",
        "A small fluffy white Pomeranian-type dog (same storybook 3D style) is already sitting/standing on the floor at their feet, facing the camera, and is revealed with them; it is the only animal and stays in place. Keep the ornate SAVE THE DATE board physically to their right,", f)
c10['video_prompt_template'] = v
c11 = t['clips'][10]; f = 'clip-11'; v = c11['video_prompt_template']
v = rep(v, "There is exactly ONE bride, ONE groom and ONE date board on its single easel at camera RIGHT.",
        "There is exactly ONE bride, ONE groom, ONE small fluffy white dog at their feet and ONE date board on its single easel at camera RIGHT.", f)
v = rep(v, "Her long wavy hair and veil sway slightly, no new people or costume change.",
        "Her long wavy hair and veil sway slightly, no new people or costume change. The SAME small white fluffy dog stays at their feet facing the camera the whole time: it lowers its raised paw, sits happily with its tongue out and gently wags its curled plume tail; it never leaves, grows, duplicates or changes breed or color.", f)
v = rep(v, "Preserve the same cream-white bell tower, gateway, floral arch, floor decorations and SINGLE right-side board throughout.",
        "Preserve the same cream-white bell tower, gateway, floral arch, floor decorations, the same dog and SINGLE right-side board throughout. The final frame (scene 12) shows the forehead touch with the dog sitting at their feet.", f)
c11['video_prompt_template'] = v
t['scenes'][11]['review_note'] = "Final decoded frame of clip-11; per rev4 it must show the couple's forehead touch with the small white dog sitting at their feet."
def fill(s):
    for k, val in prm.items(): s = s.replace("{{"+k+"}}", val)
    assert '{{' not in s; return s
s11['image_prompt'] = fill(s11['image_prompt_template'])
for c in (c10, c11): c['video_prompt'] = fill(c['video_prompt_template'])
out = json.dumps(t, indent=2, ensure_ascii=False) + "\n"; (P/"template.json").write_text(out)
print("template sha", hashlib.sha256(out.encode()).hexdigest())
