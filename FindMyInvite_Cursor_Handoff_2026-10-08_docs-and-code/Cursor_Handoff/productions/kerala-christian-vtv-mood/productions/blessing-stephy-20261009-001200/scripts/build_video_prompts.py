#!/usr/bin/env python3
"""Blessing & Stephy submitted video prompts (copied from Akhil & Sarah) = template.json (rev5) resolved video_prompt + minimal logged rule edits, adapted from
kc-v1-recreate-20261006-211129/scripts/build_video_prompts.py (Ashok rules 2026-10-07: one bell tower; don't name objects absent from
start/end frames; unpeopled end frames say so; <3900 chars). Deletions only (no rewording) except the logged subs."""
import json, hashlib
from pathlib import Path
R = Path(__file__).resolve().parent.parent
T = json.loads((R/"template.json").read_text())
sha = lambda s: hashlib.sha256(s.encode()).hexdigest()
TOWER = " Whenever the church is visible it has exactly one white bell tower with one cross on top; never a second tower."
UNPEOPLED_END = " The final view has no people."
TOWER_CLIPS = {1,2,3,4,5,7,8,9,10,11}          # same set as reference (clip-06: image-6 cloister -> image-7 nave, no exterior tower)
UNPEOPLED_END_CLIPS = {2,5,7,9}                 # end frames image-3/6/8/10 have no people (clip-02 added: ref template already said unpeopled)
out = {}
for n, c in enumerate(T["clips"], 1):
    p = c["video_prompt"]; edits = []
    def rm(s, why):
        global p
        assert p.count(s) == 1, (n, s); p = p.replace(s, ""); edits.append({"op": "delete", "text": s, "why": why})
    def sub(a, b, why):
        global p
        assert p.count(a) == 1, (n, a); p = p.replace(a, b); edits.append({"op": "replace", "from": a, "to": b, "why": why})
    if n == 1:
        rm(" and individual petals rotate independently", "length (<3900); same deletion as reference clip-01 trim")
        rm("Release a denser shower of small white jasmine and soft pink rose petals during deceleration, with near, middle and far depth layers. ", "length; same as reference trim")
        rm(", with restrained traveling edge glints and no smoke, droplets or sweeping light beam", "length; same as reference trim")
        rm("The small distant pedestal is shaded beneath the existing roof; as the camera descends, soft sunlight reveals the same floral cross and cream plaster. ", "length; redundant with 'The roof initially occludes the floral cross pedestal' (reference precedent)")
    if n == 10:
        sub("Never show a second pair, a duplicate couple, a portrait of the couple, or a reflection containing another couple.",
            "Never show a second pair or a duplicate couple.", "portrait / reflection objects are not in start/end frames")
        sub("never another couple or couple portrait.", "never another couple.", "couple portrait not in frames")
    if n in UNPEOPLED_END_CLIPS:
        sub("The final subject, people, physical sign and all exact lettering match the supplied last image.",
            "The final subject, physical sign and all exact lettering match the supplied last image." + UNPEOPLED_END, "end frame has no people; say so explicitly")
        sub(" or foreground/background copies of people.", ".", "end frame unpeopled")
    if n in TOWER_CLIPS:
        p = p.rstrip() + TOWER; edits.append({"op": "append", "text": TOWER.strip(), "why": "exactly one bell tower rule"})
    assert len(p) < 3900, (n, len(p))
    out[c["id"]] = {"template_video_prompt_sha256": sha(c["video_prompt"]), "template_len": len(c["video_prompt"]),
                    "submitted_prompt": p, "submitted_sha256": sha(p), "submitted_len": len(p), "edits": edits}
(R/"packets/VIDEO_PROMPTS_SUBMITTED.json").write_text(json.dumps(out, indent=2, ensure_ascii=False))
for k, v in out.items(): print(k, v["template_len"], "->", v["submitted_len"], len(v["edits"]), "edits")
