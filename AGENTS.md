# FindMyInvite product rules

## Personal character likeness

For any current or future template that creates personal characters from
customer photos, read `docs/personal-character-likeness.md` and reuse the
approved shared prompt in `shared/personal-character-prompt.mjs`.

Customer face details, face shape, facial hair and hairstyle take priority.
Adapt body proportions to the face. Templates supply wardrobe, pose, framing
and output dimensions without overriding likeness. Do not copy or replace the
shared identity instructions with a template-specific cartoon-face prompt.

Keep generation jobs pinned to a prompt revision. A successful API call or MP4
render does not prove likeness: compare results with the original references
before reporting quality as complete. Prompt revisions need visual validation
before becoming the product default. Persist raw and prepared images privately
so recovery does not depend on expiring provider URLs.
