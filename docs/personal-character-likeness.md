# Personal character likeness: product rule

Status: the product owner approved the revised groom and bride likeness samples
on 17 November 2026 and authorized this exact prompt as the product standard.
The revision identifier `likeness-v1-candidate` is retained to preserve the
provenance of the tested jobs; its candidate review is complete. Do not change
its text in place. Future changes require a new revision and visual validation.

The customer pays for recognizable likeness. The identity reference must govern
face details, face shape, facial hair and hairstyle. Body proportions must adapt
to that face. A template supplies wardrobe, pose, composition and output format;
it must not replace the customer's identity with its generic character.

The approved shared implementation is `shared/personal-character-prompt.mjs`,
revision `likeness-v1-candidate`. Its central requirement is:

> Preserve the exact face details and face shape and facial hairs and hairstyle,
> Match the body proportion according to the face size and shape.

Validate individual results against the original photos, including facial
geometry, eyes, nose, lips, skin tone, hairline, hairstyle and beard/moustache.
Do not invent a likeness score or treat technical success as visual approval.
Show the results for visual approval before replacing the delivered video.
Then regenerate the joint scene from the approved individual characters.

Use this same shared, versioned prompt for all customers
and every template implementing personal characters. Future integrations must
import it rather than copy or rewrite likeness instructions. Template-specific
adapters may supply outfit, pose, framing and dimensions without overriding the
identity requirements. Keep each job pinned to its recorded prompt revision.

Raw and prepared outputs must be saved in private persistent storage, with
ownership and checksums verified, so later recovery does not depend on a
provider's temporary URL. Keep superseded artifacts during review and preserve
the customer's payment and redo allowance for support corrections.
