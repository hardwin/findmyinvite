#!/usr/bin/env python3
"""Regenerate helper note.

The authoritative template is template.json (see TEMPLATE_SHA256.txt).
It was built to match kerala-christian-v1 schema (schema_version 1.1) with
10 scenes / 9 clips (scene-01 is an added aerial drone opener; storyboard
panel-0N = scene N+1, see storyboard/RENUMBER.md) and storyboard copy from
storyboard/TEXT_TRANSCRIPT.md.
To rebuild after parameter edits: substitute {{parameters.*}} into each
image_prompt_template / video_prompt_template, ensure no unresolved {{ }},
keep every clips[].video_prompt under 4000 chars (API truncates ~4090),
and refresh TEMPLATE_SHA256.txt.
"""
print("See template.json and storyboard/TEXT_TRANSCRIPT.md")
