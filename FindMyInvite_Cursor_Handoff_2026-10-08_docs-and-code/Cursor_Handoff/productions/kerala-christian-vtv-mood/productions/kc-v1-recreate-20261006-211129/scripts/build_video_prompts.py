#!/usr/bin/env python3
"""Submitted video prompts = template.json resolved video_prompt + minimal, logged rule edits
(Ashok rules 2026-10-07: one bell tower; don't name objects absent from start/end frames; unpeopled says so; <~3900 chars).
Deletions follow the clip-01 attempt-4 trim precedent (whole clause/sentence deletions, no rewording)."""
import json, hashlib
from pathlib import Path
R = Path(__file__).resolve().parent.parent
T = json.loads((R/"template.json").read_text())
sha = lambda s: hashlib.sha256(s.encode()).hexdigest()
TOWER = " Whenever the church is visible it has exactly one white bell tower with one cross on top; never a second tower."
UNPEOPLED_END = " The final view has no people."
TOWER_CLIPS = {1,2,3,4,5,7,8,9,10,11}          # tower visible in start and/or end frame (clip-06: neither)
UNPEOPLED_END_CLIPS = {5,7,9}                   # end frame (image-6/8/10) has no people
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
        rm(" and individual petals rotate independently", "length (<3900); same deletion as Theresa clip-01 attempt-4 trim")
        rm("Release a denser shower of small white jasmine and soft pink rose petals during deceleration, with near, middle and far depth layers. ", "length; same as attempt-4 trim")
        rm(", with restrained traveling edge glints and no smoke, droplets or sweeping light beam", "length; same as attempt-4 trim")
        rm("The small distant floral cross is shaded beneath the existing roof; as the camera descends, soft sunlight reveals the same floral cross and cream plaster. ", "length; redundant with 'The roof initially occludes the floral cross'")
        sub("never show an extra pillar or plinth at any moment", "never show an extra pillar at any moment", "plinth is not in start/end frames (do not name absent objects)")
    if n == 2:
        pass  # already: unpeopled + exactly one bell tower (Theresa fix)
    if n == 10:
        sub("Never show a second pair, a duplicate couple, a portrait of the couple, or a reflection containing another couple.",
            "Never show a second pair or a duplicate couple.", "portrait / reflection objects are not in start/end frames")
        sub("never another couple or couple portrait.", "never another couple.", "couple portrait not in frames")
    if n in UNPEOPLED_END_CLIPS:
        sub("The final subject, people, physical sign and all exact lettering match the supplied last image.",
            "The final subject, physical sign and all exact lettering match the supplied last image." + UNPEOPLED_END,
            "end frame has no people; say so explicitly")
        sub(" or foreground/background copies of people.", ".", "end frame unpeopled")
    if n in TOWER_CLIPS and n != 2:
        p = p.rstrip() + TOWER; edits.append({"op": "append", "text": TOWER.strip(), "why": "exactly one bell tower rule"})
    assert len(p) < 3900, (n, len(p))
    out[c["id"]] = {"template_video_prompt_sha256": sha(c["video_prompt"]), "template_len": len(c["video_prompt"]),
                    "submitted_prompt": p, "submitted_sha256": sha(p), "submitted_len": len(p), "edits": edits}
(R/"packets/VIDEO_PROMPTS_SUBMITTED.json").write_text(json.dumps(out, indent=2, ensure_ascii=False))
for k, v in out.items(): print(k, v["template_len"], "->", v["submitted_len"], len(v["edits"]), "edits")
